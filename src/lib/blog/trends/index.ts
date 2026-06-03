import type { TrendsProvider } from "./types";
import { SerpApiTrendsProvider } from "./serpApiProvider";
import { AutocompleteProvider } from "./autocompleteProvider";
import { GoogleTrendsProvider } from "./googleTrendsProvider";
import { ExternalApiTrendsProvider } from "./externalApiProvider";

export type { RelatedQuery, TrendsProvider } from "./types";
export { SerpApiTrendsProvider } from "./serpApiProvider";
export { AutocompleteProvider } from "./autocompleteProvider";
export { GoogleTrendsProvider } from "./googleTrendsProvider";
export { ExternalApiTrendsProvider } from "./externalApiProvider";

/**
 * Fabryka providera trendów (Factory + Strategy).
 *
 * Wybór sterowany env `TRENDS_PROVIDER`:
 *   - "serpapi"  -> SerpApiTrendsProvider (REALNE Google Trends przez SerpApi) [domyślny]
 *   - "google"   -> GoogleTrendsProvider (darmowy, nieoficjalny, zawodny)
 *   - "mock"     -> ExternalApiTrendsProvider (deterministyczny mock do devu bez klucza)
 *
 * Domyślnie "serpapi" — to nasz docelowy, produkcyjny dostawca. Jeśli klucz
 * `SERPAPI_API_KEY` nie jest ustawiony, provider rzuci błędem per fraza, a
 * orkiestrator (`generateTrendSchedule`) automatycznie zejdzie na frazy
 * evergreen — generowanie harmonogramu nigdy się nie wywróci.
 */
export function createTrendsProvider(): TrendsProvider {
  const choice = (process.env.TRENDS_PROVIDER ?? "serpapi").toLowerCase();

  switch (choice) {
    case "google":
      return new GoogleTrendsProvider();
    case "mock":
    case "external":
      return new ExternalApiTrendsProvider();
    case "serpapi":
    default:
      return new SerpApiTrendsProvider();
  }
}

/**
 * Fabryka providera podpowiedzi (Google Autocomplete) — źródło fraz LOKALNYCH,
 * gdy Google Trends nie ma danych przy małym wolumenie.
 *
 * Tryb `mock` zwraca ten sam deterministyczny mock co trendy (dev bez klucza).
 * Dla każdego innego trybu używamy realnego SerpApi Autocomplete — także gdy
 * `TRENDS_PROVIDER=google`, bo biblioteka `google-trends-api` nie ma autocomplete.
 */
export function createAutocompleteProvider(): TrendsProvider {
  const choice = (process.env.TRENDS_PROVIDER ?? "serpapi").toLowerCase();

  if (choice === "mock" || choice === "external") {
    return new ExternalApiTrendsProvider();
  }
  return new AutocompleteProvider();
}
