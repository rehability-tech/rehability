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
}

export default function EditorToolbar({
  onSave,
  onAiClick,
  onPreviewClick,
  isSaving = false,
  showAutosaveTooltip = false, // <--- DODANE: Teraz komponent widzi ten stan!
}: EditorToolbarProps) {
  return (
    <div className="sticky top-[95px] right-0 z-50 flex flex-col items-center pointer-events-none shrink-0 w-fit">
      {/* Pigułka z akcjami (Pionowa) */}
      <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-2 py-3 rounded-full shadow-[0_8px_30px_rgba(40,125,136,0.15)] border border-gray-200/80 flex flex-col items-center gap-2 transition-all">
        {/* 1. Asystent AI (Gemini) */}
        <Tooltip content="Asystent AI (Wygeneruj treść)" position="left">
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

        <div className="w-5 h-px bg-gray-200 my-0.5" />

        {/* 2. Zapisz */}
        <Tooltip
          content={
            isSaving
              ? "Trwa zapisywanie..."
              : showAutosaveTooltip
                ? "Autozapis wykonany!"
                : "Zapisz zmiany"
          }
          position="left"
          // Wymuszamy otwarcie dymka ZARÓWNO podczas zapisu jak i po jego udanym zakończeniu
          forceOpen={isSaving || showAutosaveTooltip}
        >
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              showAutosaveTooltip
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-brand-primary text-white hover:scale-105",
            )}
          >
            {isSaving ? (
              <CircleNotch
                size={20}
                weight="bold"
                className="animate-spin text-white" // <-- Zmienione na biały, żeby było widać na brandowym tle
              />
            ) : showAutosaveTooltip ? (
              <FloppyDisk size={20} weight="fill" />
            ) : (
              <FloppyDisk size={20} weight="bold" />
            )}
          </button>
        </Tooltip>

        <div className="w-5 h-px bg-gray-200 my-0.5" />

        {/* 3. Podgląd */}
        <Tooltip content="Podgląd strony" position="left">
          <button
            onClick={onPreviewClick}
            className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-[#0B3B4C] hover:bg-gray-100 transition-all cursor-pointer mt-1"
          >
            <Eye size={18} weight="bold" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
