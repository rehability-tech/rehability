import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveCheckoutPricing } from "@/lib/discounts/resolveCheckoutPricing";
import { rejectionMessage } from "@/lib/discounts/format";
import { validateDiscountSchema } from "@/lib/zod/discountValidators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 10 prób na minutę na konto. */
const LIMIT = 10;
const WINDOW_MS = 60_000;

/**
 * POST — podgląd ceny po wpisaniu kodu.
 *
 * BEZPIECZEŃSTWO: ten endpoint jest wprost narzędziem do zgadywania kodów,
 * więc wymaga zalogowania i jest limitowany. Każde chybienie zwraca to samo
 * `not_found` — nie zdradzamy, czy kod istnieje, czy tylko należy do innego
 * wydarzenia albo do piaskownicy.
 *
 * Wynik jest TYLKO podglądem. Realna kwota liczona jest od nowa przy
 * tworzeniu PaymentIntenta, przez tę samą funkcję `resolveCheckoutPricing`.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Musisz być zalogowany, aby użyć kodu." },
      { status: 401 },
    );
  }

  const email = session.user.email.toLowerCase();

  const limit = checkRateLimit(`discount:${email}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = validateDiscountSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 422 });
  }

  const pricing = await resolveCheckoutPricing({
    tripId: parsed.data.tripId,
    email,
    rawCode: parsed.data.code ?? null,
    viewer: { role: (session.user as { role?: string }).role, email },
  });

  if (!pricing) {
    return NextResponse.json(
      { error: "Wydarzenie jest niedostępne." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    baseAmount: pricing.price.baseAmount,
    finalAmount: pricing.price.finalAmount,
    totalDiscount: pricing.price.totalDiscount,
    lines: pricing.price.lines,
    depositGrosze: pricing.depositGrosze,
    remainderGrosze: pricing.remainderGrosze,
    couponOutranked: pricing.price.couponOutranked,
    appliedCode: pricing.codeStatus.ok ? pricing.codeStatus.code : null,
    codeStatus: {
      ok: pricing.codeStatus.ok,
      reason: pricing.codeStatus.reason,
      message: pricing.codeStatus.reason
        ? rejectionMessage(pricing.codeStatus.reason)
        : null,
    },
  });
}
