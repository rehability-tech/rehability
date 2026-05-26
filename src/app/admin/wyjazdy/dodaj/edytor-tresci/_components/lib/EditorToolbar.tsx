"use client";

import React from "react";
import {
  FloppyDisk,
  Sparkle,
  Eye,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { Tooltip } from "@/components/ui/ToolTip";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  onSave: () => void;
  isSaving: boolean;
  showAutosaveTooltip: boolean;
  onAiClick: () => void;
  onPreviewClick: () => void;
  // --- NOWOŚĆ: Dodany prop orientacji ---
  orientation?: "vertical" | "horizontal";
}

export default function EditorToolbar({
  onSave,
  onAiClick,
  onPreviewClick,
  isSaving = false,
  showAutosaveTooltip = false,
  orientation = "vertical", // Domyślnie pionowo, tak jak było
}: EditorToolbarProps) {
  // Zmienne pomocnicze upraszczające kod klas
  const isVertical = orientation === "vertical";
  const tooltipPosition = isVertical ? "left" : "top";

  return (
    <div
      className={cn(
        // Różne ułożenie i przyklejenie całego wrappera w zależności od orientacji
        "z-50 pointer-events-none w-fit shrink-0",
        isVertical
          ? "sticky top-[95px] right-0 flex flex-col items-center"
          : " self-center flex flex-row items-center justify-center z-0",
      )}
    >
      {/* Pigułka z akcjami */}
      <div
        className={cn(
          "pointer-events-auto bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(40,125,136,0.15)] border border-gray-200/80 flex items-center transition-all",
          isVertical ? "flex-col gap-2 px-2 py-3" : "flex-row gap-2 px-3 py-2",
        )}
      >
        {/* 1. Asystent AI (Gemini) */}
        <Tooltip
          content="Asystent AI (Wygeneruj treść)"
          position={tooltipPosition}
        >
          <button
            onClick={onAiClick}
            className="flex items-center justify-center w-9 h-9 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/0 to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkle
              size={18}
              weight="fill"
              className="relative z-10 group-hover:animate-pulse"
            />
          </button>
        </Tooltip>

        {/* Przerywnik */}
        <div
          className={cn(
            "bg-gray-200",
            isVertical ? "w-5 h-px my-0.5" : "h-5 w-px mx-0.5",
          )}
        />

        {/* 2. Zapisz */}
        <Tooltip
          content={
            isSaving
              ? "Trwa zapisywanie..."
              : showAutosaveTooltip
                ? "Autozapis wykonany!"
                : "Zapisz zmiany"
          }
          position={tooltipPosition}
          forceOpen={isSaving || showAutosaveTooltip}
        >
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "w-10 h-10 flex items-center cursor-pointer justify-center rounded-xl transition-all",
              showAutosaveTooltip
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-brand-primary text-white hover:scale-105",
            )}
          >
            {isSaving ? (
              <CircleNotch
                size={20}
                weight="bold"
                className="animate-spin text-white"
              />
            ) : showAutosaveTooltip ? (
              <FloppyDisk size={20} weight="fill" />
            ) : (
              <FloppyDisk size={20} weight="bold" />
            )}
          </button>
        </Tooltip>

        {/* Przerywnik */}
      </div>
    </div>
  );
}
