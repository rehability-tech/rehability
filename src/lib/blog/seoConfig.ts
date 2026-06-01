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
  | "Camp Stories"
  | "Ruch"
  | "Żywienie"
  | "Ogólne";

export interface Pillar {
  id: PillarId;
  /** Czytelna nazwa filaru (do logów / debugowania). */
  label: string;
  /** Zasięg — wpływa na geo-modyfikatory w tytułach (np. "Prudnik"). */
  scope: "LOCAL" | "NATIONAL";
  /** Kategoria bloga, do której trafią posty z tego filaru. */
  category: BlogCategory;
  /** Frazy bazowe wysyłane do API trendów. */
  seedKeywords: string[];
  /** Modyfikatory geo doklejane do tytułów (puste dla zasięgu krajowego). */
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
    category: "Fizjoterapia",
    seedKeywords: ["Fizjoterapia", "Masaż Kobido", "Rwa kulszowa ćwiczenia"],
    geoModifiers: ["Prudnik", "Nysa", "woj. opolskie"],
  },
  {
    id: "HOLISTIC_TRIPS",
    label: "Wyjazdy holistyczne (cała Polska)",
    scope: "NATIONAL",
    category: "Camp Stories",
    seedKeywords: [
      "Wyjazd holistyczny",
      "Wyjazd SPA dla kobiet",
      "Redukcja stresu",
    ],
    geoModifiers: [],
  },
  {
    id: "EDUCATION_VOD",
    label: "Edukacja / VOD (cała Polska)",
    scope: "NATIONAL",
    category: "Ruch",
    seedKeywords: ["Trening siłowy dla kobiet", "Bezpieczny trening w domu"],
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
  // Filar 2 — Wyjazdy holistyczne
  {
    pillar: "HOLISTIC_TRIPS",
    focusKeyword: "wyjazd holistyczny dla kobiet",
    supportingKeywords: ["wellness", "SPA", "regeneracja", "reset"],
  },
  {
    pillar: "HOLISTIC_TRIPS",
    focusKeyword: "jak zredukować stres",
    supportingKeywords: ["redukcja stresu", "wypalenie", "mindfulness"],
  },
  // Filar 3 — Edukacja / VOD
  {
    pillar: "EDUCATION_VOD",
    focusKeyword: "trening siłowy dla początkujących kobiet",
    supportingKeywords: ["trening siłowy", "siłownia", "plan treningowy"],
  },
  {
    pillar: "EDUCATION_VOD",
    focusKeyword: "bezpieczny trening w domu",
    supportingKeywords: ["trening w domu", "ćwiczenia", "bez sprzętu"],
  },
] as const;

/** Szybki dostęp do filaru po id. */
export const PILLAR_BY_ID: Record<PillarId, Pillar> = Object.fromEntries(
  PILLARS.map((p) => [p.id, p]),
) as Record<PillarId, Pillar>;
