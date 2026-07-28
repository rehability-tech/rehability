# Edytor blokowy bloga — kompletna paczka

Wszystkie pliki edytora treści bloga (`/admin/blog/dodaj/edytor-tresci`) zebrane w jednym miejscu, w kolejności zależności.

> **Uwaga:** edytor bloga nie jest samowystarczalny — 10 z 20 plików leży fizycznie w edytorze **wydarzeń** (`/admin/wydarzenia/dodaj/edytor-tresci`) i jest importowanych przez `BlogBlockEditorCard`. Ta paczka zawiera je wszystkie.

## Spis treści

| # | Plik | Lokalizacja |
|---|---|---|
| **Warstwa strony** |
| 1 | `page.tsx` | blog |
| **Hooki** |
| 2 | `useBlogContent.ts` | blog |
| 3 | `useBlogAiGenerator.ts` | blog |
| 4 | `useInlineImagePicker.ts` | blog |
| 5 | `useBlogUploadImage.ts` | blog |
| **Szkielet edytora** |
| 6 | `BlogBlockBuilder.tsx` | blog |
| 7 | `BlogBlockAdder.tsx` | blog |
| 8 | `BlogBlockEditorCard.tsx` | blog |
| **Bloki własne bloga** |
| 9 | `BlogInlineImageBlock.tsx` | blog |
| 10 | `BlogTableBlock.tsx` | blog |
| **Rdzeń edycji tekstu (współdzielony)** |
| 11 | `RichTextInput.tsx` | wydarzenia |
| **Bloki współdzielone z wydarzenieami** |
| 12 | `HeadingBlock.tsx` | wydarzenia |
| 13 | `ParagraphBlock.tsx` | wydarzenia |
| 14 | `HighlightBlock.tsx` | wydarzenia |
| 15 | `SpacerBlock.tsx` | wydarzenia |
| 16 | `BulletListBlock.tsx` | wydarzenia |
| 17 | `FaqBlock.tsx` | wydarzenia |
| 18 | `DraggableFaqItem.tsx` | wydarzenia |
| 19 | `FeaturesGridBlock.tsx` | wydarzenia |
| 20 | `VideoEmbedBlock.tsx` | wydarzenia |

## Zależności zewnętrzne (nieujęte w paczce)

Biblioteki: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extensions`, `framer-motion`, `@phosphor-icons/react`, `sonner`, `next`.

Moduły projektu:
- `@/lib/utils` → `cn`, `safeUuid`, `isUsableImageUrl`, `focusBlockById`
- `@/lib/gemini/clientRateLimiter` → `geminiFetch`, `RateStatus`
- `@/components/ui/Button`, `@/components/ui/ToolTip`
- `@/app/admin/blog/dodaj/_components/BlogCoverPicker`, `NeonAiPanel`
- `@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/lib/EditorToolbar`
- `@/app/admin/wydarzenia/dodaj/_components/AiGeneratorModal`

API: `/api/admin/blog/[id]`, `/api/admin/blog/schedule/[id]`, `/api/admin/blog/upload`, `/api/admin/gemini`

Renderer frontowy (osobno): `src/app/(site)/blog/[blogSlug]/_components/BlogBlockRenderer.tsx`

---

# 1. page.tsx

`src/app/admin/blog/dodaj/edytor-tresci/page.tsx`

```tsx
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
import { cn, safeUuid, isUsableImageUrl } from "@/lib/utils";

import EditorToolbar from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/lib/EditorToolbar";
import AiGeneratorModal from "@/app/admin/wydarzenia/dodaj/_components/AiGeneratorModal";
import BlogBlockBuilder from "./_components/lib/BlogBlockBuilder";
import { useBlogContent } from "./_components/hooks/useBlogContent";
import {
  useBlogAiGenerator,
  type BlogBlock,
} from "./_components/hooks/useBlogAiGenerator";
import { useInlineImagePicker } from "./_components/hooks/useInlineImagePicker";
import BlogCoverPicker from "../_components/BlogCoverPicker";
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
    id: "images",
    label: "Dobór zdjęć",
    detail: "Wybierz zdjęcia do bloków graficznych...",
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

  // Pół-automatyczny dobór zdjęć (kolejka pickerów Pexels) — współdzielony przez
  // generację ręczną (modal AI) i automatyczną (z harmonogramu).
  const imgPicker = useInlineImagePicker();

  const {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateBlogContent,
  } = useBlogAiGenerator(updateField, imgPicker.pickImagesFor);

  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

  // ── autogenerate state ──
  const [autoSteps, setAutoSteps] = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoLiveMsg, setAutoLiveMsg] = useState<string | undefined>();
  const autoStarted = useRef(false);

  // ── sterowanie agentem: pauza / wznowienie / zamknięcie ──
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false); // odczytywane w pętli (bez re-renderu)
  const cancelledRef = useRef(false); // ustawiane przy zamknięciu agenta

  // Bramka: blokuje pętlę dopóki wstrzymana (lub do zamknięcia agenta).
  const waitWhilePaused = useCallback(async () => {
    while (pausedRef.current && !cancelledRef.current) {
      await sleep(200);
    }
  }, []);

  const handlePause = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
    setAutoLiveMsg("Wstrzymano. Wznów, aby kontynuować, lub zamknij agenta.");
  }, []);

  const handleResume = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
    setAutoLiveMsg("Wznawiam pracę...");
  }, []);

  const handleCloseAgent = useCallback(() => {
    cancelledRef.current = true;
    pausedRef.current = false; // odblokuj bramkę, by pętla mogła wyjść
    setIsPaused(false);
    setIsAutoRunning(false);
  }, []);

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

        // keywords[0] z harmonogramu to nasza GŁÓWNA fraza kluczowa (focus keyword).
        const keywords = (entry.keywords as string[] | undefined) ?? [];
        const focusKeyword = keywords[0] || "";

        const overallContext = [
          `Tytuł: ${post.title || ""}`,
          `Kategoria: ${post.category || entry.category || ""}`,
          `Opis: ${post.excerpt || ""}`,
          `Temat: ${entry.topic || ""}`,
          `Główna fraza kluczowa (focus): ${focusKeyword}`,
          `Pozostałe słowa kluczowe: ${keywords.slice(1).join(", ")}`,
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
              focusKeyword,
            }),
          },
          {
            onStatus: blueprintStatus("AI projektuje układ sekcji i bloków..."),
          },
        );
        if (!bpRes.ok) throw new Error("Błąd planowania struktury artykułu.");
        const { blueprint: rawBlueprint } = await bpRes.json();
        // Odfiltruj bloki wideo — AI nie ma generować osadzonych filmów.
        const blueprint = (
          Array.isArray(rawBlueprint) ? rawBlueprint : []
        ).filter((step: { type?: string }) => step?.type !== "videoEmbed");
        if (blueprint.length === 0) {
          throw new Error("AI nie zwróciło planu artykułu.");
        }
        updateStep("blueprint", "done");

        // 3 – blocks one by one
        updateStep("blocks", "active");
        let currentBlocks: BlogBlock[] = [];

        for (let i = 0; i < blueprint.length; i++) {
          // Uszanuj pauzę i ewentualne zamknięcie agenta na granicy każdego bloku.
          await waitWhilePaused();
          if (cancelledRef.current) return;

          const step = blueprint[i];
          setAutoLiveMsg(
            `Blok ${i + 1} / ${blueprint.length} · ${step.type} – ${step.topic ?? ""}`,
          );

          // add a pending block to the list (visible with neon shimmer)
          const newBlockId = safeUuid();
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
                  action: "generateBlogSingleBlock",
                  prompt: overallContext,
                  overallContext,
                  blockType: step.type,
                  topic: step.topic,
                  focusKeyword,
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
            // AI NIGDY nie podaje realnego zdjęcia — prawdziwy url pochodzi WYŁĄCZNIE
            // z pickera (Pexels/własny upload → nasz blob). Czyścimy cokolwiek AI
            // wpisało (placeholdery, zmyślone domeny typu przyklad.pl), żeby kreator
            // zawsze zatrzymał się i poprosił o wybór grafiki.
            if (step.type === "inlineImage") {
              blockContent.url = "";
              if (typeof blockContent.alt !== "string") blockContent.alt = "";
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

          // Pauza INLINE na bloku zdjęcia: gdy AI nie dało realnego url, otwórz
          // picker OD RAZU (z opisem `alt` jako podpowiedzią, co zdjęcie ma
          // przedstawiać) i wznów pisanie dopiero po wyborze/pominięciu.
          if (
            step.type === "inlineImage" &&
            !isUsableImageUrl(
              currentBlocks.find((b) => b.id === newBlockId)?.content?.url,
            )
          ) {
            updateStep("images", "active");
            setAutoLiveMsg("Czekam, aż wybierzesz zdjęcie do tego miejsca...");
            currentBlocks = await imgPicker.pickImagesFor(
              currentBlocks,
              (bs) => updateField("blocks", bs),
              newBlockId,
            );
            setAutoLiveMsg("Zdjęcie dodane — wznawiam pisanie...");
          }

          // small breather between blocks so the UI feels paced, not rushed
          await sleep(250);
        }
        updateStep("blocks", "done");
        updateStep("images", "done");

        if (cancelledRef.current) return;

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
    [router, updateField, updateStep, imgPicker.pickImagesFor, waitWhilePaused],
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
    // świeży stan sterowania agentem dla nowego przebiegu
    cancelledRef.current = false;
    pausedRef.current = false;
    setIsPaused(false);
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
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onClose={handleCloseAgent}
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

      {/* Pół-automatyczny dobór zdjęć — kolejka pickerów po generacji treści.
          `key` wymusza świeże wyszukiwanie dla każdego kolejnego zdjęcia. */}
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
            ? `AI proponuje, by zdjęcie przedstawiało: „${imgPicker.state.query}". Wybierz pasujące z Pexels lub wgraj własne — albo pomiń i dodaj później.`
            : "Wybierz pasujące zdjęcie z Pexels lub wgraj własne — albo pomiń i dodaj później."
        }
      />

      {/* Pływający pasek postępu (manual AI z modala) */}
      <AnimatePresence>
        {aiProgress.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed top-[72px] sm:top-auto sm:bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-white rounded-full shadow-[0_10px_40px_rgba(40,125,136,0.2)] border border-gray-100 px-5 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 w-[calc(100vw-1.5rem)] max-w-[360px] sm:w-auto sm:min-w-[320px]"
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

      <div className="flex flex-col items-start gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-[20px] sm:text-[22px] md:text-[26px] font-jakarta font-bold text-[#0B3B4C] leading-tight">
            Edytor treści artykułu
          </h2>
          <p className="text-[13px] sm:text-[14px] text-gray-500 font-montserrat mt-1">
            Krok 2/3 ·{" "}
            {postTitle && (
              <span className="font-semibold text-[#0B3B4C]">{postTitle}</span>
            )}
            {!postTitle && "Buduj artykuł z gotowych modułów."}
          </p>
        </div>
        {/* Wrapper niweluje self-center toolbara → przybornik pod tytułem, wyrównany do prawej */}
        <div className="self-end">
          <EditorToolbar
            onSave={() => performSave("toolbar")}
            isSaving={savingSource !== null}
            showAutosaveTooltip={showAutosaveTooltip}
            onAiClick={() => setIsAiModalOpen(true)}
            onPreviewClick={() => {}}
            orientation="horizontal"
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 relative z-0">
        <div className="relative bg-white rounded-2xl sm:rounded-[32px] p-3 md:p-4 min-h-[500px]">
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
```

---

# 2. useBlogContent.ts

`src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogContent.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BlogBlock } from "./useBlogAiGenerator";

