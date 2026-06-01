import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { logCampEvent } from "@/lib/notifications/send";
import { z } from "zod";
import { DietType } from "@/generated/prisma";

const healthSchema = z.object({
  dietType: z.nativeEnum(DietType).optional(),
  foodIntolerances: z.array(z.string()).optional(),
  foodNotes: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bookingId: z.string().optional(),
  isFinal: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.healthProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = healthSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const { bookingId, isFinal, ...healthData } = parsed.data;

  const existing = await prisma.healthProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const profile = await prisma.healthProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...healthData },
    update: { ...healthData },
  });

  // Tylko finalny zapis (przycisk "Zapisz Kartę") = powiadomienie dla admina.
  // Rozróżnienie HEALTH_FILLED (pierwszy raz) vs HEALTH_UPDATED (kolejne edycje).
  if (bookingId && isFinal) {
    try {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, userId: session.user.id },
        select: {
          tripId: true,
          trip: { select: { title: true } },
        },
      });

      if (booking) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, email: true },
        });
        await logCampEvent({
          kind: existing ? "HEALTH_UPDATED" : "HEALTH_FILLED",
          tripId: booking.tripId,
          tripTitle: booking.trip.title,
          userName: dbUser?.name || dbUser?.email || "Uczestnik",
        });
      }
    } catch (err) {
      console.error("[health-profile] logCampEvent failed:", err);
    }
  }

  return NextResponse.json({ profile });
}
