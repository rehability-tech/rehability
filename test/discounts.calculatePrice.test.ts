/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TEST JEDNOSTKOWY — silnik wyceny rabatów
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `calculatePrice` jest funkcją czystą: te same argumenty → ten sam wynik,
 * zero bazy, zero sieci, zero zegara. Dlatego testuje się ją wprost, bez
 * mocków.
 *
 * Najważniejszy jest tu `expectInvariants` — uruchamiamy go na KAŻDYM wyniku.
 * Reguły nakładania będą się zmieniać, ale te trzy równości muszą zostać,
 * bo na nich opiera się poprawność kwoty wysyłanej do Stripe.
 */

import { describe, it, expect } from "vitest";

import { calculatePrice } from "@/lib/discounts/calculatePrice";
import { MIN_CHARGE_GROSZE, type DiscountCandidate } from "@/lib/discounts/types";

// ── Pomocniki budujące promocje ────────────────────────────────────────────

const sale = (percent: number, id = "sale-1"): DiscountCandidate => ({
  kind: "SALE",
  id,
  name: "Wczesna rezerwacja",
  valueType: "percent",
  percent,
});

const fixedSale = (targetPriceGrosze: number, id = "sale-fx"): DiscountCandidate => ({
  kind: "SALE",
  id,
  name: "Cena promocyjna",
  valueType: "fixed_price",
  targetPriceGrosze,
});

const email = (percent: number, id = "email-1"): DiscountCandidate => ({
  kind: "EMAIL",
  id,
  name: "Newsletter",
  valueType: "percent",
  percent,
});

const code = (
  percent: number,
  stackableWithSale = false,
  id = "code-1",
): DiscountCandidate => ({
  kind: "CODE",
  id,
  name: "LATO10",
  code: "LATO10",
  valueType: "percent",
  percent,
  stackableWithSale,
});

const amountCode = (
  amountGrosze: number,
  stackableWithSale = false,
): DiscountCandidate => ({
  kind: "CODE",
  id: "code-amt",
  name: "MINUS",
  code: "MINUS",
  valueType: "amount",
  amountGrosze,
  stackableWithSale,
});

/**
 * Niezmienniki, które muszą zachodzić dla każdego wyniku przy poprawnej
 * cenie bazowej (>= progu Stripe).
 */
function expectInvariants(result: ReturnType<typeof calculatePrice>) {
  const sum = result.lines.reduce((total, line) => total + line.amount, 0);

  expect(sum).toBe(result.totalDiscount);
  expect(result.baseAmount - result.totalDiscount).toBe(result.finalAmount);
  expect(result.finalAmount).toBeGreaterThanOrEqual(MIN_CHARGE_GROSZE);
  expect(result.lines.every((line) => line.amount > 0)).toBe(true);
}

// ── Testy ──────────────────────────────────────────────────────────────────

describe("calculatePrice — brak promocji", () => {
  it("przepuszcza cenę bez zmian", () => {
    const result = calculatePrice({ baseAmount: 200000 });

    expectInvariants(result);
    expect(result.finalAmount).toBe(200000);
    expect(result.totalDiscount).toBe(0);
    expect(result.lines).toEqual([]);
    expect(result.couponOutranked).toBe(false);
    expect(result.applied).toEqual({ code: null, sale: null, email: null });
  });
});

describe("calculatePrice — obniżki automatyczne KONKURUJĄ, nie sumują się", () => {
  it("sama przecena −20%", () => {
    const result = calculatePrice({ baseAmount: 200000, automatic: [sale(20)] });

    expectInvariants(result);
    expect(result.finalAmount).toBe(160000);
    expect(result.applied.sale?.id).toBe("sale-1");
    expect(result.applied.email).toBeNull();
  });

  it("sam rabat mailowy −15%", () => {
    const result = calculatePrice({ baseAmount: 200000, automatic: [email(15)] });

    expectInvariants(result);
    expect(result.finalAmount).toBe(170000);
    expect(result.applied.email?.id).toBe("email-1");
    expect(result.applied.sale).toBeNull();
  });

  it("przecena −20% vs rabat mailowy −30%: wygrywa mailowy, kwoty się NIE sumują", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      automatic: [sale(20), email(30)],
    });

    expectInvariants(result);
    // Suma dałaby 100 000. Konkurencja daje 140 000.
    expect(result.finalAmount).toBe(140000);
    expect(result.lines).toHaveLength(1);
    expect(result.applied.email?.id).toBe("email-1");
    expect(result.applied.sale).toBeNull();
  });

  it("dwie przeceny o równej wartości: deterministycznie wygrywa pierwsza z listy", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      automatic: [sale(20, "sale-a"), sale(20, "sale-b")],
    });

    expectInvariants(result);
    expect(result.lines).toHaveLength(1);
    expect(result.applied.sale?.id).toBe("sale-a");
  });

  it("przecena z ceną docelową (fixed_price)", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      automatic: [fixedSale(150000)],
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(150000);
    expect(result.totalDiscount).toBe(50000);
  });

  it("cena docelowa wyższa niż cena bazowa nie podnosi ceny", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      automatic: [fixedSale(250000)],
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(200000);
    expect(result.lines).toEqual([]);
  });
});

