# Dashboard Campa — Premium SaaS Edition

**Ścieżka:** `app/admin/campy/[id]/page.tsx`
**Styl:** Glassmorphism + Ambient Glow + Motion (AI / Premium SaaS)

## 1. Co zmienione w designie (klasy Tailwind & efekty)

### Tło (Ambient Glow Layer)

Trzy rozmyte, kolorowe "plamy" w tle, które dają wrażenie głębi i atmosfery jak w panelach Linear / Vercel / Stripe.

```tsx
<div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-brand-primary/15 blur-[120px]" />
<div className="absolute top-60 -right-40 w-[480px] h-[480px] rounded-full bg-[#E58B76]/20 blur-[120px]" />
<div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-300/10 blur-[120px]" />
```

Kluczowe klasy: `blur-[120px]`, `bg-{color}/15`, `rounded-full`. Warstwa `-z-10` + `pointer-events-none` zapewnia że glowy nie blokują kliknięć.

### Karty (Glassmorphism)

Każda karta (KPI, alerty, tabela) używa szklanego efektu:

```
rounded-3xl
bg-white/70
backdrop-blur-xl
border border-white/70
shadow-xl shadow-black/5
ring-1 ring-{accent}/20
```

`bg-white/70 + backdrop-blur-xl` = klasyczne glassmorphism. Cienie są celowo bardzo miękkie (`shadow-black/5`), żeby nie konkurowały z glowami w tle.

### Glow / Poświaty dla CTA

Główny przycisk skanera ma duplikat tła pod spodem rozmyty `blur-2xl` z `opacity-60 animate-pulse` — daje to neonowy efekt świecenia:

```tsx
<div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-primary via-[#287D88] to-[#0B3B4C] blur-2xl opacity-60 animate-pulse" />
<Link className="relative ... shadow-2xl shadow-brand-primary/40" />
```

Dodatkowo każda karta KPI ma własną "świecącą plamę" wewnątrz (`absolute -top-16 -right-16 ... blur-2xl`), dopasowaną kolorystycznie do kafelka.

### Statusy / Severity (świecące kropki)

Zamiast twardych kolorowych badge'ów używamy świecących kropek dzięki niestandardowemu cieniowi:

```
shadow-[0_0_12px_2px_rgba(244,63,94,0.6)]   // wysoki priorytet
shadow-[0_0_10px_1px_rgba(245,158,11,0.5)]  // średni
shadow-[0_0_10px_1px_rgba(40,125,136,0.5)]  // niski
```

### Animacje (framer-motion)

