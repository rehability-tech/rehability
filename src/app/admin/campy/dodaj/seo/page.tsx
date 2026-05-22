"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  CheckCircle,
  Warning,
  MagnifyingGlass,
  Globe,
  Eye,
  EyeSlash,
  Tag,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { geminiFetch } from "@/lib/gemini/clientRateLimiter";
import CampPublishControl from "./_components/CampPublishControl";

// ==========================================
// SERP PREVIEW
// ==========================================
function SerpPreview({
  metaTitle,
  metaDescription,
  campId,
}: {
  metaTitle: string;
  metaDescription: string;
  campId: string;
}) {
  const displayTitle = metaTitle || "Tytuł wyjazdu pojawi się tutaj...";
  const displayDesc =
    metaDescription ||
    "Opis meta wyjazdu pojawi się tutaj. Opisz krótko gdzie, kiedy i dla kogo jest ten camp.";
  const displayUrl = `rehability.pl › campy › ${campId || "twoj-wyjazd"}`;

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
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-montserrat text-gray-500">
            Tytuł:
          </span>
          <span
            className={cn(
              "text-[11px] font-bold font-montserrat",
              titleLen === 0
                ? "text-gray-300"
                : titleLen <= 60
                  ? "text-emerald-500"
                  : "text-red-500",
            )}
          >
            {titleLen}/60
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                titleLen === 0
                  ? "bg-gray-200"
                  : titleLen <= 60
                    ? "bg-emerald-400"
                    : "bg-red-400",
              )}
              style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-montserrat text-gray-500">
            Opis:
          </span>
          <span
            className={cn(
              "text-[11px] font-bold font-montserrat",
              descLen === 0
                ? "text-gray-300"
                : descLen <= 160
                  ? "text-emerald-500"
                  : "text-red-500",
            )}
          >
            {descLen}/160
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                descLen === 0
                  ? "bg-gray-200"
                  : descLen <= 160
                    ? "bg-emerald-400"
                    : "bg-red-400",
              )}
              style={{ width: `${Math.min((descLen / 160) * 100, 100)}%` }}
            />
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
  const pct = Math.round((score / total) * 100);

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
          Analiza SEO
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
            {check.ok ? (
              <CheckCircle
                size={16}
                weight="fill"
                className="text-emerald-500 mt-0.5 shrink-0"
              />
            ) : (
              <Warning
                size={16}
                weight="fill"
                className="text-amber-500 mt-0.5 shrink-0"
              />
            )}
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

