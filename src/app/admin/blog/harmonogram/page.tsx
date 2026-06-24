"use client";

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import HarmonogramHero from "./_components/HarmonogramHero";
import CalendarGrid from "./_components/CalendarGrid";
import StatusLegend from "./_components/StatusLegend";
import EntryDetailModal from "./_components/EntryDetailModal";
import { ScheduleEntry } from "./_components/types";

// Z parametru ?date=YYYY-MM-DD... wyciągamy rok i miesiąc (bez przesunięć stref).
function parseYearMonth(
  raw: string | null,
): { year: number; month: number } | null {
  if (!raw) return null;
  const datePart = raw.split("T")[0];
  const [y, m] = datePart.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 };
}

function HarmonogramContent() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const dateParam = searchParams.get("date");

  const today = useMemo(() => new Date(), []);
  const initial = useMemo(
    () => parseYearMonth(dateParam),
    [dateParam],
  );

  const [currentYear, setCurrentYear] = useState(
    initial?.year ?? today.getFullYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(
    initial?.month ?? today.getMonth(),
  );
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(highlightParam);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/blog/schedule?year=${currentYear}&month=${currentMonth}`,
      );
      if (!res.ok) throw new Error();
      setEntries(await res.json());
    } catch {
      toast.error("Nie udało się załadować harmonogramu.");
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Neon gaśnie po chwili — wystarczy, by przyciągnąć wzrok po wejściu z panelu.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 6000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const prevMonth = () => {
    setHighlightId(null);
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setHighlightId(null);
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
  };
  const goToToday = () => {
    setHighlightId(null);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const totalForMonth = entries.length;
  const publishedForMonth = entries.filter(
    (e) => e.status === "PUBLISHED",
  ).length;

  return (
    <div className="relative min-h-screen">
      {/* Brandowe rozmyte akcenty w tle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-28 md:pb-8"
      >
        <HarmonogramHero
          currentMonth={currentMonth}
          currentYear={currentYear}
          totalForMonth={totalForMonth}
          publishedForMonth={publishedForMonth}
          isCurrentMonth={isCurrentMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToToday}
        />

        <CalendarGrid
          currentYear={currentYear}
          currentMonth={currentMonth}
          entries={entries}
          isLoading={isLoading}
          highlightId={highlightId}
          onSelectEntry={setSelectedEntry}
        />

        <StatusLegend />
      </motion.div>

      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}

export default function HarmonogramPage() {
  return (
    <Suspense fallback={null}>
      <HarmonogramContent />
    </Suspense>
  );
}