export interface BlogContentState {
  blocks: BlogBlock[];
}

export function useBlogContent(postId: string | null) {
  const router = useRouter();

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [savingSource, setSavingSource] = useState<"auto" | "toolbar" | "bottom" | null>(null);
  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [contentData, setContentData] = useState<BlogContentState>({ blocks: [] });

  const updateField = useCallback(
    <K extends keyof BlogContentState>(
      field: K,
      value:
        | BlogContentState[K]
        | ((prev: BlogContentState[K]) => BlogContentState[K]),
    ) => {
      setContentData((prev) => ({
        ...prev,
        [field]:
          typeof value === "function"
            ? (value as (p: BlogContentState[K]) => BlogContentState[K])(
                prev[field],
              )
            : value,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!postId) {
      toast.error("Brak ID artykułu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/blog/dodaj/dane-podstawowe");
      return;
    }

    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error("Błąd pobierania danych");
        const data = await res.json();
        setPostTitle(data.title || "");
        const blocks = Array.isArray(data.content) ? data.content : [];
        setContentData({ blocks });
      } catch {
        toast.error("Nie udało się załadować treści artykułu.");
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [postId, router]);

  const performSave = useCallback(
    async (source: "auto" | "toolbar" | "bottom") => {
      if (!postId) return;
      setSavingSource(source);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "content", content: contentData.blocks }),
        });
        // Post zniknął z bazy (usunięty / reset bazy). Ostrzeż ZAWSZE — także przy
        // autosave — żeby użytkownik nie edytował „w próżnię" i nie tracił zmian.
        if (res.status === 404) {
          toast.error(
            "Ten artykuł już nie istnieje w bazie (mógł zostać usunięty lub baza została zresetowana). Zapis jest niemożliwy.",
          );
          return;
        }
        if (!res.ok) throw new Error();
        if (source === "auto" || source === "toolbar") {
          setShowAutosaveTooltip(true);
          setTimeout(() => setShowAutosaveTooltip(false), 3000);
        }
        if (source !== "auto") toast.success("Zapisano pomyślnie!");
      } catch {
        if (source !== "auto") toast.error("Błąd zapisu!");
      } finally {
        setSavingSource(null);
      }
    },
    [postId, contentData],
  );

  useEffect(() => {
    if (!postId || isFetchingData) return;
    const id = setTimeout(() => {
      if (!savingSource) performSave("auto");
    }, 30000);
    return () => clearTimeout(id);
  }, [contentData, postId, isFetchingData, savingSource, performSave]);

  const handleSaveAndNext = async () => {
    await performSave("bottom");
    router.push(`/admin/blog/dodaj/seo?id=${postId}`);
  };

  return {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    postTitle,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  };
}
```

---

# 3. useBlogAiGenerator.ts

`src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useBlogAiGenerator.ts`

Tu żyje definicja `BlogBlockType` i `BlogBlock` — źródło prawdy dla typów bloków.

```ts
import { useState } from "react";
import { toast } from "sonner";
import { safeUuid, isUsableImageUrl } from "@/lib/utils";
import {
  geminiFetch,
  type RateStatus,
} from "@/lib/gemini/clientRateLimiter";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BlogBlockType =
  | "heading"
  | "paragraph"
  | "highlight"
  | "spacer"
  | "bulletList"
  | "faq"
  | "featuresGrid"
  | "inlineImage"
  | "videoEmbed"
  | "table";

export interface BlogBlock {
  id: string;
  type: BlogBlockType;
  content: any;
  isGenerating?: boolean;
}

type PickImagesFor = (
  blocks: BlogBlock[],
  onUpdate?: (blocks: BlogBlock[]) => void,
  onlyBlockId?: string,
) => Promise<BlogBlock[]>;

