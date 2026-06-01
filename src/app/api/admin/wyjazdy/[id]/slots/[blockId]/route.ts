import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, blockId } = await params;

  const block = await prisma.spaBlock.findFirst({
    where: { id: blockId, tripId },
    include: {
      orders: { select: { id: true, status: true } },
    },
  });

  if (!block) {
    return NextResponse.json(
      { error: "Blok SPA nie istnieje." },
      { status: 404 },
    );
  }

  const activeOrders = block.orders.filter((o) => o.status !== "CANCELLED");
  if (activeOrders.length > 0) {
    return NextResponse.json(
      {
        error:
          "Blok ma aktywne rezerwacje uczestników — anuluj je przed usunięciem.",
        activeOrders: activeOrders.length,
      },
      { status: 409 },
    );
  }

  await prisma.spaBlock.delete({ where: { id: blockId } });

  revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);

  return NextResponse.json({ id: blockId });
}
