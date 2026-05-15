"use client";

import React from "react";
// ZMIANA: Importujemy Reorder zamiast AnimatePresence
import { Reorder } from "framer-motion";
import BlockEditorCard from "./BlockEditorCard";
import BlockAdder from "./BlockAdder";
import {
  CampBlock,
  BlockType,
} from "@/app/admin/campy/dodaj/edytor-tresci/page";

interface CampBlocksBuilderProps {
  blocks: CampBlock[];
  onChange: (newBlocks: CampBlock[]) => void;
}

export default function CampBlocksBuilder({
  blocks,
  onChange,
}: CampBlocksBuilderProps) {
  const handleAddBlock = (type: BlockType) => {
    let defaultContent: any = null;
    switch (type) {
      case "heading":
        defaultContent = { text: "Nowy nagłówek" };
        break;
      case "paragraph":
        defaultContent = { text: "" };
        break;
      case "spacer":
        defaultContent = { height: "64px" };
        break;
      case "bulletList":
        defaultContent = {
          items: [
            { id: crypto.randomUUID(), text: "<p>Nowy punkt na liście...</p>" },
          ],
        };
      case "faq":
        defaultContent = {
          items: [{ id: crypto.randomUUID(), question: "", answer: "" }],
        };
        break;
    }
    const newBlock: CampBlock = {
      id: crypto.randomUUID(),
      type,
      content: defaultContent,
    };
    onChange([...blocks, newBlock]);
  };

  const handleDeleteBlock = (idToRemove: string) => {
    onChange(blocks.filter((b) => b.id !== idToRemove));
  };

  const handleUpdateBlock = (updatedBlock: CampBlock) => {
    onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  return (
    <div className="w-full lg:pr-16">
      {/* ZMIANA: Reorder.Group automatycznie zarządza kolejnością.
          Kiedy zmienisz pozycję elementu, onReorder wywoła Twoje onChange z nowo ułożoną tablicą! */}
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="flex flex-col gap-2"
      >
        {blocks.map((block) => (
          <BlockEditorCard
            key={block.id}
            block={block}
            onDelete={() => handleDeleteBlock(block.id)}
            onUpdate={handleUpdateBlock}
          />
        ))}
      </Reorder.Group>

      <BlockAdder onAddBlock={handleAddBlock} />
    </div>
  );
}
