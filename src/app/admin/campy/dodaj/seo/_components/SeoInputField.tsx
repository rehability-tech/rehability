"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BaseProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  counter?: { value: number; max: number } | null;
  isLoading?: boolean;
  rightSlot?: React.ReactNode;
}

interface InputProps extends BaseProps {
  type?: "input";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

interface TextareaProps extends BaseProps {
  type: "textarea";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

type Props = InputProps | TextareaProps;

// Shimmer + glow: ten sam pattern co BlockEditorCard — przesuwający się gradient
// brand-primary nad inputem + miękka poświata wokół wskazuje, że AI właśnie
// generuje zawartość pola.
const NUM_SHIMMER = 3;
const SHIMMER_DURATION = 2.5;

export default function SeoInputField(props: Props) {
  const { label, hint, counter, isLoading, rightSlot } = props;

  const counterClass = counter
    ? counter.value === 0
      ? "text-gray-300"
      : counter.value <= counter.max
        ? "text-emerald-500"
        : "text-red-500"
    : "";

  const fieldClasses = cn(
    "w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat",
    "focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
    props.type === "textarea" && "resize-y",
    isLoading && "pointer-events-none opacity-60",
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat flex items-center gap-1.5">
          {label}
        </label>
        {counter ? (
          <span
            className={cn("text-[11px] font-bold font-montserrat", counterClass)}
          >
            {counter.value}/{counter.max}
          </span>
        ) : (
          rightSlot
        )}
      </div>

      <div
        className={cn(
          "relative rounded-[12px] transition-shadow duration-300",
          isLoading &&
            "shadow-[0_0_24px_4px_rgba(40,125,136,0.35)] ring-1 ring-brand-primary/40",
        )}
      >
        {props.type === "textarea" ? (
          <textarea
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows ?? 3}
            disabled={isLoading}
            className={fieldClasses}
          />
        ) : (
          <input
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={isLoading}
            className={fieldClasses}
          />
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="shimmer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[12px] overflow-hidden pointer-events-none"
            >
              {Array.from({ length: NUM_SHIMMER }).map((_, i) => (
                <motion.div
                  key={`s-${i}`}
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: SHIMMER_DURATION,
                    ease: "linear",
                    delay: i * (SHIMMER_DURATION / NUM_SHIMMER),
                  }}
                  className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/25 to-transparent"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
