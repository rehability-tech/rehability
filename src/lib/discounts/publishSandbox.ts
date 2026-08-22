import { prisma } from "@/lib/prisma";

import { now } from "./clock";

/**
 * Dwa wyjścia z piaskownicy. Oba są jedną transakcją, żeby nie dało się
 * zostawić wydarzenia w stanie „przełącznik zgaszony, ale połowa promocji
 * wciąż testowa".
 */

/**
 * „Opublikuj i wyłącz" — cena testowa staje się cennikiem, a wszystkie
 * promocje testowe zaczynają działać naprawdę.
 */
export async function publishSandbox(tripId: string): Promise<void> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { sandboxPrice: true, sandboxDeposit: true },
  });
  if (!trip) throw new Error("Wydarzenie nie istnieje.");

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(trip.sandboxPrice != null ? { price: trip.sandboxPrice } : {}),
        ...(trip.sandboxDeposit != null ? { deposit: trip.sandboxDeposit } : {}),
        sandboxPrice: null,
        sandboxDeposit: null,
        discountSandbox: false,
        sandboxEnabledAt: null,
      },
    }),
    prisma.discountCode.updateMany({
      where: { tripId, isSandbox: true },
      data: { isSandbox: false },
    }),
    prisma.sale.updateMany({
      where: { tripId, isSandbox: true },
      data: { isSandbox: false },
    }),
    prisma.emailDiscount.updateMany({
      where: { tripId, isSandbox: true },
      data: { isSandbox: false },
    }),
  ]);
}

/**
 * „Wyłącz bez publikacji" — gasimy sam przełącznik. Promocje testowe
 * zostają wersjami roboczymi: dalej `isSandbox = true`, więc nikt spoza
 * adminów ich nie zobaczy. Cena testowa czeka na kolejne włączenie trybu.
 */
export async function disableSandbox(tripId: string): Promise<void> {
  await prisma.trip.update({
    where: { id: tripId },
    data: { discountSandbox: false, sandboxEnabledAt: null },
  });
}

/**
 * Sam cennik testowy, bez dotykania przełącznika. Ceny podajemy w
 * ZŁOTÓWKACH (jak Trip.price); `null` czyści nadpisanie.
 */
export async function updateSandboxPrices(
  tripId: string,
  prices: { sandboxPrice?: number | null; sandboxDeposit?: number | null },
): Promise<void> {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(prices.sandboxPrice !== undefined
        ? { sandboxPrice: prices.sandboxPrice }
        : {}),
      ...(prices.sandboxDeposit !== undefined
        ? { sandboxDeposit: prices.sandboxDeposit }
        : {}),
    },
  });
}

/**
 * ── PIASKOWNICA KURSU ────────────────────────────────────────────────────
 * Kurs płaci się jednorazowo i nie ma odpowiednika `sandboxPrice`, więc tryb
 * izoluje tu wyłącznie promocje — nie ma czego „przepisywać na cennik".
 * Stąd `publishCourseSandbox` tylko zdejmuje flagę testową z promocji.
 */
export async function setCourseSandbox(
  courseId: string,
  enabled: boolean,
): Promise<void> {
  await prisma.course.update({
    where: { id: courseId },
    data: { discountSandbox: enabled },
  });
}

export async function publishCourseSandbox(courseId: string): Promise<void> {
  await prisma.$transaction([
    prisma.course.update({ where: { id: courseId }, data: { discountSandbox: false } }),
    prisma.discountCode.updateMany({
      where: { courseId, isSandbox: true },
      data: { isSandbox: false },
    }),
    prisma.sale.updateMany({
      where: { courseId, isSandbox: true },
      data: { isSandbox: false },
    }),
    prisma.emailDiscount.updateMany({
      where: { courseId, isSandbox: true },
      data: { isSandbox: false },
    }),
  ]);
}

/** Włączenie trybu. Od tej chwili każdy zapis dostaje isSandbox = true. */
export async function enableSandbox(
  tripId: string,
  prices: { sandboxPrice?: number | null; sandboxDeposit?: number | null } = {},
): Promise<void> {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      discountSandbox: true,
      sandboxEnabledAt: now(),
      ...(prices.sandboxPrice !== undefined
        ? { sandboxPrice: prices.sandboxPrice }
        : {}),
      ...(prices.sandboxDeposit !== undefined
        ? { sandboxDeposit: prices.sandboxDeposit }
        : {}),
    },
  });
}
