"use client";

const STORAGE_KEY = "gemini:rl:timestamps:v1";
const WINDOW_MS = 60_000;
// Realny limit Gemini 3.1 Flash Lite to 15 RPM — trzymamy 14 jako bezpieczny margines.
export const RPM_LIMIT = 14;

export type RateStatus =
  | { kind: "idle"; used: number; limit: number }
  | {
      kind: "waiting";
      reason: "ratelimit" | "retry";
      used: number;
      limit: number;
      countdown: number;
      attempt: number;
      maxAttempts: number;
    };

export type StatusListener = (status: RateStatus) => void;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n: unknown) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function write(arr: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // storage full / disabled — silently degrade to per-tab in-memory budget
  }
}

function prune(arr: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return arr.filter((t) => t > cutoff).sort((a, b) => a - b);
}

export function getUsage(): { used: number; limit: number } {
  const arr = prune(read());
  return { used: arr.length, limit: RPM_LIMIT };
}

function recordCall(): void {
  const arr = prune(read());
  arr.push(Date.now());
  write(arr);
}

function saturateBucket(extraMs = 0): void {
  const now = Date.now() + extraMs;
  const arr = prune(read());
  while (arr.length < RPM_LIMIT) arr.push(now);
  write(arr);
}

async function waitForSlot(onStatus: StatusListener | undefined, attempt: number, maxAttempts: number): Promise<void> {
  while (true) {
    const ts = prune(read());
    write(ts);
    if (ts.length < RPM_LIMIT) return;
    const oldest = ts[0];
    const ms = Math.max(0, WINDOW_MS - (Date.now() - oldest));
    if (ms <= 0) return;
    const sec = Math.max(1, Math.ceil(ms / 1000));
    onStatus?.({
      kind: "waiting",
      reason: "ratelimit",
      used: ts.length,
      limit: RPM_LIMIT,
      countdown: sec,
      attempt,
      maxAttempts,
    });
    await sleep(Math.min(1000, ms));
  }
}

async function countdown(
  seconds: number,
  reason: "ratelimit" | "retry",
  attempt: number,
  maxAttempts: number,
  onStatus?: StatusListener,
) {
  for (let s = Math.max(1, Math.ceil(seconds)); s > 0; s--) {
    const usage = getUsage();
    onStatus?.({
      kind: "waiting",
      reason,
      used: usage.used,
      limit: usage.limit,
      countdown: s,
      attempt,
      maxAttempts,
    });
    await sleep(1000);
  }
}

export interface GeminiFetchOptions {
  maxAttempts?: number;
  onStatus?: StatusListener;
  retryBaseDelaySec?: number;
}

export async function geminiFetch(
  input: string,
  init: RequestInit,
  options: GeminiFetchOptions = {},
): Promise<Response> {
  const { maxAttempts = 3, onStatus, retryBaseDelaySec = 6 } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await waitForSlot(onStatus, attempt, maxAttempts);
    recordCall();
    onStatus?.({ kind: "idle", ...getUsage() });

    let res: Response;
    try {
      res = await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) throw err;
      await countdown(retryBaseDelaySec * attempt, "retry", attempt, maxAttempts, onStatus);
      continue;
    }

    if (res.status === 429) {
      let waitSec = 30;
      try {
        const body = await res.clone().json();
        if (typeof body?.retryDelaySec === "number" && body.retryDelaySec > 0) {
          waitSec = body.retryDelaySec;
        }
      } catch {
        // ignore — fall back to default wait
      }
      saturateBucket(waitSec * 1000);
      if (attempt === maxAttempts) return res;
      await countdown(waitSec, "ratelimit", attempt, maxAttempts, onStatus);
      continue;
    }

    if (!res.ok) {
      if (attempt === maxAttempts) return res;
      await countdown(retryBaseDelaySec * attempt, "retry", attempt, maxAttempts, onStatus);
      continue;
    }

    return res;
  }

  if (lastError) throw lastError;
  throw new Error("geminiFetch exhausted attempts");
}
