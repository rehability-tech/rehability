"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleNotch, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  statusMsg?: string | null;
}

// Premium feel: stała szerokość → brak skoku layoutu między "Wygeneruj…" a "Generuję…".
// Glow i shimmer to OSOBNE warstwy nad statycznym tłem — tło nie animuje gradientu,
// nie ma efektu "skakania koloru". Tekst krzyżowo fade'uje przez AnimatePresence.
export default function GenerateSeoButton({
  onClick,
  isGenerating,
  disabled,
  statusMsg,
}: Props) {
  const isDisabled = (disabled && !isGenerating) || isGenerating;

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "group relative inline-flex items-center justify-center",
          "h-[44px] min-w-[220px] px-5 rounded-[12px]",
          "text-[13px] font-bold font-montserrat tracking-tight",
          "overflow-hidden isolate select-none",
          "transition-colors duration-300",
          disabled && !isGenerating
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-brand-primary text-white cursor-pointer",
        )}
      >
        {/* Warstwa 1: pulsujący glow (tylko podczas generowania) */}
        <AnimatePresence>
          {isGenerating && (
            <motion.span
              key="glow"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.5, 1, 0.5],
                boxShadow: [
                  "0 0 0 0 rgba(40,125,136,0)",
                  "0 0 28px 4px rgba(40,125,136,0.85)",
                  "0 0 14px 2px rgba(40,125,136,0.4)",
                ],
              }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-0.5 rounded-[14px] -z-10"
            />
          )}
        </AnimatePresence>

        {/* Warstwa 2: shimmer (delikatny pasek światła sunący w prawo) */}
        <AnimatePresence>
          {isGenerating && (
            <motion.span
              key="shimmer"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden rounded-[12px] pointer-events-none"
            >
              <motion.span
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 0.2,
                }}
                className="absolute top-0 bottom-0 w-[55%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
              />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Warstwa 3: hover halo (subtelny owalny rozblysk pod kursorem, idle) */}
        {!isDisabled && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
          />
        )}

        {/* Warstwa 4: treść — krzyżowe fade'owanie ikon/tekstu, BEZ przesuwania */}
        <span className="relative flex items-center justify-center gap-2 z-10">
          <span className="relative w-[14px] h-[14px] flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {isGenerating ? (
                <motion.span
                  key="spin"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.25 }}
                  className="absolute"
                >
                  <CircleNotch
                    size={14}
                    weight="bold"
                    className="animate-spin"
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="spark"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.25 }}
                  className="absolute"
                >
                  <Sparkle size={14} weight="fill" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <span className="relative h-[18px] flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isGenerating ? "gen" : "idle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                {isGenerating ? "Generuję dane SEO…" : "Wygeneruj SEO przez AI"}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </motion.button>

      <div className="h-[14px] sm:text-right">
        <AnimatePresence mode="wait">
          {statusMsg && (
            <motion.p
              key={statusMsg}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-montserrat text-gray-500"
            >
              {statusMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
