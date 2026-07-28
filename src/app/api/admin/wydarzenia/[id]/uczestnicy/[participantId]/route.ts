import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolvePackage, PACKAGE_RELATION_SELECT } from "@/lib/bookings/partner";
import {
  getBookingRemoval,
  bookingHasMoney,
  removalBlockedMessage,
} from "@/lib/bookings/removable";
import { logCampEvent } from "@/lib/notifications/send";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const { id: tripId, participantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const participant = await prisma.booking.findUnique({
      where: { id: participantId },
      include: {
        trip: { select: { id: true, title: true, startDate: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            healthProfile: true,
          },
        },
        serviceOrders: {
          where: { status: { not: "CANCELLED" } },
          include: {
            service: { select: { name: true, duration: true, price: true } },
            spaBlock: { select: { startTime: true, endTime: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        ...PACKAGE_RELATION_SELECT,
      },
    });

    // Pilnujemy, by rezerwacja faktycznie należała do tego wydarzenia.
    if (!participant || participant.tripId !== tripId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pkg = resolvePackage(participant);
    const packagePartner = pkg
      ? {
          bookingId: pkg.partner.bookingId,
          name: pkg.partner.name,
          relation: pkg.partner.relation,
          active: pkg.active,
        }
      : null;

    return NextResponse.json({ participant: { ...participant, packagePartner } });
  } catch (error) {
    console.error(
      "[GET /api/admin/wydarzenia/[id]/uczestnicy/[participantId]]",
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ==========================================
// DELETE: Ręczne usunięcie NIEOPŁACONEJ rezerwacji
// ==========================================
// Odpowiednik crona `bookings/cleanup`, tylko wywoływany ręcznie przez admina —
// potrzebny, gdy ktoś zapisał się i nie zapłacił, a wydarzenie trzeba usunąć
// albo zwolnić miejsce od ręki (cron czyści dopiero po 60 min i tylko anuluje).
//
// Reguła (patrz `src/lib/bookings/removable.ts`): zero wpłat + 30 min od
// ostatniej aktywności. Rezerwacji z jakąkolwiek wpłatą NIE ruszamy nigdy —
// najpierw zwrot w Stripe, potem ewentualne kasowanie.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const { id: tripId, participantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: participantId },
      include: {
        trip: { select: { id: true, title: true } },
        // Zaproszone osoby ("zabierz przyjaciółkę") znikają razem z zapraszającym —
        // ich rezerwacja bez zapraszającego nie ma sensu.
        invitedGuests: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            amountPaid: true,
            depositPaidAt: true,
            remainderPaidAt: true,
          },
        },
      },
    });

    if (!booking || booking.tripId !== tripId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 1. Czy w ogóle wolno usunąć (wpłaty + 30 min karencji).
    const removal = getBookingRemoval(booking);
    if (!removal.canRemove) {
      return NextResponse.json(
        {
          error: removalBlockedMessage(removal),
          reason: removal.reason,
          minutesLeft: removal.minutesLeft,
        },
        { status: 409 },
      );
    }

    // 2. Guard na pakiet: gdyby któraś z zaproszonych osób zdążyła zapłacić,
    // kasowanie zapraszającego zabrałoby jej opłacone miejsce.
    const paidGuest = booking.invitedGuests.find((g) => bookingHasMoney(g));
    if (paidGuest) {
      return NextResponse.json(
        {
          error:
            "Osoba zaproszona w pakiecie ma już opłaconą rezerwację — nie można usunąć zapraszającego.",
          reason: "PAID_GUEST",
        },
        { status: 409 },
      );
    }

    const guestIds = booking.invitedGuests.map((g) => g.id);
    const removedIds = [booking.id, ...guestIds];
    const who = booking.name || booking.email || "Nieznana osoba";

    // 3. Kasujemy. ServiceOrder → TripService nie ma kaskady, więc zamówienia
    // SPA lecą pierwsze (i tak są tylko PENDING — bez wpłat).
    await prisma.$transaction([
      prisma.serviceOrder.deleteMany({
        where: { bookingId: { in: removedIds } },
      }),
      prisma.booking.deleteMany({ where: { id: { in: removedIds } } }),
    ]);

    // 4. Ślad w aktywności wydarzenia — kasowanie rezerwacji ma być widoczne.
    // Przez tę samą fasadę co reszta zdarzeń, żeby treść wpisów mieszkała
    // w jednym miejscu (`src/lib/notifications/send.ts`).
    await logCampEvent({
      kind: "BOOKING_REMOVED",
      tripId,
      tripTitle: booking.trip?.title,
      userName: who,
      detail:
        guestIds.length > 0
          ? `wraz z pakietem (+${guestIds.length} os.)`
          : null,
    }).catch((err) =>
      console.error("[DELETE uczestnik] log usunięcia nie zapisał się:", err),
    );

    return NextResponse.json({
      ok: true,
      removedIds,
      removedGuests: guestIds.length,
    });
  } catch (error) {
    console.error(
      "[DELETE /api/admin/wydarzenia/[id]/uczestnicy/[participantId]]",
      error,
    );
    return NextResponse.json(
      { error: "Nie udało się usunąć rezerwacji" },
      { status: 500 },
    );
  }
}
