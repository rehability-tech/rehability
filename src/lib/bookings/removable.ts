// ==========================================
// USUWANIE NIEOPŁACONYCH REZERWACJI
// ==========================================
// Jedno źródło prawdy o tym, czy admin może ręcznie skasować rezerwację
// z wydarzenia. Używane przez:
//   - DELETE /api/admin/wydarzenia/[id]/uczestnicy/[participantId] (twarda blokada)
//   - ParticipantCard w panelu admina (pokazanie/ukrycie przycisku)
// Funkcja jest czysta i client-safe — bez importów Prismy.
//
// Zasada: kasujemy TYLKO rezerwacje bez ani złotówki wpłaty, i dopiero gdy od
// ostatniej aktywności minęło 30 minut. „Ostatnia aktywność" to nowsza z dat
// createdAt / updatedAt, bo wznowienie płatności (resume-payment) bumpuje
// updatedAt — dzięki temu nie skasujemy komuś rezerwacji w trakcie płacenia.

import { isPaidBookingStatus } from "@/lib/bookings/groupPackages";

/** Ile minut od ostatniej aktywności musi minąć, zanim wpis da się usunąć. */
export const UNPAID_REMOVAL_MINUTES = 30;

/** Statusy, które w ogóle wchodzą w grę przy ręcznym usuwaniu. */
const REMOVABLE_STATUSES = [
  "PENDING",
  "PENDING_INVITATION",
  "EXPIRED",
  "CANCELLED",
];

export type BookingRemovalBlockReason =
  | "PAID" // są pieniądze na rezerwacji — nigdy nie kasujemy
  | "TOO_FRESH"; // za wcześnie, osoba może właśnie płacić

export type BookingRemoval = {
  canRemove: boolean;
  reason: BookingRemovalBlockReason | null;
  /** Ile pełnych minut zostało do odblokowania (tylko dla TOO_FRESH). */
  minutesLeft: number;
};

/** Minimum potrzebne do oceny „czy są pieniądze" — bez dat rezerwacji. */
type PaymentLike = {
  status?: string | null;
  amountPaid?: number | null;
  depositPaidAt?: Date | string | null;
  remainderPaidAt?: Date | string | null;
};

type BookingLike = PaymentLike & {
  createdAt: Date | string;
  updatedAt?: Date | string | null;
};

function toTime(value: Date | string | null | undefined): number {
  if (value == null) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Czy na rezerwacji są jakiekolwiek pieniądze (albo status mówi, że były). */
export function bookingHasMoney(booking: PaymentLike): boolean {
  return (
    (booking.amountPaid ?? 0) > 0 ||
    booking.depositPaidAt != null ||
    booking.remainderPaidAt != null ||
    isPaidBookingStatus(booking.status)
  );
}

/**
 * Czy tę rezerwację można ręcznie usunąć z wydarzenia — i jeśli nie, to dlaczego.
 */
export function getBookingRemoval(
  booking: BookingLike,
  now: Date = new Date(),
): BookingRemoval {
  if (bookingHasMoney(booking)) {
    return { canRemove: false, reason: "PAID", minutesLeft: 0 };
  }

  // Nieznany/nietypowy status traktujemy jak opłacony — wolimy nie skasować.
  if (booking.status != null && !REMOVABLE_STATUSES.includes(booking.status)) {
    return { canRemove: false, reason: "PAID", minutesLeft: 0 };
  }

  const lastActivity = Math.max(
    toTime(booking.createdAt),
    toTime(booking.updatedAt),
  );
  const minutesSince = (now.getTime() - lastActivity) / 60_000;

  if (minutesSince < UNPAID_REMOVAL_MINUTES) {
    return {
      canRemove: false,
      reason: "TOO_FRESH",
      minutesLeft: Math.max(1, Math.ceil(UNPAID_REMOVAL_MINUTES - minutesSince)),
    };
  }

  return { canRemove: true, reason: null, minutesLeft: 0 };
}

/** Komunikat dla admina, gdy usunięcie jest zablokowane. */
export function removalBlockedMessage(removal: BookingRemoval): string {
  switch (removal.reason) {
    case "PAID":
      return "Ta rezerwacja ma opłaconą wpłatę — nie można jej usunąć. Rozlicz zwrot w Stripe, zanim ją skasujesz.";
    case "TOO_FRESH":
      return `Rezerwacja jest zbyt świeża — ta osoba może właśnie kończyć płatność. Spróbuj ponownie za ${removal.minutesLeft} min.`;
    default:
      return "Tej rezerwacji nie można usunąć.";
  }
}
