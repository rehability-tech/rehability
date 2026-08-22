import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getDiscountPanelData } from "@/lib/discounts/adminQueries";
import { tripOwner } from "@/lib/discounts/owner";

export const dynamic = "force-dynamic";

/** GET — pełny stan panelu rabatów: promocje, statystyki, podgląd ceny. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const data = await getDiscountPanelData(tripOwner(tripId));
  if (!data) {
    return NextResponse.json({ error: "Wydarzenie nie istnieje." }, { status: 404 });
  }

  return NextResponse.json(data);
}
