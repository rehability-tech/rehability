"use client";

import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ArrowCounterClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { POLISH_MONTHS } from "./types";

interface Props {
  currentMonth: number;
  currentYear: number;
  totalForMonth: number;
  publishedForMonth: number;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function HarmonogramHero({
  currentMonth,
  currentYear,
  totalForMonth,
  publishedForMonth,
  isCurrentMonth,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const pct =
    totalForMonth > 0
      ? Math.round((publishedForMonth / totalForMonth) * 100)
      : 0;

  return (
    <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
      {/* Gradient + brandowe poświaty */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
      <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Tytuł */}
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
            <CalendarBlank size={14} weight="fill" className="text-brand-yellow" />
            <span className="text-[10px] uppercase tracking-widest text-white font-bold">
              Plan treści
            </span>
          </div>
          <h1 className="font-jakarta text-3xl md:text-[34px] font-bold text-white leading-tight drop-shadow-sm">
            Harmonogram bloga
          </h1>
          <p className="font-montserrat text-white/70 font-medium text-[13.5px] mt-2.5 leading-relaxed">
            Miesięczny plan artykułów. Kliknij dowolny dzień, aby otworzyć temat
            i zacząć pisać.
          </p>
        </div>

        {/* Nawigacja + postęp */}
        <div className="flex flex-col gap-3 lg:items-end shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl rounded-tr-none p-1.5">
              <button
                onClick={onPrev}
                aria-label="Poprzedni miesiąc"
                className="w-9 h-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <span className="px-2 text-[15px] font-jakarta font-bold text-white min-w-[140px] text-center">
                {POLISH_MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                onClick={onNext}
                aria-label="Następny miesiąc"
                className="w-9 h-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                onClick={onToday}
                className="inline-flex items-center gap-1.5 h-[46px] px-4 rounded-2xl rounded-tr-none bg-white text-brand-secondary text-[12.5px] font-bold font-montserrat shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-transform cursor-pointer"
              >
                <ArrowCounterClockwise
                  size={15}
                  weight="bold"
                  className="text-brand-primary"
                />
                Dziś
              </button>
            )}
          </div>

          {/* Pasek postępu publikacji */}
          {totalForMonth > 0 && (
            <div className="w-full lg:w-[260px] bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl rounded-tr-none px-4 py-2.5">
              <div className="flex items-center justify-between text-[11.5px] font-montserrat font-semibold mb-1.5">
                <span className="text-white/70">Postęp publikacji</span>
                <span className="text-white">
                  <b className="text-brand-yellow">{publishedForMonth}</b> z{" "}
                  {totalForMonth}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-yellow transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