export function useBlogAiGenerator(
  updateField: (field: any, value: any) => void,
  pickImagesFor?: PickImagesFor,
) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState({
    isVisible: false,
    phase: "idle" as
      | "idle"
      | "blueprint"
      | "generating"
      | "ratelimit"
      | "images"
      | "done"
      | "error",
    currentBlock: 0,
    totalBlocks: 0,
    message: "",
    countdown: 0,
  });

  const buildStatusHandler =
    (resumeMessage: string) =>
    (status: RateStatus) => {
      if (status.kind === "waiting") {
        const baseMsg =
          status.reason === "ratelimit"
            ? "Ochrona limitu Gemini. Wznawiam automatycznie ☕"
            : `Błąd Gemini — ponawiam próbę (${status.attempt}/${status.maxAttempts})`;
        setAiProgress((prev) => ({
          ...prev,
          phase: "ratelimit",
          message: baseMsg,
          countdown: status.countdown,
        }));
      } else {
        setAiProgress((prev) =>
          prev.phase === "ratelimit"
            ? { ...prev, phase: "generating", message: resumeMessage, countdown: 0 }
            : prev,
        );
      }
    };

  const handleGenerateBlogContent = async (prompt: string, selectedModel: string) => {
    // Modal ZOSTAJE otwarty podczas blueprintu — pokazuje swój ładny ekran
    // "Budowanie struktury...". Zamykamy go dopiero po udanym planie ORAZ w catch
    // (żeby błąd nie zostawił modala zablokowanego).
    setAiProgress({
      isVisible: false,
      phase: "blueprint",
      currentBlock: 0,
      totalBlocks: 0,
      message: "Redaktor AI planuje strukturę artykułu...",
      countdown: 0,
    });

    try {
      const bpRes = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generateBlogBlueprint", prompt, model: selectedModel }),
        },
        { onStatus: buildStatusHandler("Redaktor AI planuje strukturę artykułu...") },
      );
      if (!bpRes.ok) throw new Error("Błąd podczas planowania struktury artykułu.");
      const bpData = await bpRes.json();
      // Odfiltruj bloki wideo — AI nie ma generować osadzonych filmów.
      const blueprint = (Array.isArray(bpData?.blueprint) ? bpData.blueprint : []).filter(
        (step: { type?: string }) => step?.type !== "videoEmbed",
      );
      if (blueprint.length === 0) {
        throw new Error("AI nie zwróciło planu artykułu. Spróbuj ponownie.");
      }

      // Blueprint gotowy → zamykamy modal, dalszą pracę pokazuje pływający pasek.
      setIsAiModalOpen(false);
      setAiPrompt("");

      setAiProgress({
        isVisible: true,
        phase: "generating",
        currentBlock: 0,
        totalBlocks: blueprint.length,
        message: "Copywriter pisze treść...",
        countdown: 0,
      });

      // Generujemy BLOK PO BLOKU: dokładamy ładujący się blok danego typu,
      // czekamy na treść, robimy optimistic update, dopiero potem następny.
      let currentBlocks: BlogBlock[] = [];

      for (let i = 0; i < blueprint.length; i++) {
        const step = blueprint[i];
        setAiProgress((prev) => ({ ...prev, currentBlock: i + 1 }));

        // 1) Wstaw ładujący się blok (widoczny z neonowym shimmerem).
        const blockId = safeUuid();
        currentBlocks = [
          ...currentBlocks,
          { id: blockId, type: step.type, content: {}, isGenerating: true },
        ];
        updateField("blocks", currentBlocks);
        await sleep(200); // krótka pauza, żeby widać było wejście bloku

        try {
          const blockRes = await geminiFetch(
            "/api/admin/gemini",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generateBlogSingleBlock",
                prompt,
                overallContext: prompt,
                blockType: step.type,
                topic: step.topic,
                model: selectedModel,
              }),
            },
            { onStatus: buildStatusHandler("Copywriter wraca do pracy...") },
          );

          if (!blockRes.ok) throw new Error("Błąd API");
          let blockContent = await blockRes.json();

          if (blockContent.content && typeof blockContent.content === "object" && !Array.isArray(blockContent.content))
            blockContent = blockContent.content;
          if (blockContent[step.type] && typeof blockContent[step.type] === "object" && !Array.isArray(blockContent[step.type]))
            blockContent = blockContent[step.type];
          if (blockContent.type) delete blockContent.type;
          if (["bulletList", "featuresGrid", "faq"].includes(step.type) && !blockContent.items)
            blockContent.items = [];
          if (step.type === "table") {
            if (!Array.isArray(blockContent.headers) || blockContent.headers.length === 0)
              blockContent.headers = ["Kolumna 1", "Kolumna 2"];
            if (!Array.isArray(blockContent.rows)) blockContent.rows = [];
            // Dopełnij/przytnij każdy wiersz do liczby kolumn.
            const cols = blockContent.headers.length;
            blockContent.rows = blockContent.rows.map((r: unknown) => {
              const row = Array.isArray(r) ? r.map((c) => (c == null ? "" : String(c))) : [];
              while (row.length < cols) row.push("");
              return row.slice(0, cols);
            });
          }
          if (["heading", "paragraph", "highlight"].includes(step.type)) {
            if (typeof blockContent === "string") blockContent = { text: blockContent };
            else if (!blockContent.text) blockContent.text = "Treść się nie wygenerowała. Usuń i spróbuj ponownie.";
          }
          // AI NIGDY nie podaje realnego zdjęcia — prawdziwy url pochodzi WYŁĄCZNIE
          // z pickera (Pexels/własny upload → nasz blob). Czyścimy cokolwiek AI
          // wpisało (placeholdery, zmyślone domeny typu przyklad.pl), żeby picker
          // zawsze się zatrzymał i poprosił o wybór grafiki.
          if (step.type === "inlineImage") {
            blockContent.url = "";
            if (typeof blockContent.alt !== "string") blockContent.alt = "";
          }

          // 2) Optimistic update — wypełniamy ten konkretny blok.
          currentBlocks = currentBlocks.map((b) =>
            b.id === blockId ? { ...b, content: blockContent, isGenerating: false } : b,
          );
          updateField("blocks", currentBlocks);
        } catch {
          currentBlocks = currentBlocks.map((b) =>
            b.id === blockId
              ? { ...b, isGenerating: false, content: { text: "Błąd ładowania bloku. Usuń i spróbuj ponownie." } }
              : b,
          );
          updateField("blocks", currentBlocks);
        }

        // Pauza INLINE na bloku zdjęcia: otwórz picker OD RAZU (z opisem `alt`
        // jako podpowiedzią) i wznów pisanie dopiero po wyborze/pominięciu.
        if (
          pickImagesFor &&
          step.type === "inlineImage" &&
          !isUsableImageUrl(
            currentBlocks.find((b) => b.id === blockId)?.content?.url,
          )
        ) {
          setAiProgress((prev) => ({
            ...prev,
            phase: "images",
            message: "Wybierz zdjęcie do tego miejsca...",
          }));
          currentBlocks = await pickImagesFor(
            currentBlocks,
            (bs) => updateField("blocks", bs),
            blockId,
          );
          updateField("blocks", currentBlocks);
          setAiProgress((prev) => ({
            ...prev,
            phase: "generating",
            message: "Copywriter pisze treść...",
          }));
        }

        await sleep(150); // oddech między blokami
      }

      setAiProgress((prev) => ({ ...prev, phase: "done", message: "Artykuł wygenerowany pomyślnie!" }));
      setTimeout(() => setAiProgress((prev) => ({ ...prev, isVisible: false })), 3000);
    } catch (err) {
      // Zamykamy modal także przy błędzie — inaczej zostałby zablokowany na
      // ekranie "Budowanie struktury...". Błąd pokazujemy toastem + paskiem.
      setIsAiModalOpen(false);
      setAiPrompt("");
      const msg =
        err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.";
      setAiProgress((prev) => ({
        ...prev,
        isVisible: true,
        phase: "error",
        message: msg,
      }));
      toast.error(msg);
      setTimeout(() => setAiProgress((prev) => ({ ...prev, isVisible: false })), 4000);
    }
  };

  return {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateBlogContent,
  };
}
```

---

# 4. useInlineImagePicker.ts

`src/app/admin/blog/dodaj/edytor-tresci/_components/hooks/useInlineImagePicker.ts`

```ts
import { useCallback, useRef, useState } from "react";
import { isUsableImageUrl } from "@/lib/utils";
import type { BlogBlock } from "./useBlogAiGenerator";

/**
 * Pół-automatyczny dobór zdjęć po generacji treści.
 *
 * Generator tworzy bloki `inlineImage` z pustym `url` i opisem (`alt`) jako
 * rekomendacją. Ten hook zatrzymuje przepływ i przeprowadza redaktora przez
 * KOLEJKĘ pickerów Pexels — jeden na każdy taki blok, z frazą wstępną z `alt`.
 *
 * Użycie:
 *   const picker = useInlineImagePicker();
 *   const filled = await picker.pickImagesFor(blocks, onLiveUpdate);
 *   // render: <BlogCoverPicker key={picker.pickerKey} isOpen={picker.state.isOpen} ... />
 *
 * `pickImagesFor` zwraca Promise rozwiązywany dopiero, gdy wszystkie zdjęcia
 * zostaną wybrane LUB pominięte — dzięki temu wołający może spokojnie zapisać.
 */
export interface InlineImagePickerState {
  isOpen: boolean;
  /** Fraza wstępna do wyszukiwarki (z `alt` bloku). */
  query: string;
  /** Numer aktualnego zdjęcia (1-based) i łączna liczba do wyboru. */
  index: number;
  total: number;
}

type OnUpdate = (blocks: BlogBlock[]) => void;

const hasUrl = (b: BlogBlock) =>
  Boolean(b.content && typeof b.content === "object") &&
  isUsableImageUrl((b.content as { url?: unknown }).url);

