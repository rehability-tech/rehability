import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import type { TripEventType } from "@/generated/prisma";

interface EventSeed {
  title: string;
  description: string | null;
  type: TripEventType;
  icon: string | null;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
}

const EVENT_PLAN: EventSeed[] = [
  {
    title: "Poranna joga w plenerze",
    description: "Rozciąganie i oddychanie na świeżym powietrzu.",
    type: "ACTIVITY",
    icon: "Lightning",
    startHour: 7,
    startMinute: 30,
    durationMinutes: 60,
  },
  {
    title: "Śniadanie",
    description: "Wspólne śniadanie w restauracji ośrodka.",
    type: "MEAL",
    icon: "ForkKnife",
    startHour: 9,
    startMinute: 0,
    durationMinutes: 75,
  },
  {
    title: "Warsztaty mindfulness",
    description: "Praktyka uważności prowadzona przez Annę.",
    type: "ACTIVITY",
    icon: "Sparkle",
    startHour: 10,
    startMinute: 30,
    durationMinutes: 90,
  },
  {
    title: "Obiad",
    description: "Dwudaniowy obiad z opcją wege.",
    type: "MEAL",
    icon: "ForkKnife",
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    title: "Czas wolny",
    description: "Spacer brzegiem morza, basen, sauna.",
    type: "WELLNESS_FREE",
    icon: "Leaf",
    startHour: 14,
    startMinute: 0,
    durationMinutes: 240,
  },
  {
    title: "Kolacja",
    description: "Kolacja przy świecach.",
    type: "MEAL",
    icon: "ForkKnife",
    startHour: 19,
    startMinute: 0,
    durationMinutes: 90,
  },
  {
    title: "Wieczorne ognisko",
    description: "Spotkanie integracyjne przy ognisku.",
    type: "ANNOUNCEMENT",
    icon: "Megaphone",
    startHour: 21,
    startMinute: 0,
    durationMinutes: 90,
  },
];

interface BlockSeed {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  capacity: number;
}

const SPA_BLOCK_PLAN: BlockSeed[] = [
  { startHour: 14, startMinute: 0, durationMinutes: 120, capacity: 3 },
  { startHour: 16, startMinute: 30, durationMinutes: 90, capacity: 2 },
];

function atTime(base: Date, hour: number, minute: number, addMinutes = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  if (addMinutes) d.setMinutes(d.getMinutes() + addMinutes);
  return d;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, startDate: true, endDate: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wyjazd nie istnieje." }, { status: 404 });
  }

  // Wybierz dzień docelowy: drugi dzień wyjazdu, jeśli istnieje, w przeciwnym razie pierwszy.
  const day = new Date(trip.startDate);
  const totalDays = Math.max(
    1,
    Math.round(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (24 * 3600 * 1000),
    ) + 1,
  );
  if (totalDays >= 2) day.setDate(day.getDate() + 1);

  const eventData = EVENT_PLAN.map((e) => ({
    tripId,
    title: e.title,
    description: e.description,
    type: e.type,
    icon: e.icon,
    startTime: atTime(day, e.startHour, e.startMinute),
    endTime: atTime(day, e.startHour, e.startMinute, e.durationMinutes),
    isPublished: true,
    sortOrder: 0,
  }));

  const blockData = SPA_BLOCK_PLAN.map((b) => ({
    tripId,
    startTime: atTime(day, b.startHour, b.startMinute),
    endTime: atTime(day, b.startHour, b.startMinute, b.durationMinutes),
    capacity: b.capacity,
    isActive: true,
  }));

  await prisma.$transaction([
    prisma.tripEvent.createMany({ data: eventData }),
    prisma.spaBlock.createMany({ data: blockData }),
  ]);

  revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);

  return NextResponse.json({
    seededEvents: eventData.length,
    seededBlocks: blockData.length,
    day: day.toISOString(),
  });
}
