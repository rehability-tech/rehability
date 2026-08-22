import { prisma } from "@/lib/prisma";

import { calculatePrice } from "./calculatePrice";
import { deriveDeposit } from "./deposit";
import { evaluateDiscount } from "./evaluate";
import { normalizeCode, isValidCodeShape } from "./normalizeCode";
import {
  courseOwner,
  ownerFilter,
  tripOwner,
  type DiscountOwner,
} from "./owner";
import {
  isSandboxActiveFor,
  resolveBasePrice,
  sandboxFilter,
  viewerCanUseSandbox,
  type SandboxViewer,
} from "./sandbox";
import {
  type BookingDiscountSnapshot,
  type DiscountCandidate,
  type DiscountRejectionReason,
  type PriceResult,
} from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  JEDYNE WEJŚCIE DO WYCENY — wspólne dla wydarzeń i kursów
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Wołają je: strona produktu (podgląd), endpoint podglądu kodu i tworzenie
 * PaymentIntenta. Dzięki temu podgląd i faktyczna kwota nie mogą się
 * rozjechać. Kod przysłany z przeglądarki jest TYLKO SUGESTIĄ — przy
 * tworzeniu płatności wycena liczona jest od nowa z bazy.
 *
 * Różnica między produktami sprowadza się do trzech rzeczy: skąd bierzemy
 * cenę bazową, czy istnieje zadatek i po czym filtrujemy promocje. Resztę
 * (cykl życia, reguły nakładania, snapshot) obsługuje wspólny rdzeń.
 */

export type CheckoutPricing = {
  product: {
    kind: "trip" | "course";
    id: string;
    title: string;
    priceGrosze: number;
    depositGrosze: number;
  };
  price: PriceResult;
  /** Kwota do pobrania TERAZ. Dla kursu = cała cena (brak zadatku). */
  depositGrosze: number;
  /** Reszta do dopłaty później. Zawsze 0 albo >= progu Stripe. */
  remainderGrosze: number;
  isSandbox: boolean;
  codeStatus: {
    ok: boolean;
    reason: DiscountRejectionReason | null;
    code: string | null;
  };
  /** Gotowe do zapisania na Booking / CoursePurchase. */
  snapshot: BookingDiscountSnapshot;
};

