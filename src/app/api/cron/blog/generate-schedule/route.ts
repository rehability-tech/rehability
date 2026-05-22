import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/requireCron";
import { generateMonthlySchedule } from "@/lib/blog/generateMonthlySchedule";

// POST /api/cron/blog/generate-schedule
//
// Generates a content schedule for the requested month. Defaults to the
// *next* month so a monthly cron run keeps the calendar one month ahead.
//
// Body or query:
//   { "year": 2026, "month": 5 }     // month is 0-indexed (May = 4)
//   "?year=2026&month=4"
//   "?offset=2"                       // generate for current + N months
//
// Behavior: idempotent — if a schedule already exists for that month, the
// underlying helper returns { created: 0 } without overwriting.

export async function POST(req: Request) {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  const url = new URL(req.url);
  const body = await safeJson(req);
  const now = new Date();

  let year = num(body.year ?? url.searchParams.get("year"));
  let month = num(body.month ?? url.searchParams.get("month"));
  const offset = num(body.offset ?? url.searchParams.get("offset"));

  if (year === null || month === null) {
    const base = new Date(now.getFullYear(), now.getMonth() + (offset ?? 1), 1);
    year = base.getFullYear();
    month = base.getMonth();
  }

  try {
    const result = await generateMonthlySchedule(year, month);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] schedule generation failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Schedule generation failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}

async function safeJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.clone().text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
