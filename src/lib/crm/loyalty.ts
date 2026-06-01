import type { Loyalty } from "./types";

/**
 * Reguły segmentacji lojalnościowej (Single Source of Truth).
 *
 * Trzymamy progi i logikę w jednym miejscu, aby lista CRM i profil klienta
 * zawsze liczyły status identycznie (DRY). Zmiana progu = jedna edycja tutaj.
 */

/** Próg wydatków (PLN) kwalifikujący do VIP. */
export const VIP_SPEND_THRESHOLD = 5000;
/** Próg liczby wyjazdów kwalifikujący do VIP. */
export const VIP_TRIPS_THRESHOLD = 3;
/** Próg liczby wyjazdów kwalifikujący do RETURNING. */
export const RETURNING_TRIPS_THRESHOLD = 2;

/**
 * Wyznacza segment lojalnościowy klienta.
 *
 * - VIP:        wydatki > 5000 PLN LUB >= 3 wyjazdy
 * - RETURNING:  >= 2 wyjazdy
 * - NEW:        pozostali (1 wyjazd)
 *
 * @param totalSpent Suma wpłat w PLN.
 * @param tripsCount Liczba rezerwacji (bez CANCELLED).
 */
export function resolveLoyalty(
  totalSpent: number,
  tripsCount: number,
): Loyalty {
  if (totalSpent > VIP_SPEND_THRESHOLD || tripsCount >= VIP_TRIPS_THRESHOLD) {
    return "VIP";
  }
  if (tripsCount >= RETURNING_TRIPS_THRESHOLD) {
    return "RETURNING";
  }
  return "NEW";
}

/**
 * Prezentacja segmentów (etykieta + klasy Tailwind) — bez JSX, aby mogła być
 * współdzielona przez wszystkie komponenty CRM (ikony dokładane lokalnie).
 * Dzięki temu kolory i nazwy segmentów mają jedno źródło prawdy (DRY).
 */
export const LOYALTY_META: Record<Loyalty, { label: string; className: string }> =
  {
    VIP: {
      label: "VIP",
      className:
        "bg-brand-yellow/20 text-amber-700 border-brand-yellow/40 shadow-[0_2px_10px_-4px_rgba(242,217,103,0.6)]",
    },
    RETURNING: {
      label: "Powracający",
      className: "bg-blue-50 text-blue-600 border-blue-200/60",
    },
    NEW: {
      label: "Nowy",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    },
  };
