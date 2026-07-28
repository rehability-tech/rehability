// Cała logika SEO przeniesiona do @/lib/seo/utils — re-eksportujemy żeby
// nie psuć importów w istniejących plikach.
export {
  truncateSmart,
  keywordTokens,
  keywordOverlap,
  scoreSeoLocally,
} from "@/lib/seo/utils";
export type {
  SeoCheck,
  LocalSeoScore,
  SeoSeverity,
  SeoRecommendation,
  SeoAiAnalysis,
} from "@/lib/seo/utils";
