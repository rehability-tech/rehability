import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deletePromo, patchPromo } from "@/lib/discounts/adminHandlers";
import { loadTripForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; codeId: string }> };

/** PATCH — edycja kodu albo sam przełącznik aktywności. */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, codeId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return patchPromo(req, trip.owner, trip.sandbox, "discountCode", codeId);
}

/** DELETE — tylko dla kodów bez historii użyć. */
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, codeId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return deletePromo(trip.owner, "discountCode", codeId);
}
