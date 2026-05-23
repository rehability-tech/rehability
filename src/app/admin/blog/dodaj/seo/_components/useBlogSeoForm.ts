"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { geminiFetch } from "@/lib/gemini/clientRateLimiter";
import {
  truncateSmart,
  scoreSeoLocally,
  type SeoAiAnalysis,
} from "@/lib/seo/utils";

interface PostRaw {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: string;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
}

function buildPostSummary(post: PostRaw): string {
  const contentText =
    typeof post.content === "string"
      ? post.content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000)
      : "";

  return [
    `Tytuł artykułu: ${post.title || ""}`,
    post.slug ? `Slug: ${post.slug}` : "",
    post.excerpt ? `Excerpt: ${post.excerpt}` : "",
    contentText ? `Treść artykułu:\n${contentText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function useBlogSeoForm(postId: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postRaw, setPostRaw] = useState<PostRaw | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const [postStatus, setPostStatus] = useState<string>("DRAFT");
  const [postPublishedAt, setPostPublishedAt] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [genStatusMsg, setGenStatusMsg] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<SeoAiAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const hasAutoRunRef = useRef(false);

  // Auto-flow flag: jeśli wchodzimy z editora z ?autogenerate=true, BlogSeoPage
  // odpala starszą sekwencję NeonAiPanel — wtedy NIE chcemy odpalać auto-analysis
  // równocześnie (kolizja). Po zakończeniu auto-flow page sam wywoła runAnalysis.
  const isAutoFlow = searchParams.get("autogenerate") === "true";

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error();
        const data: PostRaw = await res.json();

        setPostRaw(data);
        setPostTitle(data.title || "");
        setPostSlug(data.slug || "");
        setPostExcerpt(data.excerpt || "");

        setMetaTitle(data.metaTitle ?? truncateSmart(data.title, 60));
        setMetaDescription(
          data.metaDescription ?? truncateSmart(data.excerpt, 160),
        );
        setFocusKeyword(data.focusKeyword || "");
        setOgImage(data.ogImage || data.coverImage || "");
        setCanonicalUrl(data.canonicalUrl || "");
        setNoIndex(data.noIndex ?? false);
        setPostStatus(data.status || "DRAFT");
        setPostPublishedAt(data.publishedAt || null);
      } catch {
        toast.error("Nie udało się załadować danych SEO.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchPost();
  }, [postId]);

  const runAnalysis = useCallback(
    async (overrides?: {
      metaTitle?: string;
      metaDescription?: string;
      focusKeyword?: string;
      ogImage?: string;
      noIndex?: boolean;
    }) => {
      if (!postRaw) return;
      setAnalysisLoading(true);
      setAnalysisError(null);

      const mt = overrides?.metaTitle ?? metaTitle;
      const md = overrides?.metaDescription ?? metaDescription;
      const fk = overrides?.focusKeyword ?? focusKeyword;
      const ogi = overrides?.ogImage ?? ogImage;
      const ni = overrides?.noIndex ?? noIndex;

      const seoSnapshot = [
        `metaTitle (${mt.length}/60): ${mt || "[brak]"}`,
        `metaDescription (${md.length}/160): ${md || "[brak]"}`,
        `focusKeyword: ${fk || "[brak]"}`,
        `ogImage: ${ogi ? "ustawione" : "[brak]"}`,
        `noIndex: ${ni ? "TAK (strona ukryta)" : "nie"}`,
      ].join("\n");

      const prompt = [
        buildPostSummary(postRaw),
        "",
        "Aktualne pola SEO:",
        seoSnapshot,
      ].join("\n");

      try {
        const res = await geminiFetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, action: "analyzeBlogSeo" }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Błąd analizy SEO.");
        }

        const data = (await res.json()) as Partial<SeoAiAnalysis>;
        setAnalysis({
          score: typeof data.score === "number" ? data.score : 0,
          summary: data.summary || "",
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          recommendations: Array.isArray(data.recommendations)
            ? data.recommendations
            : [],
        });
      } catch (err) {
        setAnalysisError(
          err instanceof Error ? err.message : "Nie udało się przeanalizować.",
        );
      } finally {
        setAnalysisLoading(false);
      }
    },
    [postRaw, metaTitle, metaDescription, focusKeyword, ogImage, noIndex],
  );

  // Auto-uruchom analizę przy pierwszym załadowaniu posta — tylko poza auto-flow
  // generacji z editora (tam page sam zarządza analizą po zakończeniu).
  useEffect(() => {
    if (!postRaw || hasAutoRunRef.current || isAutoFlow) return;
    hasAutoRunRef.current = true;
    runAnalysis();
  }, [postRaw, runAnalysis, isAutoFlow]);

  const persistSeo = useCallback(
    async (overrides: {
      metaTitle: string;
      metaDescription: string;
      focusKeyword: string;
    }) => {
      if (!postId) return;
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seo",
          metaTitle: overrides.metaTitle,
          metaDescription: overrides.metaDescription,
          focusKeyword: overrides.focusKeyword,
          ogImage,
          canonicalUrl,
          noIndex,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd zapisu SEO");
      }
    },
    [postId, ogImage, canonicalUrl, noIndex],
  );

  const generateSeo = useCallback(async () => {
    if (!postRaw) {
      toast.error("Dane artykułu jeszcze się ładują.");
      return;
    }

    setIsGenerating(true);
    setGenStatusMsg("Łączenie z AI…");
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: buildPostSummary(postRaw),
            action: "generateBlogSeo",
          }),
        },
        {
          onStatus: (status) => {
            if (status.kind === "waiting") {
              const label =
                status.reason === "ratelimit"
                  ? `Limit Gemini — wznowię za ${status.countdown}s`
                  : `Błąd Gemini — ponawiam (${status.attempt}/${status.maxAttempts}) za ${status.countdown}s`;
              setGenStatusMsg(label);
            } else {
              setGenStatusMsg("AI optymalizuje tytuł i opis dla Google…");
            }
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd generowania SEO.");
      }

      const seo = (await res.json()) as {
        metaTitle?: string;
        metaDescription?: string;
        focusKeyword?: string;
      };

      const nextMetaTitle = seo.metaTitle ?? metaTitle;
      const nextMetaDescription = seo.metaDescription ?? metaDescription;
      const nextFocusKeyword = seo.focusKeyword ?? focusKeyword;

      if (seo.metaTitle) setMetaTitle(seo.metaTitle);
      if (seo.metaDescription) setMetaDescription(seo.metaDescription);
      if (seo.focusKeyword) setFocusKeyword(seo.focusKeyword);

      if (postId) {
        try {
          await persistSeo({
            metaTitle: nextMetaTitle,
            metaDescription: nextMetaDescription,
            focusKeyword: nextFocusKeyword,
          });
          toast.success("Wygenerowano i zapisano dane SEO!");
        } catch (persistErr) {
          toast.error(
            persistErr instanceof Error
              ? `Wygenerowano, ale nie zapisano: ${persistErr.message}`
              : "Wygenerowano, ale zapis się nie udał.",
          );
        }
      } else {
        toast.success("Wygenerowano dane SEO!");
      }

      runAnalysis({
        metaTitle: nextMetaTitle,
        metaDescription: nextMetaDescription,
        focusKeyword: nextFocusKeyword,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się wygenerować.",
      );
    } finally {
      setIsGenerating(false);
      setGenStatusMsg(null);
    }
  }, [
    postRaw,
    postId,
    metaTitle,
    metaDescription,
    focusKeyword,
    persistSeo,
    runAnalysis,
  ]);

  const applyFixes = useCallback(async () => {
    if (!postRaw) {
      toast.error("Dane artykułu jeszcze się ładują.");
      return;
    }
    if (!analysis || analysis.recommendations.length === 0) {
      toast.info("Nie ma rekomendacji do naprawy.");
      return;
    }

    setIsFixing(true);
    try {
      const recsBlock = analysis.recommendations
        .map(
          (r, i) =>
            `${i + 1}. [${r.severity.toUpperCase()}] ${r.title}\n   Wskazówka: ${r.hint}`,
        )
        .join("\n");

      const prompt = [
        buildPostSummary(postRaw),
        "",
        "Aktualne pola SEO:",
        `metaTitle (${metaTitle.length}/60): ${metaTitle || "[brak]"}`,
        `metaDescription (${metaDescription.length}/160): ${metaDescription || "[brak]"}`,
        `focusKeyword: ${focusKeyword || "[brak]"}`,
        "",
        "Rekomendacje do rozwiązania:",
        recsBlock,
      ].join("\n");

      const res = await geminiFetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action: "fixBlogSeo" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd naprawy SEO.");
      }

      const seo = (await res.json()) as {
        metaTitle?: string;
        metaDescription?: string;
        focusKeyword?: string;
      };

      const nextMetaTitle = seo.metaTitle ?? metaTitle;
      const nextMetaDescription = seo.metaDescription ?? metaDescription;
      const nextFocusKeyword = seo.focusKeyword ?? focusKeyword;

      // BRAMKA: liczymy lokalny score PRZED i PO. Jeśli AI nam pogorszyło dane
      // — odrzucamy fix. Niezależnie od kapryśnego scoringu Gemini.
      const hasOg = ogImage.trim().length > 0;
      const before = scoreSeoLocally({
        metaTitle,
        metaDescription,
        focusKeyword,
        hasOgImage: hasOg,
      });
      const after = scoreSeoLocally({
        metaTitle: nextMetaTitle,
        metaDescription: nextMetaDescription,
        focusKeyword: nextFocusKeyword,
        hasOgImage: hasOg,
      });

      if (after.pass < before.pass) {
        toast.error(
          `Naprawa pogorszyłaby wynik (${before.pass}/${before.total} → ${after.pass}/${after.total}). Zachowuję obecne dane.`,
          { duration: 7000 },
        );
        runAnalysis();
        return;
      }

      if (seo.metaTitle) setMetaTitle(seo.metaTitle);
      if (seo.metaDescription) setMetaDescription(seo.metaDescription);
      if (seo.focusKeyword) setFocusKeyword(seo.focusKeyword);

      if (postId) {
        try {
          await persistSeo({
            metaTitle: nextMetaTitle,
            metaDescription: nextMetaDescription,
            focusKeyword: nextFocusKeyword,
          });
          const improvement = after.pass - before.pass;
          toast.success(
            improvement > 0
              ? `Naprawiono! Wynik lokalny ${before.pass}/${before.total} → ${after.pass}/${after.total}.`
              : "Naprawiono i zapisano dane SEO.",
          );
        } catch (persistErr) {
          toast.error(
            persistErr instanceof Error
              ? `Naprawiono, ale nie zapisano: ${persistErr.message}`
              : "Naprawiono, ale zapis się nie udał.",
          );
        }
      } else {
        toast.success("Naprawiono dane SEO!");
      }

      runAnalysis({
        metaTitle: nextMetaTitle,
        metaDescription: nextMetaDescription,
        focusKeyword: nextFocusKeyword,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd naprawy SEO.");
    } finally {
      setIsFixing(false);
    }
  }, [
    postRaw,
    postId,
    analysis,
    metaTitle,
    metaDescription,
    focusKeyword,
    ogImage,
    persistSeo,
    runAnalysis,
  ]);

  const saveSeo = useCallback(
    async (redirect = true) => {
      if (!postId) {
        toast.error("Brak ID posta.");
        return;
      }
      setIsSaving(true);
      try {
        await persistSeo({ metaTitle, metaDescription, focusKeyword });
        toast.success("Dane SEO zapisane!");
        if (redirect) router.push("/admin/blog");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd serwera.");
      } finally {
        setIsSaving(false);
      }
    },
    [postId, metaTitle, metaDescription, focusKeyword, persistSeo, router],
  );

  return {
    postTitle,
    postSlug,
    postExcerpt,
    postStatus,
    postPublishedAt,
    postRaw,

    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    focusKeyword,
    setFocusKeyword,
    ogImage,
    setOgImage,
    canonicalUrl,
    setCanonicalUrl,
    noIndex,
    setNoIndex,

    isFetching,
    isSaving,
    isGenerating,
    isFixing,
    genStatusMsg,

    analysis,
    analysisLoading,
    analysisError,
    runAnalysis,

    generateSeo,
    applyFixes,
    saveSeo,
  };
}
