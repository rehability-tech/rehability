/**
 * Zegar domeny rabatów.
 *
 * Cały czas w systemie rabatowym czytamy przez `now()`, NIGDY przez
 * `new Date()`. Dzięki temu da się przetestować „co się stanie 1 września"
 * bez przestawiania zegara systemowego i bez czekania.
 *
 * `NEXT_PUBLIC_DEV_TODAY` przesuwa samą DATĘ (godzinę bierzemy z prawdziwego
 * zegara), i działa WYŁĄCZNIE poza produkcją — na produkcji zmienna jest
 * ignorowana, nawet gdyby ktoś ją ustawił.
 */
export function now(): Date {
  const real = new Date();

  if (process.env.NODE_ENV === "production") return real;

  const override = process.env.NEXT_PUBLIC_DEV_TODAY;
  if (!override) return real;

  // Oczekiwany format: YYYY-MM-DD. Cokolwiek innego ignorujemy po cichu —
  // literówka w zmiennej środowiskowej nie może wysadzić checkoutu.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(override.trim());
  if (!match) return real;

  const shifted = new Date(real);
  shifted.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(shifted.getTime()) ? real : shifted;
}
