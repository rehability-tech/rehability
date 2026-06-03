import type { RelatedQuery } from "./types";

/**
 * Filtr szumu dla kandydatów z Trends/Autocomplete.
 *
 * Realny zwiad pokazał, że surowe wyniki są zanieczyszczone frazami, które NIE
 * nadają się na temat bloga: nawigacyjne/transakcyjne ("olx", "voucher",
 * "opinie"), rozrywkowe ("wiedźmin 2 medytacja"), nazwy obcych marek/konkurencji
 * oraz wulgaryzmy z tekstów piosenek. Ten filtr odrzuca takie frazy, zanim trafią
 * do tytułów wpisów.
 *
 * To HEURYSTYKA, nie magia — ostateczną jakość daje kuracja przez
 * `scripts/discover-keywords.ts`. Listę poniżej swobodnie rozszerzaj o nazwy
 * lokalnej konkurencji, które zobaczysz w zwiadzie.
 */

/** Tokeny dyskwalifikujące frazę (dopasowanie po granicy słowa, case-insensitive). */
const NOISE_TOKENS: readonly string[] = [
  // Transakcyjne / nawigacyjne
  "olx",
  "allegro",
  "opinie",
  "opinia",
  "cena",
  "cennik",
  "voucher",
  "promocja",
  "kontakt",
  "telefon",
  "godziny",
  "dojazd",
  "mapa",
  "sklep",
  "near me",
  // Rozrywka / nie-temat
  "wiedźmin",
  "youtube",
  "tiktok",
  "lidl",
  // Off-target audience — marka jest dla KOBIET (zwiad zwracał m.in. "joga dla dzieci")
  "dzieci",
  "dziecko",
  "mężczyzn",
  "mezczyzn",
  "chłopców",
  "chlopcow",
  // Wulgaryzmy (z tekstów piosenek w trendach)
  "jebać",
  "jebac",
  // Konkurencja / obce marki lokalne (ROZSZERZAJ wg zwiadu)
  "janczar",
  "medicus",
  "szpital",
];

const noiseRegex = new RegExp(
  `(^|\\s)(${NOISE_TOKENS.map(escapeRegExp).join("|")})(\\s|$)`,
  "i",
);

/** Zwraca true, gdy fraza jest „czysta" (nadaje się na temat bloga). */
export function isCleanQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 3) return false;
  // Pojedyncze słowo rzadko jest dobrym, konkretnym tematem.
  if (!q.includes(" ")) return false;
  return !noiseRegex.test(q);
}

/** Odsiewa zaszumione kandydatury z listy RelatedQuery. */
export function filterNoise(queries: RelatedQuery[]): RelatedQuery[] {
  return queries.filter((q) => isCleanQuery(q.query));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