- Wejście elementów: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}` z `delay: i * 0.05`.
- Wypełnianie progress barów: animowane `width` z `duration: 0.7-0.8`.
- LIVE dot w nagłówku: pulsuje (`animate-pulse`) — sygnał, że widok jest "na żywo".

### Responsywność

Jeden plik, dwie radykalnie różne reprezentacje:

- `block md:hidden` — widok mobilny (PWA, praca w terenie).
- `hidden md:grid grid-cols-12` — widok desktop (Centrum dowodzenia).

Mobile maksymalizuje **akcję** (gigantyczny CTA QR + alerty kciukiem), desktop maksymalizuje **gęstość informacji** (4 KPI + tabela + timeline w jednym rzucie oka).

### Typografia & paleta

- Nagłówki: `font-jakarta font-bold text-[#0B3B4C]`.
- Body: `font-montserrat`, ciała kart `text-[13px] / text-[14px]`.
- Akcenty: `brand-primary` (#287D88), `#0B3B4C` (granat), `#E58B76` (terakota), `emerald-500` (sukces), `rose-500` (alert), `amber-500` (uwaga).

---

## 2. Struktura Danych i Integracja Prisma

### Krok 1 — Konwersja `page.tsx` na Server Component

Plik jest aktualnie `"use client"` (potrzebny dla `framer-motion`). Wzorzec docelowy:

```
page.tsx                        (Server Component, fetchuje dane)
└── _components/
    ├── CampDashboardMobile.tsx   ("use client", animacje motion)
    └── CampDashboardDesktop.tsx  ("use client", animacje motion)
```

`page.tsx` przyjmuje `params: { id: string }`, pobiera dane przez Prisma, przekazuje gotowy props `data` do komponentów klienckich.

### Krok 2 — Interfejs payloadu z serwera

```ts
export interface CampDashboardData {
  camp: {
    id: string;
    title: string;
    location: string;
    startDate: Date;
    endDate: Date;
    capacity: number;
    status: string;
  };

  kpi: {
    occupancy: { booked: number; capacity: number };         // 8 / 10
    finance: {
      depositsPaid: number;          // liczba osób z opłaconym zadatkiem
      remaindersPaid: number;        // liczba z opłaconą resztą
      totalCollected: number;        // 18400 (PLN)
      missingPayments: number;       // ilu klientek brakuje wpłaty
    };
    healthProfiles: { filled: number; required: number };    // 6 / 8
    extras: {
      revenue: number;               // 2340 (PLN)
      ordersCount: number;           // 11 wykupionych slotów
    };
  };

  pendingActions: Array<{
    bookingId: string;
    name: string;
    initials: string;
    issue: string;                   // "Brak wpłaty zadatku" itp.
    deadline: string;                // sformatowany do PL
    severity: "high" | "mid" | "low";
  }>;

  alerts: Array<{
    type: "PAYMENT_MISSING" | "ALLERGY" | "HEALTH_PROFILE_MISSING";
    title: string;
    desc: string;
  }>;

  activity: Array<{
    id: string;
    text: string;
    meta: string;
    timeAgo: string;
    kind: "ORDER" | "BOOKING_CONFIRMED" | "HEALTH_FILLED" | "INVITATION" | "CANCEL";
  }>;
}
```

### Krok 3 — Zapytania Prisma (per kafelek)

Wszystko w **jednym** Server Action / loaderze, żeby ograniczyć round-tripy do DB.

#### a) Bazowy camp + zliczenia (1 zapytanie z relacjami)

```ts
const camp = await prisma.camp.findUnique({
  where: { id },
  include: {
    _count: { select: { bookings: true } },
    bookings: {
      where: { status: { in: ["CONFIRMED", "PENDING"] } },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        depositPaidAt: true,
        remainderPaidAt: true,
        isCheckedIn: true,
        invitedById: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            healthProfile: {
              select: { id: true, allergies: true, foodIntolerances: true },
            },
          },
        },
        serviceOrders: {
          where: { status: "PAID" },
          select: { price: true, service: { select: { name: true } } },
        },
      },
    },
  },
});
```

#### b) KPI — derywacje w pamięci

```ts
const booked = camp.bookings.filter(b => b.status === "CONFIRMED").length;
const depositsPaid = camp.bookings.filter(b => b.depositPaidAt).length;
const remaindersPaid = camp.bookings.filter(b => b.remainderPaidAt).length;
const missingPayments = booked - depositsPaid;

const totalCollected = camp.bookings.reduce((sum, b) => {
  const deposit = b.depositPaidAt ? Number(camp.deposit) : 0;
  const remainder = b.remainderPaidAt ? Number(camp.price) - Number(camp.deposit) : 0;
  return sum + deposit + remainder;
}, 0);

const filledHealth = camp.bookings.filter(b => b.user?.healthProfile?.id).length;

const extrasOrders = camp.bookings.flatMap(b => b.serviceOrders);
const extrasRevenue = extrasOrders.reduce((s, o) => s + Number(o.price), 0);
```

#### c) Oczekujące akcje — algorytm

Każda rezerwacja generuje 0..N "akcji", priorytetyzowane przez `severity`:

```ts
const now = new Date();
const pendingActions = camp.bookings.flatMap(b => {
  const out = [];
  if (!b.depositPaidAt) out.push({ ...mkAction(b), issue: "Brak wpłaty zadatku", severity: "high" });
  if (b.depositPaidAt && !b.remainderPaidAt) out.push({ ...mkAction(b), issue: "Brak dopłaty końcowej", severity: daysUntil(camp.startDate) < 7 ? "high" : "mid" });
  if (!b.user?.healthProfile) out.push({ ...mkAction(b), issue: "Niewypełniona Karta Zdrowia", severity: "mid" });
  if (b.status === "PENDING_INVITATION" && b.expiresAt && b.expiresAt > now) {
    out.push({ ...mkAction(b), issue: "Wygasające zaproszenie", severity: "low" });
  }
  return out;
})
.sort(bySeverityThenDeadline);
```

#### d) Alerty mobile (z tych samych danych)

```ts
const allergyAlerts = camp.bookings
  .filter(b => b.user?.healthProfile?.allergies)
  .map(b => ({ type: "ALLERGY", title: `Alergia: ${b.user!.healthProfile!.allergies}`, desc: `${b.name} — przekaż kuchni` }));
```

#### e) Ostatnia aktywność (feed)

Aktywność = unia 3 źródeł posortowana po dacie. Najtaniej: osobne `findMany` z `take: 8` i merge w pamięci.

```ts
const [recentOrders, recentBookings, recentInvitations] = await Promise.all([
  prisma.serviceOrder.findMany({
    where: { booking: { campId: id } },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { booking: { select: { name: true } }, service: { select: { name: true } } },
  }),
  prisma.booking.findMany({
    where: { campId: id, depositPaidAt: { not: null } },
    orderBy: { depositPaidAt: "desc" },
    take: 8,
    select: { id: true, name: true, depositPaidAt: true },
  }),
  prisma.booking.findMany({
    where: { campId: id, invitedById: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, createdAt: true, invitedBy: { select: { name: true } } },
  }),
]);

const activity = mergeAndFormat(recentOrders, recentBookings, recentInvitations).slice(0, 8);
```

> **Optymalizacja:** docelowo te trzy `findMany` zastąpić jednym widokiem `CampActivityEvent` (osobny model) zapisywanym na poziomie Server Action (np. po utworzeniu `ServiceOrder` lecimy `prisma.campActivityEvent.create`). Wtedy feed = jedno query.

### Krok 4 — Server Component wrapper

```tsx
// app/admin/campy/[id]/page.tsx (po refaktorze)
import { notFound } from "next/navigation";
import { getCampDashboardData } from "./_data/getCampDashboardData";
import CampDashboardMobile from "./_components/CampDashboardMobile";
import CampDashboardDesktop from "./_components/CampDashboardDesktop";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCampDashboardData(id);
  if (!data) notFound();

  return (
    <>
      <CampDashboardMobile data={data} />
      <CampDashboardDesktop data={data} />
    </>
  );
}
```

`getCampDashboardData(id)` to czysta funkcja serwerowa zwracająca `CampDashboardData` (interfejs powyżej). Dwa komponenty kliencie dostają **ten sam payload** — gwarantuje to spójność widoku mobile vs desktop.

### Krok 5 — Cache / Rewalidacja

- Główny loader: `unstable_cache` z tagiem `camp:${id}:dashboard`, TTL 30s.
- Każdy Server Action zmieniający stan (`markCheckIn`, `confirmPayment`, `createServiceOrder`) wywołuje `revalidateTag('camp:'+id+':dashboard')`.
- Pasek "LIVE" w nagłówku ma realne pokrycie: po każdej akcji widok jest świeży w max 30s.

### Modele Prisma dotykane przez ten widok

| Model            | Cel                                                  |
| ---------------- | ---------------------------------------------------- |
| `Camp`           | Podstawowe info + capacity + price/deposit           |
| `Booking`        | Status, płatności, check-in, zaproszenia, qrToken    |
| `User`           | Mostek do `HealthProfile`                            |
| `HealthProfile`  | Alergie, diety, przeciwwskazania (alerty mobile)     |
| `ServiceOrder`   | KPI "Usługi dodatkowe" + feed aktywności             |
| `CampService`    | Nazwa usługi w feedzie                               |
| `CampEvent`      | (rezerwa) — gdy podepniemy "Teraz/Następnie"         |

Brakujący element: nie istnieje jeszcze model `Survey` / `OnboardingResponse`. Akcję "Brak ankiety wstępnej" trzeba potraktować jako TODO — albo dodać `surveyCompletedAt: DateTime?` na `Booking`, albo nowy model `BookingSurvey`.

---

## 3. Następne kroki podpięcia

1. Wydzielić `CampDashboardMobile.tsx` i `CampDashboardDesktop.tsx` z obecnego `page.tsx`.
2. Napisać `_data/getCampDashboardData.ts` z zapytaniami z sekcji 2.
3. Zamienić mocki w komponentach na `data.kpi`, `data.pendingActions`, `data.alerts`, `data.activity`.
4. Dodać Server Actions: `markCheckIn(bookingId)`, `markRemainderPaid(bookingId)` — wywoływane z przycisku "Rozwiąż →" w tabeli akcji.
5. Dorzucić `revalidateTag` we wszystkich mutacjach dotykających `Booking`/`ServiceOrder`.
