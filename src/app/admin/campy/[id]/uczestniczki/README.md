# Moduł: Uczestniczki Campa (Lista + Profil)

**Ścieżki:**

- Lista — `app/admin/campy/[id]/uczestniczki/page.tsx`
- Profil — `app/admin/campy/[id]/uczestniczki/[participantId]/page.tsx`

**Styl:** AI / Clean Tech — Glassmorphism (`backdrop-blur-xl`, `bg-white/70`), miękkie cienie (`shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)]`), brak twardych obramowań (cienkie `border-white/40`).

---

## 1. Lista uczestniczek — UI/UX

### Desktop (`hidden md:block`)

- Pełna tabela bez pionowych linii. Wiersze rozdziela `border-t border-white/30` — efekt "światła pomiędzy".
- Kolumny: **Uczestniczka** (awatar w gradientowej ramce + email), **Pakiet** (Solo / Duo z imieniem przyjaciółki), **Płatność** (badge + mini progress bar), **Karta Zdrowia** (badge, brak ankiety = czerwona poświata `bg-brand-secondary/15 blur-xl`), **Usługi** (licznik + suma w zł), **CTA** (kółko `ArrowUpRight` zmieniające kolor na hover).
- Hover wiersza: `hover:bg-white/80` (delikatne rozjaśnienie zamiast cienia).
- Pod tabelą stopka z licznikiem i czasem ostatniej synchronizacji (gotowe miejsce na realny timestamp z bazy).
- Cztery karty Quick Stats nad tabelą: Wszystkie / Opłacone w pełni / Bez Karty Zdrowia / Pakiet DUO — derywowane z tej samej listy.

### Mobile (`md:hidden`)

- Każda uczestniczka = szklana karta. Awatar w gradientowej ramce (`bg-gradient-to-br from-brand-primary to-brand-secondary` jako prsterścień `-inset-[2px]`).
- Pod imieniem: badge płatności + badge karty zdrowia (`Brak ankiety!` ma pełne tło `bg-brand-secondary text-white` + glow w prawym górnym rogu karty).
- Po prawej dwa szybkie przyciski akcji: `tel:` i `mailto:` (`e.stopPropagation()` żeby kliknięcie ikony nie odpalało nawigacji do profilu).
- Pakiet DUO sygnalizowany malutkim chipem przy imieniu (zamiast osobnej kolumny — oszczędność miejsca).

### Wspólne

- Górny pasek wyszukiwania w glassmorphism + skrót `⌘K` (placeholder pod realną funkcjonalność).
- Headline: counter "X kobiet na liście" + chip kontekstu campa.
- Cały widok ma trzy ambient glowy (`brand-primary`, `brand-yellow`) w warstwie `-z-10`.

---

## 2. Profil uczestniczki — UI/UX

Cztery sekcje (mobile = stack, desktop = `grid xl:grid-cols-3` przy czym Karta Zdrowia zajmuje `xl:col-span-2`):

1. **Header profilu** — duży awatar z gradientową poświatą (`absolute -inset-[4px] blur-md opacity-60`), statusy (CONFIRMED, DUO, qrToken), kontakty (email, telefon, miasto, data dołączenia), dwa CTA: `Zadzwoń` (primary) i `Wyślij wiadomość` (ghost).
2. **Karta Zdrowia (krytyczna)** — gdy `severity === "high"`, cała karta dostaje:
   - obramowanie `border-rose-200/60`
   - dwuwarstwowy shadow z neonem `shadow-[0_0_0_1px_rgba(244,63,94,0.15),0_20px_50px_-15px_rgba(244,63,94,0.4)]`
   - dwa animowane glow-y (`bg-rose-400/25 blur-3xl animate-pulse`)
   - badge `Krytyczne!` z `shadow-[0_6px_18px_-4px_rgba(244,63,94,0.6)]`
   - blok alergii dostaje czerwone tło, reszta sekcji (dieta, leki, urazy) jest neutralna.
   - Stopka karty = osoba kontaktowa w nagłym wypadku z przyciskiem `tel:`.
3. **Płatności** — duży licznik "Zapłacone", pasek postępu z gradientem `brand-primary → brand-secondary`, lista wpłat (zadatek opłacony, reszta pending), CTA "Wyślij przypomnienie o dopłacie".
4. **Usługi dodatkowe** — kafelkowy grid (`md:grid-cols-2`), każda usługa = mini-karta z czasem trwania, slotem (`13.06 · 14:00`), ceną i badge'em `Opłacone`. Pusty stan to delikatny placeholder.

---

