"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  Coffee,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import EditorToolbar from "@/app/admin/wyjazdy/dodaj/edytor-tresci/_components/lib/EditorToolbar";
import AiGeneratorModal from "@/app/admin/wyjazdy/dodaj/_components/AiGeneratorModal";
import BlogBlockBuilder from "./_components/lib/BlogBlockBuilder";
import { useBlogContent } from "./_components/hooks/useBlogContent";
import {
  useBlogAiGenerator,
  type BlogBlock,
} from "./_components/hooks/useBlogAiGenerator";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "../_components/NeonAiPanel";

const AUTO_STEPS_DEF: NeonStep[] = [
  {
    id: "context",
    label: "Wczytywanie kontekstu",
    detail: "Pobieram dane artykułu i temat z harmonogramu...",
  },
  {
    id: "blueprint",
    label: "Planowanie struktury",
    detail: "AI projektuje układ sekcji i bloków...",
  },
  {
    id: "blocks",
    label: "Pisanie treści blok po bloku",
    detail: "AI wypełnia każdy blok osobno...",
  },
  {
    id: "save",
    label: "Zapis i przejście do SEO",
    detail: "Zapisuję artykuł i przechodzę do SEO...",
  },
];

type LiveStep = NeonStep & { status: StepStatus };
const makeSteps = (): LiveStep[] =>
  AUTO_STEPS_DEF.map((s) => ({ ...s, status: "pending" }));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function BlogContentEditorContent() {
  const router = useRouter();
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

  // ── autogenerate state ──
  const [autoSteps, setAutoSteps] = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoLiveMsg, setAutoLiveMsg] = useState<string | undefined>();
  const autoStarted = useRef(false);

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

  useEffect(() => {
    const handleScroll = () => setShowFloatingToolbar(window.scrollY > 450);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── autogenerate orchestrator (block-by-block) ──
  const runAutoGenerate = useCallback(
    async (scheduleId: string, pId: string) => {
      try {
        // 1 – context
        updateStep("context", "active");
        setAutoLiveMsg("Pobieram dane artykułu i temat z harmonogramu...");

        const [postRes, scheduleRes] = await Promise.all([
          fetch(`/api/admin/blog/${pId}`),
          fetch(`/api/admin/blog/schedule/${scheduleId}`),
        ]);
        if (!postRes.ok) throw new Error("Nie udało się pobrać artykułu.");
        if (!scheduleRes.ok) throw new Error("Nie udało się pobrać tematu.");
        const post = await postRes.json();
        const entry = await scheduleRes.json();

        const overallContext = [
          `Tytuł: ${post.title || ""}`,
          `Kategoria: ${post.category || entry.category || ""}`,
          `Opis: ${post.excerpt || ""}`,
          `Temat: ${entry.topic || ""}`,
          `Słowa kluczowe: ${(entry.keywords as string[] | undefined)?.join(", ") || ""}`,
        ].join("\n");
        updateStep("context", "done");

        // 2 – blueprint
        updateStep("blueprint", "active");
        setAutoLiveMsg("AI projektuje układ sekcji i bloków...");

        const blueprintStatus = (resumeMsg: string) => (status: RateStatus) => {
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

        const bpRes = await geminiFetch(
          "/api/admin/gemini",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: overallContext,
              action: "generateBlogBlueprint",
            }),
          },
          {
            onStatus: blueprintStatus("AI projektuje układ sekcji i bloków..."),
          },
        );
        if (!bpRes.ok) throw new Error("Błąd planowania struktury artykułu.");
        const { blueprint } = await bpRes.json();
        if (!Array.isArray(blueprint) || blueprint.length === 0) {
          throw new Error("AI nie zwróciło planu artykułu.");
        }
        updateStep("blueprint", "done");

        // 3 – blocks one by one
        updateStep("blocks", "active");
        let currentBlocks: BlogBlock[] = [];

        for (let i = 0; i < blueprint.length; i++) {
          const step = blueprint[i];
          setAutoLiveMsg(
            `Blok ${i + 1} / ${blueprint.length} · ${step.type} – ${step.topic ?? ""}`,
          );

          // add a pending block to the list (visible with neon shimmer)
          const newBlockId = crypto.randomUUID();
          currentBlocks = [
            ...currentBlocks,
            {
              id: newBlockId,
              type: step.type,
              content: {},
              isGenerating: true,
            },
          ];
          updateField("blocks", currentBlocks);

          // tiny pause so the user sees the new pending block enter
          await sleep(250);

          try {
            const blockResumeMsg = `Blok ${i + 1} / ${blueprint.length} · ${step.type} – ${step.topic ?? ""}`;
            const blockRes = await geminiFetch(
              "/api/admin/gemini",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "generateSingleBlock",
                  prompt: overallContext,
                  overallContext,
                  blockType: step.type,
                  topic: step.topic,
                }),
              },
              { onStatus: blueprintStatus(blockResumeMsg) },
            );
            if (!blockRes.ok) throw new Error("Błąd API");
            let blockContent = await blockRes.json();

            // normalize nested response
            if (
              blockContent.content &&
              typeof blockContent.content === "object" &&
              !Array.isArray(blockContent.content)
            )
              blockContent = blockContent.content;
            if (
              blockContent[step.type] &&
              typeof blockContent[step.type] === "object" &&
              !Array.isArray(blockContent[step.type])
            )
              blockContent = blockContent[step.type];
            if (blockContent.type) delete blockContent.type;
            if (
              ["bulletList", "featuresGrid", "faq"].includes(step.type) &&
              !blockContent.items
            )
              blockContent.items = [];
            if (["heading", "paragraph", "highlight"].includes(step.type)) {
              if (typeof blockContent === "string")
                blockContent = { text: blockContent };
              else if (!blockContent.text)
                blockContent.text =
                  "Treść się nie wygenerowała. Usuń i spróbuj ponownie.";
            }

            currentBlocks = currentBlocks.map((b) =>
              b.id === newBlockId
                ? { ...b, content: blockContent, isGenerating: false }
                : b,
            );
            updateField("blocks", currentBlocks);
          } catch {
            currentBlocks = currentBlocks.map((b) =>
              b.id === newBlockId
                ? {
                    ...b,
                    isGenerating: false,
                    content: {
                      text: "Błąd ładowania bloku. Usuń i spróbuj ponownie.",
                    },
                  }
                : b,
            );
            updateField("blocks", currentBlocks);
          }

          // small breather between blocks so the UI feels paced, not rushed
          await sleep(250);
        }
        updateStep("blocks", "done");

        // 4 – save and forward to SEO
        updateStep("save", "active");
        setAutoLiveMsg("Zapisuję treść i otwieram SEO...");
        const saveRes = await fetch(`/api/admin/blog/${pId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "content", content: currentBlocks }),
        });
        if (!saveRes.ok) throw new Error("Błąd zapisu treści.");
        updateStep("save", "done");

        await sleep(700);
        router.push(
          `/admin/blog/dodaj/seo?id=${pId}&autogenerate=true&scheduleId=${scheduleId}`,
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Nieznany błąd generowania.";
        setAutoLiveMsg(msg);
        setAutoSteps((prev) =>
          prev.map((s) =>
            s.status === "active" ? { ...s, status: "error", detail: msg } : s,
          ),
        );
      }
    },
    [router, updateField, updateStep],
  );

  // ── detect autogenerate param after content is fetched ──
  useEffect(() => {
    if (autoStarted.current) return;
    if (isFetchingData || !postId) return;
    const autoGenParam = searchParams.get("autogenerate");
    const scheduleId = searchParams.get("scheduleId");
    if (autoGenParam !== "true" || !scheduleId) return;

    autoStarted.current = true;
    // strip query so a refresh doesn't replay the flow
    router.replace(`/admin/blog/dodaj/edytor-tresci?id=${postId}`);
    setAutoSteps(makeSteps());
    setIsAutoRunning(true);
    runAutoGenerate(scheduleId, postId);
  }, [isFetchingData, postId, searchParams, router, runAutoGenerate]);

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie treści artykułu...
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
      {/* Floating neon AI panel for autogenerate */}
      <AnimatePresence>
        {isAutoRunning && (
          <NeonAiPanel
            title="Agent AI · Edytor treści"
            steps={autoSteps}
            liveMessage={autoLiveMsg}
            onAbort={() => router.push("/admin/blog")}
          />
        )}
      </AnimatePresence>

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSubmit={handleGenerateBlogContent}
        prompt={aiPrompt}
        setPrompt={setAiPrompt}
        description="Opisz temat i cel artykułu. AI wygeneruje kompletną strukturę blokową z treścią."
        placeholder="np. Artykuł o ćwiczeniach na kręgosłup dla kobiet pracujących przy biurku..."
      />

      {/* Pływający pasek postępu (manual AI z modala) */}
      <AnimatePresence>
        {aiProgress.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-full shadow-[0_10px_40px_rgba(40,125,136,0.2)] border border-gray-100 px-6 py-3 flex items-center gap-4 min-w-[320px]"
          >
            {aiProgress.phase === "error" ? (
              <div className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold">
                !
              </div>
            ) : aiProgress.phase === "done" ? (
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full font-bold">
                ✓
              </div>
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
                <CircleNotch
                  size={24}
                  className="text-brand-primary animate-spin"
                  weight="bold"
                />
              </div>
            )}

            <div className="flex flex-col flex-1">
              <span
                className={`text-sm font-bold font-jakarta ${aiProgress.phase === "ratelimit" ? "text-orange-600" : "text-[#0B3B4C]"}`}
              >
                {aiProgress.message}
              </span>
              {aiProgress.phase === "generating" && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-primary"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${(aiProgress.currentBlock / aiProgress.totalBlocks) * 100}%`,
                      }}
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
            Krok 2/3 ·{" "}
            {postTitle && (
              <span className="font-semibold text-[#0B3B4C]">{postTitle}</span>
            )}
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
              onPreviewClick={() => {}}
            />
          </motion.div>

          {/* Empty placeholder while autogenerate is running and no blocks added yet */}
          {isAutoRunning && contentData.blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(40,125,136,0.35)]"
              >
                <CircleNotch
                  size={26}
                  weight="bold"
                  className="text-brand-primary animate-spin"
                />
              </motion.div>
              <p className="text-[14px] font-montserrat font-semibold text-[#0B3B4C]">
                Agent AI przygotowuje strukturę artykułu...
              </p>
              <p className="text-[12px] font-montserrat text-gray-400 mt-1">
                Bloki pojawią się tutaj jeden po drugim.
              </p>
            </div>
          )}

          <BlogBlockBuilder
            blocks={contentData.blocks}
            onChange={(newBlocks) => updateField("blocks", newBlocks)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200">
        <Link
          href={`/admin/blog/dodaj/dane-podstawowe${postId ? `?id=${postId}` : ""}`}
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
          disabled={savingSource !== null || isAutoRunning}
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
