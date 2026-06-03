"use client";

import { useMemo } from "react";
import CalendarDayCell from "./CalendarDayCell";
import {
  POLISH_DAYS,
  ScheduleEntry,
  STATUS_CARD,
  STATUS_DOT,
  STATUS_LABELS,
  getDateParts,
  getDayOfMonth,
} from "./types";

interface Props {
  currentYear: number;
  currentMonth: number;
  entries: ScheduleEntry[];
  isLoading: boolean;
  onSelectEntry: (entry: ScheduleEntry) => void;
}

export default function CalendarGrid({
  currentYear,
  currentMonth,
  entries,
  isLoading,
  onSelectEntry,
}: Props) {
  const today = new Date();

  const entriesByDay = useMemo(() => {
    const map = new Map<number, ScheduleEntry>();
    for (const entry of entries) {
      if (!entry.scheduledDate) continue;
      map.set(getDayOfMonth(entry.scheduledDate), entry);
    }
    return map;
  }, [entries]);

  // Posortowana lista wpisów dla mobilnej agendy (tylko dni z wpisami).
  const sortedEntries = useMemo(
    () =>
      [...entries]
        .filter((e) => e.scheduledDate)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [entries],
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset =
    (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day;

  const isWeekend = (day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  return (
    <>
      {/* ─── MOBILE: agenda (tylko dni z wpisami) ─── */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl bg-gray-100 animate-pulse opacity-50"
              />
            ))}
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="rounded-3xl rounded-tr-none border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm font-montserrat font-medium text-brand-secondary/50">
              Brak zaplanowanych artykułów w tym miesiącu.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedEntries.map((entry) => {
              const { day, weekday } = getDateParts(entry.scheduledDate);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEntry(entry)}
                    className={`w-full flex items-stretch gap-3 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${STATUS_CARD[entry.status]}`}
                  >
                    {/* Data */}
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/70 py-1.5 border border-white/80">
                      <span className="text-[18px] font-jakarta font-bold leading-none text-brand-secondary">
                        {day}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider font-montserrat text-brand-secondary/40">
                        {weekday}
                      </span>
                    </div>

                    {/* Treść */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`}
                        />
                        <span className="truncate text-[9px] font-bold uppercase tracking-wider font-montserrat text-brand-secondary/60">
                          {entry.category}
                        </span>
                      </div>
                      <span className="text-[13.5px] font-jakarta font-bold leading-snug text-brand-secondary line-clamp-2">
                        {entry.title}
                      </span>
                      <span className="text-[10px] font-montserrat font-semibold text-brand-secondary/40">
                        {STATUS_LABELS[entry.status]}
                        {entry.postId && entry.status !== "PUBLISHED"
                          ? " · Edytowany"
                          : ""}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ─── DESKTOP: kalendarz 7-kolumnowy ─── */}
      <div className="hidden sm:block bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-[0_10px_40px_-15px_rgba(3,63,99,0.06)]">
        {/* Nagłówki dni */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {POLISH_DAYS.map((day, i) => (
            <div
              key={day}
              className={`py-3.5 text-center text-[10px] font-bold uppercase tracking-wider font-montserrat ${
                i >= 5 ? "text-gray-400" : "text-brand-secondary/60"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Komórki dni */}
        {isLoading ? (
          <div className="grid grid-cols-7 h-[975px] bg-gray-50/30">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={`border-b border-gray-100/60 p-3 flex flex-col ${i % 7 !== 6 ? "border-r" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse mb-3 opacity-50" />
                {i % 2 !== 0 && i > 3 && i < 28 && (
                  <div className="w-full h-[80px] bg-gray-100 rounded-xl animate-pulse opacity-40" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 bg-gray-50/30 min-h-[975px] content-start">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                key={`pad-${i}`}
                aria-hidden
                className="min-h-[140px] border-b border-r border-gray-100/60 bg-gray-50/50"
              />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <CalendarDayCell
                key={day}
                day={day}
                entry={entriesByDay.get(day)}
                isWeekend={isWeekend(day)}
                isToday={isToday(day)}
                isLastInRow={(firstDayOffset + day) % 7 === 6}
                onSelect={onSelectEntry}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
