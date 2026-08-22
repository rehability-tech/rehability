import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deletePromo, patchPromo } from "@/lib/discounts/adminHandlers";
import { loadTripForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; saleId: string }> };

/** PATCH — edycja przeceny albo sam przełącznik aktywności. */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, saleId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return patchPromo(req, trip.owner, trip.sandbox, "sale", saleId);
}

/** DELETE — tylko dla przecen bez historii użyć. */
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, saleId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return deletePromo(trip.owner, "sale", saleId);
}
