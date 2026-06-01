"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ForkKnife,
  Lightning,
  Leaf,
  Megaphone,
  CalendarBlank,
  Sparkle,
  CheckCircle,
  Clock,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";

type TimelineItem = {
  id: string;
  kind: "event" | "order";
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  type: string;
  icon: string | null;
  status?: string;
  isPaid?: boolean;
};

// -- KONFIGURACJA WIZUALNA EVENTÓW --
const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; dot: string; border: string }
> = {
  MEAL: {
    icon: <ForkKnife size={14} weight="fill" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    dot: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]",
    border: "border-orange-100",
  },
  ACTIVITY: {
    icon: <Lightning size={14} weight="fill" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    dot: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]",
    border: "border-blue-100",
  },
  WELLNESS_FREE: {
    icon: <Leaf size={14} weight="fill" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
    border: "border-emerald-100",
  },
  ANNOUNCEMENT: {
    icon: <Megaphone size={14} weight="fill" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    dot: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]",
    border: "border-purple-100",
  },
  GENERAL: {
    icon: <CalendarBlank size={14} weight="fill" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
  ORDER: {
    icon: <Sparkle size={14} weight="fill" />,
    color: "text-[#287D88] bg-[#287D88]/10 border-[#287D88]/30",
    dot: "bg-brand-primary shadow-[0_0_8px_rgba(40,125,136,0.6)]",
    border: "border-brand-primary/20",
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generuje klucz formatu YYYY-MM-DD ułatwiający porównanie dat
function getDayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Zwraca ludzką datę: "Czwartek, 13 czerwca"
function formatDayHuman(dayKey: string) {
  return new Date(dayKey).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatEventLabel(type: string): string {
  const labels: Record<string, string> = {
    MEAL: "Posiłek",
    ACTIVITY: "Aktywność",
    WELLNESS_FREE: "Wellness",
    ANNOUNCEMENT: "Komunikat",
    GENERAL: "Program",
  };
  return labels[type] ?? "Program";
}

export default function TimelineClient({
  timeline,
}: {
  timeline: TimelineItem[];
}) {
  // 1. Grupowanie wydarzeń po dacie w formacie (YYYY-MM-DD)
  // Używamy ušememo, by wykonać to tylko raz na load.
  const groupedDays = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of timeline) {
      const dayKey = getDayKey(item.startTime);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(item);
    }
    return Array.from(map.entries()); // Zwraca tablicę [ ["YYYY-MM-DD", [items]], ... ]
  }, [timeline]);

  // 2. Szukanie inteligentnego domyślnego dnia
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    if (groupedDays.length === 0) return;

    // Pobierz "dzisiaj" w tym samym formacie YYYY-MM-DD (np. 2026-06-13)
    const todayKey = getDayKey(new Date().toISOString());

    // Szukamy, czy "dzisiaj" jest na liscie zgrupowanych dni wyjazdu
    const foundIndex = groupedDays.findIndex(([dayKey]) => dayKey === todayKey);

    // Jeśli wyjazd trwa teraz (dziś jest w planie), ustawiamy dzisiejszy dzień.
    // Jeśli nie (wyjazd dopiero będzie), zostaje 0, czyli dzień pierwszy.
    if (foundIndex !== -1) {
      setCurrentDayIndex(foundIndex);
    }
  }, [groupedDays]);

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-sm text-center">
        <CalendarBlank
          size={40}
          className="mb-3 text-brand-secondary/30"
          weight="duotone"
        />
        <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary mb-1">
          Harmonogram pusty
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60">
          Zajrzyj tu bliżej daty wyjazdu, gdy opublikujemy pełny plan.
        </p>
      </div>
    );
  }

  // Aktywny dzień i jego elementy
  const [activeDayKey, activeItems] = groupedDays[currentDayIndex];

  // Nawigacja
  const handlePrev = () => setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () =>
    setCurrentDayIndex((prev) => Math.min(groupedDays.length - 1, prev + 1));

  return (
    <div className="flex flex-col gap-6 relative max-w-3xl mx-auto">
      {/* TŁO: Subtelny glassmorphism */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* -- BELKA NAWIGACJI DNI -- */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-2 z-10 sticky top-4">
        <button
          onClick={handlePrev}
          disabled={currentDayIndex === 0}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-brand-secondary border border-gray-100 shadow-sm hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary transition-all"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50 mb-0.5">
            Dzień {currentDayIndex + 1} z {groupedDays.length}
          </span>
          <span className="font-jakarta text-[15px] font-bold text-brand-secondary">
            {formatDayHuman(activeDayKey)}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentDayIndex === groupedDays.length - 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-brand-secondary border border-gray-100 shadow-sm hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary transition-all"
        >
          <CaretRight size={20} weight="bold" />
        </button>
      </div>

      {/* -- OŚ CZASU (Dla danego dnia) -- */}
      <div className="relative pl-6 sm:pl-8 z-10">
        {/* Linia pionowa, która nie rośnie poza kontener */}
        <div className="absolute left-[13px] sm:left-[21px] top-4 bottom-8 w-[2px] bg-gradient-to-b from-brand-primary/20 via-brand-primary/10 to-transparent rounded-full" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDayKey} // Wywoła re-animację przy zmianie dnia
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeItems.map((item, i) => {
              const cfg =
                EVENT_TYPE_CONFIG[item.type] ?? EVENT_TYPE_CONFIG["GENERAL"];
              const isOrder = item.kind === "order";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative flex items-start gap-4 sm:gap-6"
                >
                  {/* Kropka Osi Czasu (Punkt styczny) */}
                  <span
                    className={`absolute -left-[18px] sm:-left-[18px] top-5 w-4 h-4 rounded-full border-[3px] border-white ${cfg.dot} z-10`}
                  />

                  {/* Karta Wydarzenia (Box) */}
                  <div
                    className={`flex-1 bg-white/70 backdrop-blur-md rounded-2xl border p-4 sm:p-5 transition-shadow hover:shadow-md ${cfg.border}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Nagłówek i Tytuł */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Odznaka Typu */}
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${cfg.color} uppercase tracking-wider`}
                          >
                            {cfg.icon}
                            {isOrder
                              ? "Twój Zabieg"
                              : formatEventLabel(item.type)}
                          </span>

                          {/* Pigułka Płatności (Tylko dla zamówień) */}
                          {isOrder && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                                item.isPaid
                                  ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                                  : "text-amber-600 bg-amber-50 border-amber-100"
                              }`}
                            >
                              {item.isPaid ? (
                                <CheckCircle size={12} weight="bold" />
                              ) : (
                                <Clock size={12} weight="bold" />
                              )}
                              {item.isPaid ? "Opłacone" : "Oczekuje"}
                            </span>
                          )}
                        </div>

                        <h4 className="font-jakarta font-bold text-[16px] text-brand-secondary mt-2 leading-snug">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-[13px] text-brand-secondary/60 mt-1 font-medium leading-relaxed max-w-lg">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Godzina (Prawa strona na desktopie, dolna na mobile) */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-xl h-fit">
                        <Clock
                          size={16}
                          weight="duotone"
                          className="text-brand-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-brand-secondary leading-none">
                            {formatTime(item.startTime)}
                          </span>
                          {item.endTime && (
                            <span className="text-[10px] font-bold text-brand-secondary/40 leading-none mt-0.5">
                              – {formatTime(item.endTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
