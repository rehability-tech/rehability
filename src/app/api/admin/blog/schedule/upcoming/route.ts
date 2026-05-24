import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function GET() {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  try {
    // Zaczynamy od początku dzisiejszego dnia
    const today = startOfDay(new Date());

    const upcomingEntries = await prisma.blogScheduleEntry.findMany({
      where: {
        scheduledDate: {
          gte: today, // Tylko dzisiejsze i przyszłe
        },
      },
      orderBy: {
        scheduledDate: "asc", // Od najbliższego
      },
      take: 7, // Ograniczamy do 7 najbliższych wpisów, żeby nie obciążać widgetu
    });

    return NextResponse.json(upcomingEntries);
  } catch (error) {
    console.error("[API_UPCOMING_SCHEDULE_ERROR]", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać harmonogramu." },
      { status: 500 },
    );
  }
}
