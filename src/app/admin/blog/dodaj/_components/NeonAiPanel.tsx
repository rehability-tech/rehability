"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle, CheckCircle, CircleNotch, Circle, WarningCircle, CaretDown,
  Pause, Play, X,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface NeonStep {
  id: string;
  label: string;
  detail: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  steps: (NeonStep & { status: StepStatus })[];
  onAbort?: () => void;
  liveMessage?: string;
  /** Czy generacja jest wstrzymana (steruje ikoną pauza/wznów i przyciskiem zamknięcia). */
  isPaused?: boolean;
  /** Wstrzymaj generację. Gdy podane — w nagłówku pojawia się przycisk pauzy. */
  onPause?: () => void;
  /** Wznów generację. */
  onResume?: () => void;
  /** Zamknij agenta. Przycisk pokazuje się WYŁĄCZNIE gdy generacja jest wstrzymana. */
  onClose?: () => void;
}

export default function NeonAiPanel({
  title = "Agent AI",
  subtitle,
  steps,
  onAbort,
  liveMessage,
  isPaused = false,
  onPause,
  onResume,
  onClose,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const errorStep = steps.find((s) => s.status === "error");
  const activeStep = steps.find((s) => s.status === "active");
  const allDone = doneCount === steps.length && !errorStep;
  const progress = (doneCount / steps.length) * 100;

  // Generacja "trwa" (możemy ją pauzować) gdy nie ma błędu i nie jest skończona.
  const inProgress = !errorStep && !allDone;
  // Animacje grają tylko gdy realnie pracujemy — przy pauzie zamierają.
  const isAnimating = inProgress && !isPaused;

  const defaultSubtitle = errorStep
    ? "Wystąpił błąd"
    : allDone
    ? "Wszystko gotowe"
    : isPaused
    ? "Wstrzymano — wznów lub zamknij"
    : activeStep
    ? "Pracuję nad artykułem..."
    : "Czekam...";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 40, y: -10 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="fixed top-4 left-3 right-3 sm:top-6 sm:left-auto sm:right-6 z-[100] w-auto sm:w-[320px] pointer-events-auto"
    >
      {/* Neon glow halo */}
      <motion.div
        animate={
          isAnimating
            ? { opacity: [0.5, 0.85, 0.5], scale: [1, 1.04, 1] }
            : { opacity: allDone ? 0.6 : 0.3 }
        }
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        className={cn(
          "absolute -inset-1 rounded-[24px] blur-xl pointer-events-none",
          errorStep
            ? "bg-red-400/40"
            : allDone
            ? "bg-emerald-400/40"
            : "bg-gradient-to-br from-brand-primary/60 via-cyan-400/40 to-brand-primary/60",
        )}
      />

      {/* Card */}
      <div
        className={cn(
          "relative rounded-[20px] overflow-hidden",
          "bg-gradient-to-br from-[#0a2a36] via-[#0B3B4C] to-[#071f28]",
          "border border-cyan-400/20",
          "shadow-[0_8px_40px_-8px_rgba(40,125,136,0.6),0_0_0_1px_rgba(80,200,220,0.15)]",
        )}
      >
        {/* Inner shimmer streak */}
        {isAnimating && (
          <motion.div
            initial={{ left: "-40%" }}
            animate={{ left: "120%" }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent pointer-events-none"
          />
        )}

        {/* Header */}
        <div className="relative flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="relative w-10 h-10 rounded-[12px] bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <motion.div
              animate={
                isAnimating
                  ? { rotate: [0, 12, -12, 8, 0], scale: [1, 1.15, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            >
              <Sparkle
                size={20}
                weight="fill"
                className={cn(
                  errorStep
                    ? "text-red-300"
                    : allDone
                    ? "text-emerald-300"
                    : "text-cyan-300",
                  !errorStep && "drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]",
                )}
              />
            </motion.div>
            {isAnimating && (
              <motion.div
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-[12px] bg-cyan-400/20"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-jakarta font-bold text-white leading-tight">
              {title}
            </h3>
            <p className="text-[11px] font-montserrat text-cyan-200/70 truncate">
              {subtitle ?? defaultSubtitle}
            </p>
          </div>

          {/* Pauza / wznowienie generacji */}
          {inProgress && onPause && (
            <button
              onClick={() => (isPaused ? onResume?.() : onPause())}
              className={cn(
                "p-1.5 rounded-lg transition-colors shrink-0",
                isPaused
                  ? "bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30"
                  : "hover:bg-white/10 text-cyan-200/70 hover:text-white",
              )}
              title={isPaused ? "Wznów generację" : "Wstrzymaj generację"}
            >
              {isPaused ? (
                <Play size={14} weight="fill" />
              ) : (
                <Pause size={14} weight="fill" />
              )}
            </button>
          )}

          {/* Zamknięcie agenta — tylko gdy wstrzymane */}
          {isPaused && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors shrink-0"
              title="Zamknij agenta"
            >
              <X size={14} weight="bold" />
            </button>
          )}

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-200/60 hover:text-white transition-colors shrink-0"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <CaretDown size={14} weight="bold" />
            </motion.div>
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative px-4">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                errorStep
                  ? "bg-red-400"
                  : allDone
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-cyan-300 to-brand-primary",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                boxShadow: errorStep
                  ? "0 0 8px rgba(248,113,113,0.6)"
                  : "0 0 8px rgba(103,232,249,0.7)",
              }}
            />
          </div>
        </div>

        {/* Steps + footer (collapsible) */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2.5">
                    <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                      {step.status === "done" && (
                        <CheckCircle
                          size={16}
                          weight="fill"
                          className="text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]"
                        />
                      )}
                      {step.status === "active" && (
                        <CircleNotch
                          size={16}
                          weight="bold"
                          className="text-cyan-300 animate-spin drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]"
                        />
                      )}
                      {step.status === "pending" && (
                        <Circle size={14} className="text-white/15" weight="bold" />
                      )}
                      {step.status === "error" && (
                        <WarningCircle
                          size={16}
                          weight="fill"
                          className="text-red-400 drop-shadow-[0_0_4px_rgba(248,113,113,0.6)]"
                        />
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-[12px] font-montserrat leading-tight transition-colors",
                        step.status === "done" && "text-white/40 line-through",
                        step.status === "active" && "text-white font-semibold",
                        step.status === "pending" && "text-white/30",
                        step.status === "error" && "text-red-300 font-semibold",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live detail */}
              <div className="border-t border-white/5 px-4 py-3">
                <AnimatePresence mode="wait">
                  {errorStep ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-2"
                    >
                      <p className="text-[11px] font-montserrat text-red-300">
                        {errorStep.detail}
                      </p>
                      {onAbort && (
                        <button
                          onClick={onAbort}
                          className="w-full py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-semibold font-montserrat rounded-[8px] transition-colors border border-white/10"
                        >
                          Wróć do listy
                        </button>
                      )}
                    </motion.div>
                  ) : allDone ? (
                    <motion.p
                      key="done"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[11px] font-montserrat text-emerald-300 font-semibold text-center"
                    >
                      ✓ Gotowe!
                    </motion.p>
                  ) : (
                    <motion.p
                      key={activeStep?.id ?? "idle"}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="text-[11px] font-montserrat text-cyan-200/80 leading-relaxed"
                    >
                      {liveMessage ?? activeStep?.detail ?? "..."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
