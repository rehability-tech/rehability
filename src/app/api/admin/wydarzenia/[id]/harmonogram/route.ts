import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import type { TripEventType } from "@/generated/prisma";

const EVENT_TYPES = [
  "GENERAL",
  "MEAL",
  "ACTIVITY",
  "WELLNESS_FREE",
  "ANNOUNCEMENT",
] as const satisfies readonly TripEventType[];

const eventSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(120),
  description: z.string().max(500).optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  type: z.enum(EVENT_TYPES),
  icon: z.string().max(40).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

function serialize(e: {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  type: TripEventType;
  icon: string | null;
  isPublished: boolean;
  sortOrder: number;
}) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime ? e.endTime.toISOString() : null,
    type: e.type,
    icon: e.icon,
    isPublished: e.isPublished,
    sortOrder: e.sortOrder,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wydarzenie nie istnieje." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." },
      { status: 422 },
    );
  }

  if (
    parsed.data.endTime &&
    parsed.data.endTime.getTime() <= parsed.data.startTime.getTime()
  ) {
    return NextResponse.json(
      { error: "Czas zakończenia musi być po czasie rozpoczęcia." },
      { status: 422 },
    );
  }

  const created = await prisma.tripEvent.create({
    data: {
      tripId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime ?? null,
      type: parsed.data.type,
      icon: parsed.data.icon ?? null,
      isPublished: parsed.data.isPublished ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidatePath(`/admin/wydarzenia/${tripId}/harmonogram`);
  return NextResponse.json({ event: serialize(created) }, { status: 201 });
}

// ============================================================
// GET — pełny dashboard harmonogramu: trip + services + events + bloki z rezerwacjami.
// Klient panelu admina pobiera to przez useEffect (page.tsx jest cienki).
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Wydarzenie nie istnieje." },
      { status: 404 },
    );
  }

  const [events, spaBlocks] = await Promise.all([
    prisma.tripEvent.findMany({
      where: { tripId: id },
      orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.spaBlock.findMany({
      where: { tripId: id, isActive: true },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            serviceId: true,
            startTime: true,
            endTime: true,
            price: true,
            paidAt: true,
            service: { select: { name: true } },
            booking: { select: { name: true, email: true } },
          },
        },
        serviceCapacities: {
          select: {
            capacity: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const services = trip.services.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
  }));

  const eventSerialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime ? e.endTime.toISOString() : null,
    type: e.type,
    icon: e.icon,
    isPublished: e.isPublished,
    sortOrder: e.sortOrder,
  }));

  const blockSerialized = spaBlocks.map((b) => {
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
      title: b.isOpen ? "Wolny blok" : "Blok Usług",
      description: null,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      type: "WELLNESS_FREE" as TripEventType,
      icon: "Sparkle",
      isPublished: true,
      sortOrder: 0,
      isBookable: true,
      capacity: b.capacity,
      spotsTaken: activeOrders.length,
      spotsAvailable: Math.max(0, b.capacity - activeOrders.length),
      isOpen: b.isOpen,
      services: b.isOpen
        ? undefined
        : b.serviceCapacities.map((sc) => ({
            id: sc.service.id,
            name: sc.service.name,
            capacity: sc.capacity,
            spotsTaken: perServiceTaken.get(sc.service.id) ?? 0,
          })),
      reservations: activeOrders.map((o) => ({
        id: o.id,
        bookerName: o.booking.name ?? "Klientka",
        bookerEmail: o.booking.email ?? null,
        serviceName: o.service.name,
        // ! — pola są tymczasowo nullable w schemacie do czasu backfill+required.
        startTime: o.startTime!.toISOString(),
        endTime: o.endTime!.toISOString(),
        status: o.status as "PENDING" | "PAID" | "CANCELLED",
        amountGrosze: Math.round(Number(o.price) * 100),
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
      })),
    };
  });

  return NextResponse.json({
    trip: {
      id: trip.id,
      title: trip.title,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
    },
    services,
    events: [...eventSerialized, ...blockSerialized],
  });
}
