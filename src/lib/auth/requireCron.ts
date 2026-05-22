import { NextResponse } from "next/server";

// Lightweight bearer-token auth for cron endpoints.
//
// Set CRON_SECRET in .env. Cron callers must send it as either:
//   Authorization: Bearer <token>
//   x-cron-secret: <token>
//   ?secret=<token>           (query string)
//
// If CRON_SECRET is unset in development we LOG A WARNING and allow the call
// so the endpoints stay testable locally. Production deploys MUST set it.

export interface CronAuthResult {
  ok: boolean;
  response?: NextResponse;
}

export function requireCron(req: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron] CRON_SECRET is not configured. Refusing cron call in production.",
      );
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Cron endpoints are not configured on this server." },
          { status: 503 },
        ),
      };
    }
    console.warn(
      "[cron] CRON_SECRET is not set — allowing call in non-production. " +
        "Set CRON_SECRET in .env before deploying.",
    );
    return { ok: true };
  }

  const url = new URL(req.url);
  const headerAuth = req.headers.get("authorization") ?? "";
  const headerX = req.headers.get("x-cron-secret") ?? "";
  const querySecret = url.searchParams.get("secret") ?? "";

  const bearer = headerAuth.toLowerCase().startsWith("bearer ")
    ? headerAuth.slice(7).trim()
    : "";

  const provided = bearer || headerX || querySecret;

  if (provided && timingSafeEqual(provided, secret)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
