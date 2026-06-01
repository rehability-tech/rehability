import { prisma } from "@/lib/prisma";
import {
  PILLARS,
  PILLAR_BY_ID,
  EVERGREEN_TOPICS,
  type Pillar,
  type EvergreenTopic,
} from "./seoConfig";
import { createTrendsProvider, type RelatedQuery } from "./trends";

/**
 * Generator harmonogramu bloga oparty o REALNE trendy wyszukiwań (geo: PL),
 * z twardym fallbackiem na frazy evergreen przy awarii API.
 *
 * Przepływ (Single Responsibility — każdy krok to osobna, czysta funkcja):
 *   1. Idempotencja — pomiń miesiąc, jeśli plan już istnieje.
 *   2. Wyznacz daty publikacji (pon/śr/pt).
 *   3. Dla każdego filaru pobierz rosnące "related queries" (z fallbackiem).
 *   4. Zbuduj kandydatów na posty (round-robin po filarach).
 *   5. Odfiltruj duplikaty (vs. historia + w obrębie batcha).
 *   6. Zapisz transakcyjnie (createMany).
 */

const GEO = "PL";
/** Twardy timeout pojedynczego zapytania do API trendów. */
const TREND_TIMEOUT_MS = 8_000;
/** Maks. liczba postów na miesiąc (limit slotów MWF). */
const MAX_POSTS_PER_MONTH = 12;

export interface GenerateResult {
  year: number;
  month: number;
  created: number;
  /** Skąd pochodziły tematy: "trends" jeśli API zadziałało, "fallback" w razie awarii. */
  source: "trends" | "fallback" | "mixed";
}

interface PostCandidate {
  scheduledDate: Date;
  title: string;
  topic: string;
  category: string;
  /** Główna fraza — utrwalana jako keywords[0] (schema nie ma osobnej kolumny). */
  focusKeyword: string;
  keywords: string[];
}

/**
 * Główny punkt wejścia. Zachowuje sygnaturę zgodną z poprzednim
 * `generateMonthlySchedule`, więc istniejące route handlery działają bez zmian.
 */
export async function generateTrendSchedule(
  year: number,
  month: number,
): Promise<GenerateResult> {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  // 1. Idempotencja.
  const existing = await prisma.blogScheduleEntry.count({
    where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
  });
  if (existing > 0) return { year, month, created: 0, source: "fallback" };

  // 2. Daty publikacji.
  const publishDays = getMWFDays(year, month).slice(0, MAX_POSTS_PER_MONTH);
  if (publishDays.length === 0) {
    return { year, month, created: 0, source: "fallback" };
  }

  // 3. Trendy per filar (z fallbackiem na evergreen).
  const { topicsByPillar, source } = await collectTopics(publishDays.length);

  // 4. Kandydaci — round-robin po filarach, aby zachować balans 3 filarów.
  const candidates = buildCandidates(publishDays, topicsByPillar);

  // 5. Filtr duplikatów (historia + wewnątrz batcha).
  const unique = await dedupe(candidates);

  if (unique.length === 0) return { year, month, created: 0, source };

  // 6. Zapis transakcyjny. `skipDuplicates` chroni przed race-condition przy
  //    równoległym uruchomieniu crona.
  await prisma.$transaction(async (tx) => {
    await tx.blogScheduleEntry.createMany({
      data: unique.map((c) => ({
        scheduledDate: c.scheduledDate,
        title: c.title,
        topic: c.topic,
        category: c.category,
        // focusKeyword utrwalamy na pozycji [0] — patrz komentarz w typie.
        keywords: c.keywords,
      })),
      skipDuplicates: true,
    });
  });

  return { year, month, created: unique.length, source };
}

// ──────────────────────────────────────────────────────────────────────────
// KROK 3: Pobieranie tematów z trendów + fallback
// ──────────────────────────────────────────────────────────────────────────

interface CollectedTopics {
  topicsByPillar: Map<string, RawTopic[]>;
  source: GenerateResult["source"];
}

interface RawTopic {
  pillar: Pillar;
  focusKeyword: string;
  supportingKeywords: string[];
}

/**
 * Dla każdego filaru próbuje pobrać rosnące zapytania z API trendów.
 * Każdy filar jest izolowany try/catch — awaria jednego nie psuje pozostałych
 * (odporność). Gdy WSZYSTKIE filary padną, źródłem jest czysty "fallback".
 */
async function collectTopics(needed: number): Promise<CollectedTopics> {
  const provider = createTrendsProvider();
  const topicsByPillar = new Map<string, RawTopic[]>();

  let anySuccess = false;
  let anyFallback = false;

  // Ile fraz na filar — rozkładamy zapotrzebowanie równo na 3 filary, z zapasem.
  const perPillar = Math.ceil(needed / PILLARS.length) + 1;

  await Promise.all(
    PILLARS.map(async (pillar) => {
      try {
        const rising = await fetchPillarTrends(provider, pillar);
        if (rising.length > 0) {
          topicsByPillar.set(
            pillar.id,
            rising.slice(0, perPillar).map((q) => ({
              pillar,
              focusKeyword: q.query,
              supportingKeywords: pillar.seedKeywords,
            })),
          );
          anySuccess = true;
          return;
        }
        // Pusty wynik traktujemy jak miękką awarię -> fallback dla tego filaru.
        throw new Error("empty trends");
      } catch (err) {
        console.warn(
          `[trends] Filar "${pillar.id}" — fallback na evergreen. Powód:`,
          err instanceof Error ? err.message : err,
        );
        topicsByPillar.set(pillar.id, evergreenForPillar(pillar, perPillar));
        anyFallback = true;
      }
    }),
  );

  const source: GenerateResult["source"] =
    anySuccess && anyFallback
      ? "mixed"
      : anySuccess
        ? "trends"
        : "fallback";

  return { topicsByPillar, source };
}

