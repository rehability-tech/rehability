# Panel Uczestniczki — Digital Concierge (PWA)

**Ścieżka:** `app/panel/[bookingId]/`
**Styl:** Premium SaaS / Wellness Tech — Glassmorphism (`backdrop-blur-xl`, `bg-white/70`), miękkie cienie (`shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)]`), zero twardych obramowań, ambient glowy `brand-primary` / `brand-yellow` w warstwie tła.

## 1. Architektura widoku

```
panel/
├── _components/
│   └── UserMobileBottomNav.tsx       (glass nav, 4 buttony)
├── layout.tsx                        (ambient bg, Toaster, BottomNav, container)
└── [bookingId]/
    ├── _components/
    │   └── DashboardClient.tsx       ("use client", motion, QR)
    ├── page.tsx                      (Server Component, prisma fetch)
    └── ... (sklep, finanse, harmonogram, karta-zdrowia)
```

### Komponenty Dashboardu (`DashboardClient.tsx`)

1. **Hero z odliczaniem** (`lg:col-span-12`)
   - Pełnoekranowy banner z `trip.heroImage` + nakładka `bg-gradient-to-br from-brand-secondary/90 via-brand-secondary/70 to-brand-primary/60` + dodatkowy `backdrop-blur-[2px]` żeby zdjęcie nie konkurowało z tekstem.
   - Powitanie po imieniu (`firstName = booking.name.split(' ')[0]`), nazwa wyjazdu, badge statusu z `STATUS_CONFIG`.
   - Countdown 4×kafelek (`days/hours/minutes/seconds`) w szkle `bg-white/15 backdrop-blur-xl border border-white/20`.
   - Po starcie wyjazdu: pigułka „Wyjazd trwa — miłego wypoczynku!".

2. **Karta Bilet (Apple Wallet style)** (`lg:col-span-5`)
   - Wrapper z poświatą `bg-brand-primary/30 blur-2xl` pod spodem (neonowy cień marki).
   - Górny pasek z gradientem `brand-secondary → brand-primary`, ID rezerwacji w prawym chipie, imię uczestniczki, nazwa wyjazdu.
   - Klasyczna „perforacja" przez dwa półokrągłe wycięcia (`absolute -left-3 / -right-3 rounded-full bg-[#f5fbfc]`) + przerywana linia pomiędzy.
   - QR (`react-qr-code`) w czystym białym boxie, kolor `#033f63` (brand-secondary).
   - Status pod QR-em: zameldowano (`bg-brand-primary/10`) lub oczekuje (`bg-brand-yellow/30`).

3. **Karta Płatności** (`lg:col-span-7`, pierwszy wiersz prawej kolumny)
   - Postęp z gradientem `brand-primary → brand-secondary`, dwie pigułki `PaymentChip` (Zadatek / Reszta), CTA „Opłać resztę (1 800 zł)" pojawia się dopóki `remainderPaidAt === null`.
   - Pełna opłata = świecący badge `bg-brand-primary text-white shadow-[0_6px_14px_-4px_rgba(40,125,136,0.6)]`.

4. **Karta Zdrowia (Krytyczna)** (drugi wiersz prawej kolumny)
   - Gdy `healthFilled === false`: cała karta dostaje neon-glow `shadow-[0_0_0_1px_rgba(244,63,94,0.12),0_18px_45px_-15px_rgba(244,63,94,0.35)]` + animowany blob `bg-rose-400/25 blur-3xl animate-pulse` + pulsujący czerwony przycisk „Uzupełnij dietę przed wyjazdem!".
   - Gdy wypełniona: trzy mini-pigułki (Dieta, Alergie, Urazy) z danymi z `HealthProfile`.

5. **Sneak Peek pierwszego dnia** (`lg:col-span-12`)
   - Lista 4 punktów agendy z dnia przyjazdu (`TripEvent.startTime` z `12.06`), każdy = mini-karta z ikoną Phosphor zależną od typu (`MEAL`/`ACTIVITY`/`WELLNESS_FREE`).
   - Numeracja `01-04` w prawym górnym rogu kart, ambient `brand-yellow` glow w tle sekcji.

### Mobile vs Desktop

- Mobile: cały grid stack-uje się w jedną kolumnę. Hero, bilet QR, płatności, karta zdrowia, agenda — w tej kolejności (najpilniejsze akcje pod kciuk).
- Desktop (`lg:`): grid 12-kolumnowy. Hero 12/12, bilet 5/12, prawa kolumna 7/12 (płatności + karta zdrowia stack), agenda 12/12.
- Container w `layout.tsx`: `max-w-md mx-auto` na mobile, `lg:max-w-6xl lg:px-8` na desktopie.

