import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  try {
    const body = await req.json();
    const { isPublished } = body;

    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        {
          error:
            "Nieprawidłowy parametr isPublished. Oczekiwano wartości true/false.",
        },
        { status: 400 },
      );
    }

    // Pobierz poprzedni stan, żeby rozróżnić pierwszą publikację od kolejnej.
    const previous = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { isSchedulePublished: true },
    });

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { isSchedulePublished: isPublished },
      select: {
        title: true,
        bookings: {
          where: {
            status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] },
            userId: { not: null },
          },
          select: { id: true, userId: true },
        },
      },
    });

    if (isPublished && updatedTrip.bookings.length > 0) {
      const wasPublishedBefore = previous?.isSchedulePublished === true;
      const title = wasPublishedBefore
        ? "Aktualizacja harmonogramu"
        : "Harmonogram opublikowany! 🎉";
      const message = wasPublishedBefore
        ? `Plan dla wyjazdu „${updatedTrip.title}” został zaktualizowany. Sprawdź szczegóły w panelu.`
        : `Plan dla wyjazdu „${updatedTrip.title}” jest już dostępny w Twoim panelu. Sprawdź szczegóły i zaplanuj swój czas!`;

      // Per-booking link żeby każda uczestniczka trafiła na swój własny widok.
      await Promise.all(
        updatedTrip.bookings.map((booking) =>
          dispatchNotification({
            target: "USER",
            userIds: [booking.userId!],
            title,
            message,
            link: `/panel/wyjazdy/${booking.id}/harmonogram`,
            type: "SPA",
            channels: ["IN_APP", "PUSH", "EMAIL"],
          }),
        ),
      );
    }

    revalidatePath(`/admin/wyjazdy/${tripId}/harmonogram`);

    return NextResponse.json({ success: true, isPublished }, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas aktualizacji statusu publikacji:", error);
    return NextResponse.json(
      { error: "Nie udało się zaktualizować statusu harmonogramu." },
      { status: 500 },
    );
  }
}