export function useInlineImagePicker() {
  const [state, setState] = useState<InlineImagePickerState>({
    isOpen: false,
    query: "",
    index: 0,
    total: 0,
  });

  const blocksRef = useRef<BlogBlock[]>([]);
  const queueRef = useRef<string[]>([]); // pozostałe id bloków (bieżący na [0])
  const totalRef = useRef(0);
  const resolveRef = useRef<((blocks: BlogBlock[]) => void) | null>(null);
  const onUpdateRef = useRef<OnUpdate | undefined>(undefined);

  // Przejdź do kolejnego zdjęcia w kolejce albo zakończ (rozwiąż Promise).
  const advance = useCallback(() => {
    const queue = queueRef.current;
    if (queue.length === 0) {
      setState((s) => ({ ...s, isOpen: false }));
      const resolve = resolveRef.current;
      resolveRef.current = null;
      resolve?.(blocksRef.current);
      return;
    }
    const blockId = queue[0];
    const block = blocksRef.current.find((b) => b.id === blockId);
    const query = String(block?.content?.alt ?? "").trim();
    const index = totalRef.current - queue.length + 1;
    setState({ isOpen: true, query, index, total: totalRef.current });
  }, []);

  const pickImagesFor = useCallback(
    (
      blocks: BlogBlock[],
      onUpdate?: OnUpdate,
      // Gdy podane — pytamy WYŁĄCZNIE o ten jeden blok (pauza inline w pętli),
      // żeby nie wracać do zdjęć, które redaktor już świadomie pominął.
      onlyBlockId?: string,
    ): Promise<BlogBlock[]> => {
      blocksRef.current = blocks;
      onUpdateRef.current = onUpdate;
      let pending = blocks.filter((b) => b.type === "inlineImage" && !hasUrl(b));
      if (onlyBlockId) pending = pending.filter((b) => b.id === onlyBlockId);
      if (pending.length === 0) return Promise.resolve(blocks);

      queueRef.current = pending.map((b) => b.id);
      totalRef.current = pending.length;
      return new Promise<BlogBlock[]>((resolve) => {
        resolveRef.current = resolve;
        advance();
      });
    },
    [advance],
  );

  const handleSelect = useCallback(
    (url: string) => {
      const blockId = queueRef.current[0];
      if (blockId) {
        blocksRef.current = blocksRef.current.map((b) =>
          b.id === blockId
            ? { ...b, content: { ...(b.content ?? {}), url } }
            : b,
        );
        onUpdateRef.current?.(blocksRef.current); // podgląd na żywo w edytorze
      }
      queueRef.current = queueRef.current.slice(1);
      advance();
    },
    [advance],
  );

  const handleSkip = useCallback(() => {
    queueRef.current = queueRef.current.slice(1);
    advance();
  }, [advance]);

  return {
    state,
    /** Klucz wymuszający remount pickera między zdjęciami (świeże wyszukiwanie). */
    pickerKey: `inline-img-${state.index}`,
    pickImagesFor,
    handleSelect,
    handleSkip,
  };
}
```

---

# 5. useBlogUploadImage.ts

`src/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage.ts`

```ts
import { useState } from "react";

