import { Prisma, PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbLogged: boolean | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Poza produkcją wypisujemy JEDEN RAZ, z jaką bazą rozmawiamy — bez danych
// logowania. Projekt ma bazę główną (Neon) i branch testowy przełączany przez
// scripts/with-env.mjs; bez tej linii łatwo szukać danych w złym miejscu albo,
// gorzej, zmieniać dane na produkcji będąc przekonanym, że to test.
if (process.env.NODE_ENV !== "production" && !globalForPrisma.dbLogged) {
  globalForPrisma.dbLogged = true;
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    console.log(`[prisma] baza: ${url.hostname}${url.pathname}`);
  } catch {
    console.warn("[prisma] DATABASE_URL nieustawiony lub w złym formacie");
  }
}

// Kody błędów Prisma oznaczające PROBLEM Z POŁĄCZENIEM (nie z danymi).
// To są jedyne sytuacje, w których ponawianie ma sens — np. Neon budzi się
// ze stanu uśpienia (scale-to-zero) i pierwsze połączenie pada na timeout.
const TRANSIENT_DB_CODES = new Set([
  "P1000", // authentication failed (czasem przy budzeniu)
  "P1001", // can't reach database server
  "P1002", // server reached but timed out
  "P1008", // operation timed out
  "P1017", // server closed the connection
]);

function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Komunikat ma priorytet — Neon scale-to-zero potrafi przyjść jako
  // PrismaClientKnownRequestError z "Can't reach database server" (a nie P1001).
  const messageLooksTransient =
    /can't reach database server|connection refused|econnreset|etimedout|terminating connection|connection closed|timed out/i.test(
      msg,
    );

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return messageLooksTransient || !err.errorCode || TRANSIENT_DB_CODES.has(err.errorCode);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return messageLooksTransient || TRANSIENT_DB_CODES.has(err.code);
  }
  return messageLooksTransient;
}

interface RetryOptions {
  /** Ile RAZ ponowić po pierwszej nieudanej próbie (domyślnie 2). */
  retries?: number;
  /** Bazowe opóźnienie; rośnie wykładniczo: base, base*2, base*4… (ms). */
  baseDelayMs?: number;
  /** Etykieta do logów (np. nazwa crona). */
  label?: string;
}

/**
 * Owija operację bazodanową w ponawianie przy błędach POŁĄCZENIA.
 * Pierwsza próba zwykle "budzi" uśpiony serwer Neon, kolejna już trafia.
 * Błędy danych (unikalność, walidacja itd.) NIE są ponawiane — lecą od razu w górę.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { retries = 2, baseDelayMs = 500, label } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransientDbError(err)) throw err;

      const delay = baseDelayMs * 2 ** attempt;
      console.warn(
        `[db retry]${label ? ` ${label}:` : ""} błąd połączenia (próba ${
          attempt + 1
        }/${retries}), ponawiam za ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastErr;
}
