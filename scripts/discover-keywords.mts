/**
 * Skrypt ZWIADOWCZY do kuracji seoConfig.
 *
 * Dla każdego filaru pobiera kandydatów na frazy z właściwego źródła
 * (Trends dla krajowych, Autocomplete dla lokalnych — wg `pillar.discovery`),
 * scala, deduplikuje i drukuje ranking. Na tej podstawie wybierasz najlepsze
 * frazy i wpisujesz je na stałe do `seoConfig.ts` (seedKeywords / EVERGREEN_TOPICS).
 *
 * Uruchomienie:
 *   npm run discover-keywords
 *   npm run discover-keywords -- PHYSIO_LOCAL      (tylko jeden filar)
 *
 * Wymaga SERPAPI_API_KEY w .env (czytane natywnie poniżej, bez zależności).
 */
import { readFileSync } from "node:fs";

// Minimalny loader .env (skrypt poza runtime Next, więc ładujemy ręcznie).
for (const line of readFileSync("./.env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { PILLARS } = await import("../src/lib/blog/seoConfig.js");
const { createTrendsProvider, createAutocompleteProvider } = await import(
  "../src/lib/blog/trends/index.js"
);
const { planPillarQueries } = await import(
  "../src/lib/blog/trends/queryPlan.js"
);
const { isCleanQuery } = await import("../src/lib/blog/trends/noiseFilter.js");

const GEO = "PL";
const TIMEOUT_MS = 20_000;
const TOP_N = 15;

const onlyPillar = process.argv[2]?.toUpperCase();

async function run() {
  const trends = createTrendsProvider();
  const autocomplete = createAutocompleteProvider();

  console.log(`\n🔎 ZWIAD FRAZ — provider trendów: ${trends.name}, autocomplete: ${autocomplete.name}\n`);

  for (const pillar of PILLARS) {
    if (onlyPillar && pillar.id !== onlyPillar) continue;

    const provider = pillar.discovery === "AUTOCOMPLETE" ? autocomplete : trends;
    const queries = planPillarQueries(pillar);

    console.log(`══════════════════════════════════════════════════════════`);
    console.log(`📌 ${pillar.id}  [${pillar.discovery}]  — ${pillar.label}`);
    console.log(`   zapytania (${queries.length}): ${queries.join(" | ")}`);
    console.log(`──────────────────────────────────────────────────────────`);

    const byQuery = new Map<string, number>();
    for (const q of queries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const results = await provider.relatedRising(q, GEO, controller.signal);
        if (results.length === 0) {
          console.log(`   · "${q}" → (brak wyników)`);
        }
        for (const r of results) {
          const key = r.query.toLowerCase();
          if (!byQuery.has(key) || r.value > byQuery.get(key)!) {
            byQuery.set(key, r.value);
          }
        }
      } catch (err) {
        console.log(
          `   ✖ "${q}" → BŁĄD: ${err instanceof Error ? err.message : err}`,
        );
      } finally {
        clearTimeout(timer);
      }
    }

    const ranked = [...byQuery.entries()].sort((a, b) => b[1] - a[1]);
    const clean = ranked.filter(([q]) => isCleanQuery(q));
    const noise = ranked.filter(([q]) => !isCleanQuery(q));

    console.log(
      `\n   🏆 CZYSTE — TOP ${Math.min(TOP_N, clean.length)} z ${clean.length} (po odsiewie ${noise.length} szumu):`,
    );
    clean.slice(0, TOP_N).forEach(([query, value], i) => {
      console.log(`   ${String(i + 1).padStart(2)}. ${query}   (${value})`);
    });
    if (noise.length > 0) {
      console.log(`   🗑️  odsiane (próbka): ${noise.slice(0, 6).map(([q]) => q).join(" | ")}`);
    }
    console.log("");
  }
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
