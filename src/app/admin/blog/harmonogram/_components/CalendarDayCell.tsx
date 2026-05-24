"use client";

import { ScheduleEntry, STATUS_DOT, STATUS_CARD } from "./types";

interface Props {
  day: number;
  entry?: ScheduleEntry;
  isWeekend: boolean;
  isToday: boolean;
  isLastInRow: boolean;
  onSelect: (entry: ScheduleEntry) => void;
}

export default function CalendarDayCell({
  day,
  entry,
  isWeekend,
  isToday,
  isLastInRow,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={entry ? () => onSelect(entry) : undefined}
      disabled={!entry}
      className={`min-h-[140px] border-b border-gray-100/80 px-3 pt-3 pb-3 flex flex-col gap-2.5 text-left transition-all ${
        isWeekend ? "bg-gray-50/40" : "bg-white"
      } ${
        entry
          ? "cursor-pointer hover:bg-brand-primary/[0.03] hover:shadow-[inset_0_0_0_1px_rgba(40,125,136,0.1)] focus:outline-none"
          : "cursor-default"
      } ${isLastInRow ? "" : "border-r"} ${isToday ? "bg-brand-primary/[0.02]" : ""}`}
    >
      {/* Numer dnia */}
      <span
        className={`text-[13px] font-bold font-montserrat w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
          isToday
            ? "bg-brand-primary text-white shadow-md"
            : isWeekend
              ? "text-brand-secondary/30"
              : "text-brand-secondary/60"
        }`}
      >
        {day}
      </span>

      {/* Zawartość wygenerowanego wpisu */}
      {entry && (
        <div
          className={`flex-1 w-full rounded-xl border px-3 py-2.5 flex flex-col gap-1.5 transition-all ${
            STATUS_CARD[entry.status]
          } hover:shadow-sm`}
        >
          {/* Tag kategorii */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`}
            />
            <span className="text-[9px] font-bold uppercase tracking-wider font-montserrat text-brand-secondary/60 truncate">
              {entry.category}
            </span>
          </div>

          {/* Tytuł artykułu - nowa czcionka Jakarta */}
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
