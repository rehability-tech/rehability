"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { POLISH_MONTHS } from "./types";

interface Props {
  currentMonth: number;
  currentYear: number;
  totalForMonth: number;
  publishedForMonth: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({
  currentMonth,
  currentYear,
  totalForMonth,
  publishedForMonth,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={onPrev}
          aria-label="Poprzedni miesiąc"
          className="w-9 h-9 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-brand-secondary transition-colors flex items-center justify-center"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <h2 className="px-4 text-[16px] font-jakarta font-bold text-brand-secondary min-w-[140px] text-center">
          {POLISH_MONTHS[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={onNext}
          aria-label="Następny miesiąc"
          className="w-9 h-9 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-brand-secondary transition-colors flex items-center justify-center"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {totalForMonth > 0 && (
        <div className="flex items-center gap-2 text-[11.5px] font-montserrat font-medium text-brand-secondary/60 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
          <span className="font-bold text-brand-primary">
            {publishedForMonth}
          </span>
          <span>z {totalForMonth} opublikowanych</span>
        </div>
      )}
    </div>
  );
}
