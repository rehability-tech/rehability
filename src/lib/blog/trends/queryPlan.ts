import type { Pillar } from "../seoConfig";

/**
 * Buduje listę zapytań wysyłanych do właściwego źródła dla danego filaru.
 *
 * - TRENDS:       frazy bazowe 1:1 (np. "Wydarzenie holistyczne").
 * - AUTOCOMPLETE: iloczyn seed × geoModifier, zlowercase'owany, bo tak ludzie
 *   wpisują lokalnie ("fizjoterapia prudnik"). Gdy filar nie ma geoModifierów,
 *   spadamy na same seedy (bezpieczny default).
 *
 * Współdzielony przez `generateTrendSchedule` (generacja) i skrypt zwiadowczy
 * `scripts/discover-keywords.ts` (kuracja seoConfig) — jedno źródło prawdy (DRY).
 */
export function planPillarQueries(pillar: Pillar): string[] {
  if (pillar.discovery !== "AUTOCOMPLETE") return pillar.seedKeywords;

  const queries: string[] = [];
  for (const seed of pillar.seedKeywords) {
    for (const geo of pillar.geoModifiers) {
      queries.push(`${seed} ${geo}`.toLowerCase());
    }
  }
  return queries.length > 0 ? queries : pillar.seedKeywords;
}
