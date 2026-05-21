import { useState } from "react";

let apiCallCount = 0;
let apiResetTime = Date.now();
const RPM_LIMIT = 12;
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
export interface CampBlock {
  id: string;
  type: BlockType;
  content: any; // Tu ląduje dynamiczny JSON z danymi bloku
  isGenerating?: boolean; // Używane tylko w UI do pokazywania loadera AI
}
export function useCampAiGenerator(
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
      if (apiCallCount >= RPM_LIMIT) {
        apiCallCount = 0;
        apiResetTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
      apiCallCount++;

      const bpRes = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateBlueprint",
          prompt,
          model: selectedModel,
        }),
      });

      if (!bpRes.ok) throw new Error("Błąd podczas tworzenia planu.");
      const responseData = await bpRes.json();
      const blueprint = responseData.blueprint;
      const meta = responseData.meta;

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

      let currentBlocks: CampBlock[] = blueprint.map((step: any) => ({
        id: crypto.randomUUID(),
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
          if (apiCallCount >= RPM_LIMIT) {
            const timePassed = Date.now() - apiResetTime;
            const waitMs = Math.max(0, 60000 - timePassed);

            if (waitMs > 0) {
              const waitSeconds = Math.ceil(waitMs / 1000);
              setAiProgress((prev) => ({
                ...prev,
                phase: "ratelimit",
                message: "Ochrona limitu. Agent pije kawę ☕",
                countdown: waitSeconds,
              }));
              for (let s = waitSeconds; s > 0; s--) {
                setAiProgress((prev) => ({ ...prev, countdown: s }));
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
            apiCallCount = 0;
            apiResetTime = Date.now();
            setAiProgress((prev) => ({
              ...prev,
              phase: "generating",
              message: "Copywriter wraca do pracy...",
              countdown: 0,
            }));
          }
          apiCallCount++;

          const blockRes = await fetch("/api/admin/gemini", {
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
          });

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
        message: "Wystąpił błąd. Spróbuj ponownie.",
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
