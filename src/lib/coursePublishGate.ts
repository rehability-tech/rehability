/* ===========================================================================
 *  Bramka publikacji kursu — JEDNO źródło prawdy dla krytycznych danych, bez
 *  których opublikowany kurs nie nadaje się na produkcję.
 *
 *  Używane po stronie serwera w POST /api/admin/kursy oraz PATCH /[id]. Klient
 *  (CourseWizard) liczy te same reguły do blokady przycisku, ale ostateczną
 *  decyzję podejmuje serwer (klienta da się obejść).
 * ========================================================================= */

export type CoursePublishInput = {
  title?: string | null;
  category?: string | null;
  /** Cena w zł. `null`/`undefined` = nie wybrano (blokada). 0 = darmowy (OK). */
  price?: number | null;
  excerpt?: string | null;
  /** Okładka kursu (miniatura). */
  image?: string | null;
  /** Grafika Open Graph (social media). */
  ogImage?: string | null;
  format: "single" | "sections";
  /** Główne wideo (format „single"). */
  video?: string | null;
  /** Program (format „sections") — moduły z lekcjami. */
  modules?: { lessons?: { title?: string | null; video?: string | null }[] }[] | null;
  /** Treść sekcji „O kursie" (bloki). */
  description?: unknown;
  /** FAQ kursu. */
  faq?: unknown;
};

export type CoursePublishMissing = {
  title: boolean;
  category: boolean;
  price: boolean;
  excerpt: boolean;
  image: boolean;
  video: boolean;
  description: boolean;
  faq: boolean;
  ogImage: boolean;
};

const LABELS: Record<keyof CoursePublishMissing, string> = {
  title: "tytuł kursu",
  category: "kategorię",
  price: "cenę",
  excerpt: "krótki opis",
  image: "okładkę kursu",
  video: "wideo",
  description: "treść strony (O kursie)",
  faq: "sekcję FAQ",
  ogImage: "grafikę OG",
};

const isFilled = (s: unknown): boolean =>
  typeof s === "string" && s.trim().length > 0;

/** Czy wszystkie wymagane nagrania są na miejscu (zależnie od formatu). */
function isVideoReady(input: CoursePublishInput): boolean {
  if (input.format === "single") return isFilled(input.video);
  const titled = (input.modules ?? []).flatMap((m) =>
    (m.lessons ?? []).filter((l) => isFilled(l.title)),
  );
  if (titled.length === 0) return false;
  return titled.every((l) => isFilled(l.video));
}

/**
 * Liczy braki krytyczne dla publikacji. `ok` = można publikować.
 * `missing` = mapa pól (true = brakuje). `labels` = lista po polsku do komunikatu.
 */
export function coursePublishBlockers(input: CoursePublishInput): {
  ok: boolean;
  missing: CoursePublishMissing;
  labels: string[];
} {
  const missing: CoursePublishMissing = {
    title: !(isFilled(input.title) && (input.title as string).trim().length >= 3),
    category: !isFilled(input.category),
    price: !(typeof input.price === "number" && Number.isFinite(input.price)),
    excerpt: !isFilled(input.excerpt),
    image: !isFilled(input.image),
    video: !isVideoReady(input),
    description:
      !Array.isArray(input.description) || input.description.length === 0,
    faq: !Array.isArray(input.faq) || input.faq.length === 0,
    ogImage: !isFilled(input.ogImage),
  };

  const labels = (Object.keys(missing) as (keyof CoursePublishMissing)[])
    .filter((k) => missing[k])
    .map((k) => LABELS[k]);

  return { ok: labels.length === 0, missing, labels };
}

/** Wspólny komunikat błędu 400 dla obu tras API. */
export function coursePublishError(labels: string[]) {
  return {
    error: `Aby opublikować kurs, uzupełnij: ${labels.join(", ")}.`,
    code: "MISSING_CRITICAL" as const,
    missing: labels,
  };
}
