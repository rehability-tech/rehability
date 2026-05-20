"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight, CircleNotch, Coffee } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import EditorToolbar from "@/app/admin/campy/dodaj/edytor-tresci/_components/lib/EditorToolbar";
import AiGeneratorModal from "@/app/admin/campy/dodaj/_components/AiGeneratorModal";
import BlogBlockBuilder from "./_components/lib/BlogBlockBuilder";
import { useBlogContent } from "./_components/hooks/useBlogContent";
import { useBlogAiGenerator } from "./_components/hooks/useBlogAiGenerator";

function BlogContentEditorContent() {
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");

  const {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    postTitle,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  } = useBlogContent(postId);

  const {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateBlogContent,
  } = useBlogAiGenerator(updateField);

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowFloatingToolbar(window.scrollY > 450);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin mb-4" />
        <p className="text-gray-500 font-montserrat font-medium">Ładowanie treści artykułu...</p>
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
        onSubmit={handleGenerateBlogContent}
        prompt={aiPrompt}
        setPrompt={setAiPrompt}
        description="Opisz temat i cel artykułu. AI wygeneruje kompletną strukturę blokową z treścią."
        placeholder="np. Artykuł o ćwiczeniach na kręgosłup dla kobiet pracujących przy biurku..."
      />

      {/* Pływający pasek postępu AI */}
      <AnimatePresence>
        {aiProgress.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-full shadow-[0_10px_40px_rgba(40,125,136,0.2)] border border-gray-100 px-6 py-3 flex items-center gap-4 min-w-[320px]"
          >
            {aiProgress.phase === "error" ? (
              <div className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold">!</div>
            ) : aiProgress.phase === "done" ? (
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full font-bold">✓</div>
            ) : aiProgress.phase === "ratelimit" ? (
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-500 rounded-full"
              >
                <Coffee size={18} weight="fill" />
              </motion.div>
            ) : (
              <div className="relative w-8 h-8 flex items-center justify-center">
                <CircleNotch size={24} className="text-brand-primary animate-spin" weight="bold" />
              </div>
            )}

            <div className="flex flex-col flex-1">
              <span className={`text-sm font-bold font-jakarta ${aiProgress.phase === "ratelimit" ? "text-orange-600" : "text-[#0B3B4C]"}`}>
                {aiProgress.message}
              </span>
              {aiProgress.phase === "generating" && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(aiProgress.currentBlock / aiProgress.totalBlocks) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-montserrat font-medium whitespace-nowrap">
                    {aiProgress.currentBlock} / {aiProgress.totalBlocks}
                  </span>
                </div>
              )}
              {aiProgress.phase === "ratelimit" && (
                <span className="text-xs text-orange-500 font-montserrat font-bold whitespace-nowrap mt-1">
                  Wznawiam pracę za: {aiProgress.countdown}s
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between">
        <div className="mb-6">
          <h2 className="text-[22px] md:text-[26px] font-jakarta font-bold text-[#0B3B4C]">
            Edytor treści artykułu
          </h2>
          <p className="text-[14px] text-gray-500 font-montserrat mt-1">
            Krok 2/3 · {postTitle && <span className="font-semibold text-[#0B3B4C]">{postTitle}</span>}
            {!postTitle && "Buduj artykuł z gotowych modułów."}
          </p>
        </div>
        <EditorToolbar
          onSave={() => performSave("toolbar")}
          isSaving={savingSource !== null}
          showAutosaveTooltip={showAutosaveTooltip}
          onAiClick={() => setIsAiModalOpen(true)}
          onPreviewClick={() => {}}
          orientation="horizontal"
        />
      </div>

      <div className="flex flex-col gap-8 relative z-0">
        <div className="relative bg-white rounded-[32px] p-2 md:p-4 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: showFloatingToolbar ? 1 : 0, x: showFloatingToolbar ? 0 : 20 }}
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
              onPreviewClick={() => {}}
            />
          </motion.div>

          <BlogBlockBuilder
            blocks={contentData.blocks}
            onChange={(newBlocks) => updateField("blocks", newBlocks)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200">
        <Link href={`/admin/blog/dodaj/dane-podstawowe${postId ? `?id=${postId}` : ""}`}>
          <Button variant="secondary" rightIcon={<CaretLeft size={18} weight="bold" />}>
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

export default function BlogContentEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-[400px]">
          <CircleNotch size={40} className="text-brand-primary animate-spin" />
        </div>
      }
    >
      <BlogContentEditorContent />
    </Suspense>
  );
}
