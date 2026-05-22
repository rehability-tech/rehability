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
   - Pełnoekranowy banner z `camp.heroImage` + nakładka `bg-gradient-to-br from-brand-secondary/90 via-brand-secondary/70 to-brand-primary/60` + dodatkowy `backdrop-blur-[2px]` żeby zdjęcie nie konkurowało z tekstem.
   - Powitanie po imieniu (`firstName = booking.name.split(' ')[0]`), nazwa campa, badge statusu z `STATUS_CONFIG`.
   - Countdown 4×kafelek (`days/hours/minutes/seconds`) w szkle `bg-white/15 backdrop-blur-xl border border-white/20`.
   - Po starcie campa: pigułka „Wyjazd trwa — miłego wypoczynku!".

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
   - Lista 4 punktów agendy z dnia przyjazdu (`CampEvent.startTime` z `12.06`), każdy = mini-karta z ikoną Phosphor zależną od typu (`MEAL`/`ACTIVITY`/`WELLNESS_FREE`).
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
    camp: {
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
          take: 4,                  // sneak peek
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
  camp: {
    id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    heroImage: string | null;
  };
  pricing: {
    total: number;          // Number(camp.price)
    deposit: number;        // Number(camp.deposit)
    remainder: number;      // total - deposit
  };
  health: {
    filled: boolean;
    dietType: string | null;
    allergies: string | null;
    injuries: string | null;
  } | null;
  agendaPreview: Array<{
    id: string;
    time: string;           // "08:00"
    dateLabel: string;      // "12 czerwca"
    title: string;
    place: string;
    type: "MEAL" | "ACTIVITY" | "WELLNESS_FREE" | "ANNOUNCEMENT" | "GENERAL";
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    slotAt: string;         // ISO -> "13.06 · 14:00"
    status: string;
  }>;
}
```

Funkcja `getPanelDashboardData(bookingId)` (Server-only) zwraca powyższy payload + obsługuje `Decimal → number` i `Date → string`.

### 2.3 Skąd biorą się dane poszczególnych sekcji

| Sekcja UI                | Źródło Prisma                                                       | Wyliczenie                                                                                              |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Hero / countdown         | `Booking.camp.startDate / endDate / title / location / heroImage`   | Brak dodatkowych obliczeń.                                                                              |
| Status badge             | `Booking.status`                                                    | Mapowanie do `STATUS_CONFIG`.                                                                            |
| QR ticket                | `Booking.qrToken`, `Booking.isCheckedIn`                            | Render w `react-qr-code`.                                                                                |
| Płatności — kwoty        | `Camp.price`, `Camp.deposit`, `Booking.depositPaidAt`, `remainderPaidAt` | `paymentProgress = remainderPaid ? 100 : depositPaid ? 25 : 0`; reszta = `total - deposit`.              |
| Karta zdrowia            | `Booking.user.healthProfile`                                        | `filled = !!healthProfile && (healthProfile.dietType || healthProfile.allergies)`; pulsujący CTA gdy `false`. |
| Sneak peek               | `Booking.camp.events` (4 najbliższe `isPublished=true`)             | Filtruj `startTime >= startDate` żeby pokazać tylko dzień przyjazdu, sortuj po godzinie.                 |
| (Sklep — osobny widok)   | `Booking.serviceOrders` z `service` i `slot`                        | Już zaciągnięte, gotowe pod `app/panel/[bookingId]/sklep/`.                                              |

### 2.4 Mutacje (Server Actions, które dotykają tego panelu)

- `payRemainder(bookingId)` — po sukcesie Stripe: `Booking.update({ remainderPaidAt: new Date() })` + `revalidatePath(`/panel/${bookingId}`)`.
- `submitHealthProfile(userId, payload)` — `prisma.healthProfile.upsert({ where: { userId }, ... })` + `revalidatePath`.
- `bookServiceSlot(slotId, bookingId)` — tworzy `ServiceOrder`, status `PENDING` → po opłaceniu `PAID`. Wpływa na ekran `sklep`, nie na sam dashboard.
- `markCheckIn(qrToken)` — wywoływane z admina (`/admin/campy/.../skaner`). Po skanowaniu: `Booking.update({ isCheckedIn: true, checkedInAt: new Date() })`. Panel klientki sam to wyświetli przy następnym fetchu.

### 2.5 Cache i rewalidacja

- Server Component `page.tsx` nie używa jeszcze `unstable_cache` — wystarczy `revalidatePath(`/panel/${bookingId}`)` w każdej Server Action wymienionej powyżej.
- Jeśli ruch wzrośnie: tag `booking:${bookingId}:dashboard` + `revalidateTag` w mutacjach.

### 2.6 Modele Prisma używane w panelu

| Model            | Po co                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| `Booking`        | qrToken, status, isCheckedIn, depositPaidAt, remainderPaidAt           |
| `Camp`           | Hero, daty, lokalizacja, ceny (do wyliczenia kwot)                     |
| `CampEvent`      | Sneak peek pierwszego dnia (`isPublished=true`, take 4)                |
| `User`           | Mostek do `HealthProfile`                                              |
| `HealthProfile`  | Status karty zdrowia, mini-pigułki Dieta/Alergie/Urazy                 |
| `ServiceOrder`   | Lista zakupionych usług (używana w widoku `/sklep`)                    |
| `CampService`    | Nazwa, czas trwania, cena (denormalizacja w `ServiceOrder`)            |
| `ServiceSlot`    | `startTime` → etykieta "13.06 · 14:00"                                 |

### 2.7 TODO przed pełnym podpięciem

- Wystawić `getPanelDashboardData(bookingId)` jako pojedynczy loader server-side i wymienić logikę w `page.tsx`.
- Dodać typ `PanelDashboardData` jako jedyne źródło prawdy między server a client (`DashboardClient` przyjmuje cały payload zamiast dwóch propsów).
- Podpiąć Stripe Checkout do CTA „Opłać resztę" (na razie sam przycisk).
- Po wypełnieniu Karty Zdrowia: zwijać formularz, pokazywać podsumowanie (3 pigułki: Dieta, Alergie, Urazy) — już przygotowane w UI gdy `mockState.healthFilled === true`.
- Dorzucić wariant po starcie campa: ukryć countdown, podświetlić aktywny punkt agendy „dzisiaj o…".
