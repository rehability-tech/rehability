// src/app/api/panel/wyjazdy/[bookingId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const routeParamsSchema = z.object({
  bookingId: z.string().cuid("Nieprawidłowy format ID rezerwacji"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const resolvedParams = await params;
  const parsedParams = routeParamsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: "Nieprawidłowe zapytanie",
        details: parsedParams.error.format(),
      },
      { status: 400 },
    );
  }

  const { bookingId } = parsedParams.data;

  try {
    // 1. Pobieramy główne dane o rezerwacji i wyjeździe
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, email: session.user.email },
      include: {
        trip: {
          include: {
            events: {
              where: { isPublished: true },
            },
          },
        },
        user: {
          include: { healthProfile: true },
        },
        serviceOrders: {
          where: {
            status: { in: ["PAID", "PENDING"] },
          },
          include: {
            service: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Nie znaleziono rezerwacji" },
        { status: 404 },
      );
    }

    // 2. Budujemy połączony harmonogram
    let fullSchedule: any[] | null = null;
    const isSchedulePublished = Boolean(
      (booking.trip as any).isSchedulePublished,
    );

    if (isSchedulePublished) {
      const regularEvents = booking.trip.events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        startTime: ev.startTime,
        endTime: ev.endTime,
        place: ev.description || "Na miejscu",
        icon: ev.icon || "Sparkle",
        itemType: "EVENT" as const,
      }));

      const personalReservations = booking.serviceOrders
        .filter((order) => order.startTime && order.endTime)
        .map((order) => ({
          id: order.id,
          title: order.service?.name || "Usługa SPA",
          startTime: order.startTime!,
          endTime: order.endTime!,
          place: "Strefa Wellness",
          icon: "Drop",
          itemType: "RESERVATION" as const,
        }));

      fullSchedule = [...regularEvents, ...personalReservations].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    }

    // 3. Równoległe pobieranie powiadomień globalnych i personalnych (Optymalizacja czasu I/O)
    const [systemUpdates, personalNotifications] = await Promise.all([
      // Aktualności (Marketing, dla wszystkich)
      prisma.systemUpdate.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      // Powiadomienia TYLKO dla tej użytkowniczki (Transakcyjne)
      prisma.notification.findMany({
        where: { user: { email: session.user.email } },
        orderBy: { createdAt: "desc" },
        take: 5, // Chronimy payload przed niepotrzebnym puchnięciem
      }),
    ]);

    // 4. Formatujemy odpowiedź
    return NextResponse.json({
      booking: {
        id: booking.id,
        qrToken: booking.qrToken,
        status: booking.status,
        isCheckedIn: booking.isCheckedIn,
        name: booking.name,
        email: booking.email,
        depositPaidAt: booking.depositPaidAt,
        remainderPaidAt: booking.remainderPaidAt,
        amountTotal: Number(booking.amountTotal || 0) / 100,
        amountPaid: Number(booking.amountPaid || 0) / 100,
      },
      trip: {
        id: booking.trip.id,
        title: booking.trip.title,
        location: booking.trip.location,
        startDate: booking.trip.startDate,
        endDate: booking.trip.endDate,
        heroImage: booking.trip.heroImage,
        deposit: Number(booking.trip.deposit || 0),
        price: Number(booking.trip.price || 0),
      },
      healthFilled: !!booking.user?.healthProfile,
      isSchedulePublished,
      fullSchedule,
      systemUpdates,
      personalNotifications, // <-- Dodane do zwrotki
    });
  } catch (error) {
    console.error("[API] Błąd pobierania danych wyjazdu:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
