import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/requireCron";
import { withDbRetry } from "@/lib/prisma";
import { alertAdminCronFailure } from "@/lib/cron/alertAdmin";

/**
 * Wspólny szkielet dla wszystkich endpointów `/api/cron/**`:
 *  1. Autoryzacja (CRON_SECRET przez `requireCron`).
 *  2. Wykonanie `handler` z ponawianiem błędów POŁĄCZENIA (`withDbRetry`).
 *  3. Przy awarii: log + mail do admina (`alertAdminCronFailure`) + 500.
 *
 * `handler` zwraca obiekt, który trafia do JSON-a razem z `ok: true`.
 */
export async function runCron(
  req: Request,
  name: string,
  handler: () => Promise<Record<string, unknown>>,
): Promise<NextResponse> {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  try {
    const data = await withDbRetry(handler, { label: name });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error(`[CRON ${name}] błąd:`, error);
    await alertAdminCronFailure(name, error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
