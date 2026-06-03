import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications/send";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

/**
 * Odprawa uczestniczki przez skaner QR admina.
 * Body: { qrToken: string } — wartość zakodowana w bilecie (Booking.qrToken).
 *
 * Sekwencja:
 *  1. Walidacja: token istnieje + rezerwacja należy do tego wyjazdu + nie jest anulowana.
 *  2. Oznaczenie isCheckedIn (idempotentne — drugi skan zwraca alreadyCheckedIn).
 *  3. Powiadomienie uczestniczki (IN_APP + PUSH), jeśli ma konto.
 *  4. Wpis do feedu aktywności wyjazdu (bez push-spamu do adminów przy masowej odprawie).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const { id: tripId } = await params;

  let qrToken: string | undefined;
  try {
    const body = await req.json();
    qrToken = typeof body?.qrToken === "string" ? body.qrToken.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  if (!qrToken) {
    return NextResponse.json(
      { error: "Brak kodu QR w żądaniu." },
      { status: 400 },
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { qrToken },
      include: {
        trip: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Nie rozpoznano kodu QR. Spróbuj ponownie." },
        { status: 404 },
      );
    }

    if (booking.tripId !== tripId) {
      return NextResponse.json(
        {
          error: `Ten bilet dotyczy innego wyjazdu${
            booking.trip?.title ? ` („${booking.trip.title}")` : ""
          }.`,
        },
        { status: 409 },
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Rezerwacja została anulowana — nie można odprawić." },
        { status: 409 },
      );
    }

    const participantName =
      booking.name || booking.user?.name || booking.email || "Uczestniczka";

    const participant = {
      id: booking.id,
      name: participantName,
      email: booking.email,
    };

    // Idempotencja: drugi skan tego samego biletu nie nadpisuje czasu odprawy.
    if (booking.isCheckedIn) {
      return NextResponse.json({
        ok: true,
        alreadyCheckedIn: true,
        checkedInAt: booking.checkedInAt,
        participant,
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { isCheckedIn: true, checkedInAt: new Date() },
      select: { checkedInAt: true },
    });

    // 3. Powiadomienie uczestniczki (tylko jeśli rezerwacja ma powiązane konto).
    if (booking.userId) {
      await sendNotification({
        userId: booking.userId,
        title: "✅ Witamy na miejscu!",
        message: `Twoja obecność na wyjeździe „${booking.trip?.title ?? ""}" została właśnie potwierdzona. Miłego pobytu!`,
        type: "BOOKING",
        link: `/panel/wyjazdy/${booking.id}`,
        push: true,
      });
    }

    // 4. Tylko wpis do feedu aktywności wyjazdu (ACTIVITY) — bez powiadamiania
    //    wszystkich adminów osobno, żeby przy odprawie 50 osób nie zalać pushy.
    await dispatchNotification({
      target: "ADMIN",
      channels: ["ACTIVITY"],
      title: "✅ Odprawa (check-in)",
      message: `${participantName} została odprawiona (wyjazd: ${booking.trip?.title ?? ""}).`,
      type: "BOOKING",
      kind: "CHECK_IN",
      who: participantName,
      tripId,
    });

    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: false,
      checkedInAt: updated.checkedInAt,
      participant,
    });
  } catch (error) {
    console.error("[POST /api/admin/wyjazdy/[id]/check-in]", error);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
