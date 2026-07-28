# Audyt bezpieczeństwa API — Rehability

Przegląd wszystkich route'ów REST (`src/app/api/**/route.ts`) pod kątem dziur w zabezpieczeniach, kontroli dostępu, walidacji wejścia i wycieków danych.

- **Data audytu:** 2026-06-06
- **Zakres:** ~66 plików `route.ts` (admin, panel uczestniczki, publiczne, cron, webhook, auth, notifications, user)
- **Metoda:** ręczny przegląd kodu + analiza wzorców autoryzacji

> Plik towarzyszy [`dokumentacja.md`](./dokumentacja.md) (referencja endpointów). Tu zapisane są **wyłącznie ustalenia bezpieczeństwa**.

---

## Podsumowanie

| Severity | Liczba | Najważniejsze |
|---|---|---|
| 🔴 **Krytyczne** | 1 | `/api/admin/uslugi` bez żadnej autoryzacji |
| 🟠 **Średnie** | 2 | SSRF w `import-image`, upload bez walidacji typu/rozmiaru |
| 🟡 **Niskie / informacyjne** | 8 | brak rate-limitingu, wycieki w logach, brak `.max()` w walidacji, query-secret w cron, account linking |

**Ogólna ocena:** baza kodu jest **w większości dobrze zabezpieczona**. Wzorce są spójne i poprawne: webhook Stripe weryfikuje podpis, kwoty płatności liczone są po stronie serwera z bazy (klient nie kontroluje kwoty), panel uczestniczki konsekwentnie sprawdza własność rezerwacji (`userId` lub zweryfikowany `email` z Google), cron chroniony bearer-tokenem. Jeden route wyłamuje się z tego standardu i to on jest priorytetem.

---

## ✅ Status napraw (2026-06-06)

Naprawione w tej iteracji:

| ID | Status | Co zrobiono |
|---|---|---|
| **K1** | ✅ naprawione | `requireAdmin()` + walidacja Zod na GET/POST/PATCH w `admin/uslugi`. |
| **S1** | ✅ naprawione | Nowy helper [`assertPublicHttpUrl`](../../lib/uploads/assertPublicHttpUrl.ts) (blokada loopback/sieci prywatnej/metadata), timeout 8 s, `redirect: "error"`, kontrola `Content-Type` i limit 10 MB w `import-image`. |
| **S2** | ✅ naprawione | Nowy helper [`validateImageUpload`](../../lib/uploads/validateImageUpload.ts) (whitelist rozszerzeń + MIME, limit 10 MB) w `blog/upload`, `wydarzenia/[id]/upload`, `service-image`. |
| **N2** | ✅ naprawione | Usunięto `console.log(service)` i pole `debug` (panel/orders) oraz logi z kwotami/ID (resume-payment). |
| **N3** | ✅ naprawione | Dodano `.max()` na wszystkich polach tekstowych `health-profile`. |
| **N4** | ✅ naprawione | Walidacja Zod w `email-templates` POST (oraz wcześniej w `uslugi`). |
| **N5** | ✅ naprawione | `requireCron` przyjmuje sekret tylko z nagłówka; usunięto `?secret=` z kodu i dokumentacji (`crons.md`, `blog/README.md`). |

Pozostaje do rozważenia (świadomie nieruszone):

| ID | Status | Powód |
|---|---|---|
| **N1** | ⏳ otwarte | Rate-limiting wymaga infrastruktury (Upstash/Vercel KV) — decyzja produktowa. |
| **N6** | ⏳ otwarte | `allowDangerousEmailAccountLinking` bezpieczne przy samym Google; do rewizji przy dodaniu providera. |
| **N7** | ⏳ otwarte | Race condition przy liczeniu miejsc — wymaga blokady DB/transakcji; ryzyko niskie. |
| **N8** | ⏳ otwarte | Narzędzia dev (`seed`/`clear`) — admin-gated, decyzja czy zostają na produkcji. |

> Weryfikacja: `npx tsc --noEmit` przechodzi bez błędów. (`npm run lint` pada na pre-istniejącym błędzie `eslint.config.mjs` — niezależnym od tych zmian.)

---

## 🔴 KRYTYCZNE

### K1. `/api/admin/uslugi` — całkowity brak autoryzacji

**Plik:** [`src/app/api/admin/uslugi/route.ts`](./admin/uslugi/route.ts)

Wszystkie trzy metody (`GET`, `POST`, `PATCH`) **nie wołają `requireAdmin()` ani `getServerSession`**. Każdy anonimowy użytkownik internetu może:

