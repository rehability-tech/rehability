"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { dayKey, DAY_NAMES } from "./utils";

interface Props {
  allDays: Date[];
  visibleDays: Date[];
  startIndex: number;
  maxIndex: number;
  handlePrev: () => void;
  handleNext: () => void;
}

export default function TimeGridHeader({
  allDays,
  visibleDays,
  startIndex,
  maxIndex,
  handlePrev,
  handleNext,
}: Props) {
  return (
    <div className="flex border-b-2 border-gray-100 bg-white z-30 shadow-sm relative">
      {/* Paginacja po lewej */}
      <div className="w-[50px] sm:w-[70px] shrink-0 border-r border-gray-100 flex flex-col items-center justify-center gap-2 py-3 bg-gray-50/50 relative z-20">
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white border border-gray-200 shadow-sm text-brand-secondary hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary disabled:cursor-not-allowed"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <button
          onClick={handleNext}
          disabled={startIndex === maxIndex}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white border border-gray-200 shadow-sm text-brand-secondary hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary disabled:cursor-not-allowed"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* Kolumny dni */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="popLayout">
          {visibleDays.map((day) => {
            const isToday = dayKey(day) === dayKey(new Date());
            const dayIndex = allDays.findIndex(
              (d) => dayKey(d) === dayKey(day),
            );

            return (
              <motion.div
                key={dayKey(day)}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 min-w-[200px] sm:min-w-[240px] flex flex-col items-center justify-center py-3 border-r border-gray-100 relative bg-white"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 mb-1">
                  {dayIndex === 0
                    ? "Przyjazd"
                    : dayIndex === allDays.length - 1
                      ? "Wydarzenie"
                      : `Dzień ${dayIndex + 1}`}
                </span>
                <span
                  className={cn(
                    "text-[12px] font-bold uppercase tracking-wide",
                    isToday ? "text-brand-primary" : "text-brand-secondary/70",
                  )}
                >
                  {DAY_NAMES[day.getDay()]}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full text-[16px] font-extrabold mt-0.5 transition-colors",
                    isToday
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-secondary",
                  )}
                >
                  {day.getDate()}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