### Nawigacja (`UserMobileBottomNav.tsx`)

- 4 zakładki: Dashboard (`SquaresFour`), Mój Plan (`CalendarBlank` → `harmonogram`), Masaże (`Sparkle` → `sklep`), Profil (`User` → `karta-zdrowia`).
- Glass: `bg-white/70 backdrop-blur-2xl border-t border-white/20`, safe-area na iOS przez `paddingBottom: env(safe-area-inset-bottom)`.
- Aktywny stan: kafel ikony `bg-brand-primary text-white` + halo `bg-brand-primary/30 blur-xl` pod ikoną + etykieta `text-brand-primary`.

## 2. Integracja z Prismą

Dashboard używa już Server Componentu (`page.tsx`) — kontrakt propsów `DashboardClient` zostaje **identyczny**. Aby zasilić nowo dodane sekcje danymi (płatności kwotowo, karta zdrowia, agenda) trzeba rozszerzyć query i payload.

### 2.1 Rozszerzone query

```ts
// app/panel/[bookingId]/page.tsx
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    trip: {
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        heroImage: true,
        price: true,
        deposit: true,
        events: {
          where: { isPublished: true },
          orderBy: [{ startTime: "asc" }],
          take: 4, // sneak peek
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            type: true,
            icon: true,
          },
        },
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        healthProfile: {
          select: {
            dietType: true,
            foodIntolerances: true,
            allergies: true,
            chronicConditions: true,
            injuries: true,
            updatedAt: true,
          },
        },
      },
    },
    serviceOrders: {
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        slot: { select: { startTime: true } },
      },
    },
  },
});
```

### 2.2 Mapowanie do propsów `DashboardClient`

Rozszerzamy interfejs propsów (kompatybilnie wstecz — nowe pola opcjonalne):

```ts
interface PanelDashboardData {
  booking: {
    id: string;
    qrToken: string;
    status: string;
    isCheckedIn: boolean;
    name: string | null;
    email: string;
    depositPaidAt: string | null;
    remainderPaidAt: string | null;
  };
  trip: {
    id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    heroImage: string | null;
  };
  pricing: {
    total: number; // Number(trip.price)
    deposit: number; // Number(trip.deposit)
    remainder: number; // total - deposit
  };
  health: {
    filled: boolean;
    dietType: string | null;
    allergies: string | null;
    injuries: string | null;
  } | null;
  agendaPreview: Array<{
    id: string;
    time: string; // "08:00"
    dateLabel: string; // "12 czerwca"
    title: string;
    place: string;
    type: "MEAL" | "ACTIVITY" | "WELLNESS_FREE" | "ANNOUNCEMENT" | "GENERAL";
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    slotAt: string; // ISO -> "13.06 · 14:00"
    status: string;
  }>;
}
```

Funkcja `getPanelDashboardData(bookingId)` (Server-only) zwraca powyższy payload + obsługuje `Decimal → number` i `Date → string`.

### 2.3 Skąd biorą się dane poszczególnych sekcji

| Sekcja UI              | Źródło Prisma                                                            | Wyliczenie                                                                                  |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------- |
| Hero / countdown       | `Booking.trip.startDate / endDate / title / location / heroImage`        | Brak dodatkowych obliczeń.                                                                  |
| Status badge           | `Booking.status`                                                         | Mapowanie do `STATUS_CONFIG`.                                                               |
| QR ticket              | `Booking.qrToken`, `Booking.isCheckedIn`                                 | Render w `react-qr-code`.                                                                   |
| Płatności — kwoty      | `Trip.price`, `Trip.deposit`, `Booking.depositPaidAt`, `remainderPaidAt` | `paymentProgress = remainderPaid ? 100 : depositPaid ? 25 : 0`; reszta = `total - deposit`. |
| Karta zdrowia          | `Booking.user.healthProfile`                                             | `filled = !!healthProfile && (healthProfile.dietType                                        |     | healthProfile.allergies)`; pulsujący CTA gdy `false`. |
| Sneak peek             | `Booking.trip.events` (4 najbliższe `isPublished=true`)                  | Filtruj `startTime >= startDate` żeby pokazać tylko dzień przyjazdu, sortuj po godzinie.    |
| (Sklep — osobny widok) | `Booking.serviceOrders` z `service` i `slot`                             | Już zaciągnięte, gotowe pod `app/panel/[bookingId]/sklep/`.                                 |

### 2.4 Mutacje (Server Actions, które dotykają tego panelu)