- **GET** — odczytać cały katalog usług (`ExtraService`),
- **POST** — dodać dowolną usługę,
- **PATCH** — **edytować dowolną usługę po `id`**, a zmiana propaguje się przez `tripService.updateMany({ where: { sourceServiceId: id } })` na **wszystkie wydarzenia** korzystające z tej usługi.

```ts
export async function PATCH(req: Request) {
  // ⚠️ BRAK requireAdmin() — wejście prosto do logiki
  const body = await req.json();
  const { id, name, duration, price, description, image } = body;
  ...
  await prisma.$transaction([
    prisma.extraService.update({ where: { id }, data }),
    prisma.tripService.updateMany({ where: { sourceServiceId: id }, data }), // propagacja na campy
  ]);
}
```

**Wpływ:** podmiana cen/opisów usług na wszystkich wydarzeniach, zaśmiecanie katalogu, manipulacja ofertą — bez logowania. To realna, zdalnie wykorzystywalna dziura w kontroli dostępu (BOLA/Broken Access Control, OWASP API1/API5).

> Uwaga: `dokumentacja.md` deklaruje, że „Admin: `requireAdmin()` — wszystkie `/api/admin/*`". To stwierdzenie jest **nieprawdziwe** dla tego route'a — dokumentacja maskuje lukę.

**Rekomendacja (do wdrożenia od razu):**

```ts
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;
  ...
}
// to samo na POST i PATCH
```

Dodatkowo: dodać walidację Zod (patrz N6) i `DELETE` z autoryzacją, jeśli istnieje gdzieś indziej.

---

## 🟠 ŚREDNIE

### S1. SSRF w `/api/admin/blog/import-image`

**Plik:** [`src/app/api/admin/blog/import-image/route.ts`](./admin/blog/import-image/route.ts)

Endpoint pobiera dowolny URL podany przez klienta i serwer wykonuje do niego `fetch`:

```ts
if (!url || !/^https?:\/\//i.test(url)) { ... } // jedyna walidacja: schemat http/https
const imgRes = await fetch(url); // ⚠️ żądanie po stronie serwera do dowolnego hosta
```

Walidacja sprawdza tylko schemat. Można podać:
- `http://169.254.169.254/latest/meta-data/...` (cloud metadata),
- `http://localhost:.../`, adresy z sieci wewnętrznej / RFC1918,
- usługi wewnętrzne dostępne tylko z serwera.

**Severity obniżona do średniej**, bo endpoint jest za `requireAdmin()`. Mimo to SSRF za panelem admina to nadal wektor (np. przy przejęciu sesji admina albo gdy panel jest szerzej dostępny).

**Rekomendacja:** whitelista hostów (np. tylko `images.pexels.com`), blokada adresów prywatnych/loopback po rozwiązaniu DNS, limit rozmiaru pobieranego pliku i twardy timeout. Weryfikować `Content-Type` odpowiedzi (musi być `image/*`).

### S2. Upload plików bez walidacji typu i rozmiaru

**Pliki:**
- [`src/app/api/admin/blog/upload/route.ts`](./admin/blog/upload/route.ts)
- [`src/app/api/admin/wydarzenia/[id]/upload/route.ts`](./admin/wydarzenia/[id]/upload/route.ts)
- [`src/app/api/admin/wydarzenia/service-image/route.ts`](./admin/wydarzenia/service-image/route.ts)

Wszystkie streamują surowe `request.body` prosto do Vercel Blob z `access: "public"`, biorąc rozszerzenie wprost z nazwy pliku:

```ts
const blob = await put(seoFilename, request.body as any, {
  access: "public",
  addRandomSuffix: true,
});
```

Brakuje:
- **whitelisty typów MIME / rozszerzeń** — można wgrać `.svg` (XSS przez `<script>` w SVG serwowanym z domeny blob), `.html`, dowolny plik,
- **limitu rozmiaru** — brak ochrony przed wielkimi plikami (koszt storage + DoS przepustowości).

**Severity średnia** (admin-only), ale to klasyczny stored-XSS / unrestricted-file-upload, który eskaluje przy przejęciu konta admina.

**Rekomendacja:** walidować `Content-Type` i rozszerzenie względem whitelisty (`jpg/png/webp/avif`), wymusić limit rozmiaru (np. `Content-Length` + sprawdzenie strumienia), wymusić `contentType` przy `put()` i nigdy nie ufać rozszerzeniu z nazwy.

---

## 🟡 NISKIE / INFORMACYJNE

