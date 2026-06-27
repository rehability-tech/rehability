"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  FloppyDisk,
  CircleNotch,
  VideoCamera,
  Check,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import type { SaveSource } from "./useCourseAutosave";

/**
 * Pływający pasek akcji kreatora (wzór z edytora wyjazdów): asystent AI + zapis
 * szkicu, ze wskaźnikiem autozapisu. Publikacja zostaje w nawigacji kroków.
 */
export function FloatingSaveBar({
  onAi,
  aiTitle = "Asystent AI — wygeneruj kurs",
  aiBusy = false,
  onBack,
  onSave,
  savingSource,
  showAutosaveTooltip,
  lastSavedAt,
  canSave,
  uploading = false,
  uploadingCount = 0,
  uploadProgress = 0,
  uploadDone = false,
  encoding = false,
  encodingCount = 0,
}: {
  onAi: () => void;
  /** Tooltip przycisku AI (różny dla tworzenia / edycji). */
  aiTitle?: string;
  /** Trwa praca asystenta AI (spinner + blokada przycisku). */
  aiBusy?: boolean;
  /** Strzałka „wstecz" (tylko mobile — zastępuje dolny pasek nawigacji w kreatorze).
   *  Powinna otworzyć popup z potwierdzeniem wyjścia. Brak → przycisk się nie pokazuje. */
  onBack?: () => void;
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
  /** Wideo wgrane, ale Bunny wciąż je koduje (brak miniatury/czasu materiału). */
  encoding?: boolean;
  /** Ile nagrań jest jeszcze w trakcie kodowania. */
  encodingCount?: number;
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

  // W kreatorze pasek zastępuje dolną nawigację na mobile (jest tam ukryta), więc
  // siada w prawym dolnym rogu z zapasem na safe-area; od sm: standardowe bottom-5.
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[110] sm:right-5 sm:bottom-5 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 pl-2 pr-2 sm:pl-4 py-2 shadow-[0_12px_40px_-8px_rgba(40,125,136,0.35)]"
    >
      {/* Strzałka „wstecz" — tylko mobile (zastępuje dolny pasek nawigacji w
          kreatorze). Otwiera popup z potwierdzeniem wyjścia (logika w rodzicu). */}
      {onBack && (
        <>
          <button
            type="button"
            onClick={onBack}
            aria-label="Wróć"
            title="Wróć"
            className="sm:hidden flex items-center justify-center size-10 rounded-full text-brand-secondary/70 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
          >
            <ArrowLeft size={19} weight="bold" />
          </button>
          <span className="sm:hidden h-5 w-px bg-gray-200" />
        </>
      )}

      {/* Status nagrań: PRZESYŁANIE (spinner + % + licznik) → KODOWANIE na Bunny
          (spinner „Przetwarzanie…", aż dojdzie miniatura i czas materiału) → check
          → znika. Kolejność = prawdziwy cykl życia wideo. Tryb modułowy liczy
          WSZYSTKIE nagrania naraz. */}
      <AnimatePresence>
        {(() => {
          const showUpload = uploading;
          const showEncoding = !uploading && encoding;
          const showDone = !uploading && !encoding && uploadDone;
          if (!showUpload && !showEncoding && !showDone) return null;
          const spinning = showUpload || showEncoding;
          const accent = showEncoding ? "text-amber-500" : "text-brand-primary";
          const badge =
            showUpload && uploadingCount > 1
              ? uploadingCount
              : showEncoding && encodingCount > 1
                ? encodingCount
                : null;
          const text = showUpload
            ? `Przesyłanie ${uploadingCount > 1 ? `${uploadingCount} · ` : ""}${uploadProgress}%`
            : showEncoding
              ? "Przetwarzanie wideo…"
              : "Przesłano";
          return (
            <motion.span
              key="video-status"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              title={
                showUpload
                  ? `Przesyłanie ${uploadingCount} ${
                      uploadingCount === 1 ? "materiału" : "materiałów"
                    }… ${uploadProgress}%`
                  : showEncoding
                    ? `Kodowanie wideo na serwerze (${encodingCount}) — czas materiału i miniatura pojawią się po zakończeniu`
                    : "Materiały przesłane"
              }
              className="flex items-center gap-2 shrink-0 pl-0.5"
            >
              <span className="relative flex items-center justify-center size-9 shrink-0">
                {/* Pierścień spinnera — kręci się przy przesyłaniu i kodowaniu */}
                {spinning && (
                  <CircleNotch
                    size={34}
                    weight="bold"
                    className={`absolute inset-0 m-auto animate-spin ${
                      showEncoding ? "text-amber-400/70" : "text-brand-primary/70"
                    }`}
                  />
                )}
                {showDone ? (
                  <Check size={18} weight="bold" className="text-emerald-500" />
                ) : (
                  <VideoCamera size={17} weight="fill" className={accent} />
                )}
                {/* Badge z liczbą równoległych nagrań (gdy więcej niż jedno) */}
                {badge && (
                  <span
                    className={`absolute -right-1 -top-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold leading-none shadow ${
                      showEncoding ? "bg-amber-500" : "bg-brand-primary"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </span>

              {/* Tekst statusu (desktop) */}
              <span
                className={`hidden sm:inline font-montserrat text-[12px] font-semibold tabular-nums ${accent}`}
              >
                {text}
              </span>
            </motion.span>
          );
        })()}
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
        disabled={aiBusy}
        title={aiTitle}
        className="group relative flex items-center justify-center size-10 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors overflow-hidden disabled:opacity-60 disabled:cursor-wait"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-primary/0 to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        {aiBusy ? (
          <CircleNotch size={19} weight="bold" className="relative animate-spin" />
        ) : (
          <Sparkle size={19} weight="fill" className="relative group-hover:animate-pulse" />
        )}
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
