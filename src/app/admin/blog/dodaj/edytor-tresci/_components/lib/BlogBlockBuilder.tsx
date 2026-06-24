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
