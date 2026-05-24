"use client";

import { useMemo } from "react";
import CalendarDayCell from "./CalendarDayCell";
import { POLISH_DAYS, ScheduleEntry, getDayOfMonth } from "./types";

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
    <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-[0_10px_40px_-15px_rgba(3,63,99,0.06)]">
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
        // Elegancki szkielet, który trzyma siatkę 975px
        <div className="grid grid-cols-7 h-[975px] bg-gray-50/30">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className={`border-b border-gray-100/60 p-3 flex flex-col ${i % 7 !== 6 ? "border-r" : ""}`}
            >
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse mb-3 opacity-50" />
              {/* Co drugi kafelek ma udawany wygenerowany wpis */}
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
  );
}
