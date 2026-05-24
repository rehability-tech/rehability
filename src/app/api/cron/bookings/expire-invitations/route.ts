import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCron } from "@/lib/auth/requireCron";

// Cron: wygasza Bookingi typu PENDING_INVITATION, których expiresAt minął.
// Zaproszenia żyją 24h (patrz INVITATION_TTL_HOURS w create-checkout-session).
// Po EXPIRED ich miejsce nie jest już liczone w `capacity`.

export async function POST(req: Request) {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING_INVITATION",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({
    ok: true,
    checkedAt: now.toISOString(),
    expired: result.count,
  });
}

export async function GET(req: Request) {
  return POST(req);
}
