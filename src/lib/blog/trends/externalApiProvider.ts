import type { RelatedQuery, TrendsProvider } from "./types";
import { collapseRepeats } from "./refineQuery";

/**
 * Deterministyczny MOCK providera trendów — wyłącznie do devu/testów bez klucza.
 *
 * Produkcyjnym, realnym dostawcą jest teraz [[SerpApiTrendsProvider]]. Ten mock
 * zostaje, aby:
 *   - kod był uruchamialny i testowalny bez kluczy API (`TRENDS_PROVIDER=mock`),
 *   - kontrakt [[TrendsProvider]] był spełniony 1:1 z realnym wywołaniem.
 *
 * Zwraca zawsze te same, przewidywalne frazy long-tail — NIE są to realne trendy.
 */
export class ExternalApiTrendsProvider implements TrendsProvider {
  readonly name = "mock:deterministic";

  async relatedRising(
    seed: string,
    _geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]> {
    if (signal?.aborted) throw new Error("Trends request aborted before start");

    // Deterministyczny mock — wiarygodne frazy long-tail z frazy bazowej,
    // z malejącą wartością trendu (pierwsza = najsilniejszy "wzrost").
    const lower = seed.toLowerCase();
    // collapseRepeats chroni przed dubletami, gdy seed sam zawiera modyfikator
    // (np. "trening w domu" + " w domu" -> "trening w domu").
    const templates = [
      `${lower} w domu`,
      `${lower} dla początkujących`,
      `jak zacząć ${lower}`,
      `${lower} efekty`,
      `${lower} krok po kroku`,
    ].map((t) => collapseRepeats(t));
    return templates.map((query, i) => ({
      query,
      value: 100 - i * 15, // 100, 85, 70, 55, 40
    }));
  }
}
