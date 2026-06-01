import type { TrendsProvider } from "./types";
import { GoogleTrendsProvider } from "./googleTrendsProvider";
import { ExternalApiTrendsProvider } from "./externalApiProvider";

export type { RelatedQuery, TrendsProvider } from "./types";
export { GoogleTrendsProvider } from "./googleTrendsProvider";
export { ExternalApiTrendsProvider } from "./externalApiProvider";

/**
 * Fabryka providera trendów (Factory + Strategy).
 *
 * Wybór sterowany env `TRENDS_PROVIDER`:
 *   - "google"   -> GoogleTrendsProvider (darmowy, zawodny)
 *   - "external" -> ExternalApiTrendsProvider (płatny, stabilny, obecnie mock)
 *   - domyślnie  -> "external" (mock), bo nie wymaga instalacji paczek ani kluczy
 *     i zawsze zwróci dane — generator i tak ma fallback na evergreen.
 */
export function createTrendsProvider(): TrendsProvider {
  const choice = (process.env.TRENDS_PROVIDER ?? "external").toLowerCase();

  switch (choice) {
    case "google":
      return new GoogleTrendsProvider();
    case "serpapi":
      return new ExternalApiTrendsProvider("serpapi");
    case "external":
    case "dataforseo":
    default:
      return new ExternalApiTrendsProvider("dataforseo");
  }
}
