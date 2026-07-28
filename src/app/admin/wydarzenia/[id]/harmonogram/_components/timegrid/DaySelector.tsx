"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SerializedEvent } from "./types";
import { dayKey, DAY_NAMES } from "./utils";

interface Props {
  days: Date[];
  selectedDayIdx: number;
  setSelectedDayIdx: (idx: number) => void;
  eventsByDay: Map<string, SerializedEvent[]>;
}

export default function DaySelector({
  days,
  selectedDayIdx,
  setSelectedDayIdx,
  eventsByDay,
}: Props) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-sm rounded-[24px] p-1.5 overflow-x-auto custom-scrollbar relative z-10">
      <div className="flex items-stretch min-w-max">
        {days.map((day, idx) => {
          const isSelected = idx === selectedDayIdx;
          const k = dayKey(day);
          const eventsCount = eventsByDay.get(k)?.length || 0;

          return (
            <button
              key={k}
              onClick={() => setSelectedDayIdx(idx)}
              className={cn(
                "relative flex flex-col items-center justify-center px-5 py-3 min-w-[100px] rounded-[18px] transition-colors outline-none group",
                isSelected
                  ? "text-brand-secondary"
                  : "text-brand-secondary/50 hover:text-brand-secondary",
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeDayTab"
                  className="absolute inset-0 bg-white rounded-[18px] shadow-sm border border-white"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5 transition-colors",
                    isSelected
                      ? "text-brand-primary"
                      : "text-brand-secondary/30 group-hover:text-brand-secondary/50",
                  )}
                >
                  {idx === 0
                    ? "Przyjazd"
                    : idx === days.length - 1
                      ? "Wydarzenie"
                      : `Dzień ${idx + 1}`}
                </span>

                <span className="font-jakarta text-[16px] font-extrabold leading-none">
                  {DAY_NAMES[day.getDay()]} {day.getDate()}
                </span>

                <div className="flex items-center gap-1 mt-1.5 min-h-[6px]">
                  {eventsCount > 0 ? (
                    <div className="flex gap-1">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected
                            ? "bg-brand-primary"
                            : "bg-brand-secondary/20",
                        )}
                      />
                    </div>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
