import { NextResponse } from "next/server";
import { startOfMonth } from "date-fns";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.isAuthorized) return auth.response;

    const now = new Date();
    const monthStart = startOfMonth(now);

    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      monthEnrollments,
      enrollmentsWithPrice,
      monthEnrollmentsWithPrice,
      totalBookings,
      monthBookings,
      upcomingTrips,
      publishedTrips,
      bookingRevenueTotal,
      bookingRevenueMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.enrollment.findMany({
        select: { course: { select: { price: true } } },
      }),
      prisma.enrollment.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { course: { select: { price: true } } },
      }),
      prisma.booking.count({
        where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] },
          createdAt: { gte: monthStart },
        },
      }),
      prisma.trip.count({
        where: { status: "PUBLISHED", endDate: { gte: now } },
      }),
      prisma.trip.count({ where: { status: "PUBLISHED" } }),
      prisma.booking.aggregate({
        where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
        _sum: { amountPaid: true },
      }),
      prisma.booking.aggregate({
        where: {
          status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] },
          createdAt: { gte: monthStart },
        },
        _sum: { amountPaid: true },
      }),
    ]);

    const vodRevenueTotal = enrollmentsWithPrice.reduce(
      (sum, e) => sum + (e.course?.price ?? 0),
      0,
    );
    const vodRevenueMonth = monthEnrollmentsWithPrice.reduce(
      (sum, e) => sum + (e.course?.price ?? 0),
      0,
    );
    const tripRevenueTotal = Math.round(
      (bookingRevenueTotal._sum.amountPaid ?? 0) / 100,
    );
    const tripRevenueMonth = Math.round(
      (bookingRevenueMonth._sum.amountPaid ?? 0) / 100,
    );

    return NextResponse.json({
      users: { total: totalUsers },
      vod: {
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalEnrollments,
        monthEnrollments,
        revenueTotal: vodRevenueTotal,
        revenueMonth: vodRevenueMonth,
      },
      trips: {
        publishedTrips,
        upcomingTrips,
        totalBookings,
        monthBookings,
        revenueTotal: tripRevenueTotal,
        revenueMonth: tripRevenueMonth,
      },
    });
  } catch (error) {
    console.error("[API_ADMIN_STATS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
