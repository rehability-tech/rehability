import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, email: true, campId: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owns =
    booking.userId === session.user.id ||
    booking.email === session.user.email;

  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [campEvents, serviceOrders] = await Promise.all([
    prisma.campEvent.findMany({
      where: { campId: booking.campId, isPublished: true },
      orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.serviceOrder.findMany({
      where: { bookingId, status: { not: "CANCELLED" } },
      include: {
        slot: { select: { startTime: true, endTime: true } },
        service: { select: { name: true, duration: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    }),
  ]);

  // Ujednolicony format dla frontendu
  const events = campEvents.map((e) => ({
    id: e.id,
    kind: "event" as const,
    title: e.title,
    description: e.description,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime?.toISOString() ?? null,
    type: e.type,
    icon: e.icon,
  }));

  const orders = serviceOrders.map((o) => ({
    id: o.id,
    kind: "order" as const,
    title: o.service.name,
    description: `${o.service.duration} min Â· ${Number(o.price).toFixed(0)} zL‚`,
    startTime: o.slot.startTime.toISOString(),
    endTime: o.slot.endTime.toISOString(),
    status: o.status,
    isPaid: o.status === "PAID",
  }));

  const timeline = [...events, ...orders].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return NextResponse.json({ timeline });
}
