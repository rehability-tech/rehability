import { MIN_CHARGE_GROSZE } from "./types";

/**
 * Zadatek po rabacie — PROPORCJONALNIE do ceny końcowej.
 *
 * Decyzja produktowa: rabat −10% obniża zarówno cenę całkowitą, JAK I zadatek
 * pobierany od razu. Uczestnik od razu płaci mniej — inaczej „kod rabatowy",
 * po którym kwota do zapłaty się nie zmienia, wygląda jak zepsuty.
 *
 * Ten sam wzór obsługuje `percent`, `amount` i `fixed_price`, bo zależy
 * wyłącznie od `finalTotal` — nie musi wiedzieć, skąd wzięła się obniżka.
 *
 * Gwarancje wyniku:
 *   MIN_CHARGE_GROSZE <= zadatek <= finalTotal
 *   reszta do dopłaty === 0  albo  >= MIN_CHARGE_GROSZE
 */
export function deriveDeposit(
  baseTotal: number,
  baseDeposit: number,
  finalTotal: number,
): number {
  // Brak sensownego zadatku w konfiguracji wydarzenia → pobieramy całość.
  if (baseTotal <= 0 || baseDeposit <= 0) return finalTotal;

  // 1. Proporcja. Zaokrąglenie half-up, tak jak istniejące
  //    Math.round(Number(trip.deposit) * 100) w reszcie kodu.
  let deposit = Math.round((baseDeposit * finalTotal) / baseTotal);

  // 2. Zadatek nigdy nie przekracza całości (np. gdy w cenniku zadatek
  //    był wyższy od ceny, albo przy bardzo dużym rabacie).
  deposit = Math.min(deposit, finalTotal);

  // 3. Próg Stripe. `finalTotal` jest już >= progu (dba o to calculatePrice),
  //    więc to podniesienie nie może przebić sufitu z pkt 2.
  deposit = Math.max(deposit, MIN_CHARGE_GROSZE);

  // 4. NIEŚCIĄGALNA RESZTA. Gdyby po zadatku zostało 1–199 gr, Stripe nie
  //    przyjmie dopłaty i rezerwacja utknęłaby na zawsze w DEPOSIT_PAID.
  //    W takim wypadku pobieramy całość jednym przelewem — webhook ustawi
  //    wtedy FULLY_PAID, bo wpłata pokrywa amountTotal.
  const remainder = finalTotal - deposit;
  if (remainder > 0 && remainder < MIN_CHARGE_GROSZE) deposit = finalTotal;

  return deposit;
}
