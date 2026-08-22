/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TEST INTEGRACYJNY (z zamockowaną bazą) — jedyne wejście do wyceny
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `resolveCheckoutPricing` nie jest czyste: czyta wydarzenie i promocje przez
 * Prismę. Podmieniamy `@/lib/prisma` na atrapę i sprawdzamy dwie rzeczy:
 *   - że składamy poprawne ZAPYTANIA (zwłaszcza filtr piaskownicy),
 *   - że dobrze przetwarzamy to, co „baza" zwróci.
 *
 * Wzorzec `vi.hoisted` skopiowany z test/courses-db.enrollment.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  trip: { findUnique: vi.fn() },
  course: { findFirst: vi.fn(), findUnique: vi.fn() },
  sale: { findMany: vi.fn() },
  emailDiscount: { findMany: vi.fn() },
  discountCode: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import {
  resolveCheckoutPricing,
  resolveCoursePricing,
} from "@/lib/discounts/resolveCheckoutPricing";
import { deriveDeposit } from "@/lib/discounts/deposit";

const TRIP = {
  id: "trip-1",
  title: "Camp Prudnik",
  price: 2000, // złotówki (Decimal w bazie)
  deposit: 500,
  discountSandbox: false,
  sandboxPrice: null,
  sandboxDeposit: null,
};

const ADMIN = { role: "ADMIN", email: "admin@rehability.pl" };
const GUEST = { role: "USER", email: "kto@example.com" };

/** Aktywna promocja bez ograniczeń cyklu życia. */
const lifecycle = {
  isActive: true,
  validFrom: null,
  validUntil: null,
  usageLimit: null,
  usedCount: 0,
};

/** Kurs: 200 zł, płatność jednorazowa (brak zadatku). */
const COURSE = {
  id: "course-1",
  title: "Kurs testowy",
  price: 200,
  discountSandbox: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  db.trip.findUnique.mockResolvedValue(TRIP);
  db.course.findFirst.mockResolvedValue(COURSE);
  db.sale.findMany.mockResolvedValue([]);
  db.emailDiscount.findMany.mockResolvedValue([]);
  db.discountCode.findFirst.mockResolvedValue(null);
});

describe("resolveCheckoutPricing — podstawy", () => {
  it("bez promocji zwraca cenę z cennika i proporcjonalny zadatek", async () => {
    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "kto@example.com",
      viewer: GUEST,
    });

    expect(result).not.toBeNull();
    expect(result!.price.baseAmount).toBe(200000);
    expect(result!.price.finalAmount).toBe(200000);
    expect(result!.depositGrosze).toBe(50000);
    expect(result!.remainderGrosze).toBe(150000);
    expect(result!.snapshot.totalDiscountAmount).toBe(0);
  });

  it("nieistniejące wydarzenie → null", async () => {
    db.trip.findUnique.mockResolvedValue(null);

    const result = await resolveCheckoutPricing({
      tripId: "brak",
      email: null,
      viewer: null,
    });

    expect(result).toBeNull();
  });

  it("gość bez sesji nie odpytuje o rabaty mailowe", async () => {
    await resolveCheckoutPricing({ tripId: "trip-1", email: null, viewer: null });

    expect(db.emailDiscount.findMany).not.toHaveBeenCalled();
  });

  it("zadatek zgadza się z deriveDeposit dla wyliczonej ceny", async () => {
    db.sale.findMany.mockResolvedValue([
      { ...lifecycle, id: "s1", name: "Lato", valueType: "percent", percent: 20, targetPriceGrosze: null },
    ]);

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      viewer: null,
    });

    expect(result!.depositGrosze).toBe(
      deriveDeposit(200000, 50000, result!.price.finalAmount),
    );
    expect(result!.depositGrosze).toBe(40000);
  });
});