export function useBlogUploadImage(
  onUploadSuccess: (url: string) => void,
  endpoint: string = "/api/admin/blog/upload",
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch(`${endpoint}?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      if (!res.ok) throw new Error("Błąd podczas przesyłania");
      const data = await res.json();
      onUploadSuccess(data.url);
    } catch {
      setUploadError("Nie udało się przesłać zdjęcia. Sprawdź plik.");
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadError };
}
```

---

# 6. BlogBlockBuilder.tsx

`src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockBuilder.tsx`

Kontener listy bloków. Tu jest mapa `type → domyślna treść` przy dodawaniu nowego bloku.

```tsx
"use client";

import React from "react";
import { Reorder } from "framer-motion";
import BlogBlockEditorCard from "./BlogBlockEditorCard";
import BlogBlockAdder from "./BlogBlockAdder";
import { BlogBlock, BlogBlockType } from "../hooks/useBlogAiGenerator";
import { safeUuid, focusBlockById } from "@/lib/utils";

interface BlogBlockBuilderProps {
  blocks: BlogBlock[];
  onChange: (
    newBlocks: BlogBlock[] | ((prev: BlogBlock[]) => BlogBlock[]),
  ) => void;
}

export default function BlogBlockBuilder({ blocks, onChange }: BlogBlockBuilderProps) {
  const handleAddBlock = (type: BlogBlockType) => {
    let defaultContent: any = null;
    switch (type) {
      case "heading":      defaultContent = { text: "" }; break;
      case "paragraph":    defaultContent = { text: "" }; break;
      case "highlight":    defaultContent = { text: "" }; break;
      case "spacer":       defaultContent = {}; break;
      case "bulletList":   defaultContent = { items: [{ id: safeUuid(), text: "<p>Nowy punkt...</p>" }] }; break;
      case "faq":          defaultContent = { items: [{ id: safeUuid(), question: "", answer: "" }] }; break;
      case "featuresGrid": defaultContent = { items: [{ id: safeUuid(), icon: "Sparkle", text: "Nowa zaleta" }] }; break;
      case "inlineImage":  defaultContent = { url: "", alt: "" }; break;
      case "videoEmbed":   defaultContent = { url: "" }; break;
      case "table":        defaultContent = { caption: "", headers: ["Kolumna 1", "Kolumna 2"], rows: [["", ""], ["", ""]] }; break;
    }
    const newId = safeUuid();
    onChange((prev) => [...prev, { id: newId, type, content: defaultContent }]);
    focusBlockById(newId);
  };

  const handleDeleteBlock = (id: string) =>
    onChange((prev) => prev.filter((b) => b.id !== id));
  const handleUpdateBlock = (updated: BlogBlock) =>
    onChange((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b)),
    );

  // Reorder.Group musi czytać i zapisywać TEN SAM stan — dlatego `values` i
  // `onReorder` są podpięte bezpośrednio pod stan rodzica (`blocks`/`onChange`).
  // Lokalny mirror rozjeżdżał kolejność: `onReorder` aktualizował rodzica, a
  // `values` czytało stary lokalny stan → elementy nie zamieniały się miejscami.
  return (
    <div className="w-full lg:pr-16">
      <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="flex flex-col gap-2">
        {blocks.map((block) => (
          <BlogBlockEditorCard
            key={`${block.id}-${block.isGenerating ? "loading" : "ready"}`}
            block={block}
            onDelete={() => handleDeleteBlock(block.id)}
            onUpdate={handleUpdateBlock}
          />
        ))}
      </Reorder.Group>
      <BlogBlockAdder onAddBlock={handleAddBlock} />
    </div>
  );
}
```

---

# 7. BlogBlockAdder.tsx

`src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockAdder.tsx`

**Picker bloków** — tu dodajesz nowy typ do listy wyboru.

```tsx
"use client";

import React, { useState } from "react";
import {
  Plus, TextH, TextAa, Star, X, Question,
  ArrowsOutLineVertical, YoutubeLogo, Image as ImageIcon,
  ListBullets, Cards, Table as TableIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Question as QuestionIcon } from "@phosphor-icons/react";
import { BlogBlockType } from "../hooks/useBlogAiGenerator";
import { Tooltip } from "@/components/ui/ToolTip";

interface BlogBlockAdderProps {
  onAddBlock: (type: BlogBlockType) => void;
}

export default function BlogBlockAdder({ onAddBlock }: BlogBlockAdderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const blockOptions: { type: BlogBlockType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: "heading",      label: "Nagłówek",       desc: "Duży tytuł sekcji",           icon: <TextH size={20} /> },
    { type: "paragraph",    label: "Akapit tekstu",  desc: "Zwykły blok tekstowy",         icon: <TextAa size={20} /> },
    { type: "highlight",    label: "Wyróżnik",       desc: "Cytat lub mocna myśl",         icon: <Star size={20} /> },
    { type: "bulletList",   label: "Lista punktowana", desc: "Lista z ikonką ptaszka",    icon: <ListBullets size={20} /> },
    { type: "featuresGrid", label: "Karty zalet",    desc: "Siatka kart z ikonkami",      icon: <Cards size={20} /> },
    { type: "table",        label: "Tabela",          desc: "Zestawienie / porównanie (lubi je AI)", icon: <TableIcon size={20} /> },
    { type: "faq",          label: "FAQ",             desc: "Pytania i odpowiedzi",        icon: <QuestionIcon size={20} /> },
    { type: "inlineImage",  label: "Zdjęcie",        desc: "Obrazek w treści artykułu",   icon: <ImageIcon size={20} /> },
    { type: "videoEmbed",   label: "Wideo",          desc: "Odtwarzacz YouTube",          icon: <YoutubeLogo size={20} /> },
    { type: "spacer",       label: "Przerwa",        desc: "Pusty odstęp między blokami", icon: <ArrowsOutLineVertical size={20} /> },
  ];

  const handleSelect = (type: BlogBlockType) => {
    onAddBlock(type);
    setIsOpen(false);
  };

  return (
    <div className="w-full mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[16px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
            <Plus size={18} weight="bold" />
          </div>
          <span className="font-montserrat font-medium text-sm">Kliknij, aby dodać element</span>
        </button>
      ) : (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-[16px] p-4 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">
              Wybierz rodzaj elementu
            </span>
            <div className="flex items-center gap-1">
              <Tooltip content="Dodawaj elementy jeden pod drugim. Użyj 'Przerwa' aby oddzielić sekcje." position="top">
                <button className="text-brand-primary hover:text-[#0B3B4C] p-1 rounded-md hover:bg-brand-primary/10 transition-colors cursor-help">
                  <Question size={18} weight="bold" />
                </button>
              </Tooltip>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {blockOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleSelect(opt.type)}
                className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-[12px] hover:border-brand-primary hover:shadow-md transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                  {opt.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-montserrat font-semibold text-sm text-[#0B3B4C] mb-0.5">{opt.label}</span>
                  <span className="text-[11px] text-gray-400">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

# 8. BlogBlockEditorCard.tsx

`src/app/admin/blog/dodaj/edytor-tresci/_components/lib/BlogBlockEditorCard.tsx`

**Router bloków** (`switch` po `block.type`) + drag handle, usuwanie i shimmer podczas generacji. To tutaj wpięte są bloki z edytora wydarzeń.

```tsx
"use client";

import React, { memo } from "react";
import {
  useDragControls,
  Reorder,
  motion,
  AnimatePresence,
} from "framer-motion";
import { Trash, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { BlogBlock } from "../hooks/useBlogAiGenerator";
import BlogInlineImageBlock from "../blocks/BlogInlineImageBlock";
import BlogTableBlock from "../blocks/BlogTableBlock";

// Reuse generic trip blocks — they have no camp-specific logic
import HeadingBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HeadingBlock";
import ParagraphBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/ParagraphBlock";
import HighlightBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HighlightBlock";
import SpacerBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/SpacerBlock";
import BulletListBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/BulletListBlock";
import FaqBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FaqBlock";
import FeaturesGridBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FeaturesGridBlock";
import VideoEmbedBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/VideoEmbedBlock";

interface BlogBlockEditorCardProps {
  block: BlogBlock;
  onDelete: () => void;
  onUpdate: (updated: BlogBlock) => void;
}

function BlogBlockEditorCardBase({
  block,
  onDelete,
  onUpdate,
}: BlogBlockEditorCardProps) {
  const dragControls = useDragControls();
  const setContent = (newContent: any) =>
    onUpdate({ ...block, content: newContent });

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return <HeadingBlock content={block.content} onChange={setContent} />;
      case "paragraph":
        return <ParagraphBlock content={block.content} onChange={setContent} />;
      case "highlight":
        return <HighlightBlock content={block.content} onChange={setContent} />;
      case "spacer":
        return <SpacerBlock />;
      case "bulletList":
        return (
          <BulletListBlock content={block.content} onChange={setContent} />
        );
      case "faq":
        return <FaqBlock content={block.content} onChange={setContent} />;
      case "featuresGrid":
        return (
          <FeaturesGridBlock content={block.content} onChange={setContent} />
        );
      case "inlineImage":
        return (
          <BlogInlineImageBlock content={block.content} onChange={setContent} />
        );
      case "videoEmbed":
        return (
          <VideoEmbedBlock content={block.content} onChange={setContent} />
        );
      case "table":
        return <BlogTableBlock content={block.content} onChange={setContent} />;
      default:
        return (
          <div className="text-gray-400 text-sm">
            Nieobsługiwany typ bloku: {block.type}
          </div>
        );
    }
  };

  const shimmerDuration = 2.5;
  const numShimmers = 3;

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative group/element flex items-start w-full border border-transparent rounded-[20px] transition-colors",
        block.isGenerating
          ? "bg-white/50"
          : "bg-white hover:bg-gray-50/80 hover:border-gray-100",
      )}
    >
      <AnimatePresence>
        {block.isGenerating && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 rounded-[20px] overflow-hidden pointer-events-auto backdrop-blur-[2px] shadow-[0_0_15px_5px_rgba(40,125,136,0.2)] bg-white/30"
          >
            {[...Array(numShimmers)].map((_, i) => (
              <motion.div
                key={`shimmer-${i}`}
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: shimmerDuration,
                  ease: "linear",
                  delay: i * (shimmerDuration / numShimmers),
                }}
                className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!block.isGenerating && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/element:opacity-100 flex flex-row items-center gap-1 transition-opacity bg-white/95 backdrop-blur-md p-1 rounded-lg shadow-sm border border-gray-200 z-10">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
          >
            <DotsSixVertical size={18} weight="bold" />
          </div>
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "w-full lg:pr-16 mt-1 transition-opacity duration-500",
          block.isGenerating && "opacity-40 pointer-events-none",
        )}
      >
        {renderContent()}
      </div>
    </Reorder.Item>
  );
}

export default memo(BlogBlockEditorCardBase, (prev, next) => {
  return (
    prev.block.id === next.block.id &&
    prev.block.isGenerating === next.block.isGenerating &&
    JSON.stringify(prev.block.content) === JSON.stringify(next.block.content)
  );
});
```

---

# 9. BlogInlineImageBlock.tsx

`src/app/admin/blog/dodaj/edytor-tresci/_components/blocks/BlogInlineImageBlock.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { Camera, Image } from "@phosphor-icons/react/dist/ssr";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";

interface Props {
  content: any;
  onChange: (newContent: any) => void;
}

export default function BlogInlineImageBlock({ content, onChange }: Props) {
  const imageUrl = content?.url || "";
  const imageAlt = content?.alt || "";
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm group/image">
      <div className="flex justify-between items-center gap-3">
        <label className="font-montserrat font-semibold text-[#0B3B4C] text-sm">
          Zdjęcie w treści
        </label>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-full text-xs font-montserrat font-semibold text-[#0B3B4C] transition-colors"
        >
          <Image size={16} weight="duotone" className="text-[#287D88]" />
          {imageUrl ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
        </button>
      </div>

      {imageUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mt-2">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto object-contain max-h-[500px]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => setPickerOpen(true)}
              className="p-3.5 rounded-full bg-white text-[#0B3B4C] hover:scale-105 transition-all"
            >
              <Camera size={20} weight="fill" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full aspect-[4/3] max-h-[300px] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4 mt-2 hover:border-brand-primary/40 hover:bg-brand-primary/[0.03] transition-colors"
        >
          <Image size={50} weight="duotone" className="text-gray-300" />
          <span className="font-montserrat text-sm font-medium text-center px-6">
            Wybierz zdjęcie z Pexels lub wgraj własne, aby wstawić je w treść
            artykułu
          </span>
        </button>
      )}

      <input
        type="text"
        value={imageAlt}
        onChange={(e) => onChange({ url: imageUrl, alt: e.target.value })}
        placeholder="Opis alternatywny zdjęcia (SEO)..."
        className="w-full p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl font-montserrat text-sm outline-none focus:border-brand-primary/30 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
      />

      <BlogCoverPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange({ url, alt: imageAlt });
          setPickerOpen(false);
        }}
        defaultQuery={imageAlt}
        heading="Zdjęcie w treści artykułu"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne — trafi prosto do naszego magazynu."
      />
    </div>
  );
}
```

---

# 10. BlogTableBlock.tsx

`src/app/admin/blog/dodaj/edytor-tresci/_components/blocks/BlogTableBlock.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";

// Model danych tabeli:
//   { caption?: string, headers: string[], rows: string[][] }
// Każdy wiersz (row) ma DOKŁADNIE tyle komórek, ile jest nagłówków.
// Komórki mogą zawierać HTML (np. <span style="color:#287D88"> z AI). Renderujemy
// je przez contentEditable, dzięki czemu w edytorze wyglądają TAK SAMO jak na
// froncie bloga (BlogBlockRenderer renderuje je przez dangerouslySetInnerHTML),
// a nie jako surowe tagi <span>.

