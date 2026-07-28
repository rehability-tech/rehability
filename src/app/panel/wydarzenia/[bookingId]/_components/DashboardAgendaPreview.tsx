"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  icon?: string;
  place?: string;
  itemType: "EVENT" | "RESERVATION";
}

// Paleta przyjemnych kolorów dla ikon wydarzeń (stabilnie dobierana po kluczu)
const ICON_COLORS = [
  "bg-emerald-50 text-emerald-500",
  "bg-blue-50 text-blue-500",
  "bg-purple-50 text-purple-500",
  "bg-amber-50 text-amber-500",
  "bg-rose-50 text-rose-500",
  "bg-teal-50 text-teal-500",
  "bg-indigo-50 text-indigo-500",
];

function colorForKey(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ICON_COLORS[h % ICON_COLORS.length];
}

// Definicja animacji kaskadowej (waterfall)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Opóźnienie między pojawieniem się kolejnych elementów
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function DashboardAgendaPreview({
  schedule,
  isPublished,
}: {
  schedule?: ScheduleItem[] | null;
  isPublished?: boolean;
}) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const formatDayHeader = (isoString: string) => {
    try {
      const dateStr = new Date(isoString).toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    } catch {
      return "Dzień";
    }
  };

  // Grupowanie harmonogramu dniami
  const groupedSchedule = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];

    const groups = new Map<string, ScheduleItem[]>();
    for (const item of schedule) {
      const dayKey = new Date(item.startTime).toDateString();
      if (!groups.has(dayKey)) groups.set(dayKey, []);
      groups.get(dayKey)!.push(item);
    }
    return Array.from(groups.entries());
  }, [schedule]);

  const activeDayData = groupedSchedule[activeDayIndex];
  const isFirstDay = activeDayIndex === 0;
  const isLastDay = activeDayIndex === groupedSchedule.length - 1;

  const handlePrev = () => setActiveDayIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () =>
    setActiveDayIndex((prev) => Math.min(groupedSchedule.length - 1, prev + 1));

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="relative rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6 overflow-hidden flex flex-col"
    >
      {/* Dekoracyjne rozmycie w tle */}
      <div className="absolute -top-12 right-1/4 w-44 h-44 rounded-full bg-brand-yellow/30 blur-3xl pointer-events-none" />

      {/* HEADER SEKCJI */}
      <div className="relative flex items-center gap-3 mb-5 border-b border-gray-100 pb-4 shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-brand-yellow/40 text-brand-secondary flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(3,63,99,0.05)]">
          <PhosphorIcons.CalendarBlank size={20} weight="duotone" />
        </div>
        <div>
          <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary leading-tight">
            Twój harmonogram
          </h3>
          <p className="text-[12px] text-brand-secondary/60">
            Spersonalizowany plan Twojego wydarzenia
          </p>
        </div>
      </div>

      {!isPublished || !schedule || schedule.length === 0 ? (
        // STAN PUSTY (SZKIC)
        <div className="relative flex flex-col items-center justify-center py-12 bg-white/40 rounded-2xl border border-white/50 border-dashed">
          <PhosphorIcons.CompassTool
            size={40}
            weight="duotone"
            className="text-brand-secondary/30 mb-4"
          />
          <p className="text-[14px] font-bold text-brand-secondary/80">
            Harmonogram jest w trakcie przygotowywania
          </p>
          <p className="text-[12px] text-brand-secondary/50 mt-1 max-w-[280px] text-center">
            Nasz zespół dopina wszystko na ostatni guzik. Otrzymasz
            powiadomienie, gdy plan będzie gotowy!
          </p>
        </div>
      ) : (
        // ZAWARTOŚĆ HARMONOGRAMU
        <div className="flex flex-col flex-1">
          {/* NAWIGACJA DNI (Mobile First) */}
          <div className="flex items-center justify-between bg-white/60 border border-gray-100 rounded-[18px] p-2 mb-6 shadow-sm">
            <button
              onClick={handlePrev}
              disabled={isFirstDay}
              className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white text-brand-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <PhosphorIcons.CaretLeft size={20} weight="bold" />
            </button>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-0.5">
                Dzień {activeDayIndex + 1} z {groupedSchedule.length}
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold text-brand-secondary text-center leading-tight">
                {activeDayData &&
                  formatDayHeader(activeDayData[1][0].startTime)}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={isLastDay}
              className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white text-brand-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <PhosphorIcons.CaretRight size={20} weight="bold" />
            </button>
          </div>

          {/* LISTA WYDARZEŃ DLA AKTYWNEGO DNIA Z ANIMACJĄ WATERFALL */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
            className="relative flex-1 min-h-[300px]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {activeDayData && (
                <motion.div
                  key={activeDayIndex} // Zmiana klucza resetuje animację
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative border-l-2 border-gray-100 ml-4 space-y-4 pt-2"
                >
                  {activeDayData[1].map((item, i) => {
                    const isPersonalReservation =
                      item.itemType === "RESERVATION";
                    const IconComponent =
                      (PhosphorIcons as any)[item.icon || ""] ||
                      PhosphorIcons.Sparkle;

                    return (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className="relative pl-6"
                      >
                        {/* Kropka na osi czasu */}
                        <div
                          className={cn(
                            "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center shadow-sm",
                            isPersonalReservation
                              ? "bg-brand-primary"
                              : "bg-gray-300",
                          )}
                        />

                        {/* Karta wydarzenia */}
                        <div
                          className={cn(
                            "relative p-4 rounded-[20px] transition-all",
                            isPersonalReservation
                              ? "bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 shadow-[0_4px_12px_rgba(40,125,136,0.1)]"
                              : "bg-white border border-gray-100 shadow-sm",
                          )}
                        >
                          {/* Wyróżnienie "Twoja Rezerwacja" */}
                          {isPersonalReservation && (
                            <div className="absolute top-0 right-4 -translate-y-1/2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <PhosphorIcons.Star size={10} weight="fill" />
                              Twoja Rezerwacja
                            </div>
                          )}

                          <div className="flex items-start gap-3.5">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0",
                                isPersonalReservation
                                  ? "bg-white text-brand-primary shadow-sm"
                                  : colorForKey(item.icon || item.id),
                              )}
                            >
                              <IconComponent
                                size={20}
                                weight={
                                  isPersonalReservation ? "fill" : "duotone"
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p
                                className={cn(
                                  "text-[12px] font-bold uppercase tracking-wider mb-1",
                                  isPersonalReservation
                                    ? "text-brand-primary"
                                    : "text-gray-400",
                                )}
                              >
                                {formatTime(item.startTime)}
                                {item.endTime
                                  ? ` – ${formatTime(item.endTime)}`
                                  : ""}
                              </p>
                              <p
                                className={cn(
                                  "font-jakarta font-bold text-[15px] leading-tight",
                                  isPersonalReservation
                                    ? "text-brand-secondary"
                                    : "text-gray-700",
                                )}
                              >
                                {item.title}
                              </p>
                              {item.place && (
                                <p className="text-[12px] text-gray-500 mt-1.5 flex items-center gap-1">
                                  <PhosphorIcons.MapPin size={14} />
                                  {item.place}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
}
