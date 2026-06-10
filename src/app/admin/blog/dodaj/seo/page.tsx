"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  MagnifyingGlass,
  Globe,
  Eye,
  EyeSlash,
  Tag,
  FloppyDisk,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "../_components/NeonAiPanel";
import NeonInputGlow from "../_components/NeonInputGlow";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";
import PublishControl from "./_components/PublishControl";
import GenerateSeoButton from "@/components/admin/seo/GenerateSeoButton";
import OgImageUploadButton from "@/components/admin/seo/OgImageUploadButton";
import {
  keywordOverlap,
  type SeoCheck,
} from "@/lib/seo/utils";
import { useBlogSeoForm } from "./_components/useBlogSeoForm";

const AUTO_STEPS_DEF: NeonStep[] = [
  { id: "ai", label: "Generowanie metadanych SEO", detail: "AI optymalizuje tytuł i opis dla Google..." },
  { id: "title", label: "Tytuł meta", detail: "Wpisuję tytuł zoptymalizowany pod SERP..." },
  { id: "desc", label: "Opis meta", detail: "Tworzę chwytliwy opis..." },
  { id: "keyword", label: "Słowo kluczowe", detail: "Dobieram główną frazę..." },
  { id: "save", label: "Zapis i finalizacja", detail: "Zapisuję dane SEO..." },
];

type LiveStep = NeonStep & { status: StepStatus };
const makeSteps = (): LiveStep[] =>
  AUTO_STEPS_DEF.map((s) => ({ ...s, status: "pending" }));
type LoadingField = "metaTitle" | "metaDescription" | "focusKeyword" | null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function SerpPreview({
  metaTitle,
  metaDescription,
  slug,
}: {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}) {
  const displayTitle = metaTitle || "Tytuł artykułu pojawi się tutaj...";
  const displayDesc =
    metaDescription ||
    "Opis meta artykułu pojawi się tutaj. Opisz krótko co czytelnik znajdzie w artykule.";
  const displayUrl = `rehability.pl › blog › ${slug || "twoj-artykul"}`;
  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MagnifyingGlass size={16} className="text-gray-400" />
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Podgląd w Google (SERP)
        </span>
      </div>

      <div className="border border-gray-100 rounded-[12px] p-4 bg-gray-50/50">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
            R
          </div>
          <span className="text-[13px] font-montserrat text-gray-600 truncate">
            {displayUrl}
          </span>
        </div>
        <h3
          className={cn(
            "font-montserrat text-[20px] leading-[130%] mb-1 truncate",
            metaTitle ? "text-[#1a0dab]" : "text-gray-300 italic",
          )}
        >
          {displayTitle}
        </h3>
        <p
          className={cn(
            "font-montserrat text-[14px] leading-[160%] line-clamp-2",
            metaDescription ? "text-gray-600" : "text-gray-300 italic",
          )}
        >
          {displayDesc}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <CharCounter label="Tytuł" value={titleLen} max={60} />
        <CharCounter label="Opis" value={descLen} max={160} />
      </div>
    </div>
  );
}

