"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

import HarmonogramHeader from "./_components/HarmonogramHeader";
import MonthNavigator from "./_components/MonthNavigator";
import CalendarGrid from "./_components/CalendarGrid";
import StatusLegend from "./_components/StatusLegend";
import EntryDetailModal from "./_components/EntryDetailModal";
import { ScheduleEntry } from "./_components/types";

export default function HarmonogramPage() {
  const today = useMemo(() => new Date(), []);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

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

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
  };

  const totalForMonth = entries.length;
  const publishedForMonth = entries.filter(
    (e) => e.status === "PUBLISHED",
  ).length;

  return (
    <div className="animate-in fade-in duration-500 mx-auto w-full max-w-6xl p-5">
      {/* Przycisk wygenerowany na zawsze usunięty z headera */}
      <HarmonogramHeader />

      <MonthNavigator
        currentMonth={currentMonth}
        currentYear={currentYear}
        totalForMonth={totalForMonth}
        publishedForMonth={publishedForMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
      />

      <CalendarGrid
        currentYear={currentYear}
        currentMonth={currentMonth}
        entries={entries}
        isLoading={isLoading}
        onSelectEntry={setSelectedEntry}
      />

      <StatusLegend />

      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
