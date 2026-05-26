import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ qrToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Brak tokenu QR" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { qrToken: parsed.data.qrToken },
    include: {
      trip: { select: { title: true, startDate: true, endDate: true } },
      user: {
        include: {
          healthProfile: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Nieznany kod QR" }, { status: 404 });
  }

  // Oznacz check-in jeśli jeszcze nie był zrobiony
  if (!booking.isCheckedIn) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { isCheckedIn: true, checkedInAt: new Date() },
    });
  }

  return NextResponse.json({
    ok: true,
    alreadyCheckedIn: booking.isCheckedIn,
    booking: {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      status: booking.status,
      isCheckedIn: true,
      checkedInAt: booking.checkedInAt?.toISOString() ?? new Date().toISOString(),
    },
    trip: booking.trip,
    healthProfile: booking.user?.healthProfile ?? null,
  });
}
