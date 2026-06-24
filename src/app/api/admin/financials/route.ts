import { NextRequest, NextResponse } from "next/server";
import {
  startOfMonth,
  startOfYear,
  subMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
} from "date-fns";
import { pl } from "date-fns/locale";

import { requireAdmin } from "@/lib/auth/requireAdmin"; // Załóżmy, że plik z requireAdmin jest tutaj
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 1. Sprawdzenie autoryzacji
    const auth = await requireAdmin();
    if (!auth.isAuthorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "six_months"; // month | six_months | year

    const now = new Date();
    let startDate = startOfMonth(subMonths(now, 5)); // Domyślnie 6 miesięcy temu

    if (range === "month") {
      startDate = startOfMonth(now); // Bieżący miesiąc od 1 dnia
    } else if (range === "year") {
      startDate = startOfYear(now); // Od 1 stycznia bieżącego roku
    }

    // 2. Pobieramy opłacone rezerwacje na Wyjazdy z wybranego okresu
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] },
        createdAt: { gte: startDate },
      },
      select: {
        amountPaid: true,
        createdAt: true,
      },
    });

    // 2b. Realny przychód VOD — kupione dostępy do kursów (Enrollment).
    // Cena kursu jest w zł (całe), tak jak amountPaid/100 dla wyjazdów.
    const enrollments = await prisma.enrollment.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, course: { select: { price: true } } },
    });

    let chartData: any[] = [];

    if (range === "month") {
      // Widok miesięczny: dzień po dniu (1, 2, 3... 31)
      const days = eachDayOfInterval({ start: startDate, end: now });
      chartData = days.map((day) => {
        const dateStr = format(day, "dd.MM");
        const dayBookings = bookings.filter(
          (b) => format(b.createdAt, "dd.MM") === dateStr,
        );
        const campSum = dayBookings.reduce(
          (sum, b) => sum + b.amountPaid / 100,
          0,
        );
        const vodSum = enrollments
          .filter((e) => format(e.createdAt, "dd.MM") === dateStr)
          .reduce((sum, e) => sum + (e.course?.price ?? 0), 0);

        return {
          name: dateStr,
          campy: campSum,
          vod: vodSum,
        };
      });
    } else {
      // Widok 6-miesięczny lub roczny: miesiąc po miesiącu (Sty, Lut, Mar...)
      const months = eachMonthOfInterval({
        start: startDate,
        end: range === "six_months" ? now : endOfMonth(now),
      });

      chartData = months.map((month) => {
        const monthLabel = format(month, "MMM", { locale: pl }); // np. "sty", "lut"
        const formattedMonth = format(month, "yyyy-MM");
        const monthBookings = bookings.filter(
          (b) => format(b.createdAt, "yyyy-MM") === formattedMonth,
        );
        const campSum = monthBookings.reduce(
          (sum, b) => sum + b.amountPaid / 100,
          0,
        );
        const vodSum = enrollments
          .filter((e) => format(e.createdAt, "yyyy-MM") === formattedMonth)
          .reduce((sum, e) => sum + (e.course?.price ?? 0), 0);

        return {
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          campy: campSum,
          vod: vodSum,
        };
      });
    }

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("[API_FINANCIALS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