## 3. Struktura Danych i Integracja Prisma

### 3.1 Konwersja stron na Server Components

Obie strony są obecnie `"use client"` (dla `framer-motion`). Docelowy podział:

```
uczestniczki/
├── page.tsx                          (Server Component — fetch listy)
├── _components/
│   ├── ParticipantsListClient.tsx    ("use client", motion, search input)
│   └── ParticipantsTable.tsx         (optional, server-renderowana tabela)
└── [participantId]/
    ├── page.tsx                      (Server Component — findUnique + notFound)
    └── _components/
        └── ParticipantProfileClient.tsx
```

Strony serwerowe pobierają dane, deserializują `Decimal → number` i `Date → string`, przekazują payload do komponentów klientów.

### 3.2 Typy TypeScript do zwrócenia z serwera

```ts
// _types.ts
export type PaymentStatus = "PAID_FULL" | "DEPOSIT_ONLY" | "NONE";
export type HealthStatus = "FILLED" | "PARTIAL" | "MISSING";
export type PackKind = "SOLO" | "DUO";

export interface ParticipantListRow {
  id: string;                  // Booking.id
  userId: string | null;
  name: string;
  initials: string;
  email: string;
  phone: string | null;
  bookingStatus: string;       // CONFIRMED | PENDING | ...
  pack: PackKind;              // wyliczone z invitedById / invitedGuests
  invitedByName: string | null;
  payment: PaymentStatus;      // wyliczone z depositPaidAt / remainderPaidAt
  paidAmount: number;          // PLN, sumarycznie
  totalAmount: number;         // Camp.price
  depositAmount: number;       // Camp.deposit
  health: HealthStatus;        // FILLED | PARTIAL | MISSING
  servicesCount: number;
  servicesValue: number;       // suma PAID ServiceOrder
}

export interface ParticipantDetail extends ParticipantListRow {
  city: string | null;
  qrToken: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  joinedAt: string;            // sformatowane PL

  healthProfile: {
    severity: "ok" | "mid" | "high";   // wyliczone
    dietType: string | null;
    foodIntolerances: string[];
    foodNotes: string | null;
    chronicConditions: string | null;
    medications: string | null;
    injuries: string | null;
    allergies: string | null;
    emergencyName: string | null;
    emergencyPhone: string | null;
  } | null;

  payments: {
    total: number;
    deposit: number;
    remainder: number;
    depositPaidAt: string | null;
    remainderPaidAt: string | null;
    method: string;            // tymczasowo "Przelew tradycyjny"
  };

  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    slotAt: string;            // ISO -> "13.06 · 14:00"
    status: string;            // PAID | PENDING | CANCELLED
  }>;
}
```

### 3.3 Query dla listy

```ts
// _data/getParticipantsList.ts
export async function getParticipantsList(campId: string) {
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    select: { id: true, price: true, deposit: true },
  });
  if (!camp) return null;

  const bookings = await prisma.booking.findMany({
    where: { campId, status: { in: ["CONFIRMED", "PENDING"] } },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      depositPaidAt: true,
      remainderPaidAt: true,
      isCheckedIn: true,
      invitedById: true,
      invitedBy: { select: { name: true } },
      user: {
        select: {
          id: true,
          healthProfile: {
            select: {
              id: true,
              dietType: true,
              foodIntolerances: true,
              chronicConditions: true,
              medications: true,
              injuries: true,
              allergies: true,
            },
          },
        },
      },
      serviceOrders: {
        where: { status: "PAID" },
        select: { id: true, price: true },
      },
    },
  });

  return bookings.map(toParticipantListRow(camp));
}
```

Mapper (wyliczenia statusów):

```ts
function toParticipantListRow(camp: { price: Decimal; deposit: Decimal }) {
  return (b: BookingRaw): ParticipantListRow => {
    const payment: PaymentStatus = b.remainderPaidAt
      ? "PAID_FULL"
      : b.depositPaidAt
        ? "DEPOSIT_ONLY"
        : "NONE";

    const paidAmount =
      (b.depositPaidAt ? Number(camp.deposit) : 0) +
      (b.remainderPaidAt ? Number(camp.price) - Number(camp.deposit) : 0);

    const hp = b.user?.healthProfile;
    const health: HealthStatus = !hp
      ? "MISSING"
      : (hp.allergies || hp.chronicConditions) && hp.dietType
        ? "FILLED"
        : "PARTIAL";

    return {
      id: b.id,
      userId: b.user?.id ?? null,
      name: b.name ?? "—",
      initials: makeInitials(b.name),
      email: b.email,
      phone: b.phone,
      bookingStatus: b.status,
      pack: b.invitedById ? "DUO" : "SOLO",
      invitedByName: b.invitedBy?.name ?? null,
      payment,
      paidAmount,
      totalAmount: Number(camp.price),
      depositAmount: Number(camp.deposit),
      health,
      servicesCount: b.serviceOrders.length,
      servicesValue: b.serviceOrders.reduce((s, o) => s + Number(o.price), 0),
    };
  };
}
```

