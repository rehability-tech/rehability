import { prisma } from "@/lib/prisma";
import {
  PILLARS,
  PILLAR_BY_ID,
  EVERGREEN_TOPICS,
  type Pillar,
  type EvergreenTopic,
} from "./seoConfig";
import {
  createTrendsProvider,
  createAutocompleteProvider,
  type RelatedQuery,
  type TrendsProvider,
} from "./trends";
import { planPillarQueries } from "./trends/queryPlan";
import { filterNoise } from "./trends/noiseFilter";
import { trimQuery, toWorkingTitle, titleBaseKey } from "./trends/refineQuery";
import { devLog } from "@/lib/devLog";

const GEO = "PL";
// SerpApi Google Trends bywa wolne i zmienne (zmierzone 3–16 s na zapytanie),
// dlatego timeout jest hojny. To cron działający w tle — czas nie jest krytyczny,
// a zbyt krótki timeout fałszywie wpychał filary krajowe w fallback evergreen.
const TREND_TIMEOUT_MS = 20_000;
const MAX_POSTS_PER_MONTH = 12;

export interface GenerateResult {
  year: number;
  month: number;
  created: number;
  /** "live" = z API (Trends/Autocomplete), "fallback" = evergreen, "mixed" = oba. */
  source: "live" | "fallback" | "mixed";
}

interface PostCandidate {
  scheduledDate: Date;
  title: string;
  topic: string;
  category: string;
  focusKeyword: string;
  keywords: string[];
}

export async function generateTrendSchedule(
  year: number,
  month: number,
): Promise<GenerateResult> {
  devLog.log(`\n======================================================`);
  devLog.log(`🚀 [BLOG GENERATOR] Uruchomienie dla: ${year}/${month + 1}`);
  devLog.log(`======================================================`);

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  // 1. Idempotencja.
  const existing = await prisma.blogScheduleEntry.count({
    where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
  });
  if (existing > 0) {
    devLog.log(
      `🛑 [IDEMPOTENCE] Wykryto już ${existing} wpisów w tym miesiącu. Przerywam generator (Zwracam 0).`,
    );
    return { year, month, created: 0, source: "fallback" };
  }

  // 2. Daty publikacji.
  const publishDays = getMWFDays(year, month).slice(0, MAX_POSTS_PER_MONTH);
  devLog.log(
    `📅 [DATES] Wyliczono ${publishDays.length} dni publikacji (Pon/Śr/Pt).`,
  );

  if (publishDays.length === 0) {
    devLog.log(`⚠️ [DATES] Brak dni do publikacji (tablica pusta).`);
    return { year, month, created: 0, source: "fallback" };
  }

  // 3. Trendy per filar (z fallbackiem na evergreen).
  devLog.log(
    `🔍 [TRENDS] Rozpoczynam pobieranie danych dla ${PILLARS.length} filarów...`,
  );
  const { topicsByPillar, source } = await collectTopics(publishDays.length);

  // 4. Kandydaci — round-robin po filarach, aby zachować balans 3 filarów.
  const candidates = buildCandidates(publishDays, topicsByPillar);
  devLog.log(
    `💡 [CANDIDATES] Zbudowano ${candidates.length} wstępnych kandydatów na wpisy.`,
  );

  // 5. Filtr duplikatów (historia + wewnątrz batcha).
  const unique = await dedupe(candidates);
  devLog.log(
    `♻️ [DEDUPLICATION] Pozostało ${unique.length} unikalnych wpisów z ${candidates.length} wygenerowanych.`,
  );

  if (unique.length === 0) {
    devLog.log(
      `🛑 [ABORT] Wszystkie pomysły były duplikatami. Kończę (0 stworzonych).`,
    );
    return { year, month, created: 0, source };
  }

  // Podgląd finalnego harmonogramu (data → kategoria → tytuł).
  devLog.log(`\n📋 [HARMONOGRAM] Finalny plan (${unique.length} wpisów):`);
  for (const c of unique) {
    devLog.log(
      `   ${fmtDate(c.scheduledDate)}  [${c.category.padEnd(13)}]  ${c.title}`,
    );
    devLog.log(`              ↳ keywords: ${c.keywords.join(", ")}`);
  }

  // 6. Zapis transakcyjny.
  devLog.log(`\n💾 [DATABASE] Rozpoczynam zapis transakcyjny (createMany)...`);
  await prisma.$transaction(async (tx) => {
    await tx.blogScheduleEntry.createMany({
      data: unique.map((c) => ({
        scheduledDate: c.scheduledDate,
        title: c.title,
        topic: c.topic,
        category: c.category,
        keywords: c.keywords,
      })),
      skipDuplicates: true,
    });
  });

  devLog.log(
    `✅ [SUCCESS] Generator zakończył pracę. Zapisano ${unique.length} wpisów! Źródło: ${source}\n`,
  );
  return { year, month, created: unique.length, source };
}

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

