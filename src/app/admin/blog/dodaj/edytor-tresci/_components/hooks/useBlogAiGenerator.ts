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
