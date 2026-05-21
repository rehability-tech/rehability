import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "4")));
  const skip = (page - 1) * limit;

  try {
    const [campsRaw, totalCount] = await Promise.all([
      prisma.camp.findMany({
        where: { status: "PUBLISHED" },
        take: limit,
        skip,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          tags: true,
          heroImage: true,
          location: true,
          price: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.camp.count({ where: { status: "PUBLISHED" } }),
    ]);

    const camps = campsRaw.map((camp) => ({
      ...camp,
      price: camp.price ? Number(camp.price) : null,
    }));

    return NextResponse.json({ camps, totalCount });
  } catch (error) {
    console.error("Błąd pobierania campów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