async function collectTopics(needed: number): Promise<CollectedTopics> {
  // Dwa źródła: Trends dla fraz krajowych, Autocomplete dla lokalnych.
  // Wybór per filar wg `pillar.discovery` (patrz fetchPillarTopics).
  const trendsProvider = createTrendsProvider();
  const autocompleteProvider = createAutocompleteProvider();
  const topicsByPillar = new Map<string, RawTopic[]>();

  let anySuccess = false;
  let anyFallback = false;

  const perPillar = Math.ceil(needed / PILLARS.length) + 1;

  await Promise.all(
    PILLARS.map(async (pillar) => {
      const provider =
        pillar.discovery === "AUTOCOMPLETE"
          ? autocompleteProvider
          : trendsProvider;
      try {
        const diag = await fetchPillarTopics(provider, pillar);
        if (diag.ranked.length > 0) {
          const selected = diag.ranked.slice(0, perPillar);
          topicsByPillar.set(
            pillar.id,
            selected.map((q) => ({
              pillar,
              focusKeyword: q.query,
              supportingKeywords: pillar.seedKeywords,
            })),
          );
          anySuccess = true;
          // Zgrupowany, czytelny blok per filar (filary lecą równolegle).
          devLog.log(
            [
              `   ┌─ ✔️ FILAR ${pillar.id} [${pillar.discovery}] — ${pillar.label}`,
              `   │  zapytania: ${diag.perQuery.map((p) => `${p.query}(${p.count})`).join(", ")}`,
              `   │  surowych: ${diag.rawCount} → czystych: ${diag.cleanCount} (odsiano ${diag.rawCount - diag.cleanCount}${diag.droppedSample.length ? `: ${diag.droppedSample.join(", ")}` : ""})`,
              `   │  WYBRANE tematy (${selected.length}): ${selected.map((q) => `"${q.query}"`).join(", ")}`,
              `   └─`,
            ].join("\n"),
          );
          return;
        }
        throw new Error("Pusta tablica wyników (empty)");
      } catch (err) {
        const evergreen = evergreenForPillar(pillar, perPillar);
        topicsByPillar.set(pillar.id, evergreen);
        anyFallback = true;
        // Fallback to realny sygnał problemu — zostaje prod-widoczny (console.warn).
        console.warn(
          `   ┌─ ⚠️ FILAR ${pillar.id} [${pillar.discovery}] — FALLBACK na evergreen`,
        );
        console.warn(
          `   │  powód: ${err instanceof Error ? err.message : err}`,
        );
        console.warn(
          `   │  evergreen (${evergreen.length}): ${evergreen.map((t) => `"${t.focusKeyword}"`).join(", ")}`,
        );
        console.warn(`   └─`);
      }
    }),
  );

  const source: GenerateResult["source"] =
    anySuccess && anyFallback ? "mixed" : anySuccess ? "live" : "fallback";

  return { topicsByPillar, source };
}

/** Diagnostyka pobierania jednego filaru — do czytelnych logów + wynik. */
interface PillarFetch {
  /** Unikalne, posortowane malejąco kandydatury (po odsiewie szumu). */
  ranked: RelatedQuery[];
  /** Ile zapytań i ile każde zwróciło. */
  perQuery: { query: string; count: number }[];
  /** Liczba surowych wyników (przed odsiewem). */
  rawCount: number;
  /** Liczba wyników po odsiewie szumu. */
  cleanCount: number;
  /** Próbka odrzuconych fraz (do podglądu). */
  droppedSample: string[];
}

