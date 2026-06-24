"use client";

import { useEffect, useMemo } from "react";
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
  highlightId?: string | null;
  onSelectEntry: (entry: ScheduleEntry) => void;
}

export default function CalendarGrid({
  currentYear,
  currentMonth,
  entries,
  isLoading,
  highlightId,
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

  // Po wczytaniu miesiąca przewiń wskazany (neonowy) wpis do środka ekranu.
  useEffect(() => {
    if (!highlightId || isLoading) return;
    const raf = requestAnimationFrame(() => {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-entry-id="${CSS.escape(highlightId)}"]`,
      );
      // Wybierz widoczny wariant (desktop lub mobile — drugi ma display:none).
      const visible = Array.from(candidates).find(
        (el) => el.offsetParent !== null,
      );
      visible?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightId, isLoading, entries]);

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
                className="h-[92px] rounded-2xl rounded-tr-none bg-white/50 border border-white/60 animate-pulse"
              />
            ))}
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="rounded-3xl rounded-tr-none border border-white/60 bg-white/70 backdrop-blur-xl px-6 py-12 text-center shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)]">
            <p className="text-sm font-montserrat font-medium text-brand-secondary/50">
              Brak zaplanowanych artykułów w tym miesiącu.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedEntries.map((entry) => {
              const { day, weekday } = getDateParts(entry.scheduledDate);
              const todayMobile = isToday(day);
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-entry-id={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`w-full flex items-stretch gap-3 rounded-2xl rounded-tr-none border px-3 py-3 text-left transition-all active:scale-[0.99] shadow-[0_10px_30px_-20px_rgba(3,63,99,0.45)] ${STATUS_CARD[entry.status]} ${
                      entry.id === highlightId ? "animate-neon-highlight" : ""
                    }`}
                  >
                    {/* Data */}
                    <div
                      className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl rounded-tr-none py-1.5 border ${
                        todayMobile
                          ? "bg-brand-primary border-brand-yellow/30 shadow-[0_4px_12px_-2px_rgba(242,217,103,0.6)]"
                          : "bg-white/70 border-white/80"
                      }`}
                    >
                      <span
                        className={`text-[18px] font-jakarta font-bold leading-none ${
                          todayMobile ? "text-white" : "text-brand-secondary"
                        }`}
                      >
                        {day}
                      </span>
                      <span
                        className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider font-montserrat ${
                          todayMobile ? "text-white/70" : "text-brand-secondary/40"
                        }`}
                      >
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
      <div className="hidden sm:block rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)]">
        {/* Nagłówki dni */}
        <div className="grid grid-cols-7 border-b border-brand-secondary/[0.06] bg-white/40">
          {POLISH_DAYS.map((day, i) => (
            <div
              key={day}
              className={`py-3.5 text-center text-[10px] font-bold uppercase tracking-wider font-montserrat ${
                i >= 5 ? "text-brand-primary/50" : "text-brand-secondary/55"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Komórki dni */}
        {isLoading ? (
          <div className="grid grid-cols-7 h-[924px]">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={`border-b border-brand-secondary/[0.05] p-3 flex flex-col ${i % 7 !== 6 ? "border-r" : ""}`}
              >
                <div className="w-7 h-7 rounded-full rounded-tr-none bg-brand-secondary/10 animate-pulse mb-3" />
                {i % 2 !== 0 && i > 3 && i < 28 && (
                  <div className="w-full h-[80px] bg-brand-secondary/[0.06] rounded-xl animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 min-h-[924px] content-start">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                key={`pad-${i}`}
                aria-hidden
                className="min-h-[132px] border-b border-r border-brand-secondary/[0.05] bg-brand-secondary/[0.015]"
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
                isHighlighted={
                  !!highlightId && entriesByDay.get(day)?.id === highlightId
                }
                onSelect={onSelectEntry}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
