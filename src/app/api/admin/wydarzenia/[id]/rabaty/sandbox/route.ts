import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { sandboxActionSchema } from "@/lib/zod/discountValidators";
import {
  disableSandbox,
  enableSandbox,
  publishSandbox,
  updateSandboxPrices,
} from "@/lib/discounts/publishSandbox";
import { loadTripForDiscounts, validationError } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/**
 * GET — lekki stan piaskownicy dla przełącznika w topbarze.
 *
 * Celowo NIE używamy tu pełnego payloadu panelu (`getDiscountPanelData`) —
 * topbar wisi na każdej podstronie wydarzenia, a tamten zapytanie ciągnie
 * wszystkie promocje i opłacone rezerwacje.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      title: true,
      sandbox: true,
      sandboxEnabledAt: true,
      sandboxPrice: true,
      sandboxDeposit: true,
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Wydarzenie nie istnieje." }, { status: 404 });
  }

  // Ile promocji czeka jako szkic testowy — pokazujemy przy wyjściu z trybu,
  // żeby admin wiedział, co dokładnie opublikuje.
  const scope = { tripId, isSandbox: true } as const;
  const [codes, sales, emailDiscounts] = await Promise.all([
    prisma.discountCode.count({ where: scope }),
    prisma.sale.count({ where: scope }),
    prisma.emailDiscount.count({ where: scope }),
  ]);

  return NextResponse.json({
    tripId,
    tripTitle: trip.title,
    enabled: trip.sandbox,
    since: trip.sandboxEnabledAt,
    sandboxPriceGrosze:
      trip.sandboxPrice != null ? Math.round(Number(trip.sandboxPrice) * 100) : null,
    sandboxDepositGrosze:
      trip.sandboxDeposit != null
        ? Math.round(Number(trip.sandboxDeposit) * 100)
        : null,
    draftCount: codes + sales + emailDiscounts,
  });
}

/**
 * PATCH — sterowanie piaskownicą wydarzenia.
 *
 *   enable  — włącza tryb; od tej chwili KAŻDY zapis promocji dostaje
 *             isSandbox = true i jest widoczny wyłącznie dla admina.
 *   publish — "Opublikuj i wyłącz": cena testowa staje się cennikiem,
 *             a promocje testowe zaczynają działać naprawdę.
 *   disable — "Wyłącz bez publikacji": promocje testowe zostają szkicami.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = sandboxActionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const { action, sandboxPrice, sandboxDeposit } = parsed.data;

  try {
    if (action === "prices") {
      await updateSandboxPrices(tripId, { sandboxPrice, sandboxDeposit });
      return NextResponse.json({
        success: true,
        message: "Zapisano cennik testowy.",
      });
    }

    if (action === "enable") {
      await enableSandbox(tripId, { sandboxPrice, sandboxDeposit });
      return NextResponse.json({
        success: true,
        message: "Piaskownica włączona. Nowe promocje widzi tylko administrator.",
      });
    }

    if (action === "publish") {
      await publishSandbox(tripId);
      return NextResponse.json({
        success: true,
        message: "Opublikowano promocje testowe i wyłączono piaskownicę.",
      });
    }

    await disableSandbox(tripId);
    return NextResponse.json({
      success: true,
      message: "Piaskownica wyłączona. Promocje testowe zostały jako szkice.",
    });
  } catch (error) {
    console.error("[admin/rabaty/sandbox] PATCH error:", error);
    return NextResponse.json(
      { error: "Nie udało się zmienić trybu piaskownicy." },
      { status: 500 },
    );
  }
}