describe("calculatePrice — przykłady z briefu (baza 109,00 zł, przecena −20%)", () => {
  const baseAmount = 10900;

  it("kod −10% niestackowalny → wygrywa przecena, 87,20 zł, couponOutranked", () => {
    const result = calculatePrice({
      baseAmount,
      automatic: [sale(20)],
      code: code(10, false),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(8720);
    expect(result.couponOutranked).toBe(true);
    expect(result.applied.code).toBeNull();
    expect(result.applied.sale?.id).toBe("sale-1");
  });

  it("kod −30% niestackowalny → wygrywa kod, 76,30 zł", () => {
    const result = calculatePrice({
      baseAmount,
      automatic: [sale(20)],
      code: code(30, false),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(7630);
    expect(result.couponOutranked).toBe(false);
    expect(result.applied.code?.id).toBe("code-1");
    expect(result.applied.sale).toBeNull();
  });

  it("kod −10% stackowalny → 78,48 zł (liczony od kwoty już obniżonej)", () => {
    const result = calculatePrice({
      baseAmount,
      automatic: [sale(20)],
      code: code(10, true),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(7848);
    expect(result.lines).toHaveLength(2);
    expect(result.applied.code?.id).toBe("code-1");
    expect(result.applied.sale?.id).toBe("sale-1");
  });
});

describe("calculatePrice — remis kodu z automatem", () => {
  it("kod −20% vs przecena −20%: wygrywa przecena, kod dostaje couponOutranked", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      automatic: [sale(20)],
      code: code(20, false),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(160000);
    expect(result.couponOutranked).toBe(true);
    expect(result.applied.code).toBeNull();
    expect(result.applied.sale?.id).toBe("sale-1");
  });
});

describe("calculatePrice — clamp do progu Stripe", () => {
  it("kod kwotowy większy niż cena → 2,00 zł, clamped", () => {
    const result = calculatePrice({
      baseAmount: 200000,
      code: amountCode(999999),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expect(result.totalDiscount).toBe(200000 - MIN_CHARGE_GROSZE);
    expect(result.clamped).toBe(true);
  });

  it("clamp przy dwóch pozycjach: pierwsza cała, druga ucięta, suma dokładna", () => {
    // Baza 10 000 gr. Przecena −95% = 9 500. Zostaje 500, kod kwotowy
    // −400 zł (40 000 gr) mieści się w budżecie tylko do 9 800 − 9 500 = 300.
    const result = calculatePrice({
      baseAmount: 10000,
      automatic: [sale(95)],
      code: amountCode(40000, true),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expect(result.clamped).toBe(true);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].amount).toBe(9500);
    expect(result.lines[1].amount).toBe(300);
  });

  it("pozycja przycięta do zera znika z paragonu i NIE trafia do applied", () => {
    // Przecena zjada cały dostępny budżet (10 000 − 200 = 9 800), więc dla
    // kodu nie zostaje nic. Kod nie może wtedy zjeść limitu użyć.
    const result = calculatePrice({
      baseAmount: 10000,
      automatic: [fixedSale(MIN_CHARGE_GROSZE)],
      code: amountCode(5000, true),
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(MIN_CHARGE_GROSZE);
    expect(result.lines).toHaveLength(1);
    expect(result.applied.code).toBeNull();
    expect(result.applied.sale).not.toBeNull();
  });

  it("cena bazowa poniżej progu Stripe → zero rabatu, clamped", () => {
    // Jedyny przypadek, w którym finalAmount < MIN_CHARGE_GROSZE. To błąd
    // konfiguracji wydarzenia — API odrzuci taką wycenę, silnik ma tylko
    // nie produkować kwot ujemnych.
    const result = calculatePrice({ baseAmount: 100, automatic: [sale(50)] });

    expect(result.finalAmount).toBe(100);
    expect(result.totalDiscount).toBe(0);
    expect(result.lines).toEqual([]);
    expect(result.clamped).toBe(true);
  });
});

describe("calculatePrice — skala realnego wyjazdu (2 000 zł)", () => {
  const baseAmount = 200000;

  it.each([
    ["bez kodu", null, 160000],
    ["kod −10% niestackowalny (przegrywa)", code(10, false), 160000],
    ["kod −30% niestackowalny (wygrywa)", code(30, false), 140000],
    ["kod −10% stackowalny", code(10, true), 144000],
  ])("%s → %i gr", (_label, appliedCode, expected) => {
    const result = calculatePrice({
      baseAmount,
      automatic: [sale(20)],
      code: appliedCode as DiscountCandidate | null,
    });

    expectInvariants(result);
    expect(result.finalAmount).toBe(expected);
  });
});
