# Moduł CRM 360° — Dokumentacja techniczna

> Globalna baza klientów Rehability z profilem 360° i wbudowanym asystentem AI
> do hiper-personalizacji ofert (**AI LTV Boost**).
>
> Stack: Next.js 15 (App Router) · TypeScript · Prisma (PostgreSQL) · Tailwind ·
> Framer Motion · `@phosphor-icons/react` · Google Gemini.

---

## 1. Spis plików i odpowiedzialności

| Plik | Typ | Odpowiedzialność |
| --- | --- | --- |
| `src/app/admin/klienci/page.tsx` | Server Component | Autoryzacja, zapytanie listy, kalkulacja LTV, serializacja |
| `src/app/admin/klienci/_components/GlobalCrmList.tsx` | Client Component | Tabela CRM, wyszukiwarka reaktywna, pigułki lojalności |
| `src/app/admin/klienci/[id]/page.tsx` | Server Component | Pobranie profilu 360°, obsługa 404, serializacja |
| `src/app/admin/klienci/[id]/_components/ClientProfile.tsx` | Client Component | Wizytówka, historia, SPA, zdrowie, **moduł AI** |
| `src/lib/crm/types.ts` | Typy współdzielone | Kontrakty danych Server → Client |
| `src/lib/crm/loyalty.ts` | Logika domenowa | Progi i wyliczanie segmentu + meta prezentacji |

Zasada: **logika biznesowa i typy żyją w `src/lib/crm`** (SRP/DRY), a komponenty
są cienkie — Server Components pobierają/serializują, Client Components renderują
i obsługują interakcję.

---

## 2. Architektura przepływu danych (Data Flow)

```
┌─────────────────────────── SERWER ───────────────────────────┐
│  page.tsx (RSC)                                               │
│   1. getServerSession → guard ADMIN (redirect /logowanie)    │
│   2. prisma.user.findMany / findUnique (1 zapytanie + JOIN)  │
│   3. resolveLoyalty() + mapowanie grosze→PLN, Date→ISO       │
│   4. zwrot serializowalnego obiektu (CrmClient / Profile)    │
└───────────────────────────────┬──────────────────────────────┘
                                 │  props (czysty JSON)
                                 ▼
┌─────────────────────────── KLIENT ───────────────────────────┐
│  GlobalCrmList / ClientProfile ("use client")                │
│   • useState/useMemo — filtrowanie, agregacje                │
│   • brak zapytań do DB — dane przyszły z RSC                 │
│   • AI: fetch('/api/admin/gemini') tylko na żądanie usera    │
└──────────────────────────────────────────────────────────────┘
```

Kluczowe założenia:

- **Granica serializacji jest twarda.** Komponent kliencki nigdy nie dostaje
  `Decimal` (Prisma) ani `Date`. Wszystkie kwoty to `number` w PLN, daty to
  `string` ISO. Konwersję robi wyłącznie Server Component. Zapobiega to błędom
  hydratacji i „leakom" obiektów nie-serializowalnych przez granicę RSC.
- **`dynamic = "force-dynamic"`** — dane CRM zależą od bieżącego stanu rezerwacji
  i sesji, więc nie podlegają cache'owaniu statycznemu.

---

## 3. Zapytania Prisma (i unikanie N+1)

### 3.1. Lista (`page.tsx`)

```ts
prisma.user.findMany({
  where: { bookings: { some: {} } },          // tylko realni klienci
  select: {
    id: true, name: true, email: true, image: true,
    healthProfile: { select: { id: true } },  // istnienie karty zdrowia
    bookings: {
      where: { status: { not: "CANCELLED" } },
      select: { amountPaid: true, phone: true, createdAt: true },
    },
  },
  orderBy: { name: "asc" },
});
```

- **`bookings: { some: {} }`** — filtr relacyjny: użytkownik kwalifikuje się jako
  klient tylko gdy ma ≥ 1 rezerwację. Nie tworzymy osobnej tabeli „Client".
