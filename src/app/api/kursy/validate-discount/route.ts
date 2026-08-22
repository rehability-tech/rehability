import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveCoursePricing } from "@/lib/discounts/resolveCheckoutPricing";
import { rejectionMessage } from "@/lib/discounts/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 10 prób na minutę na konto — jak przy wydarzeniach. */
const LIMIT = 10;
const WINDOW_MS = 60_000;

const BodySchema = z.object({
  slug: z.string().min(1),
  code: z.string().trim().max(64).nullable().optional(),
});

/**
 * POST — podgląd ceny kursu po wpisaniu kodu.
 *
 * BEZPIECZEŃSTWO: endpoint jest wprost narzędziem do zgadywania kodów, więc
 * wymaga zalogowania i jest limitowany. Każde chybienie zwraca to samo
 * `not_found` — nie zdradzamy, czy kod istnieje, czy należy do innego
 * produktu albo do piaskownicy.
 *
 * Wynik jest TYLKO podglądem — realna kwota liczona jest od nowa przy
 * tworzeniu PaymentIntenta, tą samą funkcją `resolveCoursePricing`.
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

  const limit = checkRateLimit(`course-discount:${email}`, LIMIT, WINDOW_MS);
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

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 422 });
  }

  const pricing = await resolveCoursePricing({
    slug: parsed.data.slug,
    email,
    rawCode: parsed.data.code ?? null,
    viewer: { role: (session.user as { role?: string }).role, email },
  });

  if (!pricing) {
    return NextResponse.json({ error: "Kurs jest niedostępny." }, { status: 404 });
  }

  return NextResponse.json({
    baseAmount: pricing.price.baseAmount,
    finalAmount: pricing.price.finalAmount,
    totalDiscount: pricing.price.totalDiscount,
    lines: pricing.price.lines,
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