### 3.4 Query dla profilu

```ts
// _data/getParticipantDetail.ts
export async function getParticipantDetail(campId: string, bookingId: string) {
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    select: { id: true, price: true, deposit: true },
  });
  if (!camp) return null;

  const b = await prisma.booking.findFirst({
    where: { id: bookingId, campId },
    include: {
      invitedBy: { select: { name: true } },
      user: { include: { healthProfile: true } },
      serviceOrders: {
        orderBy: { createdAt: "asc" },
        include: {
          service: { select: { name: true, duration: true } },
          slot: { select: { startTime: true } },
        },
      },
    },
  });
  if (!b) return null;

  return toParticipantDetail(camp, b);
}
```

`toParticipantDetail` używa tej samej logiki co mapper listy + dodaje:

- `severity` Karty Zdrowia: `"high"` gdy `allergies` lub `chronicConditions` zawiera kluczowe terminy (`anafilakt`, `astma`, `cukrzyca`, `epilepsja`); `"mid"` gdy są wypełnione tylko niektóre pola; `"ok"` w pozostałych przypadkach.
- Formatowanie `slot.startTime → "13.06 · 14:00"` przez `Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })`.

### 3.5 Server Component wrappery

```tsx
// uczestniczki/page.tsx (po refaktorze)
import { notFound } from "next/navigation";
import { getParticipantsList } from "./_data/getParticipantsList";
import ParticipantsListClient from "./_components/ParticipantsListClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await getParticipantsList(id);
  if (!rows) notFound();

  return <ParticipantsListClient campId={id} rows={rows} />;
}
```

```tsx
// uczestniczki/[participantId]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; participantId: string }>;
}) {
  const { id, participantId } = await params;
  const data = await getParticipantDetail(id, participantId);
  if (!data) notFound();

  return <ParticipantProfileClient data={data} />;
}
```

### 3.6 Cache & rewalidacja

- Lista: `unstable_cache` z tagiem `camp:${campId}:participants`, TTL 30s.
- Profil: tag `booking:${bookingId}` — zmiana statusu / dopłaty wywołuje `revalidateTag` w odpowiednich Server Actions.
- Server Actions, które dotykają tych widoków: `confirmDepositPaid`, `confirmRemainderPaid`, `sendPaymentReminder`, `manualAddBooking`, `markCheckIn` (synchronizuje również z dashboardem campa — patrz `[id]/README.md`).

### 3.7 Dotykane modele

| Model              | Po co                                                                |
| ------------------ | -------------------------------------------------------------------- |
| `Camp`             | Cena bazowa + zadatek (potrzebne do wyliczenia % i `paidAmount`)     |
| `Booking`          | Status, daty wpłat, qrToken, isCheckedIn, invitedById                |
| `User`             | Powiązanie do `HealthProfile`                                        |
| `HealthProfile`    | Dieta, alergie, leki, urazy, kontakt awaryjny                        |
| `ServiceOrder`     | Lista usług + sumaryczne kwoty                                       |
| `CampService`      | Nazwa, czas trwania w UI                                             |
| `ServiceSlot`      | `startTime` formatowane do etykiety "13.06 · 14:00"                  |

### 3.8 Co jeszcze trzeba dorobić (TODO przed pełną integracją)

- Pole `phone` jest opcjonalne na `Booking`; w UI używaj `?? "—"` i wyłącz przycisk `tel:` gdy brak.
- Nie istnieje jeszcze model `Survey` / `OnboardingResponse`. Status "Brak ankiety wstępnej" na razie nie ma odpowiednika w bazie — albo dorzucamy `surveyCompletedAt: DateTime?` na `Booking`, albo nowy model. Tymczasem traktuj brak `HealthProfile` jako brak ankiety.
- `payment.method` jest na sztywno `"Przelew tradycyjny"` — docelowo wyczytaj z metadanych Stripe / providera.
- `severity` na razie wyliczana po stronie servera; gdy podpinamy AI sugestie (np. "ta klientka wymaga konsultacji z fizjoterapeutą"), warto wynieść do dedykowanego `RiskScore` modelu.