describe("resolveCheckoutPricing — piaskownica", () => {
  it("zwykły klient NIE widzi promocji testowych (filtr w zapytaniu)", async () => {
    db.trip.findUnique.mockResolvedValue({ ...TRIP, discountSandbox: true });

    await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "kto@example.com",
      rawCode: "TAJNY",
      viewer: GUEST,
    });

    // isSandbox: false musi trafić do WHERE — filtrowanie w widoku
    // pozwoliłoby testowej nazwie wyciec.
    expect(db.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isSandbox: false }),
      }),
    );
    expect(db.discountCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isSandbox: false }),
      }),
    );
  });

  it("kod z piaskownicy zwraca klientowi not_found, nie testową nazwę", async () => {
    db.trip.findUnique.mockResolvedValue({ ...TRIP, discountSandbox: true });
    // Filtr odciął rekord — z perspektywy zapytania kodu po prostu nie ma.
    db.discountCode.findFirst.mockResolvedValue(null);

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "kto@example.com",
      rawCode: "TAJNY",
      viewer: GUEST,
    });

    expect(result!.codeStatus).toEqual({
      ok: false,
      reason: "not_found",
      code: "TAJNY",
    });
  });

  it("admin w piaskownicy dostaje cenę testową i widzi rekordy testowe", async () => {
    db.trip.findUnique.mockResolvedValue({
      ...TRIP,
      discountSandbox: true,
      sandboxPrice: 100,
      sandboxDeposit: 50,
    });

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "admin@rehability.pl",
      viewer: ADMIN,
    });

    expect(result!.isSandbox).toBe(true);
    expect(result!.price.baseAmount).toBe(10000);
    expect(result!.depositGrosze).toBe(5000);
    expect(result!.snapshot.isSandbox).toBe(true);
    // Bez `isSandbox` w WHERE, czyli admin widzi jedno i drugie.
    expect(db.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ isSandbox: expect.anything() }),
      }),
    );
  });

  it("piaskownica wyłączona na wydarzeniu → admin widzi normalną cenę", async () => {
    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "admin@rehability.pl",
      viewer: ADMIN,
    });

    expect(result!.isSandbox).toBe(false);
    expect(result!.price.baseAmount).toBe(200000);
  });
});

describe("resolveCheckoutPricing — cykl życia i kody", () => {
  it("przeterminowana przecena jest odfiltrowana", async () => {
    db.sale.findMany.mockResolvedValue([
      {
        ...lifecycle,
        id: "s1",
        name: "Zeszłoroczna",
        valueType: "percent",
        percent: 50,
        targetPriceGrosze: null,
        validUntil: new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      viewer: null,
    });

    expect(result!.price.finalAmount).toBe(200000);
    expect(result!.snapshot.saleId).toBeNull();
  });

  it("kod o niepoprawnym kształcie nie dotyka bazy", async () => {
    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      rawCode: "!!",
      viewer: null,
    });

    expect(db.discountCode.findFirst).not.toHaveBeenCalled();
    expect(result!.codeStatus.reason).toBe("not_found");
  });

  it("kod jest normalizowany do UPPERCASE przed zapytaniem", async () => {
    await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      rawCode: " lato 10 ",
      viewer: null,
    });

    expect(db.discountCode.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ code: "LATO10" }),
      }),
    );
  });

  it("kod z wyczerpanym limitem → exhausted", async () => {
    db.discountCode.findFirst.mockResolvedValue({
      ...lifecycle,
      id: "c1",
      code: "LATO10",
      valueType: "percent",
      percent: 10,
      amountGrosze: null,
      stackableWithSale: false,
      usageLimit: 5,
      usedCount: 5,
    });

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      rawCode: "LATO10",
      viewer: null,
    });

    expect(result!.codeStatus.reason).toBe("exhausted");
    expect(result!.price.finalAmount).toBe(200000);
  });

  it("kod przegrywający z przeceną dostaje reason=outranked i nie wchodzi do snapshotu", async () => {
    db.sale.findMany.mockResolvedValue([
      { ...lifecycle, id: "s1", name: "Lato", valueType: "percent", percent: 20, targetPriceGrosze: null },
    ]);
    db.discountCode.findFirst.mockResolvedValue({
      ...lifecycle,
      id: "c1",
      code: "LATO10",
      valueType: "percent",
      percent: 10,
      amountGrosze: null,
      stackableWithSale: false,
    });

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      rawCode: "LATO10",
      viewer: null,
    });

    expect(result!.price.finalAmount).toBe(160000);
    expect(result!.codeStatus).toEqual({
      ok: false,
      reason: "outranked",
      code: "LATO10",
    });
    expect(result!.snapshot.discountCodeId).toBeNull();
    expect(result!.snapshot.saleId).toBe("s1");
  });
});

