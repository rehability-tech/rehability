"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
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

export type EventInput = z.infer<typeof eventSchema>;

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: false; error: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { ok: false, error: "Brak uprawnień administratora." };
  }
  return null;
}

function ensureRange(start: Date, end: Date | null | undefined): string | null {
  if (end && end.getTime() <= start.getTime()) {
    return "Czas zakończenia musi być po czasie rozpoczęcia.";
  }
  return null;
}

export async function createEvent(
  tripId: string,
  input: EventInput,
): Promise<ActionResult<{ id: string }>> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." };
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, startDate: true, endDate: true },
  });
  if (!trip) return { ok: false, error: "Wyjazd nie istnieje." };

  const rangeErr = ensureRange(parsed.data.startTime, parsed.data.endTime);
  if (rangeErr) return { ok: false, error: rangeErr };

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
    select: { id: true },
  });

  revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);
  return { ok: true, data: { id: created.id } };
}

export async function updateEvent(
  eventId: string,
  input: EventInput,
): Promise<ActionResult<{ id: string }>> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane." };
  }

  const existing = await prisma.tripEvent.findUnique({
    where: { id: eventId },
    select: { id: true, tripId: true },
  });
  if (!existing) return { ok: false, error: "Wydarzenie nie istnieje." };

  const rangeErr = ensureRange(parsed.data.startTime, parsed.data.endTime);
  if (rangeErr) return { ok: false, error: rangeErr };

  await prisma.tripEvent.update({
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

  revalidatePath(`/admin/wyjazdy/${existing.tripId}/harmonogram`);
  return { ok: true, data: { id: eventId } };
}

export async function deleteEvent(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const existing = await prisma.tripEvent.findUnique({
    where: { id: eventId },
    select: { id: true, tripId: true },
  });
  if (!existing) return { ok: false, error: "Wydarzenie nie istnieje." };

  await prisma.tripEvent.delete({ where: { id: eventId } });

  revalidatePath(`/admin/wyjazdy/${existing.tripId}/harmonogram`);
  return { ok: true, data: { id: eventId } };
}
