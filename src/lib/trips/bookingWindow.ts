// ==========================================
// OKNO ZAPISÓW NA WYJAZD
// ==========================================
// Jedno źródło prawdy o tym, czy na wyjazd można się jeszcze zapisać.
// Używane przez:
//   - /api/bookings/create-payment-intent  (twarda blokada rezerwacji)
//   - /wyjazdy/[slug]                        (formularz vs. "zapisy zamknięte")
// Listingi (ukrywanie zakończonych wyjazdów) filtrują po endDate osobno,
// bo to zapytanie do bazy, nie reguła w pamięci.

export type TripBookingClosedReason =
  | "NOT_PUBLISHED" // status !== "PUBLISHED" (szkic / archiwum)
  | "ENDED" // wyjazd już się odbył (po endDate)
  | "MANUAL" // admin ręcznie zamknął zapisy (registrationClosed)
  | "DEADLINE"; // minął termin zapisów (registrationDeadline ?? startDate)

export type TripBookingWindow = {
  isOpen: boolean;
  reason: TripBookingClosedReason | null;
};

type TripLike = {
  status?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  registrationDeadline?: Date | string | null;
  registrationClosed?: boolean | null;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Zwraca stan okna zapisów dla wyjazdu w danym momencie.
 *
 * Kolejność reguł (od najtwardszej): brak publikacji → wyjazd zakończony →
 * ręczne zamknięcie → minięty termin zapisów. `registrationDeadline` ma
 * pierwszeństwo nad `startDate`; jeśli go nie ma, domyślnym terminem jest
 * dzień rozpoczęcia.
 */
export function getTripBookingWindow(
  trip: TripLike,
  now: Date = new Date(),
): TripBookingWindow {
  if (trip.status != null && trip.status !== "PUBLISHED") {
    return { isOpen: false, reason: "NOT_PUBLISHED" };
  }

  const endDate = toDate(trip.endDate);
  if (now >= endDate) {
    return { isOpen: false, reason: "ENDED" };
  }

  if (trip.registrationClosed) {
    return { isOpen: false, reason: "MANUAL" };
  }

  const cutoff = trip.registrationDeadline
    ? toDate(trip.registrationDeadline)
    : toDate(trip.startDate);
  if (now >= cutoff) {
    return { isOpen: false, reason: "DEADLINE" };
  }

  return { isOpen: true, reason: null };
}

/** Komunikat dla uczestniczki, gdy zapisy są zamknięte. */
export function bookingClosedMessage(
  reason: TripBookingClosedReason | null,
): string {
  switch (reason) {
    case "ENDED":
      return "Ten wyjazd już się odbył.";
    case "MANUAL":
      return "Zapisy na ten wyjazd zostały zamknięte.";
    case "DEADLINE":
      return "Termin zapisów na ten wyjazd już minął.";
    case "NOT_PUBLISHED":
    default:
      return "Ten wyjazd jest obecnie niedostępny.";
  }
}

/** Krótki nagłówek do kart "zapisy zamknięte" na froncie. */
export function bookingClosedHeadline(
  reason: TripBookingClosedReason | null,
): string {
  switch (reason) {
    case "ENDED":
      return "Wyjazd zakończony";
    case "DEADLINE":
      return "Termin zapisów minął";
    case "MANUAL":
    case "NOT_PUBLISHED":
    default:
      return "Zapisy zamknięte";
  }
}
