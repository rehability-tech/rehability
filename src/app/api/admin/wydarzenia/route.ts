import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { activeTripDateCutoff } from "@/lib/trips/bookingWindow";

// TO JEST KLUCZOWE - wymusza pobieranie świeżych danych przy każdym odświeżeniu
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // Domknięcie statusów przed odczytem: wydarzenie po terminie nie może zostać
    // „Aktywne". Normalnie robi to cron `trips/archive-past`, ale lista admina nie
    // może zależeć od jego harmonogramu — inaczej zakończone wydarzenie świeci tu
    // zielonym „Aktywny" i da się je wyróżnić na stronie głównej. Zapis jest
    // idempotentny: gdy nie ma nic do domknięcia, `updateMany` nie rusza wierszy.
    await prisma.trip.updateMany({
      where: {
        status: "PUBLISHED",
        endDate: { lt: activeTripDateCutoff() },
      },
      data: { status: "ARCHIVED", isFeatured: false },
    });

    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        location: true,
        capacity: true,
        isFeatured: true,
        lastStage: true,
        heroImage: true,
        mapUrl: true,
        allowBringFriend: true,
        views: true,
        blocks: true, // <--- Upewnij się, że to tutaj jest!
        // Liczba zapisanych uczestniczek (bez anulowanych/wygasłych) —
        // używana w karcie do blokady usuwania i paska "Miejsca".
        _count: {
          select: {
            bookings: { where: { status: { notIn: ["CANCELLED", "EXPIRED"] } } },
          },
        },
      },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}
