"use client";

import React from "react";
import BlockRenderer from "@/components/block-renderer/BlockRenderer";
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr";
import HeroBlock from "@/components/block-renderer/HeroBlock";

interface DescriptionPreviewTabProps {
  camp: any;
  viewMode?: "desktop" | "mobile";
}

export default function DescriptionPreviewTab({
  camp,
  viewMode = "desktop",
}: DescriptionPreviewTabProps) {
  const isMobile = viewMode === "mobile";

  // 1. Bezpieczne parsowanie bloków z bazy/formularza
  let parsedBlocks = [];
  if (camp?.blocks) {
    try {
      parsedBlocks =
        typeof camp.blocks === "string" ? JSON.parse(camp.blocks) : camp.blocks;
    } catch (e) {
      console.error("Błąd parsowania bloków", e);
    }
  }

  // 2. Bezpieczne parsowanie mapUrl (żeby MapBlock z renderera wiedział, co wyświetlić)
  let mapUrl = null;
  if (camp?.location) {
    try {
      const parsedLoc =
        typeof camp.location === "string"
          ? JSON.parse(camp.location)
          : camp.location;
      mapUrl = parsedLoc.mapUrl || null;
    } catch (e) {
      // Ignorujemy błąd, fallback zostanie pusty
    }
  }
  console.log(camp);

  return (
    <div className="w-full flex flex-col bg-white items-center min-h-[400px] overflow-hidden rounded-[24px]">
      {/* Ogranicznik szerokości dla podglądu.
        Na mobile zamykamy tekst w wąskim kontenerze imitującym ekran telefonu.
        Na desktopie pozwalamy mu się rozciągnąć.
      */}
      <div
        className={`w-full transition-all duration-500 ease-in-out ${
          isMobile ? "max-w-[400px] px-4 py-8" : "max-w-[800px] px-8 py-12"
        }`}
      >
        {parsedBlocks && parsedBlocks.length > 0 ? (
          // Renderujemy właściwy opis wyjazdu używając Twojego BlockRenderera
          <div className="pointer-events-none">
            <HeroBlock />
            <BlockRenderer blocks={parsedBlocks} mapUrl={mapUrl} />
          </div>
        ) : (
          // PUSTY STAN - Jeśli w campie nie ma jeszcze żadnych bloków
          <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl py-20 px-6">
            <TextAlignLeft
              size={40}
              weight="duotone"
              className="mb-4 text-brand-primary/50"
            />
            <p className="font-montserrat font-semibold text-[#0B3B4C] text-base mb-1">
              Brak pełnego opisu
            </p>
            <p className="font-montserrat text-sm text-center max-w-sm">
              Wróć do zakładki <strong>Pełny Opis AI</strong>, aby wygenerować
              treść wyjazdu, która pojawi się w tym miejscu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
