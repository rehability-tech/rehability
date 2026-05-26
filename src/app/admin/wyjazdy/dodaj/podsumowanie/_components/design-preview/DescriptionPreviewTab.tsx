"use client";

import React from "react";
import BlockRenderer from "@/components/block-renderer/BlockRenderer";
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr";
import HeroBlock from "@/components/block-renderer/HeroBlock";

interface DescriptionPreviewTabProps {
  trip: any;
  viewMode?: "desktop" | "mobile";
}

const formatDateRange = (start: any, end: any): string => {
  if (!start) return "Wkrótce";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (!endDate) {
    return startDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}–${endDate.getDate()}.${(
      startDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${startDate.getFullYear()}`;
  }
  return `${startDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} - ${endDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

export default function DescriptionPreviewTab({
  trip,
  viewMode = "desktop",
}: DescriptionPreviewTabProps) {
  const isMobile = viewMode === "mobile";

  // Bezpieczne parsowanie bloków z bazy/formularza
  let parsedBlocks: any[] = [];
  if (trip?.blocks) {
    try {
      parsedBlocks =
        typeof trip.blocks === "string" ? JSON.parse(trip.blocks) : trip.blocks;
    } catch (e) {
      console.error("Błąd parsowania bloków", e);
    }
  }

  // Bezpieczne parsowanie lokalizacji - mapUrl dla MapBlock + city dla HeroBlock
  let mapUrl: string | null = null;
  let locationDisplay = "";
  if (trip?.location) {
    try {
      const parsedLoc =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : trip.location;
      mapUrl = parsedLoc.mapUrl || null;
      locationDisplay = parsedLoc.city || parsedLoc.name || "";
    } catch (e) {
      // Stary format - location zapisana jako zwykly string
      if (typeof trip.location === "string") locationDisplay = trip.location;
    }
  }

  const dateRange = formatDateRange(trip?.startDate, trip?.endDate);
  const priceStr = trip?.price ? trip.price.toString() : "";

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
          <div className="pointer-events-none">
            <HeroBlock
              title={trip?.title || ""}
              subtitle={trip?.subtitle}
              heroImage={trip?.heroImage}
              tags={trip?.tags || []}
              location={locationDisplay}
              dateRange={dateRange}
              price={priceStr}
            />
            <BlockRenderer blocks={parsedBlocks} mapUrl={mapUrl} />
          </div>
        ) : (
          // PUSTY STAN - Jeśli na wyjeździe nie ma jeszcze żadnych bloków
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
