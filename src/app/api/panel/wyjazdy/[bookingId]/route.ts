import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 1. Zdefiniowanie schematu Zod (poza główną funkcją, by nie tworzyć go co zapytanie)
const routeParamsSchema = z.object({
  // Zod od razu sprawdzi, czy to poprawny format CUID wygenerowany przez Prismę
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

  // Czekamy na params (Next.js 15)
  const resolvedParams = await params;

  // 2. Walidacja parametrów przez Zod
  const parsedParams = routeParamsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    // Fail-fast: Zwracamy 400 Bad Request, zanim dotkniemy bazy danych
    return NextResponse.json(
      {
        error: "Nieprawidłowe zapytanie",
        details: parsedParams.error.format(),
      },
      { status: 400 },
    );
  }

  // Wyciągamy bezpieczny, zwalidowany bookingId
  const { bookingId } = parsedParams.data;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, email: session.user.email },
      include: {
        trip: {
          include: {
            events: {
              where: { isPublished: true },
              orderBy: { startTime: "asc" },
              take: 4,
            },
          },
        },
        user: {
          include: { healthProfile: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Nie znaleziono rezerwacji" },
        { status: 404 },
      );
    }

    // Od razu formatujemy dane, żeby frontend dostał gotowca bez ułamków
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

      agendaPreview: booking.trip.events.map((ev: any) => ({
        time: ev.startTime,
        title: ev.title,
        place: ev.description || "Na miejscu",
        icon: ev.icon || "Sparkle",
      })),
    });
  } catch (error) {
    console.error("Błąd API:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