- **Brak N+1.** Zagnieżdżony `select` na `bookings` powoduje, że Prisma pobiera
  rezerwacje wszystkich użytkowników jednym dodatkowym, zbatchowanym zapytaniem
  (a nie osobnym per użytkownik). Nie iterujemy po userach z `await` w pętli.
- **`healthProfile: { select: { id: true } }`** — pobieramy wyłącznie `id`, bo
  na liście potrzebujemy jedynie informacji *czy karta istnieje* (`!!healthProfile`),
  a nie jej zawartości. Minimalizujemy payload.

### 3.2. Profil (`[id]/page.tsx`)

```ts
prisma.user.findUnique({
  where: { id },
  select: {
    id: true, name: true, email: true, image: true,
    healthProfile: true,                       // pełna karta zdrowia
    bookings: {
      where: { status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, amountPaid: true, amountTotal: true,
        phone: true, createdAt: true,
        trip: { select: { id, title, location, startDate, endDate, heroImage } },
        serviceOrders: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, status: true, price: true, startTime: true,
            service: { select: { name: true } },
          },
        },
      },
    },
  },
});
```

- **Trzypoziomowe zagnieżdżenie** (`user → bookings → serviceOrders → service`)
  realizowane w JEDNYM wywołaniu. Prisma rozwiązuje każdy poziom relacji
  zbatchowanym zapytaniem — zamiast `1 + N + N*M` zapytań mamy stałą, niewielką
  ich liczbę niezależnie od liczby rezerwacji i zabiegów. To kluczowe dla
  uniknięcia N+1 na profilu „ciężkiego" klienta.
- **Selektywność pól** — pobieramy tylko kolumny faktycznie renderowane (np. z
  `service` tylko `name`), co zmniejsza transfer z bazy.
- **404** — `findUnique` zwraca `null` gdy klienta nie ma; renderujemy wtedy
  elegancki ekran z ikoną `WarningCircle` zamiast `notFound()`, aby zachować
  spójny layout panelu i przycisk powrotu.

---

## 4. Logika biznesowa: LTV i segmentacja lojalnościowa

Źródło prawdy: `src/lib/crm/loyalty.ts`. Trzymanie progów w jednym miejscu
gwarantuje, że lista i profil liczą status identycznie (DRY).

### 4.1. LTV (Lifetime Value)

```ts
totalSpent = Σ(booking.amountPaid) / 100   // grosze → PLN
tripsCount = liczba rezerwacji bez statusu CANCELLED
```

> Kwoty w bazie trzymane są w **groszach** (`Int`), dlatego dzielimy przez 100
> dopiero na serwerze, tuż przed serializacją.

### 4.2. Segmentacja

```ts
resolveLoyalty(totalSpent, tripsCount):
  VIP        ⇐ totalSpent > 5000 PLN  LUB  tripsCount >= 3
  RETURNING  ⇐ tripsCount >= 2
  NEW        ⇐ pozostali (1 wydarzenie)
```

| Segment | Kryterium | Kolor (UI) | Ikona |
| --- | --- | --- | --- |
| VIP | > 5000 zł lub ≥ 3 wydarzenia | żółty (brand-yellow) | `Crown` |
| RETURNING | ≥ 2 wydarzenia | niebieski | `ArrowsClockwise` |
| NEW | 1 wydarzenie | zielony | `Sparkle` |

Prezentacja (etykieta + klasy Tailwind) wynika z `LOYALTY_META`; komponenty
dokładają jedynie ikonę. Dzięki temu zmiana koloru/nazwy segmentu to jedna edycja.

---

## 5. Moduł Hiper-personalizacji „AI LTV Boost"

Cel biznesowy: zwiększanie wartości klienta przez generowanie
ultra-spersonalizowanych zaproszeń na kolejne wydarzenie, z darmowym dodatkiem
powiązanym z ulubioną usługą SPA klienta.

