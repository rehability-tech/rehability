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

async function loadEvent(tripId: string, eventId: string) {
  return prisma.tripEvent.findFirst({
    where: { id: eventId, tripId },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, eventId } = await params;

  const existing = await loadEvent(tripId, eventId);
  if (!existing) {
    return NextResponse.json(
      { error: "Wydarzenie nie istnieje." },
      { status: 404 },
    );
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

  const updated = await prisma.tripEvent.update({
    where: { id: eventId },
    data: {
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

  revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);
  return NextResponse.json({ event: serialize(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId, eventId } = await params;

  const existing = await loadEvent(tripId, eventId);
  if (!existing) {
    return NextResponse.json(
      { error: "Wydarzenie nie istnieje." },
      { status: 404 },
    );
  }

  await prisma.tripEvent.delete({ where: { id: eventId } });

  revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);
  return NextResponse.json({ id: eventId });
}
