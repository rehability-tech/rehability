/**
 * Konfiguracja SEO bloga Rehability Prudnik.
 *
 * Źródło prawdy dla generatora harmonogramu: 3 filary biznesowe, ich seed
 * keywords (zasilają Google Trends / zewnętrzne API), mapowanie filar -> kategoria
 * (kategorie zgodne z resztą aplikacji) oraz lista "evergreen" używana jako
 * FALLBACK, gdy API trendów jest niedostępne / zablokowane (rate limit).
 *
 * Trzymanie tego w jednym miejscu realizuje DRY i Open/Closed — dodanie filaru
 * lub frazy nie wymaga dotykania logiki generatora ani route handlera.
 */

/** Identyfikatory filarów biznesowych marki. */
export type PillarId = "PHYSIO_LOCAL" | "HOLISTIC_TRIPS" | "EDUCATION_VOD";

/** Kategorie bloga — muszą pokrywać się z wartościami używanymi w panelu/froncie. */
export type BlogCategory =
  | "Fizjoterapia"
  | "Terapia"
  | "Mindfulness"
  | "Wydarzenia holistyczne"
  | "Ruch"
  | "Żywienie"
  | "Ogólne";

export interface Pillar {
  id: PillarId;
  /** Czytelna nazwa filaru (do logów / debugowania). */
  label: string;
  /** Zasięg — wpływa na geo-modyfikatory w tytułach (np. "Prudnik"). */
  scope: "LOCAL" | "NATIONAL";
  /**
   * Źródło fraz dla generatora:
   *   - "TRENDS"       Google Trends (top+rising) — dla fraz o dużym wolumenie (krajowe).
   *   - "AUTOCOMPLETE" Google Autocomplete — dla fraz LOKALNYCH, których Trends nie widzi.
   * Kluczowe: dla okolicy Prudnika Trends zwraca pustkę, więc filar lokalny MUSI
   * korzystać z autocomplete (frazy typu "fizjoterapia prudnik nfz").
   */
  discovery: "TRENDS" | "AUTOCOMPLETE";
  /** Kategoria bloga, do której trafią posty z tego filaru. */
  category: BlogCategory;
  /** Frazy bazowe. Dla AUTOCOMPLETE krzyżowane z `geoModifiers` (seed + miasto). */
  seedKeywords: string[];
  /** Modyfikatory geo doklejane do tytułów oraz (dla AUTOCOMPLETE) do zapytań. */
  geoModifiers: string[];
}

/**
 * Definicje 3 filarów. Kolejność jest istotna — generator rozdziela sloty
 * publikacji równomiernie między filary (round-robin), więc pierwszy filar
 * dostaje pierwszy slot miesiąca.
 */
export const PILLARS: readonly Pillar[] = [
  {
    id: "PHYSIO_LOCAL",
    label: "Fizjoterapia lokalna (Prudnik)",
    scope: "LOCAL",
    discovery: "AUTOCOMPLETE",
    category: "Fizjoterapia",
    // Bazy krzyżowane z geoModifiers => "fizjoterapia prudnik", "masaż prudnik"...
    // "woj. opolskie" usunięte — autocomplete zwracał dla niego pustkę (zwiad).
    seedKeywords: ["fizjoterapia", "masaż", "rehabilitacja"],
    geoModifiers: ["Prudnik", "Nysa", "Głuchołazy"],
  },
  {
    id: "HOLISTIC_TRIPS",
    label: "Wydarzenia holistyczne (cała Polska)",
    scope: "NATIONAL",
    // AUTOCOMPLETE z pustymi geoModifiers => seedy odpytywane wprost (krajowo).
    // Trends dla tych fraz zwracał pustkę albo szum (hotele) — patrz zwiad.
    discovery: "AUTOCOMPLETE",
    category: "Wydarzenia holistyczne",
    seedKeywords: [
      "wydarzenie regeneracyjne",
      "wydarzenie weekendowe",
      "wydarzenie ze spa",
      "obóz treningowy",
    ],
    geoModifiers: [],
  },
  {
    id: "EDUCATION_VOD",
    label: "Edukacja / VOD (cała Polska)",
    scope: "NATIONAL",
    discovery: "AUTOCOMPLETE",
    category: "Ruch",
    seedKeywords: ["trening siłowy", "trening w domu", "joga dla"],
    geoModifiers: [],
  },
] as const;

/**
 * Evergreen topics — twardy FALLBACK gdy provider trendów zawiedzie.
 * Każdy wpis jest samowystarczalny (gotowy do publikacji), z przypisaniem do
 * filaru, dzięki czemu kategoria i geo-modyfikatory wynikają z [[PILLARS]].
 */
export interface EvergreenTopic {
  pillar: PillarId;
  /** Główna fraza kluczowa (focus keyword). */
  focusKeyword: string;
  /** Dodatkowe frazy wspierające. */
  supportingKeywords: string[];
}

export const EVERGREEN_TOPICS: readonly EvergreenTopic[] = [
  // Filar 1 — Fizjoterapia lokalna
  {
    pillar: "PHYSIO_LOCAL",
    focusKeyword: "ćwiczenia na ból lędźwi",
    supportingKeywords: ["ból kręgosłupa", "fizjoterapia", "ćwiczenia w domu"],
  },
  {
    pillar: "PHYSIO_LOCAL",
    focusKeyword: "masaż Kobido efekty",
    supportingKeywords: ["masaż twarzy", "lifting", "odmładzanie"],
  },
  {
    pillar: "PHYSIO_LOCAL",
    focusKeyword: "rwa kulszowa leczenie",
    supportingKeywords: ["rwa kulszowa", "ćwiczenia", "ból nogi"],
  },
  // Filar 2 — Wydarzenia holistyczne (frazy potwierdzone w autocomplete)
  {
    pillar: "HOLISTIC_TRIPS",
    focusKeyword: "wydarzenie regeneracyjne na weekend",
    supportingKeywords: ["wellness", "SPA", "regeneracja", "reset"],
  },
  {
    pillar: "HOLISTIC_TRIPS",
    focusKeyword: "wydarzenie weekendowe ze spa w Polsce",
    supportingKeywords: ["wydarzenie weekendowe", "spa", "joga", "relaks"],
  },
  // Filar 3 — Edukacja / VOD (frazy potwierdzone w autocomplete)
  {
    pillar: "EDUCATION_VOD",
    focusKeyword: "trening siłowy w domu dla początkujących",
    supportingKeywords: ["trening siłowy", "plan treningowy", "siłownia"],
  },
  {
    pillar: "EDUCATION_VOD",
    focusKeyword: "trening w domu bez sprzętu",
    supportingKeywords: ["trening w domu", "ćwiczenia", "bez sprzętu"],
  },
] as const;

/** Szybki dostęp do filaru po id. */
export const PILLAR_BY_ID: Record<PillarId, Pillar> = Object.fromEntries(
  PILLARS.map((p) => [p.id, p]),
) as Record<PillarId, Pillar>;
