import { prisma } from "@/lib/prisma";

import { calculatePrice } from "./calculatePrice";
import { deriveDeposit } from "./deposit";
import { evaluateDiscount } from "./evaluate";
import { ownerFilter, type DiscountOwner } from "./owner";
import type { DiscountCandidate, DiscountKind } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  DANE PANELU RABATÓW (/admin/wydarzenia/[id]/rabaty)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Statystyki liczymy WYŁĄCZNIE z opłaconych rezerwacji spoza piaskownicy
 * i joinujemy je po ID promocji, a NIE po nazwie. Join po nazwie sprawiłby,
 * że zwykła zmiana nazwy przeceny zerowałaby jej statystykę.
 *
 * Nazwy ze snapshotu rezerwacji służą tylko do pokazania promocji, która
 * została już skasowana ("promocja usunięta").
 */

export type PromoStats = {
  uses: number;
  discountGrosze: number;
};

export type DiscountPanelData = Awaited<ReturnType<typeof getDiscountPanelData>>;

const PAID_STATUSES = ["DEPOSIT_PAID", "FULLY_PAID"];

type PanelProduct = {
  kind: "trip" | "course";
  id: string;
  /** Kurs adresujemy slugiem w trasach panelu; wydarzenie ma tu swoje ID. */
  slug: string;
  title: string;
  priceGrosze: number;
  depositGrosze: number;
  sandbox: boolean;
  sandboxEnabledAt: Date | null;
  sandboxPriceGrosze: number | null;
  sandboxDepositGrosze: number | null;
};

/**
 * Sprowadza wydarzenie i kurs do jednego kształtu.
 *
 * Różnice: wydarzenie ma zadatek i cennik testowy, kurs płaci się
 * jednorazowo (zadatek 0) i nie ma odpowiednika `sandboxPrice`.
 */
async function loadProduct(owner: DiscountOwner): Promise<PanelProduct | null> {
  if (owner.kind === "trip") {
    const trip = await prisma.trip.findUnique({
      where: { id: owner.tripId },
      select: {
        id: true,
        title: true,
        price: true,
        deposit: true,
        discountSandbox: true,
        sandboxEnabledAt: true,
        sandboxPrice: true,
        sandboxDeposit: true,
      },
    });
    if (!trip) return null;

    return {
      kind: "trip",
      id: trip.id,
      slug: trip.id,
      title: trip.title,
      priceGrosze: Math.round(Number(trip.price) * 100),
      depositGrosze: Math.round(Number(trip.deposit) * 100),
      sandbox: trip.discountSandbox,
      sandboxEnabledAt: trip.sandboxEnabledAt,
      sandboxPriceGrosze:
        trip.sandboxPrice != null ? Math.round(Number(trip.sandboxPrice) * 100) : null,
      sandboxDepositGrosze:
        trip.sandboxDeposit != null
          ? Math.round(Number(trip.sandboxDeposit) * 100)
          : null,
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: owner.courseId },
    select: { id: true, slug: true, title: true, price: true, discountSandbox: true },
  });
  if (!course) return null;

  return {
    kind: "course",
    id: course.id,
    slug: course.slug,
    title: course.title,
    // Course.price to Int w ZŁOTÓWKACH (Trip.price jest Decimal).
    priceGrosze: Math.round((course.price ?? 0) * 100),
    depositGrosze: 0,
    sandbox: course.discountSandbox,
    sandboxEnabledAt: null,
    sandboxPriceGrosze: null,
    sandboxDepositGrosze: null,
  };
}

/** Pola snapshotu wspólne dla Booking i CoursePurchase. */
const SNAPSHOT_SELECT = {
  totalDiscountAmount: true,
  discountCodeId: true,
  discountCode: true,
  discountCodeAmount: true,
  saleId: true,
  saleName: true,
  saleAmount: true,
  emailDiscountId: true,
  emailDiscountName: true,
  emailDiscountAmount: true,
} as const;

/**
 * Dane panelu rabatów dla dowolnego produktu.
 *
 * Wydarzenie ma cenę i zadatek oraz cennik testowy w piaskownicy; kurs płaci
 * się jednorazowo (zadatek 0) i nie ma ceny testowej. Poza tym obsługa jest
 * identyczna, więc różnice sprowadzamy do jednego `if` na wejściu.
 */