### 5.1. Lokalizacja i wygląd

Komponent `AiLtvBoost` wewnątrz `ClientProfile.tsx`. Wyróżniony kontenerem z
gradientową ramką **`from-brand-primary to-brand-yellow`** (efekt „premium glow").

### 5.2. Budowa kontekstu (po stronie klienta)

Funkcja `buildContext()` składa zwięzły, czytelny dla LLM opis klienta:

```
Imię klienta: <name>
Status lojalnościowy: <VIP|Powracający|Nowy>
Łączna wartość (LTV): <X> zł
Liczba odbytych wydarzeń: <n>
Ulubiona usługa SPA: <najczęściej rezerwowana>   (jeśli istnieje)
Alergie: <...>                                    (jeśli podane)
Dieta: <...>
Ostatni wydarzenie: <tytuł>
```

„Ulubiona usługa" wyliczana jest w `useMemo` przez zliczenie wystąpień nazw
usług we wszystkich `serviceOrders` klienta i wybór najczęstszej.

### 5.3. Integracja z API

```ts
fetch("/api/admin/gemini", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "copywriting", prompt, context }),
});
// odpowiedź sukcesu: { text: string }
// odpowiedź błędu:   { error: string } + status != 2xx
```

- **`action: "copywriting"`** przełącza endpoint w tryb marketingowy (dokleja
  system prompt o tworzeniu perswazyjnych tekstów — patrz `/api/admin/gemini`).
- **`prompt`** zawiera instrukcje (ton premium, CTA, darmowy dodatek, limit
  znaków, uwzględnienie alergii/diety) + wstrzyknięty blok `--- DANE KLIENTA ---`.
- Endpoint używa modelu **`gemini-flash-latest`** (`@google/generative-ai`).

### 5.4. UX i odporność

- **`isLoading`** — przycisk pokazuje obracającą się ikonę `Sparkle` i tekst
  „Generuję ofertę..."; jest `disabled` w trakcie żądania.
- **`try/catch`** — błędy sieci/serwera oraz `res.ok === false` mapowane są na
  czytelny komunikat (`error`) renderowany w czerwonym boksie.
- **Wynik** trafia do **edytowalnego `<textarea>`** (admin może dopieścić treść)
  z przyciskiem **„Skopiuj treść"** (`navigator.clipboard`) i potwierdzeniem
  „Skopiowano!" przez 2 s.

---

## 6. Zabezpieczenia autoryzacyjne

Obrona w głąb — autoryzacja na każdej warstwie:

1. **Layout panelu** (`/admin/layout.tsx`) — globalny guard sekcji admina.
2. **Każdy Server Component CRM** — niezależnie sprawdza
   `session?.user?.role === "ADMIN"`; w przeciwnym razie `redirect("/logowanie")`.
   Nawet bezpośrednie wejście na `/admin/klienci/<id>` jest chronione.
3. **Endpoint AI** (`/api/admin/gemini`) — własny guard `getServerSession`
   zwracający `401` dla nie-adminów. Komponent kliencki *nie* jest jedynym
   strażnikiem; API samodzielnie odrzuca nieautoryzowane wywołania.

Dane wrażliwe (karta zdrowia: alergie, leki, choroby) są więc dostępne wyłącznie
dla zalogowanego administratora, a wywołania AI nie mogą zostać wykonane przez
nieuprawnionego użytkownika nawet przy próbie bezpośredniego uderzenia w API.

---

## 7. Decyzje projektowe (warte odnotowania)

- **Telefon klienta** pochodzi z `Booking.phone` (model `User` nie ma pola
  telefonu) — bierzemy najnowszą uzupełnioną wartość.
- **Brak osobnej encji „Client"** — klient to projekcja `User` z rezerwacjami;
  upraszcza model i utrzymuje spójność danych.
- **`focusKeyword` w `keywords[0]`** (kontekst modułu blogowego) — zaakceptowana
  konwencja unikająca migracji schematu.
