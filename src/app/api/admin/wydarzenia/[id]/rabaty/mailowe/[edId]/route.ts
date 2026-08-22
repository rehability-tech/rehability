import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deletePromo, patchPromo } from "@/lib/discounts/adminHandlers";
import { loadTripForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; edId: string }> };

/** PATCH — edycja rabatu mailowego albo sam przełącznik aktywności. */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, edId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return patchPromo(req, trip.owner, trip.sandbox, "emailDiscount", edId);
}

/** DELETE — tylko dla rabatów bez historii użyć (członkowie lecą kaskadą). */
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, edId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return deletePromo(trip.owner, "emailDiscount", edId);
}
