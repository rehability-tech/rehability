import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isTripPast } from "@/lib/trips/bookingWindow";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    // Kandydaci posortowani wg daty startu (od najwcześniejszej). Zakończone
    // wydarzenia odsiewamy w pamięci (isTripPast = doba po endDate), więc widżet
    // pokazuje realnie NAJBLIŻSZE nadchodzące/trwające wydarzenie, a nie ostatnio
    // utworzoną rezerwację.
    const candidates = await prisma.booking.findMany({
      where: {
        email: session.user.email,
        status: { in: ["DEPOSIT_PAID", "FULLY_PAID", "PENDING"] },
      },
      orderBy: { trip: { startDate: "asc" } },
      select: {
        id: true,
        status: true,
        amountPaid: true,
        updatedAt: true,
        trip: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            heroImage: true,
          },
        },
      },
    });

    const now = new Date();
    const activeBooking =
      candidates.find((b) => b.trip != null && !isTripPast(b.trip, now)) ??
      null;

    return NextResponse.json({ booking: activeBooking });
  } catch (error) {
    console.error("[API] Błąd pobierania aktywnego wydarzenia:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd wewnętrzny" },
      { status: 500 },
    );
  }
}
