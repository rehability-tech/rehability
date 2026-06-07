import { NextResponse } from "next/server";
import { devLog } from "@/lib/devLog";

// Lightweight bearer-token auth for cron endpoints.
//
// Set CRON_SECRET in .env. Cron callers must send it as either:
//   Authorization: Bearer <token>
//   x-cron-secret: <token>
//
// UWAGA: sekret w query stringu (?secret=) jest świadomie NIEobsługiwany —
// query trafia do logów serwera/proxy/CDN i sekret mógłby wyciec.
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

  const bearer = headerAuth.toLowerCase().startsWith("bearer ")
    ? headerAuth.slice(7).trim()
    : "";

  const provided = bearer || headerX;

  if (provided && timingSafeEqual(provided, secret)) {
    return { ok: true };
  }

  // --- LOGOWANIE BŁĘDÓW DO KONSOLI ---
  if (!provided) {
    // Debug tylko w dev — nagłówek auth to dane wrażliwe, nie trafia na prod.
    devLog.log("PROVIDED", headerAuth);

    console.warn(
      `[cron 401] Odrzucono żądanie do ${url.pathname}: Nie podano hasła CRON_SECRET (brak w nagłówkach Authorization / x-cron-secret).`,
    );
  } else {
    console.warn(
      `[cron 401] Odrzucono żądanie do ${url.pathname}: Podane hasło jest nieprawidłowe (nie zgadza się ze zmienną środowiskową na serwerze).`,
    );
  }
  // -----------------------------------

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
