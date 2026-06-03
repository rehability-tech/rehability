import { PILLARS, type Pillar } from "../seoConfig";

/**
 * Refinacja fraz z autocomplete/trends na potrzeby harmonogramu.
 *
 * Rozdzielamy dwa wyjścia, bo to dwie różne rzeczy:
 *   - KEYWORD (cel SEO) — Google ignoruje wielkość liter i ogonki, więc trzymamy
 *     przyciętą, małą formę (`trimQuery`).
 *   - TYTUŁ (nagłówek dla człowieka) — wymaga ogonków, wielkich liter, zero śmieci
 *     (`toWorkingTitle`). To TYTUŁ ROBOCZY; finalny może dopisać generator AI.
 *
 * Pipeline (każdy krok to czysta funkcja):
 *   1. TRIM      — usuń lata; dla fraz lokalnych utnij wszystko PO nazwie miasta
 *                  (generycznie zabija ulice/nawigację: "...prudnik nfz" -> "...prudnik").
 *   2. NORMALIZE — podmień seed i miasto na kanoniczne z seoConfig (ogonki + Wielkość),
 *                  napraw pozostałe ogonki słownikiem dziedzinowym, zrób kapitalizację.
 */

/**
 * Pula końcówek tytułu roboczego. ROTUJEMY je po indeksie wpisu, żeby
 * harmonogram nie był ścianą identycznych "— kompletny przewodnik".
 * Pusty wariant = sama fraza jako tytuł (czasem najlepiej brzmi).
 */
const TITLE_SUFFIXES = [
  " — kompletny przewodnik",
  " — praktyczny poradnik",
  " — wskazówki eksperta",
  " — o czym warto wiedzieć",
  "",
] as const;

// ── Słowniki ────────────────────────────────────────────────────────────────

/**
 * Mapa „forma-bez-ogonków -> forma kanoniczna" zbudowana AUTOMATYCZNIE z seoConfig.
 * Seedy wracają małą literą (np. "masaz" -> "masaż"), miasta z wielkiej (zachowują
 * oryginalną pisownię, np. "prudnik" -> "Prudnik"). To naprawia większość ogonków
 * i kapitalizacji bez ręcznej listy.
 */
const CANONICAL = buildCanonicalMap();

function buildCanonicalMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const pillar of PILLARS) {
    for (const seed of pillar.seedKeywords) {
      // tylko jednowyrazowe seedy mają sens jako mapa per-słowo
      if (!seed.includes(" ")) {
        map.set(stripDiacritics(seed.toLowerCase()), seed.toLowerCase());
      }
    }
    for (const city of pillar.geoModifiers) {
      map.set(stripDiacritics(city.toLowerCase()), city);
    }
  }
  return map;
}

/**
 * Mały słownik dziedzinowy dla „ogona" frazy (część dodana przez autocomplete,
 * której nie ma w seoConfig). Z natury niekompletny — ROZSZERZAJ wg zwiadu.
 */
const TAIL_DIACRITICS: Record<string, string> = {
  ciazy: "ciąży",
  ciaza: "ciąża",
  cwiczenia: "ćwiczenia",
  kregoslup: "kręgosłup",
  kregoslupa: "kręgosłupa",
  silowy: "siłowy",
  silowa: "siłowa",
  silownia: "siłownia",
  poczatkujacych: "początkujących",
  poczatkujacy: "początkujący",
  zywienie: "żywienie",
  bol: "ból",
  bole: "bóle",
  miesnie: "mięśnie",
  szyja: "szyja",
};

// ── Pipeline ──────────────────────────────────────────────────────────────

/**
 * KROK 1 (TRIM): usuwa lata oraz — dla fraz lokalnych — wszystko po nazwie miasta.
 * Zwraca przyciętą frazę małymi literami (gotowy `keyword`).
 */
export function trimQuery(raw: string, pillar: Pillar): string {
  let words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Strip lat (np. "2026").
  words = words.filter((w) => !/^(19|20)\d{2}$/.test(w));

  // Dla fraz lokalnych: utnij wszystko PO nazwie miasta (ulice, "nfz", oddziały).
  if (pillar.geoModifiers.length > 0) {
    const cities = new Set(
      pillar.geoModifiers.map((g) => stripDiacritics(g.toLowerCase())),
    );
    const cityIdx = words.findIndex((w) => cities.has(stripDiacritics(w)));
    if (cityIdx >= 0) words = words.slice(0, cityIdx + 1);
  }

  // Kolaps powtórzonych fraz: autocomplete/mock potrafią zwrócić
  // "trening w domu w domu" — sprowadzamy do "trening w domu".
  return collapseRepeats(words.join(" ").trim());
}

/**
 * KROK 2 (NORMALIZE → TYTUŁ): z przyciętej frazy buduje czytelny tytuł roboczy.
 *
 * `variant` rotuje końcówkę tytułu (patrz [[TITLE_SUFFIXES]]), by 12 wpisów
 * miesiąca nie kończyło się tym samym "— kompletny przewodnik".
 */
export function toWorkingTitle(
  phrase: string,
  _pillar: Pillar,
  variant = 0,
): string {
  const words = collapseRepeats(phrase.trim())
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";

  const normalized = words.map((w) => {
    const lower = w.toLowerCase();
    const key = stripDiacritics(lower);
    if (CANONICAL.has(key)) return CANONICAL.get(key)!; // seed/miasto z configu
    if (TAIL_DIACRITICS[lower]) return TAIL_DIACRITICS[lower];
    return lower;
  });

  // Kapitalizacja pierwszego słowa (jeśli nie zostało już ustawione jako nazwa własna).
  normalized[0] = normalized[0].charAt(0).toUpperCase() + normalized[0].slice(1);

  const suffix = TITLE_SUFFIXES[variant % TITLE_SUFFIXES.length];
  return normalized.join(" ") + suffix;
}

/**
 * Klucz bazowy tytułu/frazy do deduplikacji — bez ogonków, małe litery, bez
 * końcówki tytułu. Dzięki temu wpisy różniące się TYLKO rotowaną końcówką
 * ("...kompletny przewodnik" vs "...praktyczny poradnik") liczą się jako jeden.
 */
export function titleBaseKey(value: string): string {
  let base = value;
  for (const suffix of TITLE_SUFFIXES) {
    if (suffix && base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return stripDiacritics(collapseRepeats(base.trim()).toLowerCase())
    .replace(/\s+/g, " ")
    .trim();
}

// ── Utils ─────────────────────────────────────────────────────────────────

/**
 * Usuwa bezpośrednio powtórzoną sekwencję 1–3 słów ("w domu w domu" -> "w domu",
 * "dla dla" -> "dla"). Flaga `u` + `\p{L}` poprawnie obejmuje polskie ogonki.
 */
export function collapseRepeats(s: string): string {
  let prev: string;
  let out = s;
  // Pętla, bo jedno przejście nie złapie potrójnych powtórzeń.
  do {
    prev = out;
    out = out.replace(/(\p{L}+(?:\s+\p{L}+){0,2})\s+\1\b/giu, "$1");
  } while (out !== prev);
  return out.replace(/\s+/g, " ").trim();
}

/** Usuwa polskie znaki diakrytyczne (do porównań / kluczy mapy). */
export function stripDiacritics(s: string): string {
  return s
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z");
}