### N1. Brak rate-limitingu na endpointach wrażliwych i publicznych

- [`/api/public/newsletter`](./public/newsletter/route.ts) — brak rate-limitu i CAPTCHA → spam/zapychanie tabeli `NewsletterSubscriber`, możliwa enumeracja (różne odpowiedzi 409 vs 200).
- [`/api/bookings/create-payment-intent`](./bookings/create-payment-intent/route.ts), [`/api/panel/orders`](./panel/orders/route.ts), [`/api/panel/wydarzenia/resume-payment`](./panel/wydarzenia/resume-payment/route.ts) — tworzą `PaymentIntent` w Stripe przy każdym żądaniu; brak throttlingu pozwala generować masę PI (koszt/szum, porzucone rezerwacje `PENDING`).
- [`/api/admin/gemini`](./admin/gemini/route.ts), [`/api/admin/pexels`](./admin/pexels/route.ts) — płatne API zewnętrzne (admin-gated, więc ryzyko niskie, ale brak limitu).

**Rekomendacja:** rate-limit per-IP/per-user (np. Upstash/Vercel KV) na endpointach publicznych i płatniczych; CAPTCHA na newsletterze.

### N2. Wyciek danych w logach i odpowiedziach błędów

- [`/api/panel/orders`](./panel/orders/route.ts): `console.log(service)` (linia ~167) loguje cały obiekt usługi; odpowiedź 500 zwraca `debug: msg` (linia ~301) — ujawnia wewnętrzne kody błędów klientowi.
- [`/api/panel/wydarzenia/resume-payment`](./panel/wydarzenia/resume-payment/route.ts): rozbudowane `console.log` z kwotami, statusem i ID rezerwacji (linie ~80–124, ~142–157) — dane biznesowe trafiają do logów produkcyjnych.

**Rekomendacja:** usunąć logi debugowe lub przełączyć na `devLog` (jest już `@/lib/devLog`), nie zwracać `debug` w produkcji.

### N3. Brak `.max()` na polach tekstowych (potencjalny DoS payloadem)

[`/api/panel/health-profile`](./panel/health-profile/route.ts) PUT: pola `foodNotes`, `chronicConditions`, `medications`, `injuries`, `allergies`, `emergencyName/Phone` to `z.string().optional()` bez limitu długości. Klient może zapisać ogromne stringi (obciążenie DB/pamięci).

**Rekomendacja:** dodać `.max(...)` do każdego pola tekstowego (np. 2000 znaków na notatki, 200 na nazwy). Wzorcem jest tu czat, który ma `.max(2000)`.

### N4. Brak schematu Zod / mass-assignment w części admin routes

[`/api/admin/uslugi`](./admin/uslugi/route.ts) i [`/api/admin/email-templates`](./admin/email-templates/route.ts) pobierają pola wprost z `body` bez Zod (reszta kodu konsekwentnie używa `safeParse`). `parseInt`/`parseFloat` mogą dać `NaN` zapisane do bazy. Niska severity (admin), ale niespójne ze standardem projektu.

**Rekomendacja:** ujednolicić — Zod na każdym body, jak w `wydarzenia/save`, `gemini`, `slots`.

### N5. Cron akceptuje sekret w query stringu

[`src/lib/auth/requireCron.ts`](../../lib/auth/requireCron.ts) honoruje `?secret=<token>` obok nagłówków. Query string trafia do logów serwera/proxy/CDN — sekret może wyciec do logów.

**Rekomendacja:** dopuścić sekret tylko w nagłówku (`Authorization: Bearer` lub `x-cron-secret`); usunąć wariant query. Fallback „brak `CRON_SECRET` w dev → przepuść" jest akceptowalny (na produkcji jest twardy guard 503), ale upewnić się, że `CRON_SECRET` jest ustawiony na produkcji.

### N6. `allowDangerousEmailAccountLinking: true` w GoogleProvider

[`src/lib/auth/auth.ts`](../../lib/auth/auth.ts) — automatyczne linkowanie kont po e-mailu. Przy samym Google (e-mail zweryfikowany) ryzyko jest niskie, ale to świadome osłabienie: dodanie w przyszłości providera, który nie weryfikuje e-maila, otworzyłoby przejęcie konta.

**Rekomendacja:** zostawić tylko dopóki jedynym providerem produkcyjnym jest Google; udokumentować jako świadomą decyzję. Rozważyć przeniesienie `ADMIN_EMAILS` do zmiennej środowiskowej zamiast hardcode.

### N7. Możliwy oversell miejsc (race condition)