- `payRemainder(bookingId)` — po sukcesie Stripe: `Booking.update({ remainderPaidAt: new Date() })` + `revalidatePath(`/panel/${bookingId}`)`.
- `submitHealthProfile(userId, payload)` — `prisma.healthProfile.upsert({ where: { userId }, ... })` + `revalidatePath`.
- `bookServiceSlot(slotId, bookingId)` — tworzy `ServiceOrder`, status `PENDING` → po opłaceniu `PAID`. Wpływa na ekran `sklep`, nie na sam dashboard.
- `markCheckIn(qrToken)` — wywoływane z admina (`/admin/wyjazdy/.../skaner`). Po skanowaniu: `Booking.update({ isCheckedIn: true, checkedInAt: new Date() })`. Panel klientki sam to wyświetli przy następnym fetchu.

### 2.5 Cache i rewalidacja

- Server Component `page.tsx` nie używa jeszcze `unstable_cache` — wystarczy `revalidatePath(`/panel/${bookingId}`)` w każdej Server Action wymienionej powyżej.
- Jeśli ruch wzrośnie: tag `booking:${bookingId}:dashboard` + `revalidateTag` w mutacjach.

### 2.6 Modele Prisma używane w panelu

| Model           | Po co                                                        |
| --------------- | ------------------------------------------------------------ |
| `Booking`       | qrToken, status, isCheckedIn, depositPaidAt, remainderPaidAt |
| `Trip`          | Hero, daty, lokalizacja, ceny (do wyliczenia kwot)           |
| `TripEvent`     | Sneak peek pierwszego dnia (`isPublished=true`, take 4)      |
| `User`          | Mostek do `HealthProfile`                                    |
| `HealthProfile` | Status karty zdrowia, mini-pigułki Dieta/Alergie/Urazy       |
| `ServiceOrder`  | Lista zakupionych usług (używana w widoku `/sklep`)          |
| `TripService`   | Nazwa, czas trwania, cena (denormalizacja w `ServiceOrder`)  |
| `ServiceSlot`   | `startTime` → etykieta "13.06 · 14:00"                       |

### 2.7 TODO przed pełnym podpięciem

- Wystawić `getPanelDashboardData(bookingId)` jako pojedynczy loader server-side i wymienić logikę w `page.tsx`.
- Dodać typ `PanelDashboardData` jako jedyne źródło prawdy między server a client (`DashboardClient` przyjmuje cały payload zamiast dwóch propsów).
- Podpiąć Stripe Checkout do CTA „Opłać resztę" (na razie sam przycisk).
- Po wypełnieniu Karty Zdrowia: zwijać formularz, pokazywać podsumowanie (3 pigułki: Dieta, Alergie, Urazy) — już przygotowane w UI gdy `mockState.healthFilled === true`.
- Dorzucić wariant po starcie wyjazdu: ukryć countdown, podświetlić aktywny punkt agendy „dzisiaj o…".

## TODO

1. [] Opracowanie mobile menu dla admina ma trzeba zsynchronizować adminssidebar linki i admin mobile menu linki i przycisk back strzałka w lewo ma robić router.back
2. [] Na stronie chatu zarówno na stronie admina i użykownika na widoku mobile chowamy ładnie mobile navbar i topbar i zamist ikonki hcatu w lewym górnym rogu dajemy strzałke w lewo i ona ma zrobić router.back
3. [] Blokada biletu do momentu aż zapłacona jest kwota cała za wyjazd
4. []

5. []

dasd

---

## Mechanizm „Zabierz przyjaciółkę" (`allowBringFriend`)

Opcja pozwalająca zarezerwować wyjazd w wariancie **Duo** — uczestniczka opłaca swój zadatek i jednocześnie tworzy zaproszenie (24 h) dla wskazanej przyjaciółki, której rezerwuje miejsce.

### Przepływ end-to-end

**1. Flaga na wyjeździe**
`Trip.allowBringFriend` — `Boolean @default(false)` w [`prisma/schema.prisma`](../../../../../prisma/schema.prisma) (linia ~61). Admin włącza ją w kreatorze wyjazdu (`app/admin/wyjazdy/dodaj/dane-podstawowe`). To jedyny przełącznik decydujący, czy wariant Duo jest w ogóle dostępny.

**2. Formularz rezerwacji (front)**
[`TripBookingForm.tsx`](../../../(site)/wyjazdy/[slug]/_components/TripBookingForm.tsx) dostaje `allowBringFriend` jako prop:

- Krok 1 (wybór wariantu): karta „Duo" renderuje się **tylko** gdy `allowBringFriend === true`. Bez flagi widoczny jest wyłącznie „Standard".
- Krok danych: wybór duo (`isDuo`) odblokowuje pola przyjaciółki — imię, nazwisko, **email**. Walidacja wymaga poprawnego maila, **różnego od własnego**.

