import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "4")));
  const skip = (page - 1) * limit;

  try {
    const [campsRaw, totalCount] = await Promise.all([
      prisma.trip.findMany({
        where: { status: "PUBLISHED" },
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
        },
      }),
      prisma.trip.count({ where: { status: "PUBLISHED" } }),
    ]);

    const trips = campsRaw.map((trip) => ({
      ...trip,
      price: trip.price ? Number(trip.price) : null,
    }));

    return NextResponse.json({ trips, totalCount });
  } catch (error) {
    console.error("Błąd pobierania wyjazdów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
