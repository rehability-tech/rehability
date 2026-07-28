"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { geminiFetch } from "@/lib/gemini/clientRateLimiter";
import { truncateSmart, scoreSeoLocally, SeoAiAnalysis } from "./utils";

interface TripRaw {
  title?: string;
  subtitle?: string;
  description?: string;
  heroImage?: string;
  location?: unknown;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  status?: string;
  blocks?: Array<{ type: string; content: unknown }> | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
  allowBringFriend?: boolean | null;
}

function buildTripSummary(trip: TripRaw): string {
  let locationLabel = "";
  if (trip.location) {
    try {
      const parsed =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : (trip.location as { city?: string; name?: string });
      locationLabel = [parsed?.city, parsed?.name].filter(Boolean).join(" — ");
    } catch {
      locationLabel = String(trip.location);
    }
  }

  const fmtDate = (d: unknown) => {
    if (!d) return "";
    try {
      return new Date(d as string).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  // Spłaszczamy bloki ZACHOWUJĄC typ — AI musi widzieć że "heading" to inna ranga
  // SEO niż "paragraph", a faq to gotowe long-tail keywords od użytkowników.
  const blocksText = Array.isArray(trip.blocks)
    ? trip.blocks
        .map((b) => {
          if (!b?.type) return "";
          const c = b.content as Record<string, unknown> | undefined;
          if (!c) return "";

          const stripHtml = (s: unknown) =>
            typeof s === "string" ? s.replace(/<[^>]*>/g, "").trim() : "";

          if (typeof c.text === "string") {
            return `[${b.type}] ${stripHtml(c.text)}`;
          }

          if (Array.isArray(c.items)) {
            const lines = c.items
              .map((it) => {
                if (typeof it === "string") return `- ${stripHtml(it)}`;
                if (!it || typeof it !== "object") return "";
                const obj = it as Record<string, unknown>;
                // FAQ: question/answer. FeaturesGrid: title/description. Pricing: title/price/description.
                const parts = [
                  obj.question,
                  obj.title,
                  obj.name,
                  obj.label,
                  obj.price,
                  obj.answer,
                  obj.description,
                  obj.text,
                ]
                  .map(stripHtml)
                  .filter(Boolean);
                return parts.length ? `- ${parts.join(" — ")}` : "";
              })
              .filter(Boolean)
              .join("\n");
            return lines ? `[${b.type}]\n${lines}` : "";
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 4000)
    : "";

  return [
    `Tytuł wydarzenia: ${trip.title || ""}`,
    trip.subtitle ? `Podtytuł: ${trip.subtitle}` : "",
    locationLabel ? `Lokalizacja: ${locationLabel}` : "",
    trip.startDate || trip.endDate
      ? `Termin: ${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`
      : "",
    Array.isArray(trip.tags) && trip.tags.length
      ? `Tagi: ${trip.tags.join(", ")}`
      : "",
    trip.description ? `Opis: ${trip.description}` : "",
    blocksText ? `Treść bloków:\n${blocksText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function useTripSeoForm(tripId: string | null) {
  const router = useRouter();

  const [tripTitle, setTripTitle] = useState("");
  const [campDescription, setCampDescription] = useState("");
  const [campRaw, setCampRaw] = useState<TripRaw | null>(null);
  const [allowBringFriend, setAllowBringFriend] = useState(false);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [genStatusMsg, setGenStatusMsg] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<SeoAiAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const hasAutoRunRef = useRef(false);

  useEffect(() => {
    if (!tripId) {
      toast.error("Brak ID wydarzenia. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/wydarzenia/dodaj/dane-podstawowe");
      return;
    }

    const fetchCamp = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/wydarzenia/${tripId}`);
        if (!res.ok) throw new Error();
        const data: TripRaw = await res.json();

        setCampRaw(data);
        setTripTitle(data.title || "");
        setCampDescription(data.description || "");
        setAllowBringFriend(!!data.allowBringFriend);

        setMetaTitle(data.metaTitle ?? truncateSmart(data.title, 60));
        setMetaDescription(
          data.metaDescription ?? truncateSmart(data.description, 160),
        );
        setFocusKeyword(data.focusKeyword || "");
        setOgImage(data.ogImage || data.heroImage || "");
        setCanonicalUrl(data.canonicalUrl || "");
        setNoIndex(data.noIndex ?? false);
      } catch {
        toast.error("Nie udało się załadować danych SEO.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCamp();
  }, [tripId, router]);

  // Override pozwala wywołać analizę zaraz po setState, gdy "świeże" wartości
  // jeszcze nie znalazły się w state (np. zaraz po generateSeo).
  const runAnalysis = useCallback(
    async (overrides?: {
      metaTitle?: string;
      metaDescription?: string;
      focusKeyword?: string;
      ogImage?: string;
      noIndex?: boolean;
    }) => {
      if (!campRaw) return;
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
        buildTripSummary(campRaw),
        "",
        "Aktualne pola SEO:",
        seoSnapshot,
      ].join("\n");

      try {
        const res = await geminiFetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, action: "analyzeCampSeo" }),
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
    [campRaw, metaTitle, metaDescription, focusKeyword, ogImage, noIndex],
  );

  // Auto-uruchom analizę przy pierwszym załadowaniu wydarzenia.
  useEffect(() => {
    if (!campRaw || hasAutoRunRef.current) return;
    hasAutoRunRef.current = true;
    runAnalysis();
  }, [campRaw, runAnalysis]);

  const generateSeo = useCallback(async () => {
    if (!campRaw) {
      toast.error("Dane wydarzenia jeszcze się ładują.");
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
            prompt: buildTripSummary(campRaw),
            action: "generateCampSeo",
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

      // Zapis do bazy OD RAZU po generacji — bez tego po F5 wracają stare/puste pola.
      // Wysyłamy wartości z odpowiedzi AI (state nie zdąży się jeszcze zaktualizować).
      if (tripId) {
        try {
          const persistRes = await fetch(`/api/admin/wydarzenia/${tripId}/seo`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              metaTitle: nextMetaTitle,
              metaDescription: nextMetaDescription,
              focusKeyword: nextFocusKeyword,
              ogImage,
              canonicalUrl,
              noIndex,
            }),
          });
          if (!persistRes.ok) {
            const errData = await persistRes.json().catch(() => ({}));
            throw new Error(errData.error || "Błąd zapisu");
          }
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

      // Po wygenerowaniu nowych pól, odśwież analizę OD RAZU — z świeżymi wartościami,
      // bo state setters jeszcze się nie rozpropagowały do closure'a runAnalysis.
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
    campRaw,
    tripId,
    metaTitle,
    metaDescription,
    focusKeyword,
    ogImage,
    canonicalUrl,
    noIndex,
    runAnalysis,
  ]);

  const saveSeo = useCallback(
    async (redirect = true) => {
      if (!tripId) {
        toast.error("Brak ID wydarzenia.");
        return;
      }
      setIsSaving(true);
      try {
        const res = await fetch(`/api/admin/wydarzenia/${tripId}/seo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metaTitle,
            metaDescription,
            focusKeyword,
            ogImage,
            canonicalUrl,
            noIndex,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Błąd zapisu SEO");
        toast.success("Dane SEO zapisane!");
        if (redirect)
          router.push(`/admin/wydarzenia/dodaj/podsumowanie?id=${tripId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd serwera.");
      } finally {
        setIsSaving(false);
      }
    },
    [
      tripId,
      metaTitle,
      metaDescription,
      focusKeyword,
      ogImage,
      canonicalUrl,
      noIndex,
      router,
    ],
  );

  // Bierze aktualną analizę + bieżące pola SEO + treść wydarzenia i prosi AI o wersję,
  // która rozwiązuje WSZYSTKIE rekomendacje. Wynik nadpisuje pola i zapisuje w bazie.
  const applyFixes = useCallback(async () => {
    if (!campRaw) {
      toast.error("Dane wydarzenia jeszcze się ładują.");
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
        buildTripSummary(campRaw),
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
        body: JSON.stringify({ prompt, action: "fixCampSeo" }),
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

      // BRAMKA BEZPIECZEŃSTWA: liczymy lokalny score PRZED i PO. Jeśli AI nam
      // pogorszyło dane (downgrade) — odrzucamy fix i nie ruszamy state'u.
      // To jest niezależne od niezbyt deterministycznego scoringu Gemini.
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
        // Odpalamy mimo to ponowną analizę, żeby user dostał świeżą listę recs
        // dla obecnych (zachowanych) pól — może AI audytora wcześniej "trafił" inaczej.
        runAnalysis();
        return;
      }

      if (seo.metaTitle) setMetaTitle(seo.metaTitle);
      if (seo.metaDescription) setMetaDescription(seo.metaDescription);
      if (seo.focusKeyword) setFocusKeyword(seo.focusKeyword);

      if (tripId) {
        try {
          const persistRes = await fetch(`/api/admin/wydarzenia/${tripId}/seo`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              metaTitle: nextMetaTitle,
              metaDescription: nextMetaDescription,
              focusKeyword: nextFocusKeyword,
              ogImage,
              canonicalUrl,
              noIndex,
            }),
          });
          if (!persistRes.ok) {
            const errData = await persistRes.json().catch(() => ({}));
            throw new Error(errData.error || "Błąd zapisu");
          }
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
    campRaw,
    tripId,
    analysis,
    metaTitle,
    metaDescription,
    focusKeyword,
    ogImage,
    canonicalUrl,
    noIndex,
    runAnalysis,
  ]);

  return {
    tripTitle,
    campDescription,
    campRaw,
    allowBringFriend,

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
