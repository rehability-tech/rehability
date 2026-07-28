import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tripId: true, userId: true, email: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owns =
    booking.userId === session.user.id || booking.email === session.user.email;
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [services, blocks, myOrders] = await Promise.all([
    // 1. Pobranie usług
    prisma.tripService.findMany({
      where: { tripId: booking.tripId },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        duration: true,
        price: true,
      },
      orderBy: { name: "asc" },
    }),
    // 2. Pobranie bloków SPA
    prisma.spaBlock.findMany({
      where: { tripId: booking.tripId, isActive: true },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            bookingId: true,
            serviceId: true,
            startTime: true,
            endTime: true,
          },
        },
        serviceCapacities: {
          select: { serviceId: true, capacity: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    // 3. Pobranie ZAMÓWIEŃ z pełnymi danymi usługi
    prisma.serviceOrder.findMany({
      where: { bookingId, status: { not: "CANCELLED" } },
      select: {
        id: true,
        spaBlockId: true,
        serviceId: true,
        status: true,
        startTime: true, // <-- DODAJ TO
        endTime: true,
        service: {
          select: {
            id: true,
            name: true,
            description: true,

            image: true,
            duration: true,
            price: true,
          },
        },
      },
    }),
  ]);

  const mySpaBlockIds = new Set(myOrders.map((o) => o.spaBlockId));

  return NextResponse.json({
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      image: s.image,
      duration: s.duration,
      price: Number(s.price),
    })),
    blocks: blocks.map((b) => {
      const activeOrders = b.orders.filter((o) => o.status !== "CANCELLED");
      const perServiceTaken = new Map<string, number>();
      for (const o of activeOrders) {
        perServiceTaken.set(
          o.serviceId,
          (perServiceTaken.get(o.serviceId) ?? 0) + 1,
        );
      }
      return {
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        capacity: b.capacity,
        spotsTaken: activeOrders.length,
        spotsAvailable: Math.max(0, b.capacity - activeOrders.length),
        isMine: mySpaBlockIds.has(b.id),
        isOpen: b.isOpen,
        serviceCapacities: b.serviceCapacities.map((sc) => {
          const taken = perServiceTaken.get(sc.serviceId) ?? 0;
          return {
            serviceId: sc.serviceId,
            capacity: sc.capacity,
            spotsTaken: taken,
            spotsAvailable: Math.max(0, sc.capacity - taken),
          };
        }),
        orders: activeOrders.map((o) => ({
          // ! — pola są tymczasowo nullable w schemacie do czasu backfill+required.
          startTime: o.startTime!.toISOString(),
          endTime: o.endTime!.toISOString(),
          serviceId: o.serviceId,
          isMine: o.bookingId === bookingId,
        })),
      };
    }),

    // 4. Formatowanie wykupionych usług (dla frontendu)
    orders: myOrders.map((o) => ({
      id: o.id,
      status: o.status,
      startTime: o.startTime ? o.startTime.toISOString() : null,
      service: {
        id: o.service.id,
        name: o.service.name,
        description: o.service.description,
        image: o.service.image,
        duration: o.service.duration,
        price: Number(o.service.price),
      },
    })),
  });
}
