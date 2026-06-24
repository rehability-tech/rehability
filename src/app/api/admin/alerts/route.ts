import { NextResponse } from "next/server";
import { subDays, addDays } from "date-fns";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.isAuthorized) return auth.response;

    const now = new Date();
    const in30Days = addDays(now, 30);
    const in7Days = addDays(now, 7);
    const yesterday = subDays(now, 1);

    // Rezerwacje PENDING starsze niż 24h (ktoś się zapisał ale nie zapłacił)
    const pendingBookings = await prisma.booking.count({
      where: {
        status: "PENDING",
        createdAt: { lt: yesterday },
      },
    });

    // Kursy DRAFT bez przypisanego wideo (czekają na materiał)
    const coursesWithoutVideo = await prisma.course.count({
      where: {
        status: "DRAFT",
        OR: [{ video: null }, { video: "" }],
      },
    });

    // Uczestnicey z DEPOSIT_PAID na wyjazdach za < 30 dni (reszta nieopłacona)
    const unpaidRemainders = await prisma.booking.count({
      where: {
        status: "DEPOSIT_PAID",
        trip: {
          status: "PUBLISHED",
          startDate: { gte: now, lte: in30Days },
        },
      },
    });

    // Uczestnicy wyjazdów za < 7 dni bez wypełnionej karty zdrowia
    const upcomingTrips = await prisma.trip.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { gte: now, lte: in7Days },
      },
      select: {
        bookings: {
          where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
          select: { userId: true },
        },
      },
    });

    const participantIds = upcomingTrips
      .flatMap((t) => t.bookings.map((b) => b.userId))
      .filter((id): id is string => !!id);

    let missingHealthProfiles = 0;
    if (participantIds.length > 0) {
      const existing = await prisma.healthProfile.count({
        where: { userId: { in: participantIds } },
      });
      missingHealthProfiles = participantIds.length - existing;
    }

    return NextResponse.json({
      pendingBookings,
      coursesWithoutVideo,
      unpaidRemainders,
      missingHealthProfiles,
    });
  } catch (error) {
    console.error("[API_ADMIN_ALERTS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
