"use client";

import {
  FloppyDisk,
  Sparkle,
  CircleNotch,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import type { AutoSaveStatus } from "../hooks/useAutoSave";

interface EmailEditorToolbarProps {
  onSave: () => void;
  isSaving: boolean;
  autoSaveStatus: AutoSaveStatus;
  /** Opcjonalne — gdy brak, przycisk AI jest ukryty (np. w kampaniach). */
  onAiClick?: () => void;
  onPreviewClick?: () => void;
}

export default function EmailEditorToolbar({
  onSave,
  isSaving,
  autoSaveStatus,
  onAiClick,
  onPreviewClick,
}: EmailEditorToolbarProps) {
  const isProcessing = isSaving || autoSaveStatus === "saving";
  const showAutosaveTooltip = autoSaveStatus === "saved";

  // ── Mobile bar ─────────────────────────────────────────────────────────────
  const mobileBar = (
    <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <span className="text-[11px] font-montserrat font-semibold flex items-center gap-1.5 text-gray-400 truncate">
        {autoSaveStatus === "idle" && (
          <span className="text-gray-300">● autozapis co 5s</span>
        )}
        {autoSaveStatus === "pending" && <>⟳ czeka na zapis…</>}
        {autoSaveStatus === "saving" && (
          <>
            <CircleNotch
              size={10}
              weight="bold"
              className="animate-spin text-[#287d88]"
            />{" "}
            zapisuję…
          </>
        )}
        {autoSaveStatus === "saved" && (
          <span className="text-emerald-500">✓ Autozapisano</span>
        )}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {onPreviewClick && (
          <button
            type="button"
            onClick={onPreviewClick}
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#287d88] hover:bg-[#287d88]/10 transition-colors"
            title="Podgląd e-maila"
          >
            <Eye size={18} weight="bold" />
          </button>
        )}
        {onAiClick && (
          <button
            type="button"
            onClick={onAiClick}
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#287d88] hover:bg-[#287d88]/10 transition-colors"
            title="Generuj z AI"
          >
            <Sparkle size={18} weight="fill" />
          </button>
        )}
        <Tooltip
          content={
            isSaving
              ? "Trwa zapisywanie..."
              : showAutosaveTooltip
                ? "Autozapis wykonany!"
                : "Zapisz zmiany"
          }
          position={"left"}
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
      </div>
    </div>
  );

  // ── Desktop pill — identyczny z EditorToolbar (edytor-tresci) ─────────────
  const desktopPill = (
    <div className="hidden md:flex sticky top-[95px] z-50 pointer-events-none w-fit shrink-0 flex-col items-center self-start">
      <div className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(40,125,136,0.15)] border border-gray-200/80 flex flex-col gap-2 px-2 py-3">
        {/* Podgląd */}
        {onPreviewClick && (
          <>
            <Tooltip content="Podgląd w skrzynce" position="left">
              <button
                type="button"
                onClick={onPreviewClick}
                className="flex items-center justify-center w-9 h-9 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer"
              >
                <Eye size={18} weight="bold" />
              </button>
            </Tooltip>
            <div className="w-5 h-px bg-gray-200 my-0.5" />
          </>
        )}

        {/* AI */}
        {onAiClick && (
          <>
            <Tooltip content="Asystent AI (Wygeneruj treść)" position="left">
              <button
                type="button"
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
          </>
        )}

        {/* Zapisz */}
        <Tooltip
          content={
            isProcessing
              ? "Trwa zapisywanie..."
              : showAutosaveTooltip
                ? "Autozapis wykonany!"
                : "Zapisz zmiany"
          }
          position="left"
          forceOpen={isProcessing || showAutosaveTooltip}
        >
          <button
            type="button"
            onClick={onSave}
            disabled={isProcessing}
            className={cn(
              "w-10 h-10 flex items-center cursor-pointer justify-center rounded-xl transition-all",
              showAutosaveTooltip
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-brand-primary text-white hover:scale-105",
            )}
          >
            {isProcessing ? (
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
      </div>
    </div>
  );

  return (
    <>
      {mobileBar}
      {desktopPill}
    </>
  );
}
