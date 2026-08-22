import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createPromo } from "@/lib/discounts/adminHandlers";
import { loadTripForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/** POST — nowy rabat mailowy (lista adresów dodawana osobno). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return createPromo(req, trip.owner, trip.sandbox, "emailDiscount");
}
