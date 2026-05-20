"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarBlank, CaretLeft, CaretRight, Sparkle,
  CircleNotch, Tag, X, PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Status = "PLANNED" | "IN_PROGRESS" | "PUBLISHED" | "SKIPPED";

interface ScheduleEntry {
  id: string;
  scheduledDate: string;
  title: string;
  topic: string;
  category: string;
  keywords: string[];
  status: Status;
}

const POLISH_MONTHS = [
  "Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień",
];
const POLISH_DAYS = ["Pon", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const STATUS_LABELS: Record<Status, string> = {
  PLANNED:     "Zaplanowany",
  IN_PROGRESS: "W trakcie",
  PUBLISHED:   "Opublikowany",
  SKIPPED:     "Pominięty",
};

const STATUS_DOT: Record<Status, string> = {
  PLANNED:     "bg-brand-primary",
  IN_PROGRESS: "bg-blue-500",
  PUBLISHED:   "bg-green-500",
  SKIPPED:     "bg-gray-300",
};

const STATUS_CARD: Record<Status, string> = {
  PLANNED:     "border-brand-primary/30 bg-brand-primary/5",
  IN_PROGRESS: "border-blue-200 bg-blue-50/50",
  PUBLISHED:   "border-green-200 bg-green-50/50",
  SKIPPED:     "border-gray-200 bg-gray-50/50",
};

function formatDisplayDate(isoString: string): string {
  const [y, m, d] = isoString.split("T")[0].split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getDayOfMonth(isoString: string): number {
  return parseInt(isoString.split("T")[0].split("-")[2], 10);
}

export default function HarmonogramPage() {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear]     = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth]   = useState(today.getMonth());
  const [entries, setEntries]             = useState<ScheduleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isGenerating, setIsGenerating]   = useState(false);

  const entriesByDay = useMemo(() => {
    const map = new Map<number, ScheduleEntry>();
    for (const entry of entries) {
      if (!entry.scheduledDate) continue;
      map.set(getDayOfMonth(entry.scheduledDate), entry);
    }
    return map;
  }, [entries]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/schedule?year=${currentYear}&month=${currentMonth}`);
      if (!res.ok) throw new Error();
      setEntries(await res.json());
    } catch {
      toast.error("Nie udało się załadować harmonogramu.");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/blog/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: currentYear, month: currentMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.created === 0) {
        toast.info("Plan na ten miesiąc już istnieje.");
      } else {
        toast.success(`Wygenerowano ${data.created} artykułów na ${POLISH_MONTHS[currentMonth]} ${currentYear}.`);
        await fetchEntries();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd generowania harmonogramu.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calendar math (Mon-first week)
  const daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  };

  const isToday = (day: number) =>
    today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;

  const isWeekend = (day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      {/* ── NAGŁÓWEK ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-[10px] bg-brand-primary/10 flex items-center justify-center shrink-0">
              <CalendarBlank size={18} weight="fill" className="text-brand-primary" />
            </div>
            <h1 className="text-xl font-jakarta font-bold text-[#0B3B4C]">Harmonogram bloga</h1>
          </div>
          <p className="text-sm text-gray-500 font-montserrat ml-12">
            Miesięczny plan artykułów. Kliknij na zaznaczony dzień, aby zobaczyć temat.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-[12px] hover:bg-[#1E6068] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating
            ? <CircleNotch size={16} weight="bold" className="animate-spin" />
            : <Sparkle size={16} weight="fill" />
          }
          {isGenerating ? "Generuję..." : `Wygeneruj plan na ${POLISH_MONTHS[currentMonth]}`}
        </button>
      </div>

      {/* ── NAWIGACJA MIESIĄCA ── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-[10px] hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <h2 className="text-lg font-jakarta font-bold text-[#0B3B4C]">
          {POLISH_MONTHS[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-[10px] hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      {/* ── KALENDARZ ── */}
      <div className="bg-white border border-gray-100 rounded-[20px] overflow-hidden shadow-sm">
        {/* Nagłówki dni */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {POLISH_DAYS.map((day, i) => (
            <div
              key={day}
              className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider font-montserrat ${
                i >= 5 ? "text-gray-300" : "text-gray-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Komórki dni */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <CircleNotch size={32} weight="bold" className="text-brand-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Puste komórki na start */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/20" />
            ))}

            {/* Dni miesiąca */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const entry = entriesByDay.get(day);
              const weekend = isWeekend(day);
              const isLast  = (firstDayOffset + day) % 7 === 0;

              return (
                <div
                  key={day}
                  onClick={entry ? () => setSelectedEntry(entry) : undefined}
                  className={`min-h-[90px] border-b border-r border-gray-50 p-2 flex flex-col gap-1 transition-colors ${
                    weekend ? "bg-gray-50/30" : ""
                  } ${entry ? "cursor-pointer hover:bg-brand-primary/5" : ""} ${
                    isLast ? "border-r-0" : ""
                  }`}
                >
                  {/* Numer dnia */}
                  <span
                    className={`text-[13px] font-semibold font-montserrat w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
                      isToday(day)
                        ? "bg-brand-primary text-white"
                        : weekend
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    {day}
                  </span>

                  {/* Wpis harmonogramu */}
                  {entry && (
                    <div
                      className={`flex-1 rounded-[8px] border px-2 py-1.5 flex flex-col gap-1 ${STATUS_CARD[entry.status]}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wider font-montserrat text-brand-primary/70 truncate">
                          {entry.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-montserrat font-medium text-[#0B3B4C] leading-tight line-clamp-3">
                        {entry.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LEGENDA ── */}
      <div className="flex flex-wrap items-center gap-5 mt-3 px-1">
        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
            <span className="text-[11px] text-gray-400 font-montserrat">{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* ── OVERLAY WPISU ── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B3B4C]/40 backdrop-blur-sm px-4"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-md rounded-[24px] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zamknij */}
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>

              {/* Data */}
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-montserrat mb-2">
                {formatDisplayDate(selectedEntry.scheduledDate)}
              </p>

              {/* Kategoria */}
              <span className="inline-block text-[11px] font-bold font-montserrat px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary mb-3">
                {selectedEntry.category}
              </span>

              {/* Tytuł */}
              <h3 className="text-[17px] font-jakarta font-bold text-[#0B3B4C] leading-snug mb-3">
                {selectedEntry.title}
              </h3>

              {/* Temat */}
              <p className="text-sm text-gray-500 font-montserrat leading-relaxed mb-4">
                {selectedEntry.topic}
              </p>

              {/* Słowa kluczowe */}
              {selectedEntry.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-5 mb-5 border-b border-gray-100">
                  {selectedEntry.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 text-[11px] font-montserrat text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full"
                    >
                      <Tag size={10} />
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Przyciski */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    router.push(`/admin/blog/dodaj/dane-podstawowe?scheduleId=${selectedEntry.id}`)
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-[#0B3B4C] text-sm font-semibold font-montserrat rounded-[12px] hover:bg-gray-50 transition-colors"
                >
                  <PencilSimple size={16} weight="bold" />
                  Napisz samodzielnie
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/admin/blog/dodaj/dane-podstawowe?scheduleId=${selectedEntry.id}&autogenerate=true`,
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold font-montserrat rounded-[12px] hover:bg-[#1E6068] transition-colors"
                >
                  <Sparkle size={16} weight="fill" />
                  Wygeneruj przez AI
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
