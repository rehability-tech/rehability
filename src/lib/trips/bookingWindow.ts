// ==========================================
// OKNO ZAPISÓW NA WYDARZENIE
// ==========================================
// Jedno źródło prawdy o tym, czy na wydarzenie można się jeszcze zapisać.
// Używane przez:
//   - /api/bookings/create-payment-intent  (twarda blokada rezerwacji)
//   - /wydarzenia/[slug]                        (formularz vs. "zapisy zamknięte")
// Listingi (ukrywanie zakończonych wydarzeń) filtrują po endDate osobno,
// bo to zapytanie do bazy, nie reguła w pamięci.

export type TripBookingClosedReason =
  | "NOT_PUBLISHED" // status !== "PUBLISHED" (szkic / archiwum)
  | "ENDED" // wydarzenie już się odbyłoo (po endDate)
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

// Wydarzenia sprzedajemy w Polsce, więc każdą datę „do kiedy" liczymy w czasie
// polskim — niezależnie od strefy serwera (na produkcji to UTC).
const TRIP_TIMEZONE = "Europe/Warsaw";

/** Przesunięcie strefy wydarzeń względem UTC w danym momencie (w ms). */
function tripTimezoneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIP_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  // Intl potrafi zwrócić "24" dla północy — normalizujemy do 0.
  const hour = part("hour") % 24;
  const asIfUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    hour,
    part("minute"),
    part("second"),
  );

  // Sekundowa precyzja formattera: obcinamy ms po obu stronach.
  return asIfUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Ostatnia milisekunda dnia (23:59:59.999 czasu polskiego), w którym wypada
 * podana data.
 *
 * Kalendarz w adminie zapisuje samą datę, czyli PÓŁNOC wybranego dnia. Bez tej
 * normalizacji „zapisy do 27 lipca" gasłyby o 00:00 27 lipca — cały ostatni
 * dzień przepadałby. Data graniczna jest więc zawsze traktowana WŁĄCZNIE.
 */
export function endOfTripDay(value: Date | string): Date {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return date;

  const dayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(dayParts.find((p) => p.type === type)?.value ?? 0);

  // 23:59:59.999 lokalnie → instant UTC. Offset liczymy dwuetapowo, żeby
  // poprawnie trafić także w dobach ze zmianą czasu.
  const naive = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    23,
    59,
    59,
    999,
  );
  const firstGuess = naive - tripTimezoneOffsetMs(new Date(naive));
  return new Date(naive - tripTimezoneOffsetMs(new Date(firstGuess)));
}

/**
 * Zwraca stan okna zapisów dla wydarzenia w danym momencie.
 *
 * Kolejność reguł (od najtwardszej): brak publikacji → wydarzenie zakończone →
 * ręczne zamknięcie → minięty termin zapisów. `registrationDeadline` ma
 * pierwszeństwo nad `startDate`; jeśli go nie ma, domyślnym terminem jest
 * dzień rozpoczęcia. Każdy termin obowiązuje WŁĄCZNIE — wybrany w adminie
 * dzień jest ostatnim dniem, w którym można się zapisać (do 23:59 czasu PL).
 */
export function getTripBookingWindow(
  trip: TripLike,
  now: Date = new Date(),
): TripBookingWindow {
  if (trip.status != null && trip.status !== "PUBLISHED") {
    return { isOpen: false, reason: "NOT_PUBLISHED" };
  }

  // Wszystkie daty graniczne liczymy WŁĄCZNIE — do końca doby czasu polskiego
  // (patrz `endOfTripDay`), bo w bazie trzymamy samą datę bez godziny.
  if (now > endOfTripDay(trip.endDate)) {
    return { isOpen: false, reason: "ENDED" };
  }

  if (trip.registrationClosed) {
    return { isOpen: false, reason: "MANUAL" };
  }

  const cutoff = endOfTripDay(trip.registrationDeadline ?? trip.startDate);
  if (now > cutoff) {
    return { isOpen: false, reason: "DEADLINE" };
  }

  return { isOpen: true, reason: null };
}

/**
 * Czy wydarzenie należy już traktować jako minione na potrzeby LISTINGÓW
 * (panel uczestnika, widżety). Wydarzenie zostaje widoczne przez CAŁY ostatni
 * dzień (do końca doby `endDate`) — panel z harmonogramem, SPA i czatem musi
 * być dostępny także w dniu zakończenia. Miniony = dopiero doba po `endDate`.
 */
export function isTripPast(
  trip: { endDate: Date | string },
  now: Date = new Date(),
): boolean {
  return now > endOfTripDay(trip.endDate);
}

/**
 * Próg daty dla zapytań o wydarzenia jeszcze nieminione: `endDate >= cutoff`.
 *
 * Odpowiednik `isTripPast` po stronie BAZY — tam nie da się policzyć końca doby
 * per wiersz, więc porównujemy same daty. `endDate` trzymamy jako północ UTC
 * wybranego dnia, dlatego próg to północ UTC DZISIEJSZEJ daty liczonej w czasie
 * polskim. Bez tego serwer w UTC (produkcja) trzymałby minione wydarzenie na
 * listach jeszcze przez 2 godziny po północy czasu PL — i katalog rozjeżdżałby
 * się z panelem, który liczy po `isTripPast`.
 */
export function activeTripDateCutoff(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

/** Komunikat dla uczestniczki, gdy zapisy są zamknięte. */
export function bookingClosedMessage(
  reason: TripBookingClosedReason | null,
): string {
  switch (reason) {
    case "ENDED":
      return "To wydarzenie już się odbyłoo.";
    case "MANUAL":
      return "Zapisy na to wydarzenie zostałoy zamknięte.";
    case "DEADLINE":
      return "Termin zapisów na to wydarzenie już minął.";
    case "NOT_PUBLISHED":
    default:
      return "To wydarzenie jest obecnie niedostępne.";
  }
}

/** Krótki nagłówek do kart "zapisy zamknięte" na froncie. */
export function bookingClosedHeadline(
  reason: TripBookingClosedReason | null,
): string {
  switch (reason) {
    case "ENDED":
      return "Wydarzenie zakończone";
    case "DEADLINE":
      return "Termin zapisów minął";
    case "MANUAL":
    case "NOT_PUBLISHED":
    default:
      return "Zapisy zamknięte";
  }
}
