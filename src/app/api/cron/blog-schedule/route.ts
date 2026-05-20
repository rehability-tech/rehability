import { NextResponse } from "next/server";
import { generateMonthlySchedule } from "@/lib/blog/generateMonthlySchedule";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Generate for next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  try {
    const result = await generateMonthlySchedule(nextMonth.getFullYear(), nextMonth.getMonth());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Cron blog-schedule error:", error);
    return NextResponse.json({ error: "Błąd generowania harmonogramu" }, { status: 500 });
  }
}
