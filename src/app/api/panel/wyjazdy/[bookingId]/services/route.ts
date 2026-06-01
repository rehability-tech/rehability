import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    select: { tripId: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [services, blocks] = await Promise.all([
    prisma.tripService.findMany({
      where: { tripId: booking.tripId },
      orderBy: { name: "asc" },
    }),
    prisma.spaBlock.findMany({
      where: { tripId: booking.tripId, isActive: true },
      include: { orders: { select: { id: true, status: true } } },
    }),
  ]);

  const totalFree = blocks.reduce((acc, b) => {
    const taken = b.orders.filter((o) => o.status !== "CANCELLED").length;
    return acc + Math.max(0, b.capacity - taken);
  }, 0);

  const serialized = services.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
    description: s.description ?? null,
    image: s.image ?? null,
    availableSlots: totalFree,
    totalSlots: blocks.reduce((acc, b) => acc + b.capacity, 0),
  }));

  return NextResponse.json(serialized);
}
