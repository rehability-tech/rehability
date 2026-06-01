import type { RelatedQuery, TrendsProvider } from "./types";

/**
 * Provider pod komercyjne API trendów/SERP (DataForSEO lub SerpApi).
 *
 * Te API są PŁATNE i STABILNE — w przeciwieństwie do `google-trends-api` nie
 * podlegają captcha/rate-limitom w sposób losowy. To docelowy provider na prod.
 *
 * Obecnie zawiera MOCKOWANĄ implementację (deterministyczną), aby:
 *   - kod był uruchamialny i testowalny bez kluczy API,
 *   - kontrakt [[TrendsProvider]] był spełniony 1:1 z realnym wywołaniem.
 *
 * Aby włączyć realne API, odkomentuj sekcję `realFetch` i ustaw zmienne env:
 *   TRENDS_API_PROVIDER=dataforseo | serpapi
 *   TRENDS_API_KEY=...   (lub DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD)
 */
export class ExternalApiTrendsProvider implements TrendsProvider {
  readonly name: string;

  constructor(private readonly vendor: "dataforseo" | "serpapi" = "dataforseo") {
    this.name = `external:${vendor}`;
  }

  async relatedRising(
    seed: string,
    geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]> {
    if (signal?.aborted) throw new Error("Trends request aborted before start");

    // ────────────────────────────────────────────────────────────────────
    // REALNA IMPLEMENTACJA (do odkomentowania po dostarczeniu klucza API).
    //
    // const apiKey = process.env.TRENDS_API_KEY;
    // if (!apiKey) throw new Error("TRENDS_API_KEY nie ustawione");
    //
    // const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live", {
    //   method: "POST",
    //   signal,
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Basic ${apiKey}`,
    //   },
    //   body: JSON.stringify([{ keywords: [seed], location_code: geoToLocationCode(geo), time_range: "past_30_days" }]),
    // });
    // if (res.status === 429) throw new Error("DataForSEO rate limit (429)");
    // if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
    // const json = await res.json();
    // return mapVendorResponse(json); // -> RelatedQuery[]
    // ────────────────────────────────────────────────────────────────────

    // MOCK: deterministyczny, oparty o seed — symuluje "rising related queries".
    return this.mockRelatedRising(seed);
  }

  /**
   * Deterministyczny mock. Generuje wiarygodne frazy long-tail z frazy bazowej,
   * z malejącymi wartościami trendu (pierwsza = najsilniejszy wzrost).
   */
  private mockRelatedRising(seed: string): RelatedQuery[] {
    const lower = seed.toLowerCase();
    const templates = [
      `${lower} w domu`,
      `${lower} dla początkujących`,
      `jak zacząć ${lower}`,
      `${lower} efekty`,
      `${lower} krok po kroku`,
    ];
    return templates.map((query, i) => ({
      query,
      value: 100 - i * 15, // 100, 85, 70, 55, 40
    }));
  }
}
