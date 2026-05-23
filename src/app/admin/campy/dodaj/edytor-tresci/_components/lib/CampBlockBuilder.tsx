"use client";

import React, { useEffect, useState } from "react";
// ZMIANA: Importujemy Reorder zamiast AnimatePresence
import { Reorder } from "framer-motion";
import BlockEditorCard from "./BlockEditorCard";
import BlockAdder from "./BlockAdder";
import { BlockType, CampBlock } from "../hooks/useCampAiGenerator";

interface CampBlocksBuilderProps {
  blocks: CampBlock[];
  onChange: (newBlocks: CampBlock[]) => void;
  campId: string;
  mapUrl: string;
}

export default function CampBlocksBuilder({
  blocks,
  onChange,
  campId,
  mapUrl,
}: CampBlocksBuilderProps) {
  const [localBlocks, setLocalBlocks] = useState<CampBlock[]>(blocks);
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
      case "bookingOptions":
        defaultContent = {
          standardTitle: "Pakiet Standard (1 osoba)",
          standardText:
            "<p>Kupujesz jedno miejsce. Jeśli w obiekcie są pokoje współdzielone, przydzielimy Cię do innej wspaniałej uczestniczki wyjazdu.</p>",
          duoTitle: "Pakiet Zabierz Przyjaciółkę (2 osoby)",
          duoText:
            "<p>Rezerwujesz od razu 2 miejsca. Gwarantujemy Wam wspólny pokój. W formularzu podasz maila przyjaciółki, a my wyślemy jej zaproszenie.</p>",
        };
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

  const handleMoveBlock = (blockId: string, direction: -1 | 1) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    onChange(reordered);
  };
  // Dodaj to wewnątrz komponentu CampBlocksBuilder:
  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);
  return (
    <div className="w-full lg:pr-16">
      {/* ZMIANA: Reorder.Group automatycznie zarządza kolejnością.
          Kiedy zmienisz pozycję elementu, onReorder wywoła Twoje onChange z nowo ułożoną tablicą! */}
      <Reorder.Group
        axis="y"
        values={localBlocks}
        onReorder={onChange}
        className="flex flex-col gap-2"
      >
        {localBlocks.map((block) => (
          <BlockEditorCard
            key={`${block.id}-${block.isGenerating ? "loading" : "ready"}`}
            block={block}
            onDelete={() => handleDeleteBlock(block.id)}
            onUpdate={handleUpdateBlock}
            onMoveUp={() => handleMoveBlock(block.id, -1)}
            onMoveDown={() => handleMoveBlock(block.id, 1)}
            campId={campId}
            mapUrl={mapUrl}
          />
        ))}
      </Reorder.Group>

      <BlockAdder onAddBlock={handleAddBlock} />
    </div>
  );
}
