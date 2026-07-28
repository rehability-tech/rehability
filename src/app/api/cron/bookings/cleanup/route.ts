import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// GET/POST /api/cron/bookings/cleanup
// 1. Zwalnia zablokowane terminy SPA (ServiceOrder w PENDING starsze niż 15 min).
// 2. Anuluje porzucone rezerwacje wydarzeń (Booking w PENDING bez wpłaty,
//    nieaktywne dłużej niż 60 min) — inaczej "wisiałyby" w liczniku miejsc
//    bez końca. Razem z nimi anulujemy ich osierocone zaproszenia partnerek.

const STALE_ORDER_MINUTES = 15;
const STALE_PENDING_MINUTES = 60;

export async function GET(req: Request) {
  return runCron(req, "bookings/cleanup", async () => {
    const now = Date.now();

    // ── 1. Porzucone koszyki SPA ─────────────────────────────────────────
    const orderCutoff = new Date(now - STALE_ORDER_MINUTES * 60 * 1000);
    const orderResult = await prisma.serviceOrder.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: orderCutoff },
      },
      data: { status: "CANCELLED" },
    });

    // ── 2. Porzucone rezerwacje wydarzeń (zadatek nieopłacony) ────────────
    // Liczymy bezczynność po updatedAt — wznowienie płatności (resume-payment)
    // bumpuje updatedAt, więc aktywnie płacące osoby nie zostaną anulowane.
    // Guard `amountPaid: 0` + `depositPaidAt: null` — nigdy nie ruszamy opłaconych.
    const pendingCutoff = new Date(now - STALE_PENDING_MINUTES * 60 * 1000);
    const stale = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        updatedAt: { lt: pendingCutoff },
        amountPaid: 0,
        depositPaidAt: null,
      },
      select: { id: true },
    });
    const staleIds = stale.map((b) => b.id);

    let cancelledBookings = 0;
    let cancelledInvitations = 0;
    if (staleIds.length > 0) {
      const [bookers, invites] = await prisma.$transaction([
        prisma.booking.updateMany({
          where: { id: { in: staleIds } },
          data: { status: "CANCELLED" },
        }),
        // Zaproszenia partnerek tych rezerwacji są osierocone (mail wychodzi
        // dopiero po opłaceniu zadatku przez zapraszającą) — zwalniamy ich miejsce.
        prisma.booking.updateMany({
          where: { invitedById: { in: staleIds }, status: "PENDING_INVITATION" },
          data: { status: "CANCELLED" },
        }),
      ]);
      cancelledBookings = bookers.count;
      cancelledInvitations = invites.count;
    }

    console.log(
      `[CRON] cleanup: SPA=${orderResult.count}, ` +
        `PENDING=${cancelledBookings}, zaproszenia=${cancelledInvitations}`,
    );

    return {
      message: "Wyczyszczono porzucone rezerwacje.",
      cleanedOrders: orderResult.count,
      cancelledBookings,
      cancelledInvitations,
    };
  });
}

export async function POST(req: Request) {
  return GET(req);
}
