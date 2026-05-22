"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  CaretLeft, CaretRight, CircleNotch, CheckCircle, Warning,
  MagnifyingGlass, Globe, Eye, EyeSlash, Tag,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "../_components/NeonAiPanel";
import NeonInputGlow from "../_components/NeonInputGlow";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";
import PublishControl from "./_components/PublishControl";

const AUTO_STEPS_DEF: NeonStep[] = [
  { id: "ai",        label: "Generowanie metadanych SEO",  detail: "AI optymalizuje tytuł i opis dla Google..." },
  { id: "title",     label: "Tytuł meta",                  detail: "Wpisuję tytuł zoptymalizowany pod SERP..." },
  { id: "desc",      label: "Opis meta",                   detail: "Tworzę chwytliwy opis..." },
  { id: "keyword",   label: "Słowo kluczowe",              detail: "Dobieram główną frazę..." },
  { id: "save",      label: "Zapis i finalizacja",         detail: "Zapisuję dane SEO..." },
];

type LiveStep = NeonStep & { status: StepStatus };
const makeSteps = (): LiveStep[] => AUTO_STEPS_DEF.map((s) => ({ ...s, status: "pending" }));
type LoadingField = "metaTitle" | "metaDescription" | "focusKeyword" | null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// SERP PREVIEW
// ==========================================
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
  const displayDesc  = metaDescription || "Opis meta artykułu pojawi się tutaj. Opisz krótko co czytelnik znajdzie w artykule.";
  const displayUrl   = `rehability.pl › blog › ${slug || "twoj-artykul"}`;

  const titleLen = metaTitle.length;
  const descLen  = metaDescription.length;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MagnifyingGlass size={16} className="text-gray-400" />
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Podgląd w Google (SERP)
        </span>
      </div>

      <div className="border border-gray-100 rounded-[12px] p-4 bg-gray-50/50">
        {/* Breadcrumb URL */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">R</div>
          <span className="text-[13px] font-montserrat text-gray-600 truncate">{displayUrl}</span>
        </div>

        {/* Meta Title */}
        <h3 className={cn(
          "font-montserrat text-[20px] leading-[130%] mb-1 truncate",
          metaTitle ? "text-[#1a0dab]" : "text-gray-300 italic",
        )}>
          {displayTitle}
        </h3>

        {/* Meta Description */}
        <p className={cn(
          "font-montserrat text-[14px] leading-[160%] line-clamp-2",
          metaDescription ? "text-gray-600" : "text-gray-300 italic",
        )}>
          {displayDesc}
        </p>
      </div>

      {/* Wskaźniki długości */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-montserrat text-gray-500">Tytuł:</span>
          <span className={cn(
            "text-[11px] font-bold font-montserrat",
            titleLen === 0 ? "text-gray-300" : titleLen <= 60 ? "text-emerald-500" : "text-red-500",
          )}>
            {titleLen}/60
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all",
              titleLen === 0 ? "bg-gray-200" : titleLen <= 60 ? "bg-emerald-400" : "bg-red-400",
            )} style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-montserrat text-gray-500">Opis:</span>
          <span className={cn(
            "text-[11px] font-bold font-montserrat",
            descLen === 0 ? "text-gray-300" : descLen <= 160 ? "text-emerald-500" : "text-red-500",
          )}>
            {descLen}/160
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all",
              descLen === 0 ? "bg-gray-200" : descLen <= 160 ? "bg-emerald-400" : "bg-red-400",
            )} style={{ width: `${Math.min((descLen / 160) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SEO CHECKLIST
// ==========================================
interface SeoCheck {
  label: string;
  ok: boolean;
  hint: string;
}

function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct   = Math.round((score / total) * 100);

  const color =
    pct >= 80 ? "text-emerald-500" :
    pct >= 50 ? "text-amber-500"   :
                "text-red-500";

  const bgTrack = pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Analiza SEO
        </span>
        <span className={cn("text-[22px] font-jakarta font-bold", color)}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", bgTrack)} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-col gap-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2.5">
            {check.ok
              ? <CheckCircle size={16} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
              : <Warning     size={16} weight="fill" className="text-amber-500  mt-0.5 shrink-0" />
            }
            <div>
              <span className={cn(
                "text-[13px] font-semibold font-montserrat",
                check.ok ? "text-gray-600" : "text-gray-700",
              )}>
                {check.label}
              </span>
              {!check.ok && (
                <p className="text-[11px] font-montserrat text-gray-400 mt-0.5">{check.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FORMULARZ SEO
// ==========================================
function SeoFormContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const postId       = searchParams.get("id");

  const [postTitle, setPostTitle]   = useState("");
  const [postSlug, setPostSlug]     = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");

  const [metaTitle, setMetaTitle]           = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword]     = useState("");
  const [ogImage, setOgImage]               = useState("");
  const [canonicalUrl, setCanonicalUrl]     = useState("");
  const [noIndex, setNoIndex]               = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);

  const [postStatus, setPostStatus]               = useState<string>("DRAFT");
  const [postPublishedAt, setPostPublishedAt]     = useState<string | null>(null);

  // ── autogenerate state ──
  const [autoSteps, setAutoSteps]         = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [loadingField, setLoadingField]   = useState<LoadingField>(null);
  const [autoLiveMsg, setAutoLiveMsg]     = useState<string | undefined>();
  const autoStarted = useRef(false);

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

  const updateStep = useCallback((id: string, status: StepStatus, detail?: string) => {
    setAutoSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status, ...(detail ? { detail } : {}) } : s,
      ),
    );
  }, []);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setIsFetching(true);
      try {
        const res  = await fetch(`/api/admin/blog/${postId}`);
        const data = await res.json();
        setPostTitle(data.title || "");
        setPostSlug(data.slug || "");
        setPostExcerpt(data.excerpt || "");
        setMetaTitle(data.metaTitle || data.title || "");
        setMetaDescription(data.metaDescription || data.excerpt || "");
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

  // ── autogenerate flow (after coming from editor) ──
  const runAutoGenerate = useCallback(
    async (scheduleId: string, pId: string) => {
      try {
        // 1 – call AI for SEO data
        updateStep("ai", "active");

        const [postRes, scheduleRes] = await Promise.all([
          fetch(`/api/admin/blog/${pId}`),
          fetch(`/api/admin/blog/schedule/${scheduleId}`),
        ]);
        const post  = postRes.ok ? await postRes.json() : {};
        const entry = scheduleRes.ok ? await scheduleRes.json() : { keywords: [] };

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
            body: JSON.stringify({ prompt: seoPrompt, action: "generateBlogSeo" }),
          },
          { onStatus: buildRateStatus("AI optymalizuje tytuł i opis dla Google...") },
        );
        if (!seoRes.ok) throw new Error("Błąd generowania SEO.");
        const seoData = await seoRes.json();
        updateStep("ai", "done");

        // 2 – reveal meta title
        updateStep("title", "active");
        setLoadingField("metaTitle");
        await sleep(450);
        setMetaTitle(seoData.metaTitle || post.title || "");
        await sleep(450);
        setLoadingField(null);
        updateStep("title", "done");

        // 3 – reveal meta description
        updateStep("desc", "active");
        setLoadingField("metaDescription");
        await sleep(450);
        setMetaDescription(seoData.metaDescription || post.excerpt || "");
        await sleep(500);
        setLoadingField(null);
        updateStep("desc", "done");

        // 4 – reveal focus keyword
        updateStep("keyword", "active");
        setLoadingField("focusKeyword");
        await sleep(400);
        setFocusKeyword(seoData.focusKeyword || "");
        await sleep(450);
        setLoadingField(null);
        updateStep("keyword", "done");

        // 5 – save
        updateStep("save", "active");
        const saveRes = await fetch(`/api/admin/blog/${pId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:          "seo",
            metaTitle:       seoData.metaTitle       || post.title    || "",
            metaDescription: seoData.metaDescription || post.excerpt  || "",
            focusKeyword:    seoData.focusKeyword     || "",
            noIndex:         false,
          }),
        });
        if (!saveRes.ok) throw new Error("Błąd zapisu SEO.");
        updateStep("save", "done");

        toast.success("Artykuł gotowy! Możesz dopieścić SEO lub opublikować.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Nieznany błąd generowania SEO.";
        setLoadingField(null);
        setAutoSteps((prev) =>
          prev.map((s) =>
            s.status === "active" ? { ...s, status: "error", detail: msg } : s,
          ),
        );
      }
    },
    [updateStep],
  );

  useEffect(() => {
    if (autoStarted.current) return;
    if (isFetching || !postId) return;
    const autoGenParam = searchParams.get("autogenerate");
    const scheduleId   = searchParams.get("scheduleId");
    if (autoGenParam !== "true" || !scheduleId) return;

    autoStarted.current = true;
    router.replace(`/admin/blog/dodaj/seo?id=${postId}`);
    setAutoSteps(makeSteps());
    setIsAutoRunning(true);
    runAutoGenerate(scheduleId, postId);
  }, [isFetching, postId, searchParams, router, runAutoGenerate]);

  // ── Checklist logika ──
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
      ok: focusKeyword.length > 0 && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()),
      hint: "Umieść słowo kluczowe w meta tytule.",
    },
    {
      label: "Słowo kluczowe w meta opisie",
      ok: focusKeyword.length > 0 && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase()),
      hint: "Umieść słowo kluczowe w meta opisie.",
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

  // ── Zapis ──
  const handleSave = async (redirect = true) => {
    if (!postId) { toast.error("Brak ID posta."); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seo",
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
      if (redirect) router.push("/admin/blog");
    } catch (err: any) {
      toast.error(err.message || "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin mb-4" />
        <p className="text-gray-500 font-montserrat font-medium">Ładowanie danych SEO...</p>
      </div>
    );
  }

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

      <div className="mb-6">
        <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">Optymalizacja SEO</h2>
        <p className="text-sm text-gray-500 font-montserrat mt-1">
          Uzupełnij dane, które decydują o widoczności artykułu w wyszukiwarkach.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ── Lewa kolumna: Formularz ── */}
        <div className="flex flex-col gap-6">
          {/* SERP Preview */}
          <SerpPreview metaTitle={metaTitle} metaDescription={metaDescription} slug={postSlug} />

          {/* Meta title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">Meta tytuł</label>
              <span className={cn(
                "text-[11px] font-bold font-montserrat",
                metaTitle.length === 0 ? "text-gray-300" :
                metaTitle.length <= 60  ? "text-emerald-500" : "text-red-500",
              )}>
                {metaTitle.length}/60
              </span>
            </div>
            <div className="relative z-0">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={postTitle || "Główny tytuł SEO artykułu..."}
                disabled={loadingField === "metaTitle"}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
                  loadingField === "metaTitle" && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={loadingField === "metaTitle"} />
            </div>
            <span className="text-xs text-gray-400">Idealnie 50–60 znaków. Pojawia się jako niebieski link w Google.</span>
          </div>

          {/* Meta description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">Meta opis</label>
              <span className={cn(
                "text-[11px] font-bold font-montserrat",
                metaDescription.length === 0 ? "text-gray-300" :
                metaDescription.length <= 160 ? "text-emerald-500" : "text-red-500",
              )}>
                {metaDescription.length}/160
              </span>
            </div>
            <div className="relative z-0">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={postExcerpt || "Krótki opis artykułu wyświetlany w wynikach wyszukiwania..."}
                rows={3}
                disabled={loadingField === "metaDescription"}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-y",
                  loadingField === "metaDescription" && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={loadingField === "metaDescription"} />
            </div>
            <span className="text-xs text-gray-400">Idealnie 120–160 znaków. Pojawia się pod tytułem w Google.</span>
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
                placeholder="np. fizjoterapia kręgosłup"
                disabled={loadingField === "focusKeyword"}
                className={cn(
                  "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
                  loadingField === "focusKeyword" && "opacity-80 text-gray-500",
                )}
              />
              <NeonInputGlow isLoading={loadingField === "focusKeyword"} />
            </div>
            <span className="text-xs text-gray-400">Główna fraza, na którą pozycjonujesz artykuł.</span>
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
            {ogImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ogImage} alt="OG Image preview" className="mt-1 h-[120px] w-full object-cover rounded-[10px] border border-gray-200" />
            )}
            <span className="text-xs text-gray-400">Zdjęcie wyświetlane przy udostępnieniu na Facebook, LinkedIn itd. Zalecane 1200×630 px.</span>
          </div>

          {/* Canonical URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
              Canonical URL <span className="text-gray-400 font-normal">(opcjonalnie)</span>
            </label>
            <input
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://rehability.pl/blog/..."
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
            <span className="text-xs text-gray-400">Zostaw puste, jeśli to oryginalny adres artykułu. Wypełnij tylko przy duplikatach treści.</span>
          </div>

          {/* noIndex */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-[12px]">
            <div className="flex items-center gap-3">
              {noIndex ? <EyeSlash size={20} className="text-red-400 shrink-0" /> : <Eye size={20} className="text-emerald-500 shrink-0" />}
              <div>
                <p className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
                  {noIndex ? "Strona ukryta przed Google (noindex)" : "Strona widoczna w Google"}
                </p>
                <p className="text-[12px] text-gray-400 font-montserrat">
                  {noIndex ? "Robot Google nie zaindeksuje tej strony." : "Strona pojawi się w wynikach wyszukiwania."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNoIndex((p) => !p)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
                noIndex ? "bg-red-400" : "bg-emerald-500",
              )}
            >
              <span className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                noIndex ? "translate-x-1" : "translate-x-7",
              )} />
            </button>
          </div>
        </div>

        {/* ── Prawa kolumna: Checklist ── */}
        <div className="xl:sticky xl:top-6 h-fit">
          <SeoChecklist checks={seoChecks} />

          {/* Quick fill */}
          <div className="mt-4 bg-white border border-gray-200 rounded-[16px] p-4 shadow-sm">
            <p className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider mb-3">
              Autouzupełnienie
            </p>
            <button
              type="button"
              onClick={() => {
                if (!metaTitle && postTitle)       setMetaTitle(postTitle.slice(0, 60));
                if (!metaDescription && postExcerpt) setMetaDescription(postExcerpt.slice(0, 160));
              }}
              className="w-full text-sm font-semibold font-montserrat text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 py-2.5 rounded-[10px] transition-colors"
            >
              Użyj tytułu i excerpta jako meta
            </button>
          </div>

          {/* Publikacja */}
          {postId && (
            <div className="mt-4">
              <PublishControl
                postId={postId}
                initialStatus={postStatus}
                initialPublishedAt={postPublishedAt}
                onBeforePublish={async () => {
                  // Persist current SEO state before flipping status, so the
                  // live page doesn't ship with stale meta.
                  await handleSave(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nawigacja */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
        <Link
          href={`/admin/blog/dodaj/edytor-tresci${postId ? `?id=${postId}` : ""}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          <CaretLeft size={18} weight="bold" />
          Wstecz
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving || isAutoRunning}
            className="px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Zapisz bez wychodzenia
          </button>
          <Button
            onClick={() => handleSave(true)}
            isLoading={isSaving}
            disabled={isSaving || isAutoRunning}
            rightIcon={<CaretRight size={18} weight="bold" />}
          >
            Zapisz i wróć do listy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BlogSeoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin" /></div>}>
      <SeoFormContent />
    </Suspense>
  );
}
