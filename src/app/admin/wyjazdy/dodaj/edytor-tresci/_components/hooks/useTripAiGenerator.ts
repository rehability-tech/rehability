import { useState } from "react";
import { safeUuid } from "@/lib/utils";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";

export type BlockType =
  | "heading"
  | "paragraph"
  | "featuresGrid"
  | "pricingList"
  | "highlight"
  | "spacer"
  | "bulletList"
  | "faq"
  | "videoEmbed"
  | "inlineImage"
  | "map"
  | "bookingOptions";
export interface TripBlock {
  id: string;
  type: BlockType;
  content: any; // Tu ląduje dynamiczny JSON z danymi bloku
  isGenerating?: boolean; // Używane tylko w UI do pokazywania loadera AI
}
export function useTripAiGenerator(
  updateField: (field: any, value: any) => void,
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
      | "done"
      | "error",
    currentBlock: 0,
    totalBlocks: 0,
    message: "",
    countdown: 0,
  });

  // Wspólny handler statusu z geminiFetch — obsługuje limit Gemini (429) oraz
  // ponawianie po błędach: zamiast wywalać blok, czekamy i wznawiamy automatycznie
  // (dokładnie jak generacja bloga). Dzięki temu generacja jest płynna i nie
  // produkuje bloków z błędem.
  const buildStatusHandler =
    (resumeMessage: string) => (status: RateStatus) => {
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

  const handleGenerateLandingPage = async (
    prompt: string,
    selectedModel: string,
  ) => {
    setAiProgress({
      isVisible: true,
      phase: "blueprint",
      currentBlock: 0,
      totalBlocks: 0,
      message: "Architekt AI układa plan strony...",
      countdown: 0,
    });

    try {
      const bpRes = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generateBlueprint",
            prompt,
            model: selectedModel,
          }),
        },
        { onStatus: buildStatusHandler("Architekt AI układa plan strony...") },
      );

      if (!bpRes.ok) throw new Error("Błąd podczas tworzenia planu.");
      const responseData = await bpRes.json();
      const blueprint = Array.isArray(responseData.blueprint)
        ? responseData.blueprint
        : [];
      const meta = responseData.meta;
      if (blueprint.length === 0) {
        throw new Error("AI nie zwróciło planu strony. Spróbuj ponownie.");
      }

      setIsAiModalOpen(false);
      setAiPrompt("");

      setAiProgress({
        isVisible: true,
        phase: "generating",
        currentBlock: 0,
        totalBlocks: blueprint.length,
        message: "Copywriter pisze teksty...",
        countdown: 0,
      });

      if (meta) {
        updateField("subtitle", meta.subtitle || "");
        updateField("tags", meta.tags || []);
      }

      // Cała struktura wskakuje od razu (z shimmerem) — tak jak teraz — a treść
      // dolewamy blok po bloku.
      let currentBlocks: TripBlock[] = blueprint.map((step: any) => ({
        id: safeUuid(),
        type: step.type,
        content: {},
        isGenerating: true,
      }));
      updateField("blocks", currentBlocks);

      for (let i = 0; i < blueprint.length; i++) {
        const step = blueprint[i];
        const blockIdToUpdate = currentBlocks[i].id;
        setAiProgress((prev) => ({ ...prev, currentBlock: i + 1 }));

        try {
          const blockRes = await geminiFetch(
            "/api/admin/gemini",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generateSingleBlock",
                prompt: prompt,
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

          // Odkurzacz JSON PRO
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
            ["bulletList", "featuresGrid", "faq", "pricingList"].includes(
              step.type,
            ) &&
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

          currentBlocks = currentBlocks.map((block) =>
            block.id === blockIdToUpdate
              ? { ...block, content: blockContent, isGenerating: false }
              : block,
          );
          updateField("blocks", currentBlocks);
        } catch (err) {
          currentBlocks = currentBlocks.map((block) =>
            block.id === blockIdToUpdate
              ? {
                  ...block,
                  isGenerating: false,
                  content: {
                    text: "Wystąpił błąd ładowania. Usuń ten klocek i spróbuj ponownie.",
                  },
                }
              : block,
          );
          updateField("blocks", currentBlocks);
        }
      }

      setAiProgress((prev) => ({
        ...prev,
        phase: "done",
        message: "Strona wygenerowana pomyślnie!",
      }));
      setTimeout(
        () => setAiProgress((prev) => ({ ...prev, isVisible: false })),
        3000,
      );
    } catch (err) {
      setAiProgress((prev) => ({
        ...prev,
        phase: "error",
        message:
          err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.",
      }));
      setTimeout(
        () => setAiProgress((prev) => ({ ...prev, isVisible: false })),
        4000,
      );
    }
  };

  return {
    isAiModalOpen,
    setIsAiModalOpen,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    handleGenerateLandingPage,
  };
}
