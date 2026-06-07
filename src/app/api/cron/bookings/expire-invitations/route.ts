import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// Cron: wygasza Bookingi typu PENDING_INVITATION, których expiresAt minął.
// Zaproszenia żyją 24h (patrz INVITATION_TTL_HOURS w create-checkout-session).
// Po EXPIRED ich miejsce nie jest już liczone w `capacity`.

export async function POST(req: Request) {
  return runCron(req, "bookings/expire-invitations", async () => {
    const now = new Date();
    const result = await prisma.booking.updateMany({
      where: {
        status: "PENDING_INVITATION",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    return { checkedAt: now.toISOString(), expired: result.count };
  });
}

export async function GET(req: Request) {
  return POST(req);
}
