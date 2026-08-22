import { requireAdmin } from "@/lib/auth/requireAdmin";
import { addMembers, removeMember } from "@/lib/discounts/adminHandlers";
import { loadTripForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; edId: string }> };

/** POST — masowe dodanie adresów do listy rabatu mailowego. */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, edId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return addMembers(req, trip.owner, edId);
}

/** DELETE ?email=... — usunięcie jednego adresu z listy. */
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, edId } = await params;
  const trip = await loadTripForDiscounts(tripId);
  if (!trip.ok) return trip.response;

  return removeMember(req, trip.owner, edId);
}
