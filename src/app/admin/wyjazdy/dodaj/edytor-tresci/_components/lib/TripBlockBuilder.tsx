"use client";

import React from "react";
import { Reorder } from "framer-motion";
import BlockEditorCard from "./BlockEditorCard";
import BlockAdder from "./BlockAdder";
import { BlockType, TripBlock } from "../hooks/useTripAiGenerator";
import { safeUuid, focusBlockById } from "@/lib/utils";

interface TripBlocksBuilderProps {
  blocks: TripBlock[];
  onChange: (
    newBlocks: TripBlock[] | ((prev: TripBlock[]) => TripBlock[]),
  ) => void;
  tripId: string;
  mapUrl: string;
}

export default function TripBlocksBuilder({
  blocks,
  onChange,
  tripId,
  mapUrl,
}: TripBlocksBuilderProps) {
  const handleAddBlock = (type: BlockType) => {
    let defaultContent: any = null;
    switch (type) {
      case "heading":
        defaultContent = { text: "" };
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
            "<p>Kupujesz jedno miejsce. Jeśli w obiekcie są pokoje współdzielone, przydzielimy Cię do innego uczestnika wyjazdu.</p>",
          duoTitle: "Pakiet Wyjazd we Dwoje (2 osoby)",
          duoText:
            "<p>Rezerwujesz od razu 2 miejsca. Gwarantujemy Wam wspólny pokój. W formularzu podasz maila osoby towarzyszącej, a my wyślemy jej zaproszenie.</p>",
        };
        break;
      case "bulletList":
        defaultContent = {
          items: [{ id: safeUuid(), text: "<p>Nowy punkt na liście...</p>" }],
        };
        break;
      case "faq":
        defaultContent = {
          items: [{ id: safeUuid(), question: "", answer: "" }],
        };
        break;
    }
    const newBlock: TripBlock = {
      id: safeUuid(),
      type,
      content: defaultContent,
    };
    // Funkcyjne aktualizacje — zawsze na najświeższym stanie, niezależnie od
    // zamrożenia callbacku przez memo na karcie bloku (inaczej usunięty/edytowany
    // blok mógł "wracać" przy kolejnej operacji).
    onChange((prev) => [...prev, newBlock]);
    focusBlockById(newBlock.id);
  };

  const handleDeleteBlock = (idToRemove: string) => {
    onChange((prev) => prev.filter((b) => b.id !== idToRemove));
  };

  const handleUpdateBlock = (updatedBlock: TripBlock) => {
    onChange((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
    );
  };

  const handleMoveBlock = (blockId: string, direction: -1 | 1) => {
    onChange((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const reordered = [...prev];
      [reordered[index], reordered[newIndex]] = [
        reordered[newIndex],
        reordered[index],
      ];
      return reordered;
    });
  };

  // Reorder.Group czyta i zapisuje TEN SAM stan (blocks/onChange) — bez lokalnego
  // mirrora, który rozjeżdżał kolejność przy przeciąganiu.
  return (
    <div className="w-full lg:pr-16">
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="flex flex-col gap-2"
      >
        {blocks.map((block) => (
          <BlockEditorCard
            key={`${block.id}-${block.isGenerating ? "loading" : "ready"}`}
            block={block}
            onDelete={() => handleDeleteBlock(block.id)}
            onUpdate={handleUpdateBlock}
            onMoveUp={() => handleMoveBlock(block.id, -1)}
            onMoveDown={() => handleMoveBlock(block.id, 1)}
            tripId={tripId}
            mapUrl={mapUrl}
          />
        ))}
      </Reorder.Group>

      <BlockAdder onAddBlock={handleAddBlock} />
    </div>
  );
}
