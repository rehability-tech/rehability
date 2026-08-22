import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sandboxFilter, showSandboxContent } from "@/lib/sandbox/context";
import { activeTripDateCutoff } from "@/lib/trips/bookingWindow";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "4")));
  const skip = (page - 1) * limit;

  // Nie pokazujemy wydarzeń, które już się zakończyły. Wydarzenie jest widoczne
  // przez cały ostatni dzień (próg = północ dzisiejszej daty w czasie polskim).
  // Doładowywanie listy („Pokaż więcej") musi widzieć dokładnie to samo, co
  // pierwsza strona wyrenderowana serwerowo — stąd ten sam próg i filtr piaskownicy.
  const activeWhere = {
    status: "PUBLISHED",
    endDate: { gte: activeTripDateCutoff() },
    ...sandboxFilter(await showSandboxContent()),
  } as const;

  try {
    const [campsRaw, totalCount] = await Promise.all([
      prisma.trip.findMany({
        where: activeWhere,
        take: limit,
        skip,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true, // potrzebne w TripCard na publicznym froncie
          tags: true,
          heroImage: true,
          location: true,
          price: true,
          startDate: true,
          endDate: true,
          sandbox: true,
        },
      }),
      prisma.trip.count({ where: activeWhere }),
    ]);

    const trips = campsRaw.map((trip) => ({
      ...trip,
      price: trip.price ? Number(trip.price) : null,
    }));

    return NextResponse.json({ trips, totalCount });
  } catch (error) {
    console.error("Błąd pobierania wydarzeń:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
