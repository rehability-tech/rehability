/**
 * Ręczne zaksięgowanie wpłaty, która nie dotarła webhookiem Stripe.
 *
 * Kontekst: endpoint webhooka był wpięty na domenę bez `www`, przez co Vercel
 * odpowiadał 307 i Stripe nigdy nie dostarczył eventu. Rezerwacje zostały
 * anulowane przez cron „porzuconych koszyków" mimo opłaconej należności.
 *
 * Skrypt odtwarza to, co zrobiłby `handlePaymentSucceeded` w
 * src/app/api/webhooks/stripe/route.ts: księguje wpłatę, podpina konto,
 * wystawia token biletu. Jest idempotentny — ponowne uruchomienie nic nie zmieni.
 *
 * Użycie:
 *   npx tsx scripts/restore-booking-payment.mts <paymentIntentId>
 *
 * URUCHAMIAĆ WYŁĄCZNIE dla płatności potwierdzonych w dashboardzie Stripe
 * (status `succeeded`) — skrypt nie weryfikuje tego sam, bo lokalny klucz
 * STRIPE_SECRET_KEY jest kluczem testowym, a płatności są w trybie live.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const prisma = new PrismaClient();

const paymentIntentId = process.argv[2];
if (!paymentIntentId) {
  console.error("Podaj PaymentIntent ID, np. npx tsx scripts/restore-booking-payment.mts pi_...");
  process.exit(1);
}

async function main() {
  const b = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { trip: { select: { title: true, price: true, deposit: true } } },
  });
  if (!b) throw new Error("Nie znaleziono rezerwacji z PaymentIntentem " + paymentIntentId);

  console.log("=== PRZED ===");
  console.log({
    id: b.id, email: b.email, name: b.name, status: b.status, userId: b.userId,
    amountPaid: b.amountPaid, amountTotal: b.amountTotal, qrToken: b.qrToken,
    createdAt: b.createdAt, trip: b.trip?.title,
    cena: Number(b.trip?.price ?? 0), zadatek: Number(b.trip?.deposit ?? 0),
  });

  if (b.status === "FULLY_PAID" || b.status === "DEPOSIT_PAID") {
    console.log("\nWpłata już zaksięgowana — nic nie zmieniam.");
    return;
  }

  // Konto uczestnika: webhook robi upsert po e-mailu (linkOrCreateUser).
  // Bez tego rezerwacja nie pojawi się w panelu po zalogowaniu.
  let userId = b.userId;
  if (!userId) {
    const u = await prisma.user.upsert({
      where: { email: b.email },
      update: b.name ? { name: b.name } : {},
      create: { email: b.email, name: b.name ?? undefined },
      select: { id: true },
    });
    userId = u.id;
    console.log("\n  konto podpięte/utworzone:", userId);
  }

  // Gdy zadatek = pełna cena (wydarzenia jednodniowe), wpłata pokrywa całość.
  // Ustawiamy FULLY_PAID, bo bilet QR w DashboardHero aktywuje się dopiero wtedy.
  const fully = Number(b.trip?.deposit ?? 0) >= Number(b.trip?.price ?? 0);
  // Dokładnej godziny sukcesu nie znamy (klucz live jest tylko na produkcji),
  // więc przyjmujemy moment utworzenia rezerwacji — płatność szła zaraz po nim.
  const paidAt = b.createdAt;
  const newToken = `RH-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  const after = await prisma.booking.update({
    where: { id: b.id },
    data: {
      status: fully ? "FULLY_PAID" : "DEPOSIT_PAID",
      amountPaid: b.amountTotal,
      depositPaidAt: paidAt,
      ...(fully ? { remainderPaidAt: paidAt } : {}),
      qrToken: newToken,
      userId,
    },
  });

  console.log("\n=== PO ===");
  console.log({
    id: after.id, email: after.email, status: after.status, userId: after.userId,
    amountPaid: after.amountPaid, amountTotal: after.amountTotal,
    depositPaidAt: after.depositPaidAt, remainderPaidAt: after.remainderPaidAt,
    qrToken: after.qrToken, pi: after.stripePaymentIntentId,
  });

  const others = await prisma.booking.findMany({
    where: { email: b.email, id: { not: b.id } },
    select: { id: true, status: true, createdAt: true, amountPaid: true, stripePaymentIntentId: true },
  });
  if (others.length) {
    console.log("\n=== INNE REZERWACJE TEGO E-MAILA (sprawdź w Stripe, czy też opłacone) ===");
    console.log(others);
  }
}

main()
  .catch((e) => { console.error("BŁĄD:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
