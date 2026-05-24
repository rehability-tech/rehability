import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { generateMonthlySchedule } from "@/lib/blog/generateMonthlySchedule";

export async function GET(req: Request) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
  );
  const month = parseInt(
    searchParams.get("month") ?? String(new Date().getMonth()),
  );

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const entries = await prisma.blogScheduleEntry.findMany({
    where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  console.log("Test rtun");

  const authHeader = req.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  // Jeśli to nie CRON, sprawdzamy czy to zalogowany Administrator
  if (!isCron) {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;
  }

  const body = await req.json().catch(() => ({}));
  const year = Number(body.year ?? new Date().getFullYear());
  const month = Number(body.month ?? new Date().getMonth());

  console.log(`[CRON/MANUAL] Generowanie planu na miesiąc: ${month} / ${year}`);

  try {
    const result = await generateMonthlySchedule(year, month);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Manual schedule trigger error:", error);
    return NextResponse.json(
      { error: "Błąd generowania harmonogramu" },
      { status: 500 },
    );
  }
}