function CharCounter({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-montserrat text-gray-500">
        {label}:
      </span>
      <span
        className={cn(
          "text-[11px] font-bold font-montserrat",
          value === 0
            ? "text-gray-300"
            : value <= max
              ? "text-emerald-500"
              : "text-red-500",
        )}
      >
        {value}/{max}
      </span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value === 0
              ? "bg-gray-200"
              : value <= max
                ? "bg-emerald-400"
                : "bg-red-400",
          )}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);
  const color =
    pct >= 80
      ? "text-emerald-500"
      : pct >= 50
        ? "text-amber-500"
        : "text-red-500";
  const bgTrack =
    pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Szybka analiza (reguły)
        </span>
        <span className={cn("text-[22px] font-jakarta font-bold", color)}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            bgTrack,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-col gap-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-1 w-2 h-2 rounded-full shrink-0",
                check.ok ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            <div>
              <span
                className={cn(
                  "text-[13px] font-semibold font-montserrat",
                  check.ok ? "text-gray-600" : "text-gray-700",
                )}
              >
                {check.label}
              </span>
              {!check.ok && (
                <p className="text-[11px] font-montserrat text-gray-400 mt-0.5">
                  {check.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeoFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get("id");

  const {
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
    genStatusMsg,

    generateSeo,
    saveSeo,
  } = useBlogSeoForm(postId);

  // ── autogenerate state (stary flow z editora) ──
  const [autoSteps, setAutoSteps] = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [loadingField, setLoadingField] = useState<LoadingField>(null);
  const [autoLiveMsg, setAutoLiveMsg] = useState<string | undefined>();
  const autoStarted = useRef(false);

  // Globalna flaga "AI pracuje" — dla shimmer/glow na inputach trzymamy razem
  // ręczny Generate i auto-flow per-field reveal.
  const isAiBusy = isGenerating;

  const buildRateStatus =
    (resumeMsg: string) =>
    (status: RateStatus) => {
      if (status.kind === "waiting") {
        const prefix =
          status.reason === "ratelimit"
            ? "⏸ Limit Gemini — wznowię za"
            : `⚠ Błąd Gemini — ponawiam (${status.attempt}/${status.maxAttempts}) za`;
        setAutoLiveMsg(`${prefix} ${status.countdown}s`);
      } else {
        setAutoLiveMsg(resumeMsg);
      }
    };

  const updateStep = useCallback(
    (id: string, status: StepStatus, detail?: string) => {
      setAutoSteps((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, ...(detail ? { detail } : {}) } : s,
        ),
      );
    },
    [],
  );

  // ── stary autogenerate flow (przyjście z editora z ?autogenerate=true) ──
  const runAutoGenerate = useCallback(
    async (scheduleId: string, pId: string) => {
      try {
        updateStep("ai", "active");

        const [postRes, scheduleRes] = await Promise.all([
          fetch(`/api/admin/blog/${pId}`),
          fetch(`/api/admin/blog/schedule/${scheduleId}`),
        ]);
        const post = postRes.ok ? await postRes.json() : {};
        const entry = scheduleRes.ok
          ? await scheduleRes.json()
          : { keywords: [] };

        const seoPrompt = [
          `Tytuł: ${post.title || ""}`,
          `Opis: ${post.excerpt || ""}`,
          `Słowa kluczowe: ${(entry.keywords as string[] | undefined)?.join(", ") || ""}`,
        ].join("\n");

        const seoRes = await geminiFetch(
          "/api/admin/gemini",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: seoPrompt,
              action: "generateBlogSeo",
            }),
          },
          {
            onStatus: buildRateStatus(
              "AI optymalizuje tytuł i opis dla Google...",
            ),
          },
        );
        if (!seoRes.ok) throw new Error("Błąd generowania SEO.");
        const seoData = await seoRes.json();
        updateStep("ai", "done");

        updateStep("title", "active");
        setLoadingField("metaTitle");
        await sleep(450);
        setMetaTitle(seoData.metaTitle || post.title || "");
        await sleep(450);
        setLoadingField(null);
        updateStep("title", "done");

        updateStep("desc", "active");
        setLoadingField("metaDescription");
        await sleep(450);
        setMetaDescription(seoData.metaDescription || post.excerpt || "");
        await sleep(500);
        setLoadingField(null);
        updateStep("desc", "done");

        updateStep("keyword", "active");
        setLoadingField("focusKeyword");
        await sleep(400);
        setFocusKeyword(seoData.focusKeyword || "");
        await sleep(450);
        setLoadingField(null);
        updateStep("keyword", "done");

        updateStep("save", "active");
        const saveRes = await fetch(`/api/admin/blog/${pId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "seo",
            metaTitle: seoData.metaTitle || post.title || "",
            metaDescription: seoData.metaDescription || post.excerpt || "",
            focusKeyword: seoData.focusKeyword || "",
            noIndex: false,
          }),
        });
        if (!saveRes.ok) throw new Error("Błąd zapisu SEO.");
        updateStep("save", "done");

        toast.success("Artykuł gotowy! Możesz dopieścić SEO lub opublikować.");
        // Pokaż chwilę stan "Gotowe", potem zwiń panel agenta i ODBLOKUJ
        // przyciski zapisu (inaczej isAutoRunning zostaje na true na zawsze).
        await sleep(1500);
        setIsAutoRunning(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Nieznany błąd generowania SEO.";
        setLoadingField(null);
        setAutoSteps((prev) =>
          prev.map((s) =>
            s.status === "active" ? { ...s, status: "error", detail: msg } : s,
          ),
        );
      }
    },
    [updateStep, setMetaTitle, setMetaDescription, setFocusKeyword],
  );

  useEffect(() => {
    if (autoStarted.current) return;
    if (isFetching || !postId) return;
    const autoGenParam = searchParams.get("autogenerate");
    const scheduleId = searchParams.get("scheduleId");
    if (autoGenParam !== "true" || !scheduleId) return;

    autoStarted.current = true;
    router.replace(`/admin/blog/dodaj/seo?id=${postId}`);
    setAutoSteps(makeSteps());
    setIsAutoRunning(true);
    runAutoGenerate(scheduleId, postId);
  }, [isFetching, postId, searchParams, router, runAutoGenerate]);

  const seoChecks: SeoCheck[] = [
    {
      label: "Meta tytuł",
      ok: metaTitle.length >= 20 && metaTitle.length <= 60,
      hint: "Zalecana długość: 20–60 znaków.",
    },
    {
      label: "Meta opis",
      ok: metaDescription.length >= 80 && metaDescription.length <= 160,
      hint: "Zalecana długość: 80–160 znaków.",
    },
    {
      label: "Słowo kluczowe",
      ok: focusKeyword.trim().length > 0,
      hint: "Wpisz główne słowo kluczowe artykułu.",
    },
    {
      label: "Słowo kluczowe w meta tytule",
      ok:
        focusKeyword.length > 0 &&
        keywordOverlap(focusKeyword, metaTitle) >= 0.6,
      hint: "Najważniejsze słowa z focus keyword powinny pojawić się w meta tytule.",
    },
    {
      label: "Słowo kluczowe w meta opisie",
      ok:
        focusKeyword.length > 0 &&
        keywordOverlap(focusKeyword, metaDescription) >= 0.7,
      hint: "Najważniejsze słowa z focus keyword powinny pojawić się w meta opisie.",
    },
    {
      label: "OG Image (Social Media)",
      ok: ogImage.trim().length > 0,
      hint: "Zdjęcie dla udostępnień w mediach społecznościowych.",
    },
    {
      label: "Artykuł widoczny (noindex OFF)",
      ok: !noIndex,
      hint: "Strona jest ukryta przed robotami Google.",
    },
  ];

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie danych SEO...
        </p>
      </div>
    );
  }

  // Pole jest w trybie loading albo z auto-flow (per-field reveal), albo z
  // ręcznego Generate/Fix (wszystkie na raz).
  const fieldLoading = (name: LoadingField) =>
    loadingField === name || isAiBusy;

  return (
    <div className="animate-in fade-in duration-500">
      <AnimatePresence>
        {isAutoRunning && (
          <NeonAiPanel
            title="Agent AI · SEO"
            steps={autoSteps}
            onAbort={() => router.push("/admin/blog")}
            liveMessage={autoLiveMsg}
          />
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
            Optymalizacja SEO
          </h2>
          <p className="text-sm text-gray-500 font-montserrat mt-1">
            Uzupełnij dane, które decydują o widoczności artykułu w
            wyszukiwarkach.
          </p>
        </div>

        <GenerateSeoButton
          onClick={generateSeo}
          isGenerating={isGenerating}
          disabled={isFetching || !postRaw || isAutoRunning}
          statusMsg={genStatusMsg}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Lewa kolumna: Formularz */}
        <div className="flex flex-col gap-6">
          <SerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            slug={postSlug}
          />

          {/* Meta title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
                Meta tytuł
              </label>
              <span
                className={cn(
                  "text-[11px] font-bold font-montserrat",
                  metaTitle.length === 0
                    ? "text-gray-300"
                    : metaTitle.length <= 60
                      ? "text-emerald-500"
                      : "text-red-500",
                )}
              >
                {metaTitle.length}/60
              </span>
            </div>
            <div className="relative z-0">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={postTitle || "Główny tytuł SEO artykułu..."}
                disabled={fieldLoading("metaTitle")}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
                  fieldLoading("metaTitle") && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={fieldLoading("metaTitle")} />
            </div>
            <span className="text-xs text-gray-400">
              Idealnie 50–60 znaków. Pojawia się jako niebieski link w Google.
            </span>
          </div>

          {/* Meta description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
                Meta opis
              </label>
              <span
                className={cn(
                  "text-[11px] font-bold font-montserrat",
                  metaDescription.length === 0
                    ? "text-gray-300"
                    : metaDescription.length <= 160
                      ? "text-emerald-500"
                      : "text-red-500",
                )}
              >
                {metaDescription.length}/160
              </span>
            </div>
            <div className="relative z-0">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={
                  postExcerpt ||
                  "Krótki opis artykułu wyświetlany w wynikach wyszukiwania..."
                }
                rows={3}
                disabled={fieldLoading("metaDescription")}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-y",
                  fieldLoading("metaDescription") && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={fieldLoading("metaDescription")} />
            </div>
            <span className="text-xs text-gray-400">
              Idealnie 120–160 znaków. Pojawia się pod tytułem w Google.
            </span>
          </div>

          {/* Focus keyword */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat flex items-center gap-1.5">
              <Tag size={15} />
              Słowo kluczowe (Focus Keyword)
            </label>
            <div className="relative z-0">
              <input
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="np. ćwiczenia na ból kręgosłupa lędźwiowego"
                disabled={fieldLoading("focusKeyword")}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
                  fieldLoading("focusKeyword") && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={fieldLoading("focusKeyword")} />
            </div>
            <span className="text-xs text-gray-400">
              Główna fraza, na którą pozycjonujesz artykuł.
            </span>
          </div>

          {/* OG Image */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat flex items-center gap-1.5">
              <Globe size={15} />
              OG Image (Social Media)
            </label>
            <input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://... lub /images/..."
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
            <OgImageUploadButton onUploaded={setOgImage} />
            {ogImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ogImage}
                alt="OG Image preview"
                className="mt-1 h-[120px] w-full object-cover rounded-[10px] border border-gray-200"
              />
            )}
            <span className="text-xs text-gray-400">
              Zdjęcie wyświetlane przy udostępnieniu na Facebook, LinkedIn itd.
              Zalecane 1200×630 px.
            </span>
          </div>

          {/* Canonical URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
              Canonical URL{" "}
              <span className="text-gray-400 font-normal">(opcjonalnie)</span>
            </label>
            <input
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://rehability.pl/blog/..."
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
            <span className="text-xs text-gray-400">
              Zostaw puste, jeśli to oryginalny adres artykułu. Wypełnij tylko
              przy duplikatach treści.
            </span>
          </div>

          {/* noIndex */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-[12px]">
            <div className="flex items-center gap-3">
              {noIndex ? (
                <EyeSlash size={20} className="text-red-400 shrink-0" />
              ) : (
                <Eye size={20} className="text-emerald-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
                  {noIndex
                    ? "Strona ukryta przed Google (noindex)"
                    : "Strona widoczna w Google"}
                </p>
                <p className="text-[12px] text-gray-400 font-montserrat">
                  {noIndex
                    ? "Robot Google nie zaindeksuje tej strony."
                    : "Strona pojawi się w wynikach wyszukiwania."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!noIndex}
              onClick={() => setNoIndex(!noIndex)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
                noIndex ? "bg-red-400" : "bg-emerald-500",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
                  noIndex ? "translate-x-0.5" : "translate-x-[22px]",
                )}
              />
            </button>
          </div>
        </div>

        {/* Prawa kolumna: checklist regułowy + publikacja */}
        <div className="xl:sticky xl:top-6 h-fit flex flex-col gap-4">
          <SeoChecklist checks={seoChecks} />

          {postId && (
            <PublishControl
              postId={postId}
              initialStatus={postStatus}
              initialPublishedAt={postPublishedAt}
              onBeforePublish={async () => {
                await saveSeo(false);
              }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-6 mt-6 border-t border-gray-100 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          href={`/admin/blog/dodaj/edytor-tresci${postId ? `?id=${postId}` : ""}`}
          className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-bold font-montserrat bg-gray-100 text-gray-600 hover:bg-gray-200 transition sm:w-auto"
        >
          <CaretLeft size={16} weight="bold" />
          Wstecz
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => saveSeo(false)}
            disabled={isSaving || isAutoRunning}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-bold font-montserrat transition sm:w-auto",
              isSaving || isAutoRunning
                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-[#0B3B4C] text-white hover:bg-brand-primary shadow-[0_10px_24px_-12px_rgba(11,59,76,0.55)]",
            )}
          >
            <FloppyDisk size={16} weight="fill" />
            Zapisz bez wychodzenia
          </button>
          <button
            type="button"
            onClick={() => saveSeo(true)}
            disabled={isSaving || isAutoRunning}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-[13px] font-bold font-montserrat transition sm:w-auto",
              isSaving || isAutoRunning
                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-brand-primary text-white hover:bg-[#1E6068] shadow-[0_10px_24px_-12px_rgba(40,125,136,0.55)]",
            )}
          >
            {isSaving ? (
              <CircleNotch size={16} weight="bold" className="animate-spin" />
            ) : (
              <CaretRight size={16} weight="bold" />
            )}
            Zapisz i wróć do listy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogSeoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch
            size={40}
            weight="bold"
            className="text-brand-primary animate-spin"
          />
        </div>
      }
    >
      <SeoFormContent />
    </Suspense>
  );
}
