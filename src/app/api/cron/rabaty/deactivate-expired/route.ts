import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import { now } from "@/lib/discounts/clock";
import { endOfTripDay } from "@/lib/trips/bookingWindow";

// Cron: wyłącza promocje, którym minął termin (kody, przeceny, rabaty mailowe).
//
// To WYŁĄCZNIE porządek w panelu — egzekwowanie terminu dzieje się przy każdym
// użyciu, w `evaluateDiscount`. Gdyby ten cron nie zadziałał, przeterminowany
// kod i tak nie przejdzie; admin zobaczy go tylko jako „aktywny, ale poza
// terminem".
//
// `validUntil` obowiązuje WŁĄCZNIE, do 23:59:59.999 czasu polskiego — dlatego
// porównujemy z końcem doby, a nie z samą datą. Inaczej cron gasiłby promocję
// rankiem jej ostatniego dnia.

export async function POST(req: Request) {
  return runCron(req, "rabaty/deactivate-expired", async () => {
    const checkedAt = now();

    // Kandydaci: aktywne, z ustawionym terminem, którego data jest już za nami.
    // Doprecyzowanie do końca doby robimy w kodzie — `endOfTripDay` poprawnie
    // obsługuje zmianę czasu, czego nie da się wyrazić w zapytaniu SQL.
    const where = {
      isActive: true,
      validUntil: { lt: checkedAt },
    } as const;

    const [codes, sales, emailDiscounts] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        select: { id: true, validUntil: true },
      }),
      prisma.sale.findMany({ where, select: { id: true, validUntil: true } }),
      prisma.emailDiscount.findMany({
        where,
        select: { id: true, validUntil: true },
      }),
    ]);

    const expired = (rows: { id: string; validUntil: Date | null }[]) =>
      rows
        .filter((row) => row.validUntil && checkedAt > endOfTripDay(row.validUntil))
        .map((row) => row.id);

    const codeIds = expired(codes);
    const saleIds = expired(sales);
    const emailIds = expired(emailDiscounts);

    const [deactivatedCodes, deactivatedSales, deactivatedEmailDiscounts] =
      await prisma.$transaction([
        prisma.discountCode.updateMany({
          where: { id: { in: codeIds } },
          data: { isActive: false },
        }),
        prisma.sale.updateMany({
          where: { id: { in: saleIds } },
          data: { isActive: false },
        }),
        prisma.emailDiscount.updateMany({
          where: { id: { in: emailIds } },
          data: { isActive: false },
        }),
      ]);

    return {
      checkedAt: checkedAt.toISOString(),
      codes: deactivatedCodes.count,
      sales: deactivatedSales.count,
      emailDiscounts: deactivatedEmailDiscounts.count,
    };
  });
}

export async function GET(req: Request) {
  return POST(req);
}
