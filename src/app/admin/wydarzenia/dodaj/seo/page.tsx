"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  Globe,
  Eye,
  EyeSlash,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import SerpPreview from "./_components/SerpPreview";
import SeoChecklist from "./_components/SeoChecklist";
import SeoInputField from "./_components/SeoInputField";
import GenerateSeoButton from "./_components/GenerateSeoButton";
import OgImageUploadButton from "@/components/admin/seo/OgImageUploadButton";
import OgImageCreatorButton from "@/components/admin/seo/OgImageCreatorButton";
import { useTripSeoForm } from "./_components/useTripSeoForm";
import { keywordOverlap, type SeoCheck } from "./_components/utils";

function SeoFormContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("id");

  const {
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
    genStatusMsg,

    isFixing,
    generateSeo,
    saveSeo,
  } = useTripSeoForm(tripId);

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
      hint: "Wpisz główne słowo kluczowe wydarzenia.",
    },
    {
      label: "Słowo kluczowe w meta tytule",
      // Długi ogon (4-7 słów) nie zmieści się dosłownie w 60 znakach tytułu, więc
      // sprawdzamy ile KLUCZOWYCH tokenów (pomijając stopwordy) z focusKeyword
      // pojawia się w tytule. Próg 60% = realistyczny dla SEO.
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
      label: "Wydarzenie widoczne (noindex OFF)",
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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
            Optymalizacja SEO
          </h2>
          <p className="text-sm text-gray-500 font-montserrat mt-1">
            Uzupełnij dane, które decydują o widoczności wydarzenia w
            wyszukiwarkach.
          </p>
        </div>

        <GenerateSeoButton
          onClick={generateSeo}
          isGenerating={isGenerating}
          disabled={isFetching || !campRaw}
          statusMsg={genStatusMsg}
        />
      </div>

      <div className="max-w-3xl">
        {/* Jedna kolumna: formularz + reguły SEO */}
        <div className="flex flex-col gap-6">
          <SerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            tripId={tripId || ""}
          />

          <SeoInputField
            label="Meta tytuł"
            value={metaTitle}
            onChange={setMetaTitle}
            placeholder={tripTitle || "Główny tytuł SEO wydarzenia..."}
            counter={{ value: metaTitle.length, max: 60 }}
            isLoading={isGenerating || isFixing}
            hint="Idealnie 50–60 znaków. Pojawia się jako niebieski link w Google."
          />

          <SeoInputField
            type="textarea"
            label="Meta opis"
            value={metaDescription}
            onChange={setMetaDescription}
            placeholder={
              campDescription ||
              "Krótki opis wydarzenia wyświetlany w wynikach wyszukiwania..."
            }
            counter={{ value: metaDescription.length, max: 160 }}
            isLoading={isGenerating || isFixing}
            hint="Idealnie 120–160 znaków. Pojawia się pod tytułem w Google."
          />

          <SeoInputField
            label={
              <>
                <Tag size={15} />
                Słowo kluczowe (Focus Keyword)
              </>
            }
            value={focusKeyword}
            onChange={setFocusKeyword}
            placeholder="np. obozy fizjoterapeutyczne karkonosze"
            isLoading={isGenerating || isFixing}
            hint="Główna fraza, na którą pozycjonujesz to wydarzenie."
          />

          <div className="flex flex-col gap-1.5">
            <SeoInputField
              label={
                <>
                  <Globe size={15} />
                  OG Image (Social Media)
                </>
              }
              value={ogImage}
              onChange={setOgImage}
              placeholder="https://... lub /images/..."
              hint="Zdjęcie wyświetlane przy udostępnieniu na Facebook, LinkedIn itd. Zalecane 1200×630 px."
            />
            <div className="flex flex-wrap items-center gap-2">
              <OgImageUploadButton onUploaded={setOgImage} />
              <OgImageCreatorButton
                onApply={setOgImage}
                title={metaTitle || tripTitle}
                category="Wydarzenie"
                image={ogImage}
                subtitle="Wydarzenie · Rehability"
              />
            </div>
            {ogImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ogImage}
                alt="OG Image preview"
                className="mt-1 h-[120px] w-full object-cover rounded-[10px] border border-gray-200"
              />
            )}
          </div>

          <SeoInputField
            label={
              <>
                Canonical URL{" "}
                <span className="text-gray-400 font-normal">
                  (opcjonalnie)
                </span>
              </>
            }
            value={canonicalUrl}
            onChange={setCanonicalUrl}
            placeholder="https://rehability.pl/wydarzenia/..."
            hint="Zostaw puste, jeśli to oryginalny adres wydarzenia. Wypełnij tylko przy duplikatach treści."
          />

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
                    ? "Wydarzenie ukryte przed Google (noindex)"
                    : "Wydarzenie widoczne w Google"}
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

          {/* Reguły SEO — w tej samej kolumnie co inputy */}
          <SeoChecklist checks={seoChecks} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-6 mt-6 border-t border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={
            allowBringFriend
              ? `/admin/wydarzenia/dodaj/zaproszenia${tripId ? `?id=${tripId}` : ""}`
              : `/admin/wydarzenia/dodaj/edytor-tresci${tripId ? `?id=${tripId}` : ""}`
          }
          className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors sm:w-auto"
        >
          <CaretLeft size={18} weight="bold" />
          Wstecz
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => saveSeo(false)}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center px-5 py-3 rounded-[12px] text-gray-500 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 sm:w-auto"
          >
            Zapisz bez wychodzenia
          </button>
          <Button
            onClick={() => saveSeo(true)}
            isLoading={isSaving}
            disabled={isSaving}
            rightIcon={<CaretRight size={18} weight="bold" />}
            className="w-full sm:w-auto"
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
