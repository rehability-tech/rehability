// Wspólna reguła dla dat wydarzenia.
//
// Wydarzenia jednodniowe (warsztaty, dzień otwarty, promocja na jeden dzień)
// mają startDate === endDate. Formatery zakresu produkowały wtedy "12–12.10"
// albo "6-6 wrzesień", co wygląda jak błąd danych. Tu trzymamy rozpoznanie
// takiego przypadku i jego zapis słowny — każdy komponent zachowuje własny
// styl dla terminów wielodniowych.

export function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

export function isSameCalendarDay(
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start || !end) return false;
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );
}

// "12 października 2026" — zapis pojedynczego dnia wydarzenia.
export function formatSingleTripDay(
  date: Date,
  { withYear = true }: { withYear?: boolean } = {},
): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

// Skrót dla formaterów: zwraca gotowy tekst dla wydarzenia jednodniowego
// albo null, gdy termin jest wielodniowy i trzeba użyć własnego formatu.
export function formatSingleDayOrNull(
  start: unknown,
  end: unknown,
  options?: { withYear?: boolean },
): string | null {
  const startDate = toDateOrNull(start);
  const endDate = toDateOrNull(end);
  if (!isSameCalendarDay(startDate, endDate)) return null;
  return formatSingleTripDay(startDate as Date, options);
}
