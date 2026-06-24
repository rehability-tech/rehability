"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle, CheckCircle, CircleNotch, Circle, WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import Portal from "@/components/ui/Portal";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface AutoGenStep {
  id: string;
  label: string;
  detail: string;
}

interface Props {
  steps: (AutoGenStep & { status: StepStatus })[];
  onAbort: () => void;
}

export default function AutoGenerateOverlay({ steps, onAbort }: Props) {
  const doneCount    = steps.filter((s) => s.status === "done").length;
  const errorStep    = steps.find((s) => s.status === "error");
  const activeStep   = steps.find((s) => s.status === "active");
  const progress     = (doneCount / steps.length) * 100;

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071f28]/90 backdrop-blur-md"
    >
      {/* Ambient glow effects */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute w-[400px] h-[400px] bg-brand-primary/30 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
        className="absolute w-[200px] h-[200px] bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260, delay: 0.1 }}
        className="relative z-10 bg-white w-full max-w-sm rounded-[28px] p-8 shadow-2xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <motion.div
              animate={!errorStep ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Sparkle
                size={28}
                weight="fill"
                className={cn("text-brand-primary", !errorStep && "drop-shadow-[0_0_8px_rgba(40,125,136,0.6)]")}
              />
            </motion.div>
            {!errorStep && (
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-2xl bg-brand-primary/10"
              />
            )}
          </div>
          <div>
            <h2 className="text-lg font-jakarta font-bold text-[#0B3B4C]">Agent AI</h2>
            <p className="text-[13px] font-montserrat text-gray-500">
              {errorStep ? "Wystąpił błąd" : "Pisze Twój artykuł automatycznie"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", errorStep ? "bg-red-400" : "bg-brand-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Steps list */}
        <div className="flex flex-col gap-3 mb-6">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {/* Status icon */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {step.status === "done" && (
                  <CheckCircle size={20} weight="fill" className="text-brand-primary" />
                )}
                {step.status === "active" && (
                  <CircleNotch size={20} weight="bold" className="text-brand-primary animate-spin" />
                )}
                {step.status === "pending" && (
                  <Circle size={20} className="text-gray-200" />
                )}
                {step.status === "error" && (
                  <WarningCircle size={20} weight="fill" className="text-red-500" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[13px] font-montserrat transition-colors",
                  step.status === "done"    && "text-gray-400",
                  step.status === "active"  && "text-[#0B3B4C] font-bold",
                  step.status === "pending" && "text-gray-300",
                  step.status === "error"   && "text-red-500 font-semibold",
                )}
              >
                {step.label}
              </span>

              {/* Active pulse dot */}
              {step.status === "active" && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="ml-auto text-[10px] font-montserrat text-brand-primary/60 shrink-0"
                >
                  w trakcie
                </motion.span>
              )}
            </div>
          ))}
        </div>

        {/* Current step detail / error */}
        <div className="border-t border-gray-100 pt-4">
          <AnimatePresence mode="wait">
            {errorStep ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <p className="text-[13px] font-montserrat text-red-500 font-medium">
                  {errorStep.detail}
                </p>
                <button
                  onClick={onAbort}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold font-montserrat rounded-[12px] transition-colors"
                >
                  Wróć do listy blogów
                </button>
              </motion.div>
            ) : activeStep ? (
              <motion.p
                key={activeStep.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-[12px] font-montserrat text-gray-400 animate-pulse"
              >
                {activeStep.detail}
              </motion.p>
            ) : (
              <motion.p
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[13px] font-montserrat text-brand-primary font-semibold text-center"
              >
                ✓ Artykuł wygenerowany! Przekierowuję...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* "Don't close" warning */}
        {!errorStep && activeStep && (
          <p className="mt-3 text-[11px] font-montserrat text-gray-300 text-center">
            Nie zamykaj tej strony podczas generowania.
          </p>
        )}
      </motion.div>
    </motion.div>
    </Portal>
  );
}
