"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  FloppyDisk,
  CircleNotch,
  VideoCamera,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import type { SaveSource } from "./useCourseAutosave";

/**
 * Pływający pasek akcji kreatora (wzór z edytora wyjazdów): asystent AI + zapis
 * szkicu, ze wskaźnikiem autozapisu. Publikacja zostaje w nawigacji kroków.
 */
export function FloatingSaveBar({
  onAi,
  onSave,
  savingSource,
  showAutosaveTooltip,
  lastSavedAt,
  canSave,
  uploading = false,
  uploadingCount = 0,
  uploadProgress = 0,
  uploadDone = false,
}: {
  onAi: () => void;
  onSave: () => void;
  savingSource: SaveSource | null;
  showAutosaveTooltip: boolean;
  lastSavedAt: Date | null;
  canSave: boolean;
  /** Trwa przesyłanie nagrania (spinner wokół ikony wideo). */
  uploading?: boolean;
  /** Ile materiałów leci równolegle (tryb modułowy = wiele lekcji naraz). */
  uploadingCount?: number;
  /** Zagregowany postęp wszystkich przesyłań (0–100). */
  uploadProgress?: number;
  /** Przesyłanie właśnie się zakończyło (krótko „check", potem ikona znika). */
  uploadDone?: boolean;
}) {
  const saving = savingSource === "auto" || savingSource === "manual";
  const status = saving
    ? "Zapisywanie szkicu…"
    : showAutosaveTooltip
      ? "Szkic zapisany"
      : lastSavedAt
        ? `Zapisano ${lastSavedAt.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : canSave
          ? "Szkic niezapisany"
          : "Brak treści do zapisania";

  const dotClass = saving
    ? "bg-brand-primary animate-pulse"
    : showAutosaveTooltip || lastSavedAt
      ? "bg-emerald-500"
      : canSave
        ? "bg-amber-400"
        : "bg-gray-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 pl-4 pr-2 py-2 shadow-[0_12px_40px_-8px_rgba(40,125,136,0.35)]"
    >
      {/* Status przesyłania wideo: spinner + licznik materiałów + zagregowany
          postęp → check → znika. W trybie modułowym liczy WSZYSTKIE uploady. */}
      <AnimatePresence>
        {(uploading || uploadDone) && (
          <motion.span
            key="upload-status"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            title={
              uploading
                ? `Przesyłanie ${uploadingCount} ${
                    uploadingCount === 1 ? "materiału" : "materiałów"
                  }… ${uploadProgress}%`
                : "Materiały przesłane"
            }
            className="flex items-center gap-2 shrink-0 pl-0.5"
          >
            <span className="relative flex items-center justify-center size-9 shrink-0">
              {/* Pierścień spinnera — kręci się dopóki trwa wysyłka */}
              {uploading && (
                <CircleNotch
                  size={34}
                  weight="bold"
                  className="absolute inset-0 m-auto animate-spin text-brand-primary/70"
                />
              )}
              {uploadDone ? (
                <Check size={18} weight="bold" className="text-emerald-500" />
              ) : (
                <VideoCamera
                  size={17}
                  weight="fill"
                  className="text-brand-primary"
                />
              )}
              {/* Badge z liczbą równoległych przesyłań (gdy więcej niż jedno) */}
              {uploading && uploadingCount > 1 && (
                <span className="absolute -right-1 -top-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold leading-none shadow">
                  {uploadingCount}
                </span>
              )}
            </span>

            {/* Tekst postępu (desktop) */}
            <span className="hidden sm:inline font-montserrat text-[12px] font-semibold text-brand-primary tabular-nums">
              {uploading
                ? `Przesyłanie ${
                    uploadingCount > 1 ? `${uploadingCount} · ` : ""
                  }${uploadProgress}%`
                : "Przesłano"}
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Status autozapisu */}
      <span className="hidden sm:flex items-center gap-2 font-montserrat text-[12px] font-semibold text-brand-secondary/70">
        <span className={`size-2 rounded-full ${dotClass}`} />
        {status}
      </span>

      <span className="hidden sm:block h-5 w-px bg-gray-200" />

      {/* Asystent AI */}
      <button
        type="button"
        onClick={onAi}
        title="Asystent AI — wygeneruj kurs"
        className="group relative flex items-center justify-center size-10 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors overflow-hidden"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-primary/0 to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkle size={19} weight="fill" className="relative group-hover:animate-pulse" />
      </button>

      {/* Zapis szkicu */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !canSave}
        title={canSave ? "Zapisz szkic" : "Dodaj treść kursu, aby zapisać"}
        className={`relative inline-flex items-center gap-2 h-10 px-4 rounded-full font-montserrat font-bold text-[13px] transition-all disabled:cursor-not-allowed ${
          showAutosaveTooltip
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : "bg-brand-primary text-white border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] disabled:opacity-50 disabled:shadow-none"
        }`}
      >
        {!showAutosaveTooltip && !saving && (
          <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-7 rounded-full bg-brand-yellow/50 blur-[10px]" />
        )}
        <span className="relative inline-flex items-center gap-2">
          {saving ? (
            <CircleNotch size={16} weight="bold" className="animate-spin" />
          ) : (
            <FloppyDisk size={16} weight={showAutosaveTooltip ? "fill" : "bold"} />
          )}
          Zapisz
        </span>
      </button>
    </motion.div>
  );
}