export async function getDiscountPanelData(owner: DiscountOwner) {
  const product = await loadProduct(owner);
  if (!product) return null;

  const scope = ownerFilter(owner);

  const [codes, sales, emailDiscounts, purchases] = await Promise.all([
    prisma.discountCode.findMany({ where: scope, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: scope, orderBy: { createdAt: "desc" } }),
    prisma.emailDiscount.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      include: {
        members: { orderBy: { email: "asc" } },
        _count: { select: { members: true } },
      },
    }),
    // Zakupy z piaskownicy nie liczą się do statystyk.
    owner.kind === "trip"
      ? prisma.booking.findMany({
          where: {
            tripId: owner.tripId,
            isSandbox: false,
            status: { in: PAID_STATUSES },
            totalDiscountAmount: { gt: 0 },
          },
          select: SNAPSHOT_SELECT,
        })
      : prisma.coursePurchase.findMany({
          where: {
            courseId: owner.courseId,
            isSandbox: false,
            totalDiscountAmount: { gt: 0 },
          },
          select: SNAPSHOT_SELECT,
        }),
  ]);

  const bookings = purchases;

  // ── Agregacja po ID ────────────────────────────────────────────────────
  const stats = new Map<string, PromoStats>();
  /** Promocje obecne w historii, ale już skasowane z bazy. */
  const orphans = new Map<string, { kind: DiscountKind; name: string } & PromoStats>();

  const knownIds = new Set<string>([
    ...codes.map((c) => c.id),
    ...sales.map((s) => s.id),
    ...emailDiscounts.map((e) => e.id),
  ]);

  const record = (
    id: string | null,
    amount: number | null,
    kind: DiscountKind,
    name: string | null,
  ) => {
    if (!id || !amount) return;

    const entry = stats.get(id) ?? { uses: 0, discountGrosze: 0 };
    entry.uses += 1;
    entry.discountGrosze += amount;
    stats.set(id, entry);

    if (!knownIds.has(id)) {
      const orphan = orphans.get(id) ?? {
        kind,
        name: name ?? "Promocja usunięta",
        uses: 0,
        discountGrosze: 0,
      };
      orphan.uses += 1;
      orphan.discountGrosze += amount;
      orphans.set(id, orphan);
    }
  };

  let totalDiscountGrosze = 0;
  for (const booking of bookings) {
    totalDiscountGrosze += booking.totalDiscountAmount;
    record(booking.discountCodeId, booking.discountCodeAmount, "CODE", booking.discountCode);
    record(booking.saleId, booking.saleAmount, "SALE", booking.saleName);
    record(
      booking.emailDiscountId,
      booking.emailDiscountAmount,
      "EMAIL",
      booking.emailDiscountName,
    );
  }

  const withStats = <T extends { id: string }>(row: T) => ({
    ...row,
    stats: stats.get(row.id) ?? { uses: 0, discountGrosze: 0 },
    eligible: evaluateDiscount(row as never).eligible,
  });

  // ── Podgląd: co realnie zapłaci klient przy obecnych przecenach ────────
  const { priceGrosze, depositGrosze, sandboxPriceGrosze, sandboxDepositGrosze } =
    product;

  const activeSaleCandidates: DiscountCandidate[] = sales
    .filter((sale) => !sale.isSandbox && evaluateDiscount(sale).eligible)
    .map((sale) => ({
      kind: "SALE",
      id: sale.id,
      name: sale.name,
      valueType: sale.valueType as DiscountCandidate["valueType"],
      percent: sale.percent,
      targetPriceGrosze: sale.targetPriceGrosze,
    }));

  const preview = calculatePrice({
    baseAmount: priceGrosze,
    automatic: activeSaleCandidates,
  });

  return {
    // Nazwa `trip` jest historyczna — pole opisuje PRODUKT (wydarzenie albo
    // kurs). Zostawiona, żeby nie przepisywać całego panelu; `kind` mówi,
    // z czym mamy do czynienia.
    trip: {
      kind: product.kind,
      id: product.id,
      slug: product.slug,
      title: product.title,
      priceGrosze,
      depositGrosze,
      sandboxEnabled: product.sandbox,
      sandboxSince: product.sandboxEnabledAt,
      sandboxPriceGrosze,
      sandboxDepositGrosze,
    },
    codes: codes.map(withStats),
    sales: sales.map(withStats),
    emailDiscounts: emailDiscounts.map(({ _count, ...row }) => ({
      ...withStats(row),
      memberCount: _count.members,
    })),
    /** Podgląd ceny widocznej dziś dla uczestnika (bez kodu). */
    preview: {
      baseAmount: preview.baseAmount,
      finalAmount: preview.finalAmount,
      totalDiscount: preview.totalDiscount,
      lines: preview.lines,
      depositGrosze: deriveDeposit(priceGrosze, depositGrosze, preview.finalAmount),
      /** Ile przecen konkuruje w tej chwili — panel ostrzega przy >= 2. */
      competingSales: activeSaleCandidates.length,
      winningSaleId: preview.applied.sale?.id ?? null,
    },
    summary: {
      activePromotions:
        codes.filter((c) => c.isActive).length +
        sales.filter((s) => s.isActive).length +
        emailDiscounts.filter((e) => e.isActive).length,
      totalUses: bookings.length,
      totalDiscountGrosze,
      averageDiscountGrosze: bookings.length
        ? Math.round(totalDiscountGrosze / bookings.length)
        : 0,
      sandboxDrafts:
        codes.filter((c) => c.isSandbox).length +
        sales.filter((s) => s.isSandbox).length +
        emailDiscounts.filter((e) => e.isSandbox).length,
    },
    /** Promocje skasowane, ale obecne w historii zamówień. */
    orphans: [...orphans.entries()].map(([id, data]) => ({ id, ...data })),
  };
}
