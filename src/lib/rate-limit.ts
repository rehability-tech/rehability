/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PROSTY LIMITER ZAPYTAŃ (okno przesuwne, pamięć procesu)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * OGRANICZENIE, które trzeba znać: licznik żyje w pamięci PROCESU. Na
 * serverless każda instancja ma własny — przy N instancjach realny limit to
 * N × `limit`. To wciąż zabija naiwne zgadywanie kodów rabatowych ze skryptu,
 * ale nie jest twardą gwarancją. Twardy limit wymagałby Redisa.
 *
 * Używane przez /api/bookings/validate-discount, który jest wprost
 * narzędziem do zgadywania kodów.
 */

type Bucket = {
  count: number;
  /** Kiedy okno się zamyka (epoch ms). */
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Żeby mapa nie rosła w nieskończoność przy dużym ruchu. */
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  /** Ile prób jeszcze zostało w bieżącym oknie. */
  remaining: number;
  /** Za ile sekund okno się zresetuje — do nagłówka Retry-After. */
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const nowMs = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= nowMs) {
    if (buckets.size >= MAX_BUCKETS) pruneExpired(nowMs);

    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - nowMs) / 1000),
  );

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds,
  };
}

function pruneExpired(nowMs: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= nowMs) buckets.delete(key);
  }

  // Gdyby po czyszczeniu nadal było ciasno (sam ruch, zero wygasłych),
  // zwalniamy najstarsze wpisy — limiter ma chronić, nie zjadać pamięci.
  if (buckets.size >= MAX_BUCKETS) {
    const oldest = [...buckets.entries()]
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, Math.floor(MAX_BUCKETS / 2));

    for (const [key] of oldest) buckets.delete(key);
  }
}
