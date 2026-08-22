/**
 * TEST JEDNOSTKOWY — bramka cyklu życia promocji.
 *
 * `at` wstrzykujemy JAWNIE w każdym teście. Poleganie na zegarze ściennym
 * dałoby test, który psuje się o północy albo po zmianie czasu.
 */

import { describe, it, expect } from "vitest";

import { evaluateDiscount } from "@/lib/discounts/evaluate";
import type { DiscountLifecycle } from "@/lib/discounts/types";

const base: DiscountLifecycle = {
  isActive: true,
  validFrom: null,
  validUntil: null,
  usageLimit: null,
  usedCount: 0,
};

const AT = new Date("2026-08-07T12:00:00.000Z");

describe("evaluateDiscount", () => {
  it("przepuszcza promocję bez ograniczeń", () => {
    expect(evaluateDiscount(base, AT)).toEqual({ eligible: true, reason: null });
  });

  it("odrzuca nieaktywną", () => {
    expect(evaluateDiscount({ ...base, isActive: false }, AT)).toEqual({
      eligible: false,
      reason: "inactive",
    });
  });

  it("odrzuca przed datą startu", () => {
    const validFrom = new Date("2026-09-01T00:00:00.000Z");

    expect(evaluateDiscount({ ...base, validFrom }, AT)).toEqual({
      eligible: false,
      reason: "not_started",
    });
  });

  it("przepuszcza dokładnie w momencie startu", () => {
    expect(evaluateDiscount({ ...base, validFrom: AT }, AT).eligible).toBe(true);
  });

  it("odrzuca po dacie końca", () => {
    const validUntil = new Date("2026-08-01T00:00:00.000Z");

    expect(evaluateDiscount({ ...base, validUntil }, AT)).toEqual({
      eligible: false,
      reason: "expired",
    });
  });

  it("odrzuca przy wyczerpanym limicie", () => {
    const exhausted = { ...base, usageLimit: 20, usedCount: 20 };

    expect(evaluateDiscount(exhausted, AT)).toEqual({
      eligible: false,
      reason: "exhausted",
    });
  });

  it("odrzuca także przy przekroczonym limicie (limit jest miękki)", () => {
    // Dwie równoległe płatności potrafią dobić licznik ponad limit —
    // świadomy kompromis. Kolejne użycia muszą wtedy odpaść.
    const overshot = { ...base, usageLimit: 20, usedCount: 21 };

    expect(evaluateDiscount(overshot, AT).reason).toBe("exhausted");
  });

  it("przepuszcza tuż pod limitem", () => {
    const almost = { ...base, usageLimit: 20, usedCount: 19 };

    expect(evaluateDiscount(almost, AT).eligible).toBe(true);
  });

  it("brak limitu = bez ograniczeń", () => {
    const many = { ...base, usageLimit: null, usedCount: 9999 };

    expect(evaluateDiscount(many, AT).eligible).toBe(true);
  });
});

describe("evaluateDiscount — data końca obowiązuje WŁĄCZNIE (do 23:59 czasu PL)", () => {
  // Kalendarz w adminie zapisuje samą datę, czyli północ. Bez normalizacji
  // przez endOfTripDay „kod do 31.08" gasłby o 00:00 31 sierpnia.
  const validUntil = new Date("2026-08-31T00:00:00.000Z");

  it("działa rano ostatniego dnia", () => {
    const at = new Date("2026-08-31T06:00:00.000Z");

    expect(evaluateDiscount({ ...base, validUntil }, at).eligible).toBe(true);
  });

  it("działa wieczorem ostatniego dnia", () => {
    // 21:00 UTC = 23:00 czasu polskiego (CEST) — wciąż 31 sierpnia.
    const at = new Date("2026-08-31T21:00:00.000Z");

    expect(evaluateDiscount({ ...base, validUntil }, at).eligible).toBe(true);
  });

  it("nie działa następnego dnia rano", () => {
    const at = new Date("2026-09-01T08:00:00.000Z");

    expect(evaluateDiscount({ ...base, validUntil }, at).reason).toBe("expired");
  });
});
