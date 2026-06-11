"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Importy UI
import EditableHero from "./_components/EditableHero";
import EditorToolbar from "./_components/lib/EditorToolbar";
import TripBlocksBuilder from "./_components/lib/TripBlockBuilder";
import AiGeneratorModal from "../_components/AiGeneratorModal";
import { useTripContent } from "./_components/hooks/useTripContent";
import { useTripAiGenerator } from "./_components/hooks/useTripAiGenerator";
import { useInlineImagePicker } from "@/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useInlineImagePicker";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "@/app/admin/blog/dodaj/_components/NeonAiPanel";

// Helper do formatowania daty
const formatDateRange = (start: any, end: any) => {
  if (!start) return "";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const monthYearOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };

  if (!endDate)
    return startDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      ...monthYearOptions,
    });
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString("pl-PL", monthYearOptions)}`;
  }
  return `${startDate.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("pl-PL", { day: "numeric", ...monthYearOptions })}`;
};

// Buduje kroki agenta z płaskiego stanu aiProgress (planowanie -> treść+zdjęcia).
function buildAiSteps(
  phase: string,
  message: string,
): (NeonStep & { status: StepStatus })[] {
  const blueprint: StepStatus =
    phase === "idle" ? "pending" : phase === "blueprint" ? "active" : "done";
  const content: StepStatus =
    phase === "error"
      ? "error"
      : phase === "idle" || phase === "blueprint"
        ? "pending"
        : phase === "done"
          ? "done"
          : "active"; // generating | ratelimit | images
  return [
    {
      id: "blueprint",
      label: "Planowanie struktury",
      detail: "Architekt AI układa plan strony...",
      status: blueprint,
    },
    {
      id: "content",
      label: "Pisanie treści i dobór zdjęć",
      detail: message || "Copywriter pisze teksty...",
      status: content,
    },
  ];
}

function ContentEditorFormContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  // Wyciągamy logikę z naszych hooków
  const {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    tripTitle,
    campData,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  } = useTripContent(editId);

  // Pół-automatyczny dobór zdjęć (kolejka pickerów) — współdzielony z blogiem.
  const imgPicker = useInlineImagePicker();

  const {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateLandingPage,
  } = useTripAiGenerator(updateField, imgPicker.pickImagesFor);

  // Stan UI dla pływającego paska (to zostaje w komponencie, bo dotyczy tylko widoku)
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowFloatingToolbar(window.scrollY > 450);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePreview = () => window.open(`/oboz/${editId}`, "_blank");

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie treści wyjazdu...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative pb-24"
    >
      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSubmit={handleGenerateLandingPage}
        prompt={aiPrompt}
        setPrompt={setAiPrompt}
      />

      {/* Kolejka pickerów zdjęć — generator zatrzymuje się i prosi o wybór
          grafiki dla bloków, dla których AI nie ma realnego zdjęcia (jak blog). */}
      <BlogCoverPicker
        key={imgPicker.pickerKey}
        isOpen={imgPicker.state.isOpen}
        mandatory
        onSkip={imgPicker.handleSkip}
        onClose={imgPicker.handleSkip}
        onSelect={imgPicker.handleSelect}
        defaultQuery={imgPicker.state.query}
        heading={`Dobierz zdjęcie do treści (${imgPicker.state.index}/${imgPicker.state.total})`}
        subheading={
          imgPicker.state.query
            ? `AI proponuje, by zdjęcie przedstawiało: „${imgPicker.state.query}". Wybierz z Pexels lub wgraj własne — albo pomiń i dodaj później.`
            : "Wybierz pasujące zdjęcie z Pexels lub wgraj własne — albo pomiń i dodaj później."
        }
        uploadEndpoint={`/api/admin/wyjazdy/${editId}/upload`}
      />

      {/* PANEL AGENTA AI (kroki + live info) — identyczny jak na blogu */}
      <AnimatePresence>
        {aiProgress.isVisible && (
          <NeonAiPanel
            title="Agent AI · Edytor treści"
            steps={buildAiSteps(aiProgress.phase, aiProgress.message)}
            liveMessage={
              aiProgress.phase === "ratelimit"
                ? `${aiProgress.message}${
                    aiProgress.countdown
                      ? ` — wznawiam za ${aiProgress.countdown}s`
                      : ""
                  }`
                : aiProgress.message
            }
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between max-[720px]:flex-col max-[720px]:text-center max-[720px]:mb-6">
        <div className="mb-6">
          <h2 className="text-[22px] md:text-[26px] font-jakarta font-bold text-[#0B3B4C]">
            Kreator: Edytor treści wyjazdu
          </h2>
          <p className="text-[14px] text-gray-500 font-montserrat mt-1">
            Krok 2/3. Opowiedz o wyjeździe i zbuduj stronę z przygotowanych
            modułów.
          </p>
        </div>
        <EditorToolbar
          onSave={() => performSave("toolbar")}
          isSaving={savingSource !== null}
          showAutosaveTooltip={showAutosaveTooltip}
          onAiClick={() => setIsAiModalOpen(true)}
          onPreviewClick={handlePreview}
          orientation="horizontal"
        />
      </div>

      <div className="flex flex-col gap-8 relative z-0">
        <EditableHero
          title={tripTitle}
          data={contentData}
          updateField={updateField}
          tripId={editId || ""}
          location={campData?.location || ""}
          price={campData?.price ? campData.price.toString() : ""}
          dateRange={formatDateRange(campData?.startDate, campData?.endDate)}
        />

        <div className="relative bg-white rounded-[32px] p-2 md:p-4 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: showFloatingToolbar ? 1 : 0,
              x: showFloatingToolbar ? 0 : 20,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "absolute top-6 bottom-6 right-6 z-50 pointer-events-none w-10 hidden lg:block",
              !showFloatingToolbar && "invisible",
            )}
          >
            <EditorToolbar
              onSave={() => performSave("toolbar")}
              isSaving={savingSource !== null}
              showAutosaveTooltip={showAutosaveTooltip}
              onAiClick={() => setIsAiModalOpen(true)}
              onPreviewClick={handlePreview}
            />
          </motion.div>

          <TripBlocksBuilder
            blocks={contentData.blocks}
            onChange={(newBlocks) => updateField("blocks", newBlocks)}
            tripId={editId || ""}
            mapUrl={contentData.mapUrl}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200">
        <Link
          href={`/admin/wyjazdy/dodaj/dane-podstawowe${editId ? `?id=${editId}` : ""}`}
        >
          <Button
            variant="secondary"
            rightIcon={<CaretLeft size={18} weight="bold" />}
          >
            Wstecz
          </Button>
        </Link>
        <Button
          onClick={handleSaveAndNext}
          isLoading={savingSource === "bottom"}
          disabled={savingSource !== null}
          rightIcon={<CaretRight size={18} weight="bold" />}
        >
          Zapisz i kontynuuj
        </Button>
      </div>
    </motion.div>
  );
}

export default function ContentEditorStepPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-[400px]">
          <CircleNotch size={40} className="text-brand-primary animate-spin" />
        </div>
      }
    >
      <ContentEditorFormContent />
    </Suspense>
  );
}
