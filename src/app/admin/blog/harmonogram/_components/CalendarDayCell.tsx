"use client";

import { ScheduleEntry, STATUS_DOT, STATUS_CARD } from "./types";

interface Props {
  day: number;
  entry?: ScheduleEntry;
  isWeekend: boolean;
  isToday: boolean;
  isLastInRow: boolean;
  isHighlighted?: boolean;
  onSelect: (entry: ScheduleEntry) => void;
}

export default function CalendarDayCell({
  day,
  entry,
  isWeekend,
  isToday,
  isLastInRow,
  isHighlighted,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      data-entry-id={entry?.id}
      onClick={entry ? () => onSelect(entry) : undefined}
      disabled={!entry}
      className={`group min-h-[132px] border-b border-brand-secondary/[0.06] px-2.5 pt-2.5 pb-2.5 flex flex-col gap-2 text-left transition-colors ${
        isToday
          ? "bg-brand-yellow/[0.07]"
          : isWeekend
            ? "bg-brand-secondary/[0.02]"
            : ""
      } ${
        entry
          ? "cursor-pointer hover:bg-brand-primary/[0.04] focus:outline-none"
          : "cursor-default"
      } ${isLastInRow ? "" : "border-r"}`}
    >
      {/* Nagłówek komórki: numer dnia + znacznik „Dziś” */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[12px] font-bold font-montserrat w-7 h-7 flex items-center justify-center rounded-full rounded-tr-none shrink-0 transition-all ${
            isToday
              ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(242,217,103,0.65)]"
              : isWeekend
                ? "text-brand-secondary/35"
                : "text-brand-secondary/55"
          }`}
        >
          {day}
        </span>
        {isToday && (
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full">
            Dziś
          </span>
        )}
      </div>

      {/* Zawartość wygenerowanego wpisu */}
      {entry && (
        <div
          className={`flex-1 w-full rounded-2xl rounded-tr-none border px-2.5 py-2 flex flex-col gap-1.5 transition-all ${
            STATUS_CARD[entry.status]
          } group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_22px_-10px_rgba(40,125,136,0.5)] ${
            isHighlighted ? "animate-neon-highlight" : ""
          }`}
        >
          {/* Tag kategorii */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`}
            />
            <span className="text-[9px] font-bold uppercase tracking-wider font-montserrat text-brand-secondary/60 truncate">
              {entry.category}
            </span>
          </div>

          {/* Tytuł artykułu */}
          <span className="text-[12.5px] font-jakarta font-bold text-brand-secondary leading-[1.3] line-clamp-3">
            {entry.title}
          </span>

          {/* Status dodatkowy */}
          {entry.postId && entry.status !== "PUBLISHED" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary mt-auto pt-1 font-montserrat">
              • Edytowany
            </span>
          )}
        </div>
      )}
    </button>
  );
}