[`/api/bookings/create-payment-intent`](./bookings/create-payment-intent/route.ts) liczy `occupiedSeats` **przed** transakcją tworzącą rezerwację — dwa równoległe żądania mogą przekroczyć `capacity`. Wpływ ograniczony (statusy `PENDING` wygasają), ale przy dużym ruchu możliwe chwilowe przepełnienie.

**Rekomendacja:** liczyć i wstawiać w jednej transakcji z blokadą/`SELECT ... FOR UPDATE` lub ograniczeniem na poziomie bazy.

### N8. Narzędzia „dev/test" dostępne na produkcji

[`/api/admin/wydarzenia/[id]/harmonogram/seed`](./admin/wydarzenia/[id]/harmonogram/seed/route.ts) i [`/api/admin/wydarzenia/[id]/harmonogram/clear`](./admin/wydarzenia/[id]/harmonogram/clear/route.ts) — `clear` kaskadowo usuwa cały harmonogram i `ServiceOrder`. Są admin-gated (akceptowalne), ale destrukcyjne i opisane jako narzędzia dev.

**Rekomendacja:** dodać potwierdzenie/flagę lub ograniczyć do środowiska nieprodukcyjnego, jeśli nie są potrzebne klientowi.

---

## ✅ Co jest zrobione dobrze (warto utrzymać)

- **Webhook Stripe** weryfikuje podpis (`stripe.webhooks.constructEvent`) i jest idempotentny (sprawdza status przed aktualizacją). [`webhooks/stripe`](./webhooks/stripe/route.ts)
- **Kwoty płatności** liczone wyłącznie po stronie serwera z `Trip.price`/`deposit`/`amountTotal` — klient nigdy nie przesyła kwoty. [`resume-payment`](./panel/wydarzenia/resume-payment/route.ts), [`create-payment-intent`](./bookings/create-payment-intent/route.ts)
- **Kontrola własności** w panelu: konsekwentne `userId === session.user.id || email === session.user.email` (e-mail pochodzi ze zweryfikowanego konta Google). [`panel/orders`](./panel/orders/route.ts), [`panel/wydarzenia/[bookingId]/sklep`](./panel/wydarzenia/[bookingId]/sklep/route.ts), [`harmonogram/[bookingId]`](./panel/harmonogram/[bookingId]/route.ts)
- **Powiadomienia / notyfikacje** filtrowane po `userId` zalogowanego — brak IDOR. [`notifications`](./notifications/route.ts), [`notifications/[id]/read`](./notifications/[id]/read/route.ts)
- **Czat** sprawdza dostęp do wydarzenia (admin lub posiadacz rezerwacji) i waliduje treść Zod (`max 2000`). [`wydarzenia/[tripId]/chat`](./wydarzenia/[tripId]/chat/route.ts)
- **Admin – obrona w głąb:** route'y jak [`klienci/[id]`](./admin/klienci/[id]/route.ts) i [`uczestnicy/[participantId]`](./admin/wydarzenia/[id]/uczestnicy/[participantId]/route.ts) sprawdzają rolę `ADMIN` niezależnie od guardu w layoutcie oraz weryfikują przynależność zasobu do wydarzenia (`participant.tripId !== tripId`).
- **Walidacja paginacji** z górnymi limitami (`Math.min(...)`) — brak nadmiarowych zapytań. [`public/wydarzenia`](./public/wydarzenia/route.ts), [`notifications`](./notifications/route.ts)
- **Cron** chroniony bearer-tokenem z porównaniem w czasie stałym (`timingSafeEqual`) i twardym guardem na produkcji. [`requireCron`](../../lib/auth/requireCron.ts)

---

## Plan działania (priorytety)

1. **Natychmiast:** dodać `requireAdmin()` do wszystkich metod [`/api/admin/uslugi`](./admin/uslugi/route.ts) (**K1**).
2. **Wkrótce:** walidacja typu/rozmiaru w uploadach (**S2**); whitelista hostów + blokada adresów prywatnych w `import-image` (**S1**).
3. **Plan średnioterminowy:** rate-limiting publicznych i płatniczych endpointów (**N1**); usunięcie logów debug i pól `debug` (**N2**); `.max()` w walidacji (**N3**); ujednolicenie Zod w admin routes (**N4**); cron tylko z nagłówka (**N5**).
4. **Higiena:** poprawić [`dokumentacja.md`](./dokumentacja.md), aby nie deklarowała ochrony `requireAdmin()` dla `uslugi`, dopóki nie zostanie ona faktycznie dodana.
