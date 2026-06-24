import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.isAuthorized) return auth.response;

    const now = new Date();

    const trip = await prisma.trip.findFirst({
      where: {
        status: "PUBLISHED",
        endDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        capacity: true,
        heroImage: true,
        bookings: {
          where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
          select: { userId: true, status: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ trip: null });
    }

    const bookedCount = trip.bookings.length;
    const fullyPaidCount = trip.bookings.filter(
      (b) => b.status === "FULLY_PAID",
    ).length;
    const daysUntil = differenceInCalendarDays(trip.startDate, now);

    const userIds = trip.bookings
      .map((b) => b.userId)
      .filter((id): id is string => !!id);

    let missingHealthProfiles = 0;
    if (userIds.length > 0) {
      const profiles = await prisma.healthProfile.count({
        where: { userId: { in: userIds } },
      });
      missingHealthProfiles = userIds.length - profiles;
    }

    return NextResponse.json({
      trip: {
        id: trip.id,
        title: trip.title,
        location: trip.location,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        heroImage: trip.heroImage,
        capacity: trip.capacity,
        bookedCount,
        fullyPaidCount,
        daysUntil,
        missingHealthProfiles,
      },
    });
  } catch (error) {
    console.error("[API_ADMIN_UPCOMING]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