describe("resolveCheckoutPricing — snapshot", () => {
  it("mapuje wszystkie trzy źródła na kolumny rezerwacji", async () => {
    db.sale.findMany.mockResolvedValue([
      { ...lifecycle, id: "s1", name: "Lato", valueType: "percent", percent: 20, targetPriceGrosze: null },
    ]);
    db.emailDiscount.findMany.mockResolvedValue([
      { ...lifecycle, id: "e1", name: "Newsletter", valueType: "percent", percent: 5, amountGrosze: null },
    ]);
    db.discountCode.findFirst.mockResolvedValue({
      ...lifecycle,
      id: "c1",
      code: "LATO10",
      valueType: "percent",
      percent: 10,
      amountGrosze: null,
      stackableWithSale: true,
    });

    const result = await resolveCheckoutPricing({
      tripId: "trip-1",
      email: "kto@example.com",
      rawCode: "LATO10",
      viewer: GUEST,
    });

    // Przecena (−20%) bije rabat mailowy (−5%), a kod stackowalny dokłada
    // −10% od 160 000 → 144 000.
    expect(result!.price.finalAmount).toBe(144000);
    expect(result!.snapshot).toEqual({
      originalAmount: 200000,
      totalDiscountAmount: 56000,
      discountCodeId: "c1",
      discountCode: "LATO10",
      discountCodeAmount: 16000,
      saleId: "s1",
      saleName: "Lato",
      saleAmount: 40000,
      // Rabat mailowy przegrał konkurencję z przeceną — nie zjada limitu.
      emailDiscountId: null,
      emailDiscountName: null,
      emailDiscountAmount: null,
      isSandbox: false,
    });
  });

  it("suma pozycji snapshotu zgadza się z totalDiscountAmount", async () => {
    db.sale.findMany.mockResolvedValue([
      { ...lifecycle, id: "s1", name: "Lato", valueType: "percent", percent: 20, targetPriceGrosze: null },
    ]);
    db.discountCode.findFirst.mockResolvedValue({
      ...lifecycle,
      id: "c1",
      code: "LATO10",
      valueType: "percent",
      percent: 10,
      amountGrosze: null,
      stackableWithSale: true,
    });

    const { snapshot, price } = (await resolveCheckoutPricing({
      tripId: "trip-1",
      email: null,
      rawCode: "LATO10",
      viewer: null,
    }))!;

    const parts =
      (snapshot.discountCodeAmount ?? 0) +
      (snapshot.saleAmount ?? 0) +
      (snapshot.emailDiscountAmount ?? 0);

    expect(parts).toBe(snapshot.totalDiscountAmount);
    expect(snapshot.originalAmount - snapshot.totalDiscountAmount).toBe(
      price.finalAmount,
    );
  });
});

describe("resolveCoursePricing — kurs (płatność jednorazowa)", () => {
  it("bez promocji: cała cena do zapłaty od razu, zero reszty", async () => {
    const result = await resolveCoursePricing({
      slug: "kurs",
      email: null,
      viewer: null,
    });

    expect(result!.price.finalAmount).toBe(20000);
    // Kurs nie ma zadatku — deriveDeposit(base, 0, final) zwraca całość.
    expect(result!.depositGrosze).toBe(20000);
    expect(result!.remainderGrosze).toBe(0);
    expect(result!.product.kind).toBe("course");
  });

  it("filtruje promocje po courseId, nie po tripId", async () => {
    await resolveCoursePricing({ slug: "kurs", email: null, viewer: null });

    expect(db.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ courseId: "course-1" }),
      }),
    );
    expect(db.sale.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tripId: expect.anything() }),
      }),
    );
  });

  it("przecena i kod stackowalny liczą się tak samo jak przy wydarzeniu", async () => {
    db.sale.findMany.mockResolvedValue([
      { ...lifecycle, id: "s1", name: "Lato", valueType: "percent", percent: 20, targetPriceGrosze: null },
    ]);
    db.discountCode.findFirst.mockResolvedValue({
      ...lifecycle,
      id: "c1",
      code: "STACK10",
      valueType: "percent",
      percent: 10,
      amountGrosze: null,
      stackableWithSale: true,
    });

    const result = await resolveCoursePricing({
      slug: "kurs",
      email: null,
      rawCode: "STACK10",
      viewer: null,
    });

    // 20000 → -20% = 16000 → -10% = 14400
    expect(result!.price.finalAmount).toBe(14400);
    expect(result!.depositGrosze).toBe(14400);
    expect(result!.remainderGrosze).toBe(0);
  });

  it("nieistniejący kurs → null", async () => {
    db.course.findFirst.mockResolvedValue(null);

    const result = await resolveCoursePricing({
      slug: "brak",
      email: null,
      viewer: null,
    });

    expect(result).toBeNull();
  });

  it("bez slug i bez courseId → null (nie odpytujemy bazy)", async () => {
    const result = await resolveCoursePricing({ email: null, viewer: null });

    expect(result).toBeNull();
    expect(db.course.findFirst).not.toHaveBeenCalled();
  });
});
