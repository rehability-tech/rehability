/**
 * Adapter synchronizacji kontaktów (warstwa domenowa Rehability).
 *
 * To TUTAJ — a nie w przenośnym `src/lib/mailer` — żyje wiedza o tym, skąd biorą
 * się kontakty: `NewsletterSubscriber` ("Newsletter"), `User` z rezerwacjami
 * ("Wyjazdy") i `User` z zapisami na kursy ("VOD"). Mailer operuje już tylko na
 * gotowej tabeli `Contact`.
 *
 * Zasady:
 *  - dedup po emailu (lowercase),
 *  - `sources[]` zarządzane automatycznie (dokładamy, nie kasujemy),
 *  - `tags[]` (ręczne) NIGDY nie są ruszane,
 *  - status (np. UNSUBSCRIBED) nie jest nadpisywany przez sync.
 */
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Źródła rozpoznawane przez sync — spójne z filtrami segmentów w UI. */
export const CONTACT_SOURCES = {
  TRIPS: "Wyjazdy",
  VOD: "VOD",
  NEWSLETTER: "Newsletter",
} as const;

export type ContactSource =
  (typeof CONTACT_SOURCES)[keyof typeof CONTACT_SOURCES];

function genUnsubToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface UpsertContactOptions {
  name?: string | null;
  source: ContactSource;
  userId?: string | null;
}

/**
 * Idempotentny upsert pojedynczego kontaktu. Dokłada źródło do `sources[]`,
 * uzupełnia brakujące `name`/`userId`. Bezpieczny do wołania z hooków (best-effort).
 */
export async function upsertContactFromEmail(
  rawEmail: string,
  opts: UpsertContactOptions,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return;

  const existing = await prisma.contact.findUnique({
    where: { email },
    select: { id: true, sources: true, name: true, userId: true },
  });

  if (!existing) {
    await prisma.contact.create({
      data: {
        email,
        name: opts.name ?? null,
        sources: [opts.source],
        userId: opts.userId ?? null,
        unsubscribeToken: genUnsubToken(),
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  const nextSources = existing.sources.includes(opts.source)
    ? existing.sources
    : [...existing.sources, opts.source];

  await prisma.contact.update({
    where: { id: existing.id },
    data: {
      sources: nextSources,
      // Uzupełniamy tylko brakujące pola — nie nadpisujemy istniejących.
      ...(existing.name ? {} : opts.name ? { name: opts.name } : {}),
      ...(existing.userId ? {} : opts.userId ? { userId: opts.userId } : {}),
      lastSyncedAt: new Date(),
    },
  });
}

export interface SyncResult {
  newsletter: number;
  trips: number;
  vod: number;
  total: number;
}

/**
 * Pełna rekoncyliacja bazy kontaktów ze wszystkich źródeł.
 * Najpierw agreguje w pamięci (dedup po emailu), potem zapisuje — by ten sam
 * adres z kilku źródeł dał jeden upsert z połączonymi `sources`.
 */
export async function syncAllContacts(): Promise<SyncResult> {
  type Agg = {
    name: string | null;
    userId: string | null;
    sources: Set<string>;
  };
  const map = new Map<string, Agg>();

  const add = (
    rawEmail: string | null | undefined,
    source: ContactSource,
    name?: string | null,
    userId?: string | null,
  ) => {
    if (!rawEmail) return;
    const email = normalizeEmail(rawEmail);
    if (!email || !email.includes("@")) return;
    const agg = map.get(email) ?? {
      name: null,
      userId: null,
      sources: new Set<string>(),
    };
    agg.sources.add(source);
    if (!agg.name && name) agg.name = name;
    if (!agg.userId && userId) agg.userId = userId;
    map.set(email, agg);
  };

  // Newsletter
  const subs = await prisma.newsletterSubscriber.findMany({
    select: { email: true },
  });
  let newsletter = 0;
  for (const s of subs) {
    add(s.email, CONTACT_SOURCES.NEWSLETTER);
    newsletter++;
  }

  // Wyjazdy: użytkownicy z co najmniej jedną rezerwacją (≠ CANCELLED)
  const tripUsers = await prisma.user.findMany({
    where: { bookings: { some: { status: { not: "CANCELLED" } } } },
    select: { id: true, name: true, email: true },
  });
  let trips = 0;
  for (const u of tripUsers) {
    add(u.email, CONTACT_SOURCES.TRIPS, u.name, u.id);
    trips++;
  }

  // VOD: użytkownicy z co najmniej jednym zapisem na kurs
  const vodUsers = await prisma.user.findMany({
    where: { enrollments: { some: {} } },
    select: { id: true, name: true, email: true },
  });
  let vod = 0;
  for (const u of vodUsers) {
    add(u.email, CONTACT_SOURCES.VOD, u.name, u.id);
    vod++;
  }

  // Zapis — jeden upsert na unikalny email z połączonymi źródłami.
  const now = new Date();
  for (const [email, agg] of map) {
    const existing = await prisma.contact.findUnique({
      where: { email },
      select: { id: true, sources: true, name: true, userId: true },
    });

    if (!existing) {
      await prisma.contact.create({
        data: {
          email,
          name: agg.name,
          userId: agg.userId,
          sources: [...agg.sources],
          unsubscribeToken: genUnsubToken(),
          lastSyncedAt: now,
        },
      });
      continue;
    }

    const merged = new Set([...existing.sources, ...agg.sources]);
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        sources: [...merged],
        ...(existing.name ? {} : agg.name ? { name: agg.name } : {}),
        ...(existing.userId ? {} : agg.userId ? { userId: agg.userId } : {}),
        lastSyncedAt: now,
      },
    });
  }

  return { newsletter, trips, vod, total: map.size };
}
