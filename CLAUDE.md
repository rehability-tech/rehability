# Projekt: Rehability - Platforma Campów i VOD

## Rola AI

Jesteś ekspertem od Next.js (App Router), TypeScript, Tailwind CSS, Prisma oraz PWA. Budujemy Panel Uczestnika oraz panele administracyjne. Platforma jest uniwersalna — przeznaczona zarówno dla uczestników, jak i uczestniczek. W UI i komunikatach używaj formy neutralnej płciowo (np. „Witaj", „Twoje wydarzenie", „uczestnik"), unikaj zwrotów w rodzaju żeńskim.

## 🎨 System Designu i Layout

1. **Kolorystyka:**
   - Tekst/Nagłówki: `var(--color-secondary)` lub `text-[#033f63]`.
   - Akcenty/Przyciski: `var(--color-primary)` lub `bg-[#287d88]`.
   - Żółty akcent: `var(--color-yellow)` / `#f2d967`.
2. **Znak Rozpoznawczy 1 (Efekty Premium & Glow):**
   - W panelach, nawigacjach i głównych UI stosujemy **jasny Glassmorphism** (np. `bg-white/20 backdrop-blur-2xl border-white/40`).
   - **Aktywne elementy (buttony, linki w menu):** Zawsze łączą morskie tło (`bg-brand-primary`) z czysto białymi ikonami/tekstem.
   - Koniecznie muszą posiadać **słoneczną, żółtą poświatę** (np. `shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]` oraz subtelny `border-brand-yellow/30`).
   - Wewnątrz aktywnych komponentów często umieszczamy absolutnie pozycjonowaną, żółtą, rozmytą kulkę (np. `bg-brand-yellow/50 blur-[10px]`) w prawym dolnym rogu, aby wzmocnić blask.
3. **Znak Rozpoznawczy 2 (Kształt "Kropli"):**
   - Wszystkie główne karty/boksy na dashboardzie mają klasy: `rounded-3xl rounded-tr-none`.
4. **Architektura Layoutu (Responsive App Shell):**
   - **Desktop (`md:` / `lg:`):** Używamy bocznego menu (Sidebar) oraz Topbaru w stylu naszego panelu Admina.
   - **Mobile:** Używamy bardzo płynnego, przyklejonego do dołu paska nawigacji (Native-like Bottom Bar).
5. **Komponenty:** UI to zawsze `"use client"`. Używamy Phosphor Icons (`@phosphor-icons/react/dist/ssr`).

## 🗄️ Kontekst Bazy Danych (Prisma)

Znamy schemat bazy:

- `Booking` łączy się z `User` i ma pole `status` (np. `DEPOSIT_PAID`, `FULLY_PAID`).
- Karta Zdrowia: Model `HealthProfile` przypisany do `User` (1:1).
- Usługi SPA: Model `Camp` ma `services` (`CampService`). Użytkownik rezerwuje `ServiceSlot` tworząc `ServiceOrder`.

## 🚀 Cel: Panel Uczestnika (PWA) -> `/panel/campy/[bookingId]`

Użytkownik trafia tutaj po opłaceniu zadatku na stronie publicznej z parametrem `?status=success`.

**Kolejność wdrożenia:**

1. Layout (Sidebar Desktop / Bottom Bar Mobile).
2. Dashboard (Odliczanie do wydarzenia, Moduł wpłaty reszty kwoty oparty o `Booking.amountPaid` i nową sesję Stripe).
3. Modale powitalne (Sukces wpłaty, instalacja PWA).
4. Karta Zdrowia (zapis do `HealthProfile`).
5. Moduł Usług SPA (pobieranie `CampService`, rezerwacja slotów w `ServiceOrder`).

## 🧪 Sandbox (środowisko testowe)

Treści oznaczone jako sandbox żyją w bazie obok produkcyjnych, ale widzą je tylko **admin** i **konta z `User.sandboxAccess`**. Obejmuje `Trip.sandbox` i `Course.sandbox`.

- **`sandbox` jest wymiarem NIEZALEŻNYM od `status`** — sandboxowe wydarzenie/kurs może być `PUBLISHED` i zachowywać się jak produkcyjne, nie wychodząc do klientów. „Wypuszczenie na produkcję" zdejmuje tylko flagę; statusu nie ruszamy.
- **Rdzeń: `src/lib/sandbox/`**
  - `constants.ts` — czysty moduł (bezpieczny w client/proxy): `SANDBOX_COOKIE` (celowo **nie** `httpOnly` — to preferencja widoku, nie poświadczenie), `SANDBOX_PREVIEW_EVENT`.
  - `context.ts` — `getSandboxContext()`, `showSandboxContent()`, `canUseSandbox()`, `sandboxFilter()`.
- **Dwa różne pytania — nie mylić:**
  - `canUseSandbox` → czy wolno otworzyć/kupić POJEDYNCZĄ treść. Nie zależy od przełącznika (link wysłany testerowi ma działać od razu).
  - `showSandbox` → czy doklejać treści testowe do LIST (katalogi, biblioteka VOD). Wymaga włączonego podglądu, żeby admin widział stronę oczami klienta.
- **Domyślnie ukryte:** funkcje czytające treść „dla klienta" przyjmują `includeSandbox` z domyślną wartością `false` — przeoczenie parametru ukrywa treść testową, zamiast ją wyciekać.
- **Enrollment wygrywa:** odtwarzacz VOD i biblioteka nie filtrują po sandbox — dostęp rozstrzyga `Enrollment`. Kursant nie traci kupionego kursu, gdy trafi on do piaskownicy.
- **Twarde bramki serwerowe:** `create-payment-intent` (kursy i rezerwacje) oraz `actions/stripe.ts` odpowiadają 404 na treść sandbox bez uprawnień.
- **Higiena:** treści sandbox nie trafiają do `sitemap.xml`, nie wywołują IndexNow, nie wysyłają powiadomień push przy publikacji i nie liczą się do statystyk (wyświetlenia, dashboard VOD). Strona główna (ISR) nigdy ich nie pokazuje.
- **Panel: `/admin/sandbox`** — przełącznik podglądu, lista treści testowych z akcją „Wypuść", zarządzanie testerami (nadanie po e-mailu istniejącego konta). Globalny żółty pasek (`SandboxPreviewBar` w `src/app/layout.tsx`) ostrzega, że podgląd jest włączony.
- **API:** `POST /api/sandbox/preview` (admin + testerzy), `GET|POST /api/admin/sandbox/testerzy`, `DELETE /api/admin/sandbox/testerzy/[id]`, `PATCH /api/admin/sandbox/tresci`.

## 🎬 Platforma VOD (Kursy)

Druga noga produktu obok wydarzeń: sprzedaż i odtwarzanie kursów wideo on-demand. Dostęp jest **per-konto** (model `Enrollment`) i **dożywotni**. W UI mówimy „kurs/program", użytkownik to „kursant".

### Mapa tras

- **Publiczne (`(site)`):**
  - `/kursy` — katalog (filtr po kategorii, karty kursów).
  - `/kursy/[slug]` — strona sprzedażowa (zakładki: O kursie / Zawartość / Opinie / FAQ).
  - `/kursy/[slug]/checkout` — koszyk + płatność.
- **Panel kursanta (`/panel`, PWA):**
  - `/panel/vod` — biblioteka: kursy posiadane + cały katalog do kupienia; tryb „locked", gdy brak zakupów.
  - `/panel/vod/[slug]` — odtwarzacz kursu (gating po `Enrollment` — bez dostępu redirect na checkout).
- **Panel admina (`/admin/kursy`):**
  - `/admin/kursy` + `/admin/kursy/lista` — lista kursów ze statystykami sprzedaży.
  - `/admin/kursy/dodaj` — kreator (`CourseWizard`, 4 kroki: Start → Dane → Program → Podsumowanie; opcjonalny start z AI).
  - `/admin/kursy/[slug]` — dashboard kursu; zakładki: `overview`, `informacje` (edycja danych), `tresc` (edycja modułów/lekcji + wideo), `uczestnicy` (lista kursantów + postępy).
- **API:**
  - `POST /api/kursy/create-payment-intent` — tworzy Stripe PaymentIntent (kurs darmowy → od razu `Enrollment`).
  - `POST|DELETE /api/kursy/[slug]/opinie` — opinia kursanta (tylko z dostępem; agreguje rating kursu).
  - `POST /api/panel/vod/progress` — zapis postępu lekcji (`LessonProgress`).
  - `GET /api/panel/vod/last` — ostatnio oglądany kurs (skrót w sidebarze).
  - `POST /api/admin/kursy` — tworzenie kursu; `PATCH|DELETE /api/admin/kursy/[id]` — edycja (sync modułów/lekcji po ID, zachowuje postępy) / usuwanie.
  - `POST /api/admin/kursy/bunny-upload` — inicjacja uploadu wideo; `POST /api/admin/kursy/bunny-webhook` — status przetwarzania wideo z Bunny.

### Model danych (Prisma)

- **`Course`** — `slug`, `title`, `category`, `excerpt`, `price` (zł, int), `durationMin`, `rating`/`reviews` (cache liczony z opinii), `format` (`single` = jeden film | `sections` = moduły/lekcje), `video` (główne wideo lub zwiastun), `status` (`DRAFT`|`PUBLISHED`|`ARCHIVED`), pola treści `description`/`faq`/`testimonials` (Json).
- **`CourseModule`** → **`Lesson`** (`title`, `description`, `video`, `order`) — program kursu w formacie `sections`.
- **`Enrollment`** (`@@unique [userId, courseId]`) — dostęp do kursu; nadawany idempotentnie.
- **`LessonProgress`** (`@@unique [userId, lessonId]`) — `completed` + `seconds`; baza statystyk i procentu ukończenia.
- **`CourseReview`** (`@@unique [courseId, userId]`) — jedna opinia na kursanta; po zapisie/usunięciu przeliczamy `Course.rating`/`reviews` w transakcji.

### Workflow zakupu → dostępu

1. Kursant na `/kursy/[slug]` → `Kup` → `/kursy/[slug]/checkout`.
2. `CheckoutClient` woła `create-payment-intent` (wymaga logowania — `userId` ląduje w `metadata`). Już posiadany kurs → redirect na panel; darmowy → `Enrollment` od ręki.
3. Płatność osadzonym Stripe **Payment Element** (karta / BLIK / Przelewy24). `return_url` → `/panel/vod?zakup=sukces`.
4. **Webhook Stripe** (`payment_intent.succeeded`, `kind: "COURSE_PURCHASE"`) → `handleCoursePurchasePaid` → idempotentny `Enrollment` + powiadomienie + wpis do live-feedu admina.
5. **Fallback**: `/panel/vod` po powrocie weryfikuje `payment_intent` ze Stripe i domyka `Enrollment`, gdyby webhook się spóźnił (świeży kurs widoczny od razu).
6. Odtwarzacz zapisuje postęp przez `/api/panel/vod/progress`; kursant z dostępem może wystawić opinię.

### Hosting wideo (Bunny Stream) — `src/lib/bunny.ts`

- Upload **bezpośrednio z przeglądarki** przez TUS (wznawialny). Serwer tylko tworzy obiekt wideo i podpisuje upload — klucz API nigdy nie trafia na klienta (`VideoUploader` w kreatorze/edytorze).
- Wideo trzymamy jako **embed URL** Bunny (`iframe.mediadelivery.net/embed/{lib}/{guid}`).
- Player kursanta gra **podpisany HLS** (`bunnySignedHlsUrl` — token-auth na pull zone, TTL 6 h) we własnym `HlsPlayer`; admin/podglądy używają iframe Bunny.
- Wymagane env: `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_STREAM_TOKEN_KEY`, `BUNNY_WEBHOOK_SECRET` (+ publiczny `NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME` do miniatur).

### Źródło danych i kluczowe pliki

- **`src/lib/courses-db.ts`** — JEDYNE źródło danych kursów (Prisma): katalog, player, statystyki admina, enrollments, postępy, opinie. To tu dodajemy logikę domenową VOD.
- **`src/app/(site)/kursy/_data/courses.ts`** — już TYLKO typy (`Course`, `CourseModule`…) i statyczne stałe/fallbacki (`COURSE_BENEFITS`, `DEFAULT_FAQ`, `DEFAULT_CURRICULUM`). Tablica `COURSES` jest reliktem — kursy żyją w bazie.
  Krok „Podsumowanie" w `CourseWizard` poprawnie informuje, że „Opublikuj kurs" zapisuje go w bazie i publikuje (przez `publish()` → `POST /api/admin/kursy`); szkic jest autozapisywany w tle. Brak już komunikatu o wklejaniu JSON do `courses.ts`.