// Skraca tekst do `maxLen` znaków, cięcie po granicy słowa, czyści HTML/whitespace.
// Używamy do fallbacku „description → metaDescription" żeby nie wrzucić 500 znaków
// do pola z twardym limitem 160.
function truncateSmart(input: string | null | undefined, maxLen: number): string {
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

// ==========================================
// FORMULARZ SEO
// ==========================================
function SeoFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campId = searchParams.get("id");

  // Dane bazowe campa do placeholderów / fallbacku
  const [campTitle, setCampTitle] = useState("");
  const [campDescription, setCampDescription] = useState("");
  const [campHeroImage, setCampHeroImage] = useState("");
  // Pełny obiekt campa do generacji AI (potrzebny location/tags/daty itd.)
  const [campRaw, setCampRaw] = useState<any>(null);

  // Pola SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatusMsg, setGenStatusMsg] = useState<string | null>(null);

  const [campStatus, setCampStatus] = useState<string>("DRAFT");

  useEffect(() => {
    if (!campId) {
      toast.error("Brak ID wyjazdu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/campy/dodaj/dane-podstawowe");
      return;
    }

    const fetchCamp = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/campy/${campId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        setCampRaw(data);
        setCampTitle(data.title || "");
        setCampDescription(data.description || "");
        setCampHeroImage(data.heroImage || "");

        // Twarde limity: 60 / 160. Fallback z `title`/`description` musi być
        // przyciety, bo description z bazy potrafi mieć 500+ znaków i wybija
        // licznik na czerwono zaraz po wejściu na stronę.
        setMetaTitle(data.metaTitle ?? truncateSmart(data.title, 60));
        setMetaDescription(
          data.metaDescription ?? truncateSmart(data.description, 160),
        );
        setFocusKeyword(data.focusKeyword || "");
        setOgImage(data.ogImage || data.heroImage || "");
        setCanonicalUrl(data.canonicalUrl || "");
        setNoIndex(data.noIndex ?? false);
        setCampStatus(data.status || "DRAFT");
      } catch {
        toast.error("Nie udało się załadować danych SEO.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCamp();
  }, [campId, router]);

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
      hint: "Wpisz główne słowo kluczowe wyjazdu.",
    },
    {
      label: "Słowo kluczowe w meta tytule",
      ok:
        focusKeyword.length > 0 &&
        metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()),
      hint: "Umieść słowo kluczowe w meta tytule.",
    },
    {
      label: "Słowo kluczowe w meta opisie",
      ok:
        focusKeyword.length > 0 &&
        metaDescription.toLowerCase().includes(focusKeyword.toLowerCase()),
      hint: "Umieść słowo kluczowe w meta opisie.",
    },
    {
      label: "OG Image (Social Media)",
      ok: ogImage.trim().length > 0,
      hint: "Zdjęcie dla udostępnień w mediach społecznościowych.",
    },
    {
      label: "Wyjazd widoczny (noindex OFF)",
      ok: !noIndex,
      hint: "Strona jest ukryta przed robotami Google.",
    },
  ];

  // ── Generowanie SEO przez Gemini ──
  const handleGenerateSeo = async () => {
    if (!campRaw) {
      toast.error("Dane wyjazdu jeszcze się ładują.");
      return;
    }

    // Lokalizacja w bazie jest stringifyowanym JSON-em ({city, name}) — dekodujemy
    let locationLabel = "";
    if (campRaw.location) {
      try {
        const parsed =
          typeof campRaw.location === "string"
            ? JSON.parse(campRaw.location)
            : campRaw.location;
        locationLabel = [parsed.city, parsed.name].filter(Boolean).join(" — ");
      } catch {
        locationLabel = String(campRaw.location);
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

    const promptParts = [
      `Tytuł wyjazdu: ${campRaw.title || ""}`,
      campRaw.subtitle ? `Podtytuł: ${campRaw.subtitle}` : "",
      locationLabel ? `Lokalizacja: ${locationLabel}` : "",
      campRaw.startDate || campRaw.endDate
        ? `Termin: ${fmtDate(campRaw.startDate)} – ${fmtDate(campRaw.endDate)}`
        : "",
      Array.isArray(campRaw.tags) && campRaw.tags.length
        ? `Tagi: ${campRaw.tags.join(", ")}`
        : "",
      campRaw.description ? `Opis: ${campRaw.description}` : "",
    ].filter(Boolean);

    setIsGenerating(true);
    setGenStatusMsg("Łączenie z AI…");
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptParts.join("\n"),
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

      if (seo.metaTitle) setMetaTitle(seo.metaTitle);
      if (seo.metaDescription) setMetaDescription(seo.metaDescription);
      if (seo.focusKeyword) setFocusKeyword(seo.focusKeyword);

      toast.success("Wygenerowano dane SEO!");
    } catch (err: any) {
      toast.error(err.message || "Nie udało się wygenerować danych SEO.");
    } finally {
      setIsGenerating(false);
      setGenStatusMsg(null);
    }
  };

  // ── Zapis ──
  const handleSave = async (redirect = true) => {
    if (!campId) {
      toast.error("Brak ID wyjazdu.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/campy/${campId}/seo`, {
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
      if (redirect) router.push("/admin/campy");
    } catch (err: any) {
      toast.error(err.message || "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
            Optymalizacja SEO
          </h2>
          <p className="text-sm text-gray-500 font-montserrat mt-1">
            Uzupełnij dane, które decydują o widoczności wyjazdu w
            wyszukiwarkach.
          </p>
        </div>

        {/* Akcja AI — prawy górny róg, równa wysokość z tytułem + paragrafem */}
        <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={handleGenerateSeo}
            disabled={isGenerating || isFetching || !campRaw}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold font-montserrat transition shadow-[0_10px_24px_-12px_rgba(40,125,136,0.55)]",
              isGenerating || isFetching || !campRaw
                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-brand-primary text-white hover:bg-[#1E6068]",
            )}
          >
            {isGenerating ? (
              <>
                <CircleNotch size={14} weight="bold" className="animate-spin" />
                Generuję…
              </>
            ) : (
              <>
                <Sparkle size={14} weight="fill" />
                Wygeneruj SEO przez AI
              </>
            )}
          </button>
          {genStatusMsg && (
            <p className="text-[11px] font-montserrat text-gray-500 sm:text-right">
              {genStatusMsg}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ── Lewa kolumna: Formularz ── */}
        <div className="flex flex-col gap-6">
          <SerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            campId={campId || ""}
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
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={campTitle || "Główny tytuł SEO wyjazdu..."}
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
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
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={
                campDescription ||
                "Krótki opis wyjazdu wyświetlany w wynikach wyszukiwania..."
              }
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-y"
            />
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
            <input
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="np. obozy fizjoterapeutyczne kobiety"
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
            <span className="text-xs text-gray-400">
              Główna fraza, na którą pozycjonujesz ten wyjazd.
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
              placeholder="https://rehability.pl/campy/..."
              className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
            />
            <span className="text-xs text-gray-400">
              Zostaw puste, jeśli to oryginalny adres wyjazdu. Wypełnij tylko
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
                    ? "Wyjazd ukryty przed Google (noindex)"
                    : "Wyjazd widoczny w Google"}
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
              onClick={() => setNoIndex((p) => !p)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
                noIndex ? "bg-red-400" : "bg-emerald-500",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                  noIndex ? "translate-x-1" : "translate-x-7",
                )}
              />
            </button>
          </div>
        </div>

        {/* ── Prawa kolumna: Checklist + akcje ── */}
        <div className="xl:sticky xl:top-6 h-fit">
          <SeoChecklist checks={seoChecks} />

          {/* Quick fill (ręczny fallback — bez AI) */}
          <div className="mt-4 bg-white border border-gray-200 rounded-[16px] p-4 shadow-sm">
            <p className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider mb-3">
              Autouzupełnienie
            </p>
            <button
              type="button"
              onClick={() => {
                if (!metaTitle && campTitle)
                  setMetaTitle(truncateSmart(campTitle, 60));
                if (!metaDescription && campDescription)
                  setMetaDescription(truncateSmart(campDescription, 160));
                if (!ogImage && campHeroImage) setOgImage(campHeroImage);
              }}
              className="w-full text-sm font-semibold font-montserrat text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 py-2.5 rounded-[10px] transition-colors"
            >
              Użyj tytułu, opisu i zdjęcia wyjazdu
            </button>
          </div>

          {/* Publikacja */}
          {campId && (
            <div className="mt-4">
              <CampPublishControl
                campId={campId}
                initialStatus={campStatus}
                onBeforePublish={async () => {
                  // Zapisujemy aktualne dane SEO, żeby live'owa strona
                  // nie startowała ze starymi metadanymi.
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
          href={`/admin/campy/dodaj/edytor-tresci${campId ? `?id=${campId}` : ""}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          <CaretLeft size={18} weight="bold" />
          Wstecz
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Zapisz bez wychodzenia
          </button>
          <Button
            onClick={async () => {
              await handleSave(false);
              if (campId)
                router.push(
                  `/admin/campy/dodaj/podsumowanie?id=${campId}`,
                );
            }}
            isLoading={isSaving}
            disabled={isSaving}
            rightIcon={<CaretRight size={18} weight="bold" />}
          >
            Zapisz i przejdź dalej
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CampSeoPage() {
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
