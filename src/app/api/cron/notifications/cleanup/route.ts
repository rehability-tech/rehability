import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCron } from "@/lib/auth/requireCron";

// Cron: sprzątanie powiadomień, by tabela nie rosła w nieskończoność.
//  - przeczytane starsze niż 30 dni → usuwane,
//  - cokolwiek starszego niż 90 dni (nawet nieprzeczytane) → usuwane.

const READ_TTL_DAYS = 30;
const HARD_TTL_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  const now = Date.now();
  const readCutoff = new Date(now - READ_TTL_DAYS * DAY_MS);
  const hardCutoff = new Date(now - HARD_TTL_DAYS * DAY_MS);

  const result = await prisma.notification.deleteMany({
    where: {
      OR: [
        { isRead: true, createdAt: { lt: readCutoff } },
        { createdAt: { lt: hardCutoff } },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    deleted: result.count,
  });
}

export async function GET(req: Request) {
  return POST(req);
}
