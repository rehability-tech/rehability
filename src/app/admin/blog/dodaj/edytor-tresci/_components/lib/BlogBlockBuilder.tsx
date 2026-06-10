"use client";

import React, { useEffect, useState } from "react";
import { Reorder } from "framer-motion";
import BlogBlockEditorCard from "./BlogBlockEditorCard";
import BlogBlockAdder from "./BlogBlockAdder";
import { BlogBlock, BlogBlockType } from "../hooks/useBlogAiGenerator";
import { safeUuid } from "@/lib/utils";

interface BlogBlockBuilderProps {
  blocks: BlogBlock[];
  onChange: (
    newBlocks: BlogBlock[] | ((prev: BlogBlock[]) => BlogBlock[]),
  ) => void;
}

export default function BlogBlockBuilder({ blocks, onChange }: BlogBlockBuilderProps) {
  const [localBlocks, setLocalBlocks] = useState<BlogBlock[]>(blocks);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const handleAddBlock = (type: BlogBlockType) => {
    let defaultContent: any = null;
    switch (type) {
      case "heading":      defaultContent = { text: "Nowy nagłówek" }; break;
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
    onChange((prev) => [
      ...prev,
      { id: safeUuid(), type, content: defaultContent },
    ]);
  };

  const handleDeleteBlock = (id: string) =>
    onChange((prev) => prev.filter((b) => b.id !== id));
  const handleUpdateBlock = (updated: BlogBlock) =>
    onChange((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b)),
    );

  return (
    <div className="w-full lg:pr-16">
      <Reorder.Group axis="y" values={localBlocks} onReorder={onChange} className="flex flex-col gap-2">
        {localBlocks.map((block) => (
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
