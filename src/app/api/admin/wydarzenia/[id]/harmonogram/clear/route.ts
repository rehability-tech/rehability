import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/wydarzenia/[id]/harmonogram/clear
// Czyści cały harmonogram wydarzenia — wszystkie TripEvent + SpaBlock.
// Operacja głównie debugowa (test/seed reset). Nie odróżnia bloków
// z aktywnymi rezerwacjami — Cascade onDelete usunie ServiceOrder.
// Z premedytacją bez zwracania pieniędzy — zakładamy że to dev/test.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const [eventsDeleted, blocksDeleted] = await Promise.all([
    prisma.tripEvent.deleteMany({ where: { tripId } }),
    prisma.spaBlock.deleteMany({ where: { tripId } }),
  ]);

  revalidatePath(`/admin/wydarzenia/${tripId}/harmonogram`);

  return NextResponse.json({
    ok: true,
    eventsDeleted: eventsDeleted.count,
    blocksDeleted: blocksDeleted.count,
  });
}
