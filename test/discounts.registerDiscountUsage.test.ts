/**
 * TEST INTEGRACYJNY (z zamockowaną bazą) — naliczanie zużycia promocji.
 *
 * Najważniejszy przypadek to `select` per model: DiscountCode ma pole `code`,
 * a Sale i EmailDiscount mają `name`. Wybranie nieistniejącego pola to błąd
 * walidacji Prismy, który wywróciłby cały `update` — licznik nigdy by nie
 * wzrósł, a błąd zniknąłby w `catch`. Cichy brak naliczania limitów byłby
 * bardzo trudny do zauważenia na produkcji, więc pilnujemy tego testem.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  discountCode: { update: vi.fn(), updateMany: vi.fn() },
  sale: { update: vi.fn(), updateMany: vi.fn() },
  emailDiscount: { update: vi.fn(), updateMany: vi.fn() },
}));

const notify = vi.hoisted(() => ({ sendNotificationToAdmins: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/notifications/send", () => notify);

import { registerDiscountUsage } from "@/lib/discounts/registerDiscountUsage";

const CTX = {
  productTitle: "Camp Prudnik",
  panelPath: "/admin/wydarzenia/trip-1/rabaty",
};

/** Promocja bez limitu — zwykły przypadek. */
const unlimited = { usedCount: 1, usageLimit: null };

beforeEach(() => {
  vi.clearAllMocks();
  db.discountCode.update.mockResolvedValue({ ...unlimited, code: "LATO10" });
  db.sale.update.mockResolvedValue({ ...unlimited, name: "Lato" });
  db.emailDiscount.update.mockResolvedValue({ ...unlimited, name: "Newsletter" });
  db.discountCode.updateMany.mockResolvedValue({ count: 1 });
  db.sale.updateMany.mockResolvedValue({ count: 1 });
  db.emailDiscount.updateMany.mockResolvedValue({ count: 1 });
  notify.sendNotificationToAdmins.mockResolvedValue(undefined);
});

describe("registerDiscountUsage — select musi pasować do modelu", () => {
  it("dla kodu wybiera `code`, nigdy `name`", async () => {
    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    const args = db.discountCode.update.mock.calls[0][0];
    expect(args.select).toEqual({
      usedCount: true,
      usageLimit: true,
      code: true,
    });
    expect(args.select).not.toHaveProperty("name");
  });

  it("dla przeceny wybiera `name`, nigdy `code`", async () => {
    await registerDiscountUsage({ saleId: "s1" }, CTX);

    const args = db.sale.update.mock.calls[0][0];
    expect(args.select).toEqual({
      usedCount: true,
      usageLimit: true,
      name: true,
    });
    expect(args.select).not.toHaveProperty("code");
  });

  it("dla rabatu mailowego wybiera `name`, nigdy `code`", async () => {
    await registerDiscountUsage({ emailDiscountId: "e1" }, CTX);

    const args = db.emailDiscount.update.mock.calls[0][0];
    expect(args.select).not.toHaveProperty("code");
    expect(args.select).toHaveProperty("name", true);
  });
});

describe("registerDiscountUsage — naliczanie", () => {
  it("podbija licznik o 1", async () => {
    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    expect(db.discountCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: { usedCount: { increment: 1 } },
      }),
    );
  });

  it("nalicza wszystkie trzy źródła naraz", async () => {
    await registerDiscountUsage(
      { discountCodeId: "c1", saleId: "s1", emailDiscountId: "e1" },
      CTX,
    );

    expect(db.discountCode.update).toHaveBeenCalledTimes(1);
    expect(db.sale.update).toHaveBeenCalledTimes(1);
    expect(db.emailDiscount.update).toHaveBeenCalledTimes(1);
  });

  it("pomija promocje, których nie ma w snapshocie", async () => {
    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    expect(db.sale.update).not.toHaveBeenCalled();
    expect(db.emailDiscount.update).not.toHaveBeenCalled();
  });

  it("rezerwacja z piaskownicy NIE konsumuje limitów", async () => {
    await registerDiscountUsage(
      { discountCodeId: "c1", saleId: "s1", isSandbox: true },
      CTX,
    );

    expect(db.discountCode.update).not.toHaveBeenCalled();
    expect(db.sale.update).not.toHaveBeenCalled();
  });

  it("skasowana promocja nie wywraca webhooka", async () => {
    db.discountCode.update.mockRejectedValue(new Error("Record not found"));

    await expect(
      registerDiscountUsage({ discountCodeId: "gone" }, CTX),
    ).resolves.toBeUndefined();
  });
});

describe("registerDiscountUsage — powiadomienie o wyczerpaniu", () => {
  it("milczy, dopóki limit nie został osiągnięty", async () => {
    db.discountCode.update.mockResolvedValue({
      usedCount: 19,
      usageLimit: 20,
      code: "LATO10",
    });

    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    expect(db.discountCode.updateMany).not.toHaveBeenCalled();
    expect(notify.sendNotificationToAdmins).not.toHaveBeenCalled();
  });

  it("wysyła powiadomienie po osiągnięciu limitu", async () => {
    db.discountCode.update.mockResolvedValue({
      usedCount: 20,
      usageLimit: 20,
      code: "LATO10",
    });

    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    // Prawo do wysyłki rezerwujemy atomowo — filtr po exhaustedNotifiedAt: null.
    expect(db.discountCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1", exhaustedNotifiedAt: null },
      }),
    );
    expect(notify.sendNotificationToAdmins).toHaveBeenCalledTimes(1);
    expect(notify.sendNotificationToAdmins.mock.calls[0][0].message).toContain(
      "LATO10",
    );
  });

  it("nie wysyła drugi raz, gdy znacznik już zajął inny proces", async () => {
    db.discountCode.update.mockResolvedValue({
      usedCount: 21,
      usageLimit: 20,
      code: "LATO10",
    });
    db.discountCode.updateMany.mockResolvedValue({ count: 0 });

    await registerDiscountUsage({ discountCodeId: "c1" }, CTX);

    expect(notify.sendNotificationToAdmins).not.toHaveBeenCalled();
  });
});