/** Wspólny rdzeń: promocje danego produktu → PriceResult → snapshot. */
async function priceWithDiscounts(args: {
  owner: DiscountOwner;
  product: CheckoutPricing["product"];
  inSandbox: boolean;
  email: string | null;
  rawCode?: string | null;
}): Promise<CheckoutPricing> {
  const { owner, product, inSandbox, email, rawCode } = args;

  const scope = { ...ownerFilter(owner), ...sandboxFilter(inSandbox) };

  // Kod bez poprawnego kształtu nie ma prawa dotknąć bazy — to darmowa
  // ochrona przed zgadywaniem po jednym znaku.
  const normalizedCode = rawCode ? normalizeCode(rawCode) : "";
  const codeQueryable =
    normalizedCode.length > 0 && isValidCodeShape(normalizedCode);

  const [sales, emailDiscounts, discountCode] = await Promise.all([
    prisma.sale.findMany({
      where: { ...scope, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    email
      ? prisma.emailDiscount.findMany({
          where: { ...scope, isActive: true, members: { some: { email } } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    codeQueryable
      ? prisma.discountCode.findFirst({
          where: { ...scope, code: normalizedCode },
        })
      : Promise.resolve(null),
  ]);

  // ── Obniżki automatyczne ────────────────────────────────────────────────
  // Kolejność [przeceny, rabaty mailowe] jest DETERMINISTYCZNYM tie-breakiem
  // w calculatePrice: przy równej wartości wygrywa przecena.
  const automatic: DiscountCandidate[] = [
    ...sales
      .filter((sale) => evaluateDiscount(sale).eligible)
      .map(
        (sale): DiscountCandidate => ({
          kind: "SALE",
          id: sale.id,
          name: sale.name,
          valueType: sale.valueType as DiscountCandidate["valueType"],
          percent: sale.percent,
          targetPriceGrosze: sale.targetPriceGrosze,
        }),
      ),
    ...emailDiscounts
      .filter((discount) => evaluateDiscount(discount).eligible)
      .map(
        (discount): DiscountCandidate => ({
          kind: "EMAIL",
          id: discount.id,
          name: discount.name,
          valueType: discount.valueType as DiscountCandidate["valueType"],
          percent: discount.percent,
          amountGrosze: discount.amountGrosze,
        }),
      ),
  ];

  // ── Kod ─────────────────────────────────────────────────────────────────
  let codeCandidate: DiscountCandidate | null = null;
  let codeReason: DiscountRejectionReason | null = null;

  if (normalizedCode) {
    if (!discountCode) {
      // Pokrywa też kod z piaskownicy i kod z innego produktu — celowo
      // nie potwierdzamy, że taki kod w ogóle istnieje.
      codeReason = "not_found";
    } else {
      const verdict = evaluateDiscount(discountCode);
      if (!verdict.eligible) {
        codeReason = verdict.reason;
      } else {
        codeCandidate = {
          kind: "CODE",
          id: discountCode.id,
          name: discountCode.code,
          code: discountCode.code,
          valueType: discountCode.valueType as DiscountCandidate["valueType"],
          percent: discountCode.percent,
          amountGrosze: discountCode.amountGrosze,
          stackableWithSale: discountCode.stackableWithSale,
        };
      }
    }
  }

  const price = calculatePrice({
    baseAmount: product.priceGrosze,
    code: codeCandidate,
    automatic,
  });

  // Kod przegrał z automatem — koszyk pokaże wyjaśnienie zamiast milczeć.
  if (codeCandidate && price.couponOutranked) codeReason = "outranked";

  // Dla kursu depositGrosze = 0, więc deriveDeposit zwróci całą kwotę —
  // dokładnie to, czego chcemy przy płatności jednorazowej.
  const finalDeposit = deriveDeposit(
    product.priceGrosze,
    product.depositGrosze,
    price.finalAmount,
  );

  return {
    product,
    price,
    depositGrosze: finalDeposit,
    remainderGrosze: price.finalAmount - finalDeposit,
    isSandbox: inSandbox,
    codeStatus: {
      ok: !!price.applied.code,
      reason: codeReason,
      code: normalizedCode || null,
    },
    snapshot: buildSnapshot(price, inSandbox),
  };
}

/** Wycena rezerwacji wydarzenia (cena + zadatek). */
export async function resolveCheckoutPricing(args: {
  tripId: string;
  /** Lowercase e-mail z sesji. null = gość → bez rabatów mailowych. */
  email: string | null;
  rawCode?: string | null;
  viewer: SandboxViewer;
}): Promise<CheckoutPricing | null> {
  const trip = await prisma.trip.findUnique({
    where: { id: args.tripId },
    select: {
      id: true,
      title: true,
      price: true,
      deposit: true,
      discountSandbox: true,
      sandboxPrice: true,
      sandboxDeposit: true,
    },
  });

  if (!trip) return null;

  const inSandbox = isSandboxActiveFor(trip, args.viewer);
  const { priceGrosze, depositGrosze } = resolveBasePrice(trip, inSandbox);

  return priceWithDiscounts({
    owner: tripOwner(trip.id),
    product: { kind: "trip", id: trip.id, title: trip.title, priceGrosze, depositGrosze },
    inSandbox,
    email: args.email,
    rawCode: args.rawCode,
  });
}

/**
 * Wycena zakupu kursu. Kurs płaci się JEDNORAZOWO, więc zadatek to 0 —
 * `deriveDeposit` zwróci wtedy pełną kwotę.
 *
 * Kurs nie ma cennika testowego (brak odpowiednika `sandboxPrice`), więc
 * piaskownica izoluje tu wyłącznie promocje, nie cenę.
 */
export async function resolveCoursePricing(args: {
  /** Podaj jedno z dwóch — checkout zna slug, webhook zna id. */
  courseId?: string;
  slug?: string;
  email: string | null;
  rawCode?: string | null;
  viewer: SandboxViewer;
}): Promise<CheckoutPricing | null> {
  if (!args.courseId && !args.slug) return null;

  const course = await prisma.course.findFirst({
    where: args.courseId ? { id: args.courseId } : { slug: args.slug },
    select: { id: true, title: true, price: true, discountSandbox: true },
  });

  if (!course) return null;

  const inSandbox = course.discountSandbox && viewerCanUseSandbox(args.viewer);
  // Course.price to Int w ZŁOTÓWKACH (inaczej niż Trip.price typu Decimal).
  const priceGrosze = Math.round((course.price ?? 0) * 100);

  return priceWithDiscounts({
    owner: courseOwner(course.id),
    product: {
      kind: "course",
      id: course.id,
      title: course.title,
      priceGrosze,
      depositGrosze: 0,
    },
    inSandbox,
    email: args.email,
    rawCode: args.rawCode,
  });
}

/**
 * Snapshot to WARTOŚCI, nie referencje — świadomie bez kluczy obcych, żeby
 * skasowanie promocji nie psuło historii. `*Id` służy do naliczenia zużycia
 * i do statystyk (joinujemy po ID, nie po nazwie — nazwa może się zmienić).
 */
function buildSnapshot(
  price: PriceResult,
  isSandbox: boolean,
): BookingDiscountSnapshot {
  const amountOf = (id: string | undefined) =>
    price.lines.find((line) => line.id === id)?.amount ?? null;

  const { code, sale, email } = price.applied;

  return {
    originalAmount: price.baseAmount,
    totalDiscountAmount: price.totalDiscount,
    discountCodeId: code?.id ?? null,
    discountCode: code?.code ?? null,
    discountCodeAmount: amountOf(code?.id),
    saleId: sale?.id ?? null,
    saleName: sale?.name ?? null,
    saleAmount: amountOf(sale?.id),
    emailDiscountId: email?.id ?? null,
    emailDiscountName: email?.name ?? null,
    emailDiscountAmount: amountOf(email?.id),
    isSandbox,
  };
}
