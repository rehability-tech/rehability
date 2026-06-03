import type { RelatedQuery, TrendsProvider } from "./types";

/**
 * Provider oparty o Google Autocomplete (przez SerpApi, `engine=google_autocomplete`).
 *
 * PO CO: dla fraz HIPERLOKALNYCH (np. "fizjoterapia prudnik") Google Trends nie
 * ma danych — wolumen jest za mały i API zwraca "hasn't returned any results".
 * Autocomplete natomiast oddaje realne podpowiedzi, które ludzie faktycznie
 * wpisują w okolicy (np. "fizjoterapia prudnik nfz", "masaż kobido prudnik").
 * To jedyne wiarygodne źródło fraz lokalnych dla filaru PHYSIO_LOCAL.
 *
 * Implementuje ten sam kontrakt [[TrendsProvider]] co providery trendowe —
 * `relatedRising` zwraca tu kandydatów wg POPULARNOŚCI podpowiedzi (pozycja 0 =
 * najczęstsza), z malejącą wartością. Dzięki temu generator traktuje oba źródła
 * jednolicie. Naming "relatedRising" jest historyczny (kontrakt współdzielony).
 *
 * Wymagane env:  SERPAPI_API_KEY  (alias: SERPAPI_KEY)
 * Opcjonalne:    TRENDS_HL="pl"   język podpowiedzi
 */
export class AutocompleteProvider implements TrendsProvider {
  readonly name = "serpapi:google_autocomplete";

  private static readonly ENDPOINT = "https://serpapi.com/search.json";

  async relatedRising(
    seed: string,
    geo: string,
    signal?: AbortSignal,
  ): Promise<RelatedQuery[]> {
    if (signal?.aborted) throw new Error("Autocomplete request aborted before start");

    const apiKey = process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error(
        "SERPAPI_API_KEY nie ustawione — nie mogę odpytać Autocomplete.",
      );
    }

    const url = new URL(AutocompleteProvider.ENDPOINT);
    url.searchParams.set("engine", "google_autocomplete");
    url.searchParams.set("q", seed);
    // SerpApi autocomplete używa `gl` (kraj) zamiast `geo`; mapujemy "PL" -> "pl".
    url.searchParams.set("gl", geo.toLowerCase());
    url.searchParams.set("hl", process.env.TRENDS_HL ?? "pl");
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url, { signal, cache: "no-store" });

    if (res.status === 429) throw new Error("SerpApi rate limit (HTTP 429)");
    if (!res.ok) throw new Error(`SerpApi HTTP ${res.status}`);

    const json: AutocompleteResponse = await res.json();
    if (json.error) throw new Error(`SerpApi: ${json.error}`);

    return mapSuggestions(json.suggestions ?? []);
  }
}

interface AutocompleteSuggestion {
  value?: string;
}

interface AutocompleteResponse {
  error?: string;
  suggestions?: AutocompleteSuggestion[];
}

/**
 * Mapuje podpowiedzi na RelatedQuery. Pozycja na liście = popularność, więc
 * wartość maleje wraz z indeksem (pierwsza podpowiedź dostaje najwięcej).
 */
function mapSuggestions(items: AutocompleteSuggestion[]): RelatedQuery[] {
  return items
    .map((item, i) => ({
      query: String(item.value ?? "").trim(),
      value: Math.max(1, 100 - i * 5),
    }))
    .filter((q) => q.query.length > 0);
}