async function fetchPillarTopics(
  provider: TrendsProvider,
  pillar: Pillar,
): Promise<PillarFetch> {
  const merged: RelatedQuery[] = [];
  const perQuery: { query: string; count: number }[] = [];

  // Plan zapytań zależy od źródła: dla AUTOCOMPLETE to seed × geoModifier
  // ("fizjoterapia prudnik"), dla TRENDS — same frazy bazowe.
  for (const query of planPillarQueries(pillar)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TREND_TIMEOUT_MS);
    try {
      const rising = await provider.relatedRising(query, GEO, controller.signal);
      perQuery.push({ query, count: rising.length });
      merged.push(...rising);
    } finally {
      clearTimeout(timer);
    }
  }

  // REJECT: odsiew szumu (nawigacyjne/brandowe/rozrywkowe/off-target).
  const clean = filterNoise(merged);
  const droppedSample = merged
    .filter((q) => !clean.includes(q))
    .slice(0, 5)
    .map((q) => q.query);

  // TRIM + dedupe: przycinamy każdą frazę (lata, ulice po mieście), a duplikaty
  // scalają się PO przycięciu ("...prudnik nfz" i "...prudnik" -> jedno).
  const byQuery = new Map<string, RelatedQuery>();
  for (const q of clean) {
    const trimmed = trimQuery(q.query, pillar);
    // Po przycięciu odrzucamy frazy zbyt ogólne (jedno słowo) — słaby temat.
    if (!trimmed.includes(" ")) continue;
    const key = trimmed.toLowerCase();
    const prev = byQuery.get(key);
    if (!prev || q.value > prev.value) {
      byQuery.set(key, { query: trimmed, value: q.value });
    }
  }

  return {
    ranked: [...byQuery.values()].sort((a, b) => b.value - a.value),
    perQuery,
    rawCount: merged.length,
    cleanCount: clean.length,
    droppedSample,
  };
}

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

function buildCandidates(
  publishDays: Date[],
  topicsByPillar: Map<string, RawTopic[]>,
): PostCandidate[] {
  const cursors = new Map<string, number>(PILLARS.map((p) => [p.id, 0]));
  const candidates: PostCandidate[] = [];

  for (let i = 0; i < publishDays.length; i++) {
    const pillar = PILLARS[i % PILLARS.length];
    const topics = topicsByPillar.get(pillar.id) ?? [];
    if (topics.length === 0) continue;

    const cursor = cursors.get(pillar.id) ?? 0;
    const topic = topics[cursor % topics.length];
    cursors.set(pillar.id, cursor + 1);

    // `i` rotuje końcówkę tytułu, by harmonogram nie był ścianą identycznych sufiksów.
    const candidate = toCandidate(publishDays[i], topic, i);
    devLog.log(
      `   • dzień ${fmtDate(publishDays[i])} → filar ${pillar.id} → "${candidate.title}"`,
    );
    candidates.push(candidate);
  }

  return candidates;
}

function toCandidate(date: Date, topic: RawTopic, variant: number): PostCandidate {
  // focusKeyword = przycięta fraza (SEO, małe litery); title = znormalizowany
  // tytuł roboczy (ogonki + kapitalizacja). To TYTUŁ ROBOCZY — finalny może
  // później dopisać generator treści AI.
  const focusKeyword = topic.focusKeyword;
  const title = toWorkingTitle(focusKeyword, topic.pillar, variant);
  const keywords = unique([focusKeyword, ...topic.supportingKeywords]).slice(
    0,
    6,
  );

  return {
    scheduledDate: date,
    title,
    topic: buildTopicBrief(topic),
    category: PILLAR_BY_ID[topic.pillar.id].category,
    focusKeyword,
    keywords,
  };
}

function buildTopicBrief(topic: RawTopic): string {
  return (
    `Artykuł rozwijający temat "${topic.focusKeyword}" w kontekście filaru: ` +
    `${topic.pillar.label}. Treść ekspercka oparta o wiedzę fizjoterapeutyczną, ` +
    `zoptymalizowana pod frazę kluczową i realne intencje wyszukiwania.`
  );
}

// ──────────────────────────────────────────────────────────────────────────

async function dedupe(candidates: PostCandidate[]): Promise<PostCandidate[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const past = await prisma.blogScheduleEntry.findMany({
    where: { scheduledDate: { gte: sixMonthsAgo } },
    select: { title: true },
  });

  // Dedupe po BAZOWEJ frazie (bez rotowanej końcówki, bez ogonków), więc
  // dwa tytuły różniące się tylko sufiksem liczą się jako jeden temat.
  const seen = new Set(past.map((p) => titleBaseKey(p.title)));
  const result: PostCandidate[] = [];

  for (const c of candidates) {
    const key = titleBaseKey(c.title);
    if (seen.has(key)) {
      devLog.log(`   ❌ [DEDUPE] Usunięto zduplikowany temat: "${c.title}"`);
      continue;
    }
    seen.add(key);
    result.push(c);
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────

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

/** Krótka data do logów: "pon 2026-07-06". */
function fmtDate(d: Date): string {
  const dow = ["nd", "pon", "wt", "śr", "czw", "pt", "sob"][d.getDay()];
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${dow} ${iso}`;
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
