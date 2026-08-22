import { prisma } from "@/lib/prisma";
import { sendNotificationToAdmins } from "@/lib/notifications/send";

import { now } from "./clock";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NALICZENIE ZUŻYCIA PROMOCJI
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Wołane WYŁĄCZNIE z webhooka, po `payment_intent.succeeded`. Dzięki temu
 * porzucony koszyk nie zjada puli — licznik rośnie dopiero, gdy pieniądze
 * realnie wpłynęły.
 *
 * Jedna funkcja obsługuje wszystkie trzy typy promocji, żeby reguła
 * „limit + jednorazowe powiadomienie" istniała w projekcie tylko raz.
 *
 * LIMIT JEST MIĘKKI: przy 19/20 dwie równoległe płatności obie przejdą
 * i licznik dobije 21. To świadomy kompromis — twardy limit wymagałby
 * rezerwacji miejsca na czas całego checkoutu.
 */

type UsageSnapshot = {
  discountCodeId?: string | null;
  saleId?: string | null;
  emailDiscountId?: string | null;
  isSandbox?: boolean | null;
};

type UsageContext = {
  /** Nazwa produktu do treści powiadomienia (wydarzenie albo kurs). */
  productTitle?: string | null;
  /** Dokąd prowadzi powiadomienie — panel rabatów danego produktu. */
  panelPath: string;
};

export async function registerDiscountUsage(
  snapshot: UsageSnapshot,
  ctx: UsageContext,
): Promise<void> {
  // Rezerwacje z piaskownicy nie konsumują limitów.
  if (snapshot.isSandbox) return;

  await Promise.all([
    snapshot.discountCodeId
      ? bump("discountCode", snapshot.discountCodeId, ctx)
      : null,
    snapshot.saleId ? bump("sale", snapshot.saleId, ctx) : null,
    snapshot.emailDiscountId
      ? bump("emailDiscount", snapshot.emailDiscountId, ctx)
      : null,
  ]);
}

type DiscountModel = "discountCode" | "sale" | "emailDiscount";

const LABEL: Record<DiscountModel, string> = {
  discountCode: "Kod",
  sale: "Przecena",
  emailDiscount: "Rabat mailowy",
};

async function bump(
  model: DiscountModel,
  id: string,
  ctx: UsageContext,
): Promise<void> {
  try {
    // `delegate` jest wspólnym mianownikiem trzech modeli — mają identyczny
    // zestaw pól cyklu życia, więc pojedynczy kod obsługuje wszystkie.
    const delegate = prisma[model] as unknown as {
      update: (args: unknown) => Promise<{
        usedCount: number;
        usageLimit: number | null;
        code?: string;
        name?: string;
      }>;
      updateMany: (args: unknown) => Promise<{ count: number }>;
    };

    // UWAGA: pole z nazwą różni się między modelami — DiscountCode ma `code`,
    // a Sale i EmailDiscount mają `name`. Wybranie nieistniejącego pola to
    // błąd walidacji Prismy, który wywróciłby CAŁY update (czyli licznik nigdy
    // by nie wzrósł), więc select musi być per model.
    const labelField = model === "discountCode" ? "code" : "name";

    const updated = await delegate.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
      select: { usedCount: true, usageLimit: true, [labelField]: true },
    });

    if (updated.usageLimit === null || updated.usedCount < updated.usageLimit) {
      return;
    }

    // Powiadomienie o wyczerpaniu idzie DOKŁADNIE RAZ. Prawo do wysyłki
    // rezerwujemy atomowo: tylko ten proces, którego updateMany trafi
    // w exhaustedNotifiedAt = null, faktycznie wyśle maila.
    const claimed = await delegate.updateMany({
      where: { id, exhaustedNotifiedAt: null },
      data: { exhaustedNotifiedAt: now() },
    });
    if (claimed.count === 0) return;

    const label = updated.code ?? updated.name ?? id;
    await sendNotificationToAdmins({
      title: "🏷️ Limit promocji wyczerpany",
      message: `${LABEL[model]} „${label}" osiągnął limit ${updated.usageLimit} użyć${
        ctx.productTitle ? ` (${ctx.productTitle})` : ""
      }.`,
      type: "SYSTEM",
      link: ctx.panelPath,
    });
  } catch (err) {
    // Promocja mogła zostać skasowana między zakupem a webhookiem. Snapshot
    // na rezerwacji i tak zachowuje kwotę, więc historia jest bezpieczna —
    // logujemy i idziemy dalej, nigdy nie wywracamy webhooka.
    console.error(`[discounts] registerDiscountUsage ${model}=${id}:`, err);
  }
}