/**
 * Pobiera i scala rosnące zapytania dla wszystkich seed keywords danego filaru,
 * a następnie sortuje malejąco po sile trendu i deduplikuje.
 */
async function fetchPillarTrends(
  provider: ReturnType<typeof createTrendsProvider>,
  pillar: Pillar,
): Promise<RelatedQuery[]> {
  const merged: RelatedQuery[] = [];

  for (const seed of pillar.seedKeywords) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TREND_TIMEOUT_MS);
    try {
      const rising = await provider.relatedRising(
        seed,
        GEO,
        controller.signal,
      );
      merged.push(...rising);
    } finally {
      clearTimeout(timer);
    }
  }

  // Dedupe po treści frazy, zachowując najwyższą wartość trendu.
  const byQuery = new Map<string, RelatedQuery>();
  for (const q of merged) {
    const key = q.query.toLowerCase();
    const prev = byQuery.get(key);
    if (!prev || q.value > prev.value) byQuery.set(key, q);
  }

  return [...byQuery.values()].sort((a, b) => b.value - a.value);
}

/** Mapuje evergreen topics filaru na wewnętrzny RawTopic. */
function evergreenForPillar(pillar: Pillar, limit: number): RawTopic[] {
  return EVERGREEN_TOPICS.filter((t) => t.pillar === pillar.id)
    .slice(0, limit)
    .map((t: EvergreenTopic) => ({
      pillar,
      focusKeyword: t.focusKeyword,
      supportingKeywords: t.supportingKeywords,
    }));
}

// ──────────────────────────────────────────────────────────────────────────
// KROK 4: Budowa kandydatów (round-robin po filarach)
// ──────────────────────────────────────────────────────────────────────────

function buildCandidates(
  publishDays: Date[],
  topicsByPillar: Map<string, RawTopic[]>,
): PostCandidate[] {
  // Kursory na pozycję w liście tematów każdego filaru.
  const cursors = new Map<string, number>(PILLARS.map((p) => [p.id, 0]));
  const candidates: PostCandidate[] = [];

  for (let i = 0; i < publishDays.length; i++) {
    // Round-robin: dzień 0 -> filar 0, dzień 1 -> filar 1, ...
    const pillar = PILLARS[i % PILLARS.length];
    const topics = topicsByPillar.get(pillar.id) ?? [];
    if (topics.length === 0) continue;

    const cursor = cursors.get(pillar.id) ?? 0;
    const topic = topics[cursor % topics.length];
    cursors.set(pillar.id, cursor + 1);

    candidates.push(toCandidate(publishDays[i], topic));
  }

  return candidates;
}

/** Zamienia surowy temat trendowy na gotowego kandydata na wpis bloga. */
function toCandidate(date: Date, topic: RawTopic): PostCandidate {
  const title = buildTitle(topic);
  const focusKeyword = topic.focusKeyword;
  // keywords[0] === focusKeyword (utrwalenie w schemacie bez nowej kolumny).
  const keywords = unique([
    focusKeyword,
    ...topic.supportingKeywords,
  ]).slice(0, 6);

  return {
    scheduledDate: date,
    title,
    topic: buildTopicBrief(topic),
    category: PILLAR_BY_ID[topic.pillar.id].category,
    focusKeyword,
    keywords,
  };
}

/**
 * Buduje tytuł zoptymalizowany pod CTR: kapitalizacja frazy, dla filarów
 * lokalnych doklejenie geo-modyfikatora ("… w Prudniku").
 */
function buildTitle(topic: RawTopic): string {
  const base = capitalize(topic.focusKeyword);
  if (topic.pillar.scope === "LOCAL" && topic.pillar.geoModifiers.length > 0) {
    return `${base} — sprawdzony przewodnik (${topic.pillar.geoModifiers[0]})`;
  }
  return `${base} — kompletny przewodnik`;
}

/** Krótki brief tematu (pole `topic` w bazie). */
function buildTopicBrief(topic: RawTopic): string {
  return (
    `Artykuł rozwijający temat "${topic.focusKeyword}" w kontekście filaru: ` +
    `${topic.pillar.label}. Treść ekspercka oparta o wiedzę fizjoterapeutyczną, ` +
    `zoptymalizowana pod frazę kluczową i realne intencje wyszukiwania.`
  );
}

// ──────────────────────────────────────────────────────────────────────────
// KROK 5: Deduplikacja
// ──────────────────────────────────────────────────────────────────────────

/**
 * Usuwa kandydatów, których tytuł już istnieje (case-insensitive) w historii
 * z ostatnich 6 miesięcy oraz duplikaty w obrębie bieżącego batcha.
 */
async function dedupe(candidates: PostCandidate[]): Promise<PostCandidate[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const past = await prisma.blogScheduleEntry.findMany({
    where: { scheduledDate: { gte: sixMonthsAgo } },
    select: { title: true },
  });

  const seen = new Set(past.map((p) => p.title.toLowerCase().trim()));
  const result: PostCandidate[] = [];

  for (const c of candidates) {
    const key = c.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(c);
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// Utilsy (DRY)
// ──────────────────────────────────────────────────────────────────────────

/** Zwraca poniedziałki/środy/piątki danego miesiąca. */
function getMWFDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow === 1 || dow === 3 || dow === 5) days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
