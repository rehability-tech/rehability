/**
 * TEST JEDNOSTKOWY — proporcjonalny zadatek.
 *
 * `deriveDeposit` decyduje, ile pieniędzy realnie pobieramy TERAZ. Błąd tutaj
 * to albo obciążenie uczestnika zbyt dużą kwotą, albo rezerwacja, której nie
 * da się dopłacić (reszta poniżej minimum Stripe).
 */

import { describe, it, expect } from "vitest";

import { deriveDeposit } from "@/lib/discounts/deposit";
import { MIN_CHARGE_GROSZE } from "@/lib/discounts/types";

// Typowy wyjazd: 2 000 zł ceny, 500 zł zadatku.
const BASE_TOTAL = 200000;
const BASE_DEPOSIT = 50000;

describe("deriveDeposit — proporcja", () => {
  it.each([
    ["bez rabatu", 200000, 50000],
    ["−10%", 180000, 45000],
    ["−20%", 160000, 40000],
    ["−28% (kod stackowalny na przecenie)", 144000, 36000],
    ["−30%", 140000, 35000],
  ])("%s: cena %i gr → zadatek %i gr", (_label, finalTotal, expected) => {
    expect(deriveDeposit(BASE_TOTAL, BASE_DEPOSIT, finalTotal)).toBe(expected);
  });

  it("zachowuje stosunek zadatku do ceny", () => {
    const finalTotal = 160000;
    const deposit = deriveDeposit(BASE_TOTAL, BASE_DEPOSIT, finalTotal);

    expect(deposit / finalTotal).toBeCloseTo(BASE_DEPOSIT / BASE_TOTAL, 10);
  });
});

describe("deriveDeposit — przypadki brzegowe", () => {
  it("brak zadatku w cenniku → pobieramy całość", () => {
    expect(deriveDeposit(BASE_TOTAL, 0, 160000)).toBe(160000);
  });

  it("brak ceny w cenniku → pobieramy całość", () => {
    expect(deriveDeposit(0, BASE_DEPOSIT, 160000)).toBe(160000);
  });

  it("zadatek wyższy niż cena w cenniku → nigdy nie przekracza ceny końcowej", () => {
    expect(deriveDeposit(10000, 99999, 10000)).toBe(10000);
  });

  it("podnosi zadatek do progu Stripe", () => {
    // 1 gr zadatku przy cenie 100 000 gr → proporcja dałaby 0 gr.
    const deposit = deriveDeposit(10000000, 1, 100000);

    expect(deposit).toBeGreaterThanOrEqual(MIN_CHARGE_GROSZE);
  });

  it("scala nieściągalną resztę (1–199 gr) w jedną wpłatę", () => {
    // Zadatek 99,5% ceny → zostałoby 100 gr, czyli mniej niż minimum Stripe.
    const finalTotal = 20000;
    const deposit = deriveDeposit(20000, 19900, finalTotal);

    expect(deposit).toBe(finalTotal);
  });

  it("rabat bliski 100%: zadatek równy cenie końcowej przy progu", () => {
    const deposit = deriveDeposit(BASE_TOTAL, BASE_DEPOSIT, MIN_CHARGE_GROSZE);

    expect(deposit).toBe(MIN_CHARGE_GROSZE);
  });
});

describe("deriveDeposit — gwarancje wyniku", () => {
  const finalTotals = [200, 1000, 12345, 99999, 144000, 200000];

  it.each(finalTotals)(
    "dla ceny końcowej %i gr: próg <= zadatek <= cena, a reszta to 0 albo >= próg",
    (finalTotal) => {
      const deposit = deriveDeposit(BASE_TOTAL, BASE_DEPOSIT, finalTotal);
      const remainder = finalTotal - deposit;

      expect(deposit).toBeGreaterThanOrEqual(MIN_CHARGE_GROSZE);
      expect(deposit).toBeLessThanOrEqual(finalTotal);
      expect(remainder === 0 || remainder >= MIN_CHARGE_GROSZE).toBe(true);
    },
  );
});
