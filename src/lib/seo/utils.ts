// Wspólne utility SEO używane na stronach SEO campów I bloga. Dwa miejsca
// dzielą tę samą logikę dopasowania słów kluczowych, scoringu i typów rekomendacji,
// żeby nie rozjeżdżały się reguły.

// Skraca tekst do `maxLen` znaków, cięcie po granicy słowa, czyści HTML/whitespace.
// Używamy do fallbacku „description → metaDescription" żeby nie wrzucić 500 znaków
// do pola z twardym limitem 160.
export function truncateSmart(
  input: string | null | undefined,
  maxLen: number,
): string {
  if (!input) return "";
  const clean = String(input)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[\s.,;:!?-]+$/, "").trimEnd();
}

export interface SeoCheck {
  label: string;
  ok: boolean;
  hint: string;
}

// Polskie stopwordy + krótkie słowa nie liczą się jako "kluczowe" tokeny.
// Dzięki temu długi ogon typu "wyjazd regeneracyjny dla kobiet Jarnołówek czerwiec"
// pasuje do tytułu zawierającego "wyjazd Jarnołówek czerwiec" — bo "dla", "i", "w"
// są wszechobecne i ich obecność nic nie znaczy.
const PL_STOPWORDS = new Set([
  "i",
  "w",
  "we",
  "z",
  "ze",
  "dla",
  "na",
  "do",
  "po",
  "u",
  "od",
  "za",
  "o",
  "się",
  "to",
  "ten",
  "ta",
  "te",
  "a",
  "lub",
  "oraz",
  "czy",
  "by",
  "był",
  "była",
  "być",
  "jest",
  "są",
  "lat",
  "rok",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywordTokens(keyword: string): string[] {
  return normalize(keyword)
    .split(" ")
    .filter((t) => t.length > 2 && !PL_STOPWORDS.has(t));
}

// Dla polskich odmian używamy dopasowania po rdzeniu, nie po całym słowie.
// "jarnołówek" w focus keyword vs "jarnołówku" w opisie — bez stem matchu
// .includes() zwraca false i AI dostaje punkt karny mimo że napisał poprawnie.
// Stem = pierwsze N znaków (min 4), np. "jarnołówek"→"jarnoło" pasuje do obu odmian.
function stem(token: string): string {
  if (token.length <= 4) return token; // krótkie tokeny + liczby (2026, mama) zostawiamy
  if (/^\d+$/.test(token)) return token; // czyste liczby — exact match
  return token.slice(0, Math.max(4, Math.floor(token.length * 0.7)));
}

// Zwraca jak duży procent kluczowych tokenów z `keyword` pojawia się w `field`.
// 0 = nic, 1 = wszystkie. Używamy progu w SEO checkliście (np. 0.6 dla tytułu,
// 0.7 dla opisu) zamiast .includes(całość) — bo długi ogon nie zmieści się
// w 60 znakach metaTitle wersji dosłownej.
export function keywordOverlap(keyword: string, field: string): number {
  const tokens = keywordTokens(keyword);
  if (tokens.length === 0) return 0;
  const fieldNorm = normalize(field);
  const hits = tokens.filter((t) => fieldNorm.includes(stem(t))).length;
  return hits / tokens.length;
}

// Lokalny, w pełni deterministyczny scoring SEO. Używamy go jako BRAMKI
// dla AI fixCampSeo / fixBlogSeo — jeśli AI zwróci pola które dają niższy
// lokalny score niż obecne, odrzucamy fix. User nigdy nie widzi downgrade'u.
export interface LocalSeoScore {
  pass: number;
  total: number;
  pct: number;
  failures: string[];
}

const CTA_TOKENS = [
  "zarezerwuj",
  "sprawdz",
  "dolacz",
  "zapisz",
  "zglos",
  "odbierz",
  "przeczytaj",
  "dowiedz",
  "poznaj",
];

const ENGLISH_BLOCKLIST = [
  "wellness",
  "glamping",
  "retreat",
  "slow",
  "mindfulness",
  "detox",
  "coaching",
  "workout",
  "lifestyle",
  "empowerment",
  "storytelling",
];

export function scoreSeoLocally(input: {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  hasOgImage: boolean;
}): LocalSeoScore {
  const { metaTitle, metaDescription, focusKeyword, hasOgImage } = input;
  const checks: { ok: boolean; label: string }[] = [];

  checks.push({ ok: metaTitle.trim().length > 0, label: "metaTitle istnieje" });
  checks.push({
    ok: metaDescription.trim().length > 0,
    label: "metaDescription istnieje",
  });
  checks.push({
    ok: focusKeyword.trim().length > 0,
    label: "focusKeyword istnieje",
  });
  checks.push({ ok: hasOgImage, label: "ogImage ustawione" });

  checks.push({
    ok: metaTitle.length >= 50 && metaTitle.length <= 60,
    label: "metaTitle 50-60 znaków",
  });
  checks.push({
    ok: metaDescription.length >= 130 && metaDescription.length <= 155,
    label: "metaDescription 130-155 znaków",
  });

  const fkWords = focusKeyword.trim().split(/\s+/).filter(Boolean).length;
  checks.push({
    ok: fkWords >= 4 && fkWords <= 7,
    label: "focusKeyword 4-7 słów",
  });

  checks.push({
    ok:
      focusKeyword.length > 0 && keywordOverlap(focusKeyword, metaTitle) >= 0.6,
    label: "focusKeyword w metaTitle (≥60%)",
  });
  checks.push({
    ok:
      focusKeyword.length > 0 &&
      keywordOverlap(focusKeyword, metaDescription) >= 0.7,
    label: "focusKeyword w metaDescription (≥70%)",
  });

  const descNorm = normalize(metaDescription);
  checks.push({
    ok: CTA_TOKENS.some((t) => descNorm.includes(t)),
    label: "CTA w metaDescription",
  });

  const fkNorm = normalize(focusKeyword);
  checks.push({
    ok:
      focusKeyword.length === 0 ||
      !ENGLISH_BLOCKLIST.some((e) => fkNorm.includes(e)),
    label: "focusKeyword bez angielskich słów",
  });

  const pass = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    pass,
    total,
    pct: total === 0 ? 0 : Math.round((pass / total) * 100),
    failures: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

export type SeoSeverity = "critical" | "warning" | "info";

export interface SeoRecommendation {
  severity: SeoSeverity;
  title: string;
  hint: string;
}

export interface SeoAiAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  recommendations: SeoRecommendation[];
}
