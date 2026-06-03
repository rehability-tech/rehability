import type { RelatedQuery, TrendsProvider } from "./types";

/**
 * Realny provider trendów oparty o SerpApi (https://serpapi.com/).
 *
 * Wykorzystuje silnik `google_trends` z `data_type=RELATED_QUERIES`, który w
 * JEDNYM requeście zwraca dwie listy: `rising` (ROSNĄCE) i `top` (najpopularniejsze).
 *
 * Dlaczego używamy OBU: dla niszowego rynku PL lista `rising` bywa skrajnie uboga
 * lub zaszumiona (potrafi zwrócić 0–1 fraz). Sama w sobie skazywałaby generator
 * na ciągły fallback evergreen. Dlatego `rising` traktujemy priorytetowo (świeży,
 * rosnący popyt — ideał do planowania z wyprzedzeniem), a `top` dokładamy jako
 * uzupełnienie. Sortowanie gwarantuje, że KAŻDA fraza `rising` stoi nad `top`
 * (patrz [[RISING_TIER]]). Oba pochodzą z tego samego requestu — zero dodatkowych
 * kosztów API.
 *
 * Kontrakt [[TrendsProvider]]: przy KAŻDEJ awarii (brak klucza, rate limit,
 * timeout, błąd Google) RZUCAMY błędem — decyzję o fallbacku na frazy evergreen
 * podejmuje orkiestrator (`generateTrendSchedule`), nie provider.
 *
 * Wymagane env:
 *   SERPAPI_API_KEY=...        (alias akceptowany: SERPAPI_KEY)
 * Opcjonalne env:
 *   TRENDS_DATE="today 3-m"    okno czasowe Google Trends (domyślnie ostatnie 90 dni)
 *   TRENDS_HL="pl"             język interfejsu
 *   TRENDS_INCLUDE_TOP="false" wyłącza dokładanie listy `top` (domyślnie włączone)
 */
export class SerpApiTrendsProvider implements TrendsProvider {
  readonly name = "serpapi:google_trends";

  private static readonly ENDPOINT = "https://serpapi.com/search.json";

  async relatedRising(
    seed: string,
    geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]> {
    if (signal?.aborted) throw new Error("Trends request aborted before start");

    const apiKey = process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error(
        "SERPAPI_API_KEY nie ustawione — nie mogę odpytać SerpApi.",
      );
    }

    const url = new URL(SerpApiTrendsProvider.ENDPOINT);
    url.searchParams.set("engine", "google_trends");
    url.searchParams.set("data_type", "RELATED_QUERIES");
    url.searchParams.set("q", seed);
    url.searchParams.set("geo", geo);
    url.searchParams.set("hl", process.env.TRENDS_HL ?? "pl");
    url.searchParams.set("date", process.env.TRENDS_DATE ?? "today 3-m");
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url, { signal, cache: "no-store" });

    // 429 = przekroczony limit planu SerpApi; sygnalizujemy wprost.
    if (res.status === 429) throw new Error("SerpApi rate limit (HTTP 429)");
    if (!res.ok) throw new Error(`SerpApi HTTP ${res.status}`);

    const json: SerpApiTrendsResponse = await res.json();

    // SerpApi zwraca 200 + pole `error`, gdy Google nie oddał wyników dla frazy.
    if (json.error) throw new Error(`SerpApi: ${json.error}`);

    const includeTop = process.env.TRENDS_INCLUDE_TOP !== "false";
    return mapRelatedQueries(json.related_queries, includeTop);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mapowanie odpowiedzi SerpApi -> kontrakt RelatedQuery
// ──────────────────────────────────────────────────────────────────────────

interface SerpApiRisingItem {
  query?: string;
  /** Sformatowana wartość: "+250%" lub "Breakout". */
  value?: string;
  /** Liczbowa wartość wzrostu wyłuskana przez SerpApi (gdy dostępna). */
  extracted_value?: number;
}

interface SerpApiTrendsResponse {
  error?: string;
  related_queries?: {
    rising?: SerpApiRisingItem[];
    top?: SerpApiRisingItem[];
  };
}

/**
 * Stałe "piętro" doliczane do fraz `rising`, aby ZAWSZE sortowały się nad `top`,
 * niezależnie od surowych liczb (rising bywa "+90%", top to skala 0–100).
 * Orkiestrator sortuje malejąco po `value`, więc to gwarantuje priorytet rising.
 */
const RISING_TIER = 1_000_000;

/**
 * Scala `rising` (priorytet) i opcjonalnie `top` w jedną listę RelatedQuery.
 * Filtruje puste frazy i deduplikuje (case-insensitive), zachowując wyższą wartość.
 */
function mapRelatedQueries(
  related: SerpApiTrendsResponse["related_queries"],
  includeTop: boolean,
): RelatedQuery[] {
  const rising = (related?.rising ?? []).map((item) => ({
    query: String(item.query ?? "").trim(),
    value: RISING_TIER + normalizeTrendValue(item.extracted_value, item.value),
  }));

  const top = includeTop
    ? (related?.top ?? []).map((item) => ({
        query: String(item.query ?? "").trim(),
        value: normalizeTrendValue(item.extracted_value, item.value),
      }))
    : [];

  const byQuery = new Map<string, RelatedQuery>();
  for (const q of [...rising, ...top]) {
    if (q.query.length === 0) continue;
    const key = q.query.toLowerCase();
    const prev = byQuery.get(key);
    if (!prev || q.value > prev.value) byQuery.set(key, q);
  }

  return [...byQuery.values()];
}

/**
 * Normalizuje siłę trendu do liczby (większa = silniejszy wzrost).
 * - "Breakout" (skok > 5000%) => maksymalny priorytet,
 * - `extracted_value` SerpApi (np. 250) => użyj wprost,
 * - w ostateczności wyłuskaj cyfry z "+250%".
 */
function normalizeTrendValue(
  extracted: number | undefined,
  formatted: string | undefined,
): number {
  const label = (formatted ?? "").toLowerCase();
  if (label.includes("breakout")) return 100_000;
  if (typeof extracted === "number" && Number.isFinite(extracted)) {
    return extracted;
  }
  const digits = label.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}
