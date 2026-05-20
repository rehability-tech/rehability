import { useState } from "react";

let apiCallCount = 0;
let apiResetTime = Date.now();
const RPM_LIMIT = 12;

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
      if (apiCallCount >= RPM_LIMIT) {
        apiCallCount = 0;
        apiResetTime = Date.now();
        await new Promise((r) => setTimeout(r, 60000));
      }
      apiCallCount++;

      const bpRes = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateBlogBlueprint", prompt, model: selectedModel }),
      });
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
          if (apiCallCount >= RPM_LIMIT) {
            const timePassed = Date.now() - apiResetTime;
            const waitMs = Math.max(0, 60000 - timePassed);
            if (waitMs > 0) {
              const secs = Math.ceil(waitMs / 1000);
              setAiProgress((prev) => ({
                ...prev,
                phase: "ratelimit",
                message: "Ochrona limitu. Agent pije kawę ☕",
                countdown: secs,
              }));
              for (let s = secs; s > 0; s--) {
                setAiProgress((prev) => ({ ...prev, countdown: s }));
                await new Promise((r) => setTimeout(r, 1000));
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
              prompt,
              overallContext: prompt,
              blockType: step.type,
              topic: step.topic,
              model: selectedModel,
            }),
          });

          if (!blockRes.ok) throw new Error("Błąd API");
          let blockContent = await blockRes.json();

          // Normalize response
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