interface BlogTableBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

// Edytowalna komórka renderująca sformatowany HTML (kolory, pogrubienia z AI).
// Niekontrolowana (TipTap-style): treść ustawiamy do DOM-u tylko gdy zmieni się
// z zewnątrz i pole nie jest aktywne — dzięki temu kursor nie skacze przy pisaniu.
function EditableCell({
  html,
  onChange,
  className,
  placeholder,
}: {
  html: string;
  onChange: (value: string) => void;
  className: string;
  placeholder: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = html ?? "";
    if (document.activeElement !== el && el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [html]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onKeyDown={(e) => {
        // Komórki tabeli są jednoliniowe — Enter nie ma tworzyć nowych linii.
        if (e.key === "Enter") e.preventDefault();
      }}
      className={className}
    />
  );
}

export default function BlogTableBlock({
  content,
  onChange,
}: BlogTableBlockProps) {
  const caption: string = content?.caption ?? "";
  const headers: string[] =
    Array.isArray(content?.headers) && content.headers.length > 0
      ? content.headers
      : ["Kolumna 1", "Kolumna 2"];
  const rows: string[][] = Array.isArray(content?.rows) ? content.rows : [];

  const colCount = headers.length;

  // Normalizuje wiersz do aktualnej liczby kolumn (dopełnia/przycina).
  const normalizeRow = (row: string[]): string[] => {
    const next = [...(row || [])];
    while (next.length < colCount) next.push("");
    return next.slice(0, colCount);
  };

  const commit = (next: {
    caption?: string;
    headers?: string[];
    rows?: string[][];
  }) =>
    onChange({
      caption: next.caption ?? caption,
      headers: next.headers ?? headers,
      rows: (next.rows ?? rows).map(normalizeRow),
    });

  const setCaption = (value: string) => commit({ caption: value });

  const setHeader = (col: number, value: string) => {
    const nextHeaders = [...headers];
    nextHeaders[col] = value;
    commit({ headers: nextHeaders });
  };

  const setCell = (rowIdx: number, col: number, value: string) => {
    const nextRows = rows.map(normalizeRow);
    if (!nextRows[rowIdx]) return;
    nextRows[rowIdx][col] = value;
    commit({ rows: nextRows });
  };

  const addColumn = () => {
    commit({
      headers: [...headers, `Kolumna ${colCount + 1}`],
      rows: rows.map((r) => [...normalizeRow(r), ""]),
    });
  };

  const removeColumn = (col: number) => {
    if (colCount <= 1) return;
    commit({
      headers: headers.filter((_, i) => i !== col),
      rows: rows.map((r) => normalizeRow(r).filter((_, i) => i !== col)),
    });
  };

  const addRow = () => {
    commit({ rows: [...rows, Array(colCount).fill("")] });
  };

  const removeRow = (rowIdx: number) => {
    commit({ rows: rows.filter((_, i) => i !== rowIdx) });
  };

  // Wspólne style komórek edytowalnych. `empty:before` pokazuje placeholder gdy
  // komórka jest pusta. `[&_span]:text-inherit` zachowuje się jak na froncie
  // (kolory z inline style i tak wygrywają nad tą regułą).
  const cellCls =
    "flex-1 min-w-0 bg-transparent outline-none font-montserrat text-sm px-2 py-1.5 rounded-md focus:bg-brand-primary/5 transition-colors [&_span]:text-inherit empty:before:content-[attr(data-placeholder)] before:text-gray-300 before:pointer-events-none before:font-normal";

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Tytuł / opis tabeli (opcjonalnie, pomaga SEO i AI)…"
        className="w-full bg-transparent outline-none font-jakarta font-semibold text-[#0B3B4C] text-sm px-2 py-1 placeholder:text-gray-300 placeholder:font-normal"
      />

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-primary/5">
              {headers.map((h, col) => (
                <th
                  key={col}
                  className="border-b border-r border-gray-200 last:border-r-0 align-top group/col"
                >
                  <div className="flex items-center">
                    <EditableCell
                      html={h}
                      onChange={(value) => setHeader(col, value)}
                      placeholder={`Nagłówek ${col + 1}`}
                      className={`${cellCls} font-semibold text-[#0B3B4C]`}
                    />
                    {colCount > 1 && (
                      <button
                        onClick={() => removeColumn(col)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0"
                        title="Usuń kolumnę"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const cells = normalizeRow(row);
              return (
                <tr key={rowIdx} className="group/row hover:bg-gray-50/60">
                  {cells.map((cell, col) => (
                    <td
                      key={col}
                      className="border-b border-r border-gray-100 last:border-r-0 align-top"
                    >
                      <div className="flex items-center">
                        <EditableCell
                          html={cell}
                          onChange={(value) => setCell(rowIdx, col, value)}
                          placeholder="—"
                          className={`${cellCls} text-gray-600`}
                        />
                        {col === colCount - 1 && (
                          <button
                            onClick={() => removeRow(rowIdx)}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                            title="Usuń wiersz"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-montserrat font-medium text-brand-primary hover:text-[#0B3B4C] px-2.5 py-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" /> Wiersz
        </button>
        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 text-xs font-montserrat font-medium text-brand-primary hover:text-[#0B3B4C] px-2.5 py-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" /> Kolumna
        </button>
      </div>
    </div>
  );
}
```

---

# 11. RichTextInput.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/lib/RichTextInput.tsx`

**Rdzeń edycji tekstu** — TipTap z BubbleMenu (pogrubienie + kolory brandowe). Używany przez większość bloków.

```tsx
"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus"; // <-- TO JEST KLUCZ DO SUKCESU
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Placeholder } from "@tiptap/extensions";
import { TextB, Circle } from "@phosphor-icons/react/dist/ssr";

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /**
   * Gdy podane: Enter (bez Shift) NIE wstawia nowej linii, tylko wywołuje ten
   * callback — używane w listach punktowanych, by Enter tworzył kolejny punkt.
   * Shift+Enter nadal robi miękki łamacz linii w obrębie punktu.
   */
  onEnter?: () => void;
  /** Ustaw fokus na tym polu po zamontowaniu (np. świeżo dodany punkt listy). */
  autoFocus?: boolean;
  /** Tekst podpowiedzi widoczny, gdy pole jest puste (np. „Nowy nagłówek"). */
  placeholder?: string;
}

export default function RichTextInput({
  value,
  onChange,
  className = "",
  onEnter,
  autoFocus = false,
  placeholder,
}: RichTextInputProps) {
  // Ref trzyma najświeższy callback — editorProps domyka się tylko raz.
  const onEnterRef = React.useRef(onEnter);
  onEnterRef.current = onEnter;

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `outline-none min-h-[24px] cursor-text ${className}`,
      },
      handleKeyDown(_view, event) {
        if (
          onEnterRef.current &&
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {
          event.preventDefault();
          onEnterRef.current();
          return true;
        }
        return false;
      },
      // Czyszczenie wklejanej treści: twarde spacje → zwykłe i usunięcie pustych
      // akapitów (źródło „nieusuwalnego" whitespace'u po wklejeniu z Worda/web).
      transformPastedHTML(html) {
        return html
          .replace(/ /g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
      },
      transformPastedText(text) {
        return text
          .replace(/ /g, " ")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      },
    },
  });

  React.useEffect(() => {
    if (autoFocus && editor) editor.commands.focus("end");
  }, [autoFocus, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full relative">
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-1 bg-white shadow-lg border border-gray-100 rounded-xl p-1.5 z-50"
      >
        {/* POGRUBIENIE */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive("bold")
              ? "bg-brand-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title="Pogrubienie (Ctrl+B)"
        >
          <TextB size={18} weight="bold" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* KOLORY */}
        <button
          onClick={() => editor.chain().focus().setColor("#0B3B4C").run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Ustaw ciemny granat"
        >
          <Circle size={18} weight="fill" color="#0B3B4C" />
        </button>

        <button
          onClick={() => editor.chain().focus().setColor("#287D88").run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Ustaw główny brandowy"
        >
          <Circle size={18} weight="fill" color="#287D88" />
        </button>

        <button
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs font-bold text-gray-400"
          title="Usuń kolor"
        >
          Reset
        </button>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
```

---

# 12. HeadingBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HeadingBlock.tsx`

```tsx
"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface HeadingBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function HeadingBlock({ content, onChange }: HeadingBlockProps) {
  return (
    <RichTextInput
      value={content?.text || ""}
      onChange={(text) => onChange({ text })}
      placeholder="Nowy nagłówek"
      className="text-2xl md:text-3xl font-jakarta font-bold text-[#0B3B4C] leading-[1.2]"
    />
  );
}
```

---

# 13. ParagraphBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/ParagraphBlock.tsx`

```tsx
"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface ParagraphBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function ParagraphBlock({
  content,
  onChange,
}: ParagraphBlockProps) {
  return (
    <RichTextInput
      value={content?.text || ""}
      onChange={(text) => onChange({ text })}
      className="text-gray-600 font-montserrat text-base leading-[1.7]"
    />
  );
}
```

---

# 14. HighlightBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HighlightBlock.tsx`

```tsx
"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface HighlightBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function HighlightBlock({
  content,
  onChange,
}: HighlightBlockProps) {
  return (
    <div className="w-full border-l-4 border-brand-primary pl-4 py-1">
      <RichTextInput
        value={content?.text || ""}
        onChange={(text) => onChange({ text })}
        className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed"
      />
    </div>
  );
}
```

---

# 15. SpacerBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/SpacerBlock.tsx`

```tsx
"use client";

import React from "react";

export default function SpacerBlock() {
  return (
    <div className="w-full flex items-center justify-center h-16 border border-dashed border-brand-primary/20 rounded-lg bg-brand-primary/[0.02]">
      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary/40">
        Przerwa wizualna
      </span>
    </div>
  );
}
```

---

# 16. BulletListBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/BulletListBlock.tsx`

Enter tworzy kolejny punkt (przez `onEnter` z `RichTextInput`).

```tsx
"use client";

import React from "react";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import RichTextInput from "../lib/RichTextInput";
import { safeUuid } from "@/lib/utils";

// TYPOWANIE PROPSÓW
interface BulletListBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function BulletListBlock({
  content,
  onChange,
}: BulletListBlockProps) {
  const listItems = content?.items || [];
  // Id punktu, który ma dostać fokus po dodaniu (Enter → nowy punkt).
  const [focusId, setFocusId] = React.useState<string | null>(null);

  // Enter na punkcie idx → wstaw nowy punkt zaraz pod nim i przenieś tam fokus.
  const addItemAfter = (idx: number) => {
    const newItem = { id: safeUuid(), text: "" };
    const newItems = [...listItems];
    newItems.splice(idx + 1, 0, newItem);
    onChange({ items: newItems });
    setFocusId(newItem.id);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {listItems.map((item: any, idx: number) => (
        <div key={item.id} className="flex items-start gap-4 w-full group/item">
          <CheckCircle
            size={24}
            weight="fill"
            className="text-[#287D88] shrink-0 mt-1"
          />
          <div className="flex-1 w-full">
            <RichTextInput
              value={item.text || ""}
              onChange={(newHtml) => {
                const newItems = [...listItems];
                newItems[idx].text = newHtml;
                onChange({ items: newItems });
              }}
              onEnter={() => addItemAfter(idx)}
              autoFocus={focusId === item.id}
              className="text-gray-600 font-montserrat text-base leading-[1.7]"
            />
          </div>
          <button
            onClick={() =>
              onChange({
                items: listItems.filter((_: any, i: number) => i !== idx),
              })
            }
            className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
            title="Usuń punkt"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      ))}

      <button
        onClick={() =>
          onChange({
            items: [...listItems, { id: safeUuid(), text: "" }],
          })
        }
        className="flex items-start gap-4 w-full opacity-50 hover:opacity-100 transition-opacity group/add cursor-pointer mt-1"
      >
        <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-1">
          <Plus size={20} weight="bold" className="text-[#287D88]" />
        </div>
        <span className="text-gray-400 font-montserrat text-base leading-[1.7] italic">
          Dodaj kolejny punkt...
        </span>
      </button>
    </div>
  );
}
```

---

# 17. FaqBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FaqBlock.tsx`

```tsx
"use client";
import React, { useState } from "react";
import { Reorder } from "framer-motion";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import DraggableFaqItem from "./DraggableFaqItem";
import { safeUuid } from "@/lib/utils";

export default function FaqBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const faqItems = content?.items || [];

  return (
    <div className="w-full flex flex-col bg-white">
      <div className="w-full max-w-[900px] flex flex-col mx-auto">
        <Reorder.Group
          axis="y"
          values={faqItems}
          onReorder={(items) => onChange({ items })}
          className="flex flex-col w-full"
        >
          {faqItems.map((item: any, idx: number) => (
            <DraggableFaqItem
              key={item.id}
              index={idx}
              item={item}
              isOpen={openFaqIndex === idx}
              onToggle={() =>
                setOpenFaqIndex(openFaqIndex === idx ? null : idx)
              }
              onUpdate={(updatedItem: any) => {
                const newItems = [...faqItems];
                newItems[idx] = updatedItem;
                onChange({ items: newItems });
              }}
              onRemove={() =>
                onChange({
                  items: faqItems.filter((_: any, i: number) => i !== idx),
                })
              }
            />
          ))}
        </Reorder.Group>
        <button
          onClick={() => {
            const newItems = [
              ...faqItems,
              { id: safeUuid(), question: "", answer: "" },
            ];
            onChange({ items: newItems });
            setOpenFaqIndex(newItems.length - 1);
          }}
          className="flex items-center justify-center gap-3 w-full p-4 mt-6 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl opacity-60 hover:opacity-100 hover:bg-gray-50 hover:border-[#287D88]/50 transition-all group/add cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover/add:bg-white shadow-sm transition-colors text-gray-400 group-hover/add:text-[#287D88]">
            <Plus size={18} weight="bold" />
          </div>
          <span className="font-montserrat font-semibold text-sm text-gray-500 group-hover/add:text-[#287D88] transition-colors">
            Dodaj kolejne pytanie
          </span>
        </button>
      </div>
    </div>
  );
}
```

---

# 18. DraggableFaqItem.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/DraggableFaqItem.tsx`

```tsx
"use client";

import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Trash, Plus, Minus, List } from "@phosphor-icons/react/dist/ssr";
import { Tooltip } from "@/components/ui/ToolTip";
import RichTextInput from "../lib/RichTextInput";

interface DraggableFaqItemProps {
  item: any;
  index: number;
  onUpdate: (updatedItem: any) => void;
  onRemove: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function DraggableFaqItem({
  item,
  index,
  onUpdate,
  onRemove,
  isOpen,
  onToggle,
}: DraggableFaqItemProps) {
  const dragControls = useDragControls();
  const formattedNumber = String(index + 1).padStart(2, "0");

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className={`relative flex flex-col min-[600px]:flex-row min-[600px]:items-start gap-4 min-[600px]:gap-10 py-6 md:py-10 border-b border-[#0B3B4C]/20 group/faq transition-colors w-full bg-white ${
        index === 0 ? "border-t" : ""
      }`}
    >
      {/* MINI TOOLBAR */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/faq:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm">
        <Tooltip content="Przeciągnij by zmienić kolejność" position="top">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors"
          >
            <List size={16} weight="bold" />
          </div>
        </Tooltip>
        <div className="w-px h-3 bg-gray-200 mx-0.5" />
        <Tooltip content="Usuń pytanie" position="top">
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={16} weight="bold" />
          </button>
        </Tooltip>
      </div>

      {/* 1. GÓRNY PASEK NA MOBILE / LEWA KOLUMNA NA DESKTOP */}
      <div className="flex justify-between items-center w-full min-[600px]:w-auto">
        <div className="font-jakarta font-bold text-[40px] min-[600px]:text-[48px] min-[600px]:self-center leading-none text-[#0B3B4C] min-[600px]:mt-1">
          {formattedNumber}
        </div>
        <button
          onClick={onToggle}
          className="min-[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out"
        >
          <div
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            {isOpen ? (
              <Minus size={18} weight="bold" />
            ) : (
              <Plus size={18} weight="bold" />
            )}
          </div>
        </button>
      </div>

      {/* 2. TREŚĆ (Pytanie + Odpowiedź) */}
      <div className="flex-1 flex flex-col w-full pr-0 md:pr-4">
        <textarea
          value={item.question || ""}
          onChange={(e) => onUpdate({ ...item, question: e.target.value })}
          rows={1}
          className={`font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] transition-all duration-300 outline-none resize-none overflow-hidden w-full placeholder:text-gray-400 bg-gray-50/80 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus:bg-white focus:border-[#287D88]/30 rounded-xl px-4 py-3 ${
            isOpen
              ? "text-[#287D88]"
              : "text-[#0B3B4C] group-hover/faq:text-[#287D88]"
          }`}
          placeholder="Wpisz tutaj swoje pytanie..."
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = "0px";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="w-full bg-gray-50/80 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus-within:bg-white focus-within:border-[#287D88]/30 rounded-xl px-4 py-3 transition-all duration-300">
              <RichTextInput
                value={item.answer || ""}
                onChange={(newHtml) => onUpdate({ ...item, answer: newHtml })}
                className="font-montserrat text-[#0B3B4C]/80 text-[14px] md:text-[15px] leading-[170%] min-h-[40px] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRZYCISK DESKTOP */}
      <button
        onClick={onToggle}
        className="hidden min-[600px]:flex w-10 h-10 self-start shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out mt-1 hover:scale-105 cursor-pointer"
      >
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          {isOpen ? (
            <Minus size={18} weight="bold" />
          ) : (
            <Plus size={18} weight="bold" />
          )}
        </div>
      </button>
    </Reorder.Item>
  );
}
```

---

# 19. FeaturesGridBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FeaturesGridBlock.tsx`

Zawiera whitelistę ikon (`ICONS`) — ta sama lista musi być w prompcie AI.

```tsx
"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { safeUuid } from "@/lib/utils";
import {
  Plus,
  Trash,
  X,
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";
import RichTextInput from "../lib/RichTextInput";

const ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
};

export default function FeaturesGridBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const [openIconPickerId, setOpenIconPickerId] = useState<string | null>(null);
  const items = content?.items || [];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
        {items.map((item: any, idx: number) => {
          const isPickerOpen = openIconPickerId === item.id;
          const hasSelectedIcon = !!item.icon && ICONS[item.icon];
          const SelectedIcon = hasSelectedIcon ? ICONS[item.icon] : Plus;

          return (
            <div
              key={item.id}
              className="on-dark-card flex flex-col items-start gap-4 p-5 w-full bg-[#287D88] rounded-[20px] shadow-sm relative group/card transition-all"
            >
              <button
                onClick={() =>
                  onChange({
                    items: items.filter((_: any, i: number) => i !== idx),
                  })
                }
                className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer z-10"
                title="Usuń kartę"
              >
                <Trash size={14} weight="bold" />
              </button>
              <button
                onClick={() =>
                  setOpenIconPickerId(isPickerOpen ? null : item.id)
                }
                className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all cursor-pointer border-2 ${hasSelectedIcon ? "bg-white/10 border-transparent hover:bg-white/20" : "bg-transparent border-dashed border-white/50 hover:border-white hover:bg-white/10"}`}
                title="Zmień ikonę"
              >
                <SelectedIcon
                  size={24}
                  weight={hasSelectedIcon ? "duotone" : "bold"}
                  className="text-white"
                />
              </button>

              {isPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute top-[75px] left-5 z-50 w-[260px] bg-white p-4 rounded-2xl shadow-xl border border-gray-100 origin-top-left"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Wybierz ikonę
                    </span>
                    <button
                      onClick={() => setOpenIconPickerId(null)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ICONS).map(([key, IconComp]) => {
                      const isActive = item.icon === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            const newItems = [...items];
                            newItems[idx].icon = key;
                            onChange({ items: newItems });
                            setOpenIconPickerId(null);
                          }}
                          className={`p-2 rounded-xl cursor-pointer transition-all ${isActive ? "bg-[#287D88] text-white shadow-md scale-110" : "text-gray-500 hover:bg-gray-100 hover:text-[#0B3B4C]"}`}
                          title={key}
                        >
                          <IconComp
                            size={22}
                            weight={isActive ? "fill" : "duotone"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              <div className="w-full mt-1">
                <RichTextInput
                  value={item.text || ""}
                  onChange={(newHtml) => {
                    const newItems = [...items];
                    newItems[idx].text = newHtml;
                    onChange({ items: newItems });
                  }}
                  className="text-white font-montserrat font-medium text-[14px] leading-relaxed placeholder:text-white/40"
                />
              </div>
            </div>
          );
        })}
        <button
          onClick={() => {
            const newItemId = safeUuid();
            onChange({
              items: [
                ...items,
                { id: newItemId, text: "<p>Nowa zaleta</p>", icon: "" },
              ],
            });
            setOpenIconPickerId(newItemId);
          }}
          className="flex flex-col items-center justify-center gap-4 p-5 w-full bg-[#287D88]/5 border-2 border-dashed border-[#287D88]/30 rounded-[20px] transition-all hover:bg-[#287D88]/10 hover:border-[#287D88]/60 cursor-pointer min-h-[160px] group/ghost"
        >
          <div className="w-14 h-14 flex items-center justify-center bg-[#287D88]/10 group-hover:bg-[#287D88]/20 transition-colors rounded-full text-[#287D88]/60 group-hover:text-[#287D88]">
            <Plus size={28} weight="bold" />
          </div>
          <span className="font-montserrat font-bold text-[14px] text-[#287D88]/60 group-hover:text-[#287D88] transition-colors">
            Dodaj kolejną kartę
          </span>
        </button>
      </div>
    </div>
  );
}
```

---

# 20. VideoEmbedBlock.tsx

`src/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/VideoEmbedBlock.tsx`

Dostępny ręcznie, ale **filtrowany z blueprintu AI** (`step.type !== "videoEmbed"`).

```tsx
"use client";

import React from "react";
import { Info, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

// TYPOWANIE PROPSÓW
interface VideoEmbedBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function VideoEmbedBlock({
  content,
  onChange,
}: VideoEmbedBlockProps) {
  const videoUrl = content?.url || "";

  const getYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 transition-colors focus-within:border-brand-primary/30 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="font-montserrat font-semibold text-[#0B3B4C] text-sm flex flex-col gap-2">
          Link do filmu na YouTube
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="np. https://youtu.be/WlxSfQVr6U8"
            className="w-full p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl font-montserrat text-sm outline-none focus:border-brand-primary/30 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
          />
        </label>

        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-[#0B3B4C]/70">
          <Info size={20} className="text-[#287D88] shrink-0 mt-0.5" />
          <p className="font-montserrat text-[13px] md:text-[14px] leading-[1.6]">
            Przed wklejeniem upewnij się, że film jest przesłany na YouTube,
            opublikowany jako{" "}
            <strong className="text-[#287D88]">publiczny</strong> lub{" "}
            <strong className="text-[#287D88]">niepubliczny</strong>.
          </p>
        </div>
      </div>

      {videoId ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-100 shadow-lg mt-3">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4 mt-3">
          <YoutubeLogo size={56} weight="duotone" className="text-gray-300" />
          <span className="font-montserrat text-sm font-medium text-center px-6">
            Wklej link YouTube, aby zobaczyć podgląd wideo
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## Jak dodać nowy typ bloku — checklista

1. **Typ** → `useBlogAiGenerator.ts`, union `BlogBlockType` (plik 3)
2. **Domyślna treść** → `BlogBlockBuilder.tsx`, `switch` w `handleAddBlock` (plik 6)
3. **Wpis w pickerze** → `BlogBlockAdder.tsx`, tablica `blockOptions` (plik 7)
4. **Komponent bloku** → nowy plik w `_components/blocks/`
5. **Wpięcie** → `BlogBlockEditorCard.tsx`, `switch` w `renderContent` (plik 8)
6. **Normalizacja odpowiedzi AI** → `useBlogAiGenerator.ts` + `page.tsx` (**dwie kopie tej samej logiki**)
7. **Prompt AI** → `src/app/api/admin/gemini/route.ts`, akcje `generateBlogBlueprint` i `generateBlogSingleBlock`
8. **Renderer frontowy** → `src/app/(site)/blog/[blogSlug]/_components/BlogBlockRenderer.tsx`

## Znane duplikacje

- Logika normalizacji odpowiedzi AI jest **skopiowana** między `page.tsx` (generacja z harmonogramu) a `useBlogAiGenerator.ts` (generacja z modala). Obsługa `table` jest tylko w hooku — wersja w `page.tsx` jej nie ma.
- `sleep()` zdefiniowany osobno w `page.tsx` i `useBlogAiGenerator.ts`.
- `useBlogUploadImage.ts` leży w `lib/`, ale nie jest importowany przez żaden plik z tej paczki (upload obsługuje `BlogCoverPicker`).
