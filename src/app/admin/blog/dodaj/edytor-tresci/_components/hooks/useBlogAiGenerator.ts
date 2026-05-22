import { useState } from "react";
import {
  geminiFetch,
  type RateStatus,
} from "@/lib/gemini/clientRateLimiter";

export type BlogBlockType =
  | "heading"
  | "paragraph"
  | "highlight"
  | "spacer"
  | "bulletList"
  | "faq"
  | "featuresGrid"
  | "inlineImage"
  | "videoEmbed";

export interface BlogBlock {
  id: string;
  type: BlogBlockType;
  content: any;
  isGenerating?: boolean;
}

export function useBlogAiGenerator(updateField: (field: any, value: any) => void) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState({
    isVisible: false,
    phase: "idle" as "idle" | "blueprint" | "generating" | "ratelimit" | "done" | "error",
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
    setAiProgress({
      isVisible: true,
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
      if (!bpRes.ok) throw new Error("Błąd podczas planowania struktury.");
      const { blueprint } = await bpRes.json();

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

      let currentBlocks: BlogBlock[] = blueprint.map((step: any) => ({
        id: crypto.randomUUID(),
        type: step.type,
        content: {},
        isGenerating: true,
      }));
      updateField("blocks", currentBlocks);

      for (let i = 0; i < blueprint.length; i++) {
        const step = blueprint[i];
        const blockId = currentBlocks[i].id;
        setAiProgress((prev) => ({ ...prev, currentBlock: i + 1 }));

        try {
          const blockRes = await geminiFetch(
            "/api/admin/gemini",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generateSingleBlock",
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
          if (["heading", "paragraph", "highlight"].includes(step.type)) {
            if (typeof blockContent === "string") blockContent = { text: blockContent };
            else if (!blockContent.text) blockContent.text = "Treść się nie wygenerowała. Usuń i spróbuj ponownie.";
          }

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
      }

      setAiProgress((prev) => ({ ...prev, phase: "done", message: "Artykuł wygenerowany pomyślnie!" }));
      setTimeout(() => setAiProgress((prev) => ({ ...prev, isVisible: false })), 3000);
    } catch {
      setAiProgress((prev) => ({ ...prev, phase: "error", message: "Wystąpił błąd. Spróbuj ponownie." }));
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