**3. API — `create-payment-intent`**
[`app/api/bookings/create-payment-intent/route.ts`](../../../api/bookings/create-payment-intent/route.ts) — serce logiki. Zabezpieczenia (defense-in-depth, bo front może skłamać):

- zod `refine`: wariant `duo` **wymaga** obiektu `friend`;
- `friend.email ≠ sessionEmail` (422);
- duo dozwolone tylko gdy `trip.allowBringFriend` (inaczej 422);
- pojemność: duo = `seatsNeeded = 2`; zajęte miejsca liczą też `PENDING_INVITATION`.

W jednej **transakcji** powstają **dwa** Bookingi:

| Pole              | Bookerka          | Przyjaciółka              |
| ----------------- | ----------------- | ------------------------- |
| `status`          | `PENDING`         | `PENDING_INVITATION`      |
| `userId`          | zalogowanej       | **brak** (nie ma sesji)   |
| `email`           | sesyjny           | podany w formularzu       |
| `invitedById`     | —                 | = id bookerki             |
| `invitationToken` | —                 | losowy (`crypto`, base64url) |
| `expiresAt`       | —                 | **+24 h**                 |

PaymentIntent tworzony jest **tylko na zadatek bookerki** — przyjaciółka nie płaci od razu. Jeśli Stripe zwróci błąd, oba bookingi → `CANCELLED`.

**4. Relacja w modelu**
Self-relacja `FriendInvitation` na `Booking` (`prisma/schema.prisma`, linie ~171-176): `invitedBy` / `invitedGuests`, `invitationToken @unique`, `expiresAt`.

**5. Jak przyjaciółka dołącza**
Powiązanie idzie po **emailu**. Gdy zaproszona loguje się tym samym adresem, jej booking dopasowuje się po mailu — [`resume-payment`](../../../api/panel/wyjazdy/resume-payment/route.ts) używa `where: { id, email: session.user.email }` i **dopuszcza status `PENDING_INVITATION`**, traktując go jak zadatek. Panel [`app/panel/wyjazdy/page.tsx`](../page.tsx) pokazuje go w sekcji „do opłaty". Każdy booking ma `amountTotal` = pełna cena, więc przyjaciółka też płaci najpierw swój zadatek, a potem resztę.

**6. Wygasanie i pojemność**
Cron [`expire-invitations`](../../../api/cron/bookings/expire-invitations/route.ts) zmienia `PENDING_INVITATION` z minionym `expiresAt` → `EXPIRED`. Dopóki zaproszenie żyje (24 h), **trzyma miejsce** (liczy się do `capacity`); po `EXPIRED` miejsce się zwalnia. Czat dodatkowo wyklucza `PENDING_INVITATION` z odbiorców.

### ✅ Pełny flow zaproszeń (Resend + token)

Token nie jest już „uśpiony" — działa cały handshake mailowy:

1. **Wysyłka maila** — w webhooku Stripe ([`api/webhooks/stripe/route.ts`](../../../api/webhooks/stripe/route.ts)), w gałęzi `deposit`, po opłaceniu zadatku przez zapraszającą wołamy `maybeSendFriendInvitation()`. Szuka gościni (`invitedById` = booker, status `PENDING_INVITATION`), **odświeża `expiresAt` na +24 h od wysyłki** i wysyła e-mail. Trigger w webhooku = nie zapraszamy przy porzuconym koszyku.
2. **Mail (Resend)** — [`lib/email/resend.ts`](../../../../../lib/email/resend.ts) (singleton klienta, best-effort gdy brak `RESEND_API_KEY`) + [`lib/email/friendInvitation.ts`](../../../../../lib/email/friendInvitation.ts) (responsywny HTML w brandowych kolorach, wersja `text`, escaping danych, link `"{APP_URL}/zaproszenie/{token}"`).
3. **Strona akceptacji** — [`app/zaproszenie/[token]/page.tsx`](../../../zaproszenie) (Server Component). Obsługuje stany: nieprawidłowy token / wygasłe / już przejęte (przez Ciebie → CTA do panelu, lub przez kogoś innego) / właściwy (szczegóły wyjazdu + przycisk).
4. **Przejęcie** — niezalogowana loguje się Google z `callbackUrl` na ten sam link; po powrocie `POST /api/zaproszenia/accept` ustawia `userId` **oraz** `email` na zalogowaną (panel matchuje po emailu), status zostaje `PENDING_INVITATION`. Redirect do `/panel/wyjazdy`, gdzie gościni opłaca swój zadatek przez istniejący `resume-payment`.

**ENV:** `RESEND_API_KEY` (wymagany do wysyłki), `EMAIL_FROM` (zweryfikowana domena w Resend; domyślnie sandbox), `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` (bazowy URL w linku).
