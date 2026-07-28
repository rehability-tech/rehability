import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

const blockSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    // capacity używane gdy isOpen=true (sumaryczne miejsca w wolnym bloku).
    capacity: z.number().int().min(1).max(50).default(1),
    isOpen: z.boolean().default(false),
    serviceCapacities: z
      .array(
        z.object({
          serviceId: z.string().min(1),
          capacity: z.number().int().min(1).max(50),
        }),
      )
      .default([]),
  })
  .refine((d) => d.isOpen || d.serviceCapacities.length > 0, {
    message: "Wybierz przynajmniej jedną usługę lub zaznacz że to wolny blok.",
    path: ["serviceCapacities"],
  });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." },
      { status: 422 },
    );
  }

  const { startTime, endTime, capacity, isOpen, serviceCapacities } =
    parsed.data;

  if (endTime.getTime() <= startTime.getTime()) {
    return NextResponse.json(
      { error: "Czas zakończenia musi być po czasie rozpoczęcia." },
      { status: 422 },
    );
  }

  const blockDurationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000,
  );

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wydarzenie nie istnieje." }, { status: 404 });
  }

  // Guard: blok nie może nakładać się czasowo z istniejącym aktywnym blokiem na tym wydarzeniu.
  const overlapping = await prisma.spaBlock.findFirst({
    where: {
      tripId,
      isActive: true,
      // overlap = istniejący.start < new.end AND istniejący.end > new.start
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
    select: { id: true, startTime: true, endTime: true },
  });
  if (overlapping) {
    const fmt = (d: Date) =>
      d.toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    return NextResponse.json(
      {
        error: `Ten przedział nakłada się z istniejącym blokiem (${fmt(overlapping.startTime)} – ${fmt(overlapping.endTime)}).`,
      },
      { status: 409 },
    );
  }

  // Whitelist: każda wybrana usługa musi należeć do tego wydarzenia i mieścić się w bloku czasowym.
  let serviceCapacitiesRows: { serviceId: string; capacity: number }[] = [];
  if (!isOpen && serviceCapacities.length > 0) {
    const ids = serviceCapacities.map((s) => s.serviceId);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: "Powtórzona usługa w liście." },
        { status: 422 },
      );
    }
    const dbServices = await prisma.tripService.findMany({
      where: { tripId, id: { in: ids } },
      select: { id: true, name: true, duration: true },
    });
    if (dbServices.length !== ids.length) {
      return NextResponse.json(
        { error: "Jedna z wybranych usług nie należy do tego wydarzenia." },
        { status: 422 },
      );
    }
    const tooLong = dbServices.find((s) => s.duration > blockDurationMinutes);
    if (tooLong) {
      return NextResponse.json(
        {
          error: `Usługa „${tooLong.name}” (${tooLong.duration} min) nie mieści się w bloku ${blockDurationMinutes} min.`,
        },
        { status: 422 },
      );
    }
    serviceCapacitiesRows = serviceCapacities;
  }

  const finalCapacity = isOpen
    ? capacity
    : serviceCapacitiesRows.reduce((sum, r) => sum + r.capacity, 0);

  const block = await prisma.spaBlock.create({
    data: {
      tripId,
      startTime,
      endTime,
      capacity: finalCapacity,
      isActive: true,
      isOpen,
      serviceCapacities: isOpen
        ? undefined
        : { create: serviceCapacitiesRows },
    },
    select: {
      id: true,
      tripId: true,
      startTime: true,
      endTime: true,
      capacity: true,
      isOpen: true,
      serviceCapacities: {
        select: {
          capacity: true,
          service: { select: { id: true, name: true } },
        },
      },
    },
  });

  revalidatePath(`/admin/wydarzenia/${tripId}/harmonogram`);

  return NextResponse.json(
    {
      block: {
        id: block.id,
        tripId: block.tripId,
        startTime: block.startTime.toISOString(),
        endTime: block.endTime.toISOString(),
        capacity: block.capacity,
        isOpen: block.isOpen,
        serviceCapacities: block.serviceCapacities.map((sc) => ({
          serviceId: sc.service.id,
          name: sc.service.name,
          capacity: sc.capacity,
        })),
      },
    },
    { status: 201 },
  );
}
