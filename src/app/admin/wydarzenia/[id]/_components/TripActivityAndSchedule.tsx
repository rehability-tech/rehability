"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Clock,
  CurrencyCircleDollar,
  HeartStraight,
  Sparkle,
  CaretLeft,
  CaretRight,
  CheckCircle,
  UserPlus,
  MapPin,
  CalendarBlank,
  Info,
  CircleNotch,
  Star,
  User,
} from "@phosphor-icons/react/dist/ssr";
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

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

interface Activity {
  id: string;
  kind: string;
  who: string;
  text: string;
  // Pełny komunikat (z kwotą wpłaty itp.). Dla starych rekordów bywa = tripId.
  meta?: string | null;
  createdAt: string;
}

type ActivityFilter =
  | "ALL"
  | "PAYMENT"
  | "HEALTH_FILLED"
  | "SERVICE_BOUGHT"
  | "OTHER";

const ACTIVITY_FILTERS: { label: string; value: ActivityFilter }[] = [
  { label: "Wszystkie", value: "ALL" },
  { label: "Płatności", value: "PAYMENT" },
  { label: "Zdrowie", value: "HEALTH_FILLED" },
  { label: "SPA", value: "SERVICE_BOUGHT" },
  { label: "Inne", value: "OTHER" },
];

const ACTIVITY_PAGE_SIZE = 5;

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime?: string | null;
  icon?: string | null;
  place?: string | null;
  who?: string | null; // kto zarezerwował (dla itemType === "RESERVATION")
  itemType: "EVENT" | "RESERVATION";
}

function getActivityStyling(kind: string) {
  switch (kind) {
    case "PAYMENT":
      return {
        icon: CurrencyCircleDollar,
        color: "text-emerald-500",
        bg: "bg-emerald-50 border-emerald-100",
      };
    case "HEALTH_FILLED":
      return {
        icon: HeartStraight,
        color: "text-rose-500",
        bg: "bg-rose-50 border-rose-100",
      };
    case "SERVICE_BOUGHT":
      return {
        icon: Sparkle,
        color: "text-purple-500",
        bg: "bg-purple-50 border-purple-100",
      };
    case "SIGNUP":
      return {
        icon: UserPlus,
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-100",
      };
    case "CHECK_IN":
      return {
        icon: CheckCircle,
        color: "text-[#0B3B4C]",
        bg: "bg-gray-100 border-gray-200",
      };
    default:
      return {
        icon: Info,
        color: "text-gray-500",
        bg: "bg-gray-50 border-gray-200",
      };
  }
}

// =========================================
// OSTATNIE LOGI WYDARZENIA (aktywności)
// =========================================
export function TripRecentActivity({ tripId }: { tripId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!tripId) return;
      try {
        setIsLoadingActivities(true);

        // "OTHER" = wszystko, co nie należy do trzech głównych grup
        const qs = new URLSearchParams({
          page: String(activityPage),
          limit: String(ACTIVITY_PAGE_SIZE),
        });
        if (activityFilter !== "ALL" && activityFilter !== "OTHER") {
          qs.set("type", activityFilter);
        }

        const res = await fetch(
          `/api/admin/wydarzenia/${tripId}/activity?${qs.toString()}&t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          let items: Activity[] = data.items ?? [];
          if (activityFilter === "OTHER") {
            items = items.filter(
              (a) =>
                a.kind !== "PAYMENT" &&
                a.kind !== "HEALTH_FILLED" &&
                a.kind !== "SERVICE_BOUGHT",
            );
          }
          setActivities(items);
          setActivityTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        console.error("Błąd pobierania aktywności:", err);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [tripId, activityFilter, activityPage]);

  // Reset paginacji przy zmianie filtra
  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter]);

  return (
    <div className="flex flex-col w-full h-full min-h-[480px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_-10px_rgba(3,63,99,0.1)] rounded-[24px] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="p-5 sm:p-6 border-b border-white/50 relative z-10 flex flex-col gap-4">
        <h3 className="font-jakarta text-[18px] font-bold text-brand-secondary leading-none">
          Ostatnie logi wydarzenia
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_FILTERS.map((f) => {
            const active = activityFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActivityFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap",
                  active
                    ? "bg-brand-primary text-white shadow-[0_4px_12px_-4px_rgba(40,125,136,0.4)]"
                    : "bg-white/70 text-brand-secondary/60 hover:bg-white hover:text-brand-secondary border border-white/60",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[420px] shrink-0 p-4 sm:p-6 relative z-10 overflow-y-auto custom-scrollbar">
        {isLoadingActivities ? (
          <div className="flex flex-col items-center justify-center h-full text-brand-primary">
            <CircleNotch size={32} weight="bold" className="animate-spin mb-2" />
            <p className="text-[12px] font-bold uppercase tracking-wider opacity-60">
              Ładowanie danych...
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-brand-secondary/40">
            <Clock size={32} weight="duotone" className="mb-2 opacity-50" />
            <p className="text-[13px] font-medium text-center">
              Brak aktywności w tej kategorii.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {activities.map((act, idx) => {
              const style = getActivityStyling(act.kind);
              const timeAgo = formatDistanceToNow(new Date(act.createdAt), {
                addSuffix: true,
                locale: pl,
              });
              // `meta` zawiera pełny opis z kwotą; dla starych rekordów bywa = tripId.
              const detail =
                act.meta && act.meta !== tripId ? act.meta : act.text;

              return (
                <div key={act.id} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                      style.bg,
                      style.color,
                    )}
                  >
                    <style.icon size={20} weight="fill" />
                  </div>
                  <div
                    className={cn(
                      "flex flex-col flex-1 pb-4",
                      idx !== activities.length - 1 &&
                        "border-b border-white/50",
                    )}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-brand-secondary text-[14px]">
                        {act.who}
                      </span>
                      <span className="text-[11px] font-bold text-brand-secondary/40 whitespace-nowrap ml-2">
                        {timeAgo}
                      </span>
                    </div>
                    <span className="text-brand-secondary/60 font-medium text-[13px] leading-snug">
                      {detail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginacja na dole */}
      {!isLoadingActivities && activityTotalPages > 1 && (
        <div className="px-5 py-3 border-t border-white/50 flex items-center justify-between relative z-10">
          <button
            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
            disabled={activityPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-white hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white/80 disabled:hover:text-brand-secondary transition-all text-brand-secondary"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <span className="text-[12px] font-bold text-brand-secondary/60">
            Strona <span className="text-brand-primary">{activityPage}</span> z{" "}
            {activityTotalPages}
          </span>
          <button
            onClick={() =>
              setActivityPage((p) => Math.min(activityTotalPages, p + 1))
            }
            disabled={activityPage === activityTotalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-white hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white/80 disabled:hover:text-brand-secondary transition-all text-brand-secondary"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

// =========================================
// HARMONOGRAM (z dniami) — pełna szerokość
// Pokazuje wydarzenia wydarzenia ORAZ rezerwacje usług uczestniczek.
// =========================================
const scheduleContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const scheduleItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const formatScheduleTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const formatDayHeader = (iso: string) => {
  try {
    const s = new Date(iso).toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return "Dzień";
  }
};

export function TripSchedule({ schedule }: { schedule: ScheduleItem[] }) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

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
  const handlePrev = () => setActiveDayIndex((p) => Math.max(0, p - 1));
  const handleNext = () =>
    setActiveDayIndex((p) => Math.min(groupedSchedule.length - 1, p + 1));

  return (
    <section className="relative w-full rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6 overflow-hidden flex flex-col">
      {/* Dekoracyjne rozmycie w tle */}
      <div className="absolute -top-12 right-1/4 w-44 h-44 rounded-full bg-brand-yellow/30 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="relative flex items-center gap-3 mb-5 border-b border-gray-100 pb-4 shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-brand-yellow/40 text-brand-secondary flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(3,63,99,0.05)]">
          <CalendarBlank size={20} weight="duotone" />
        </div>
        <div>
          <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary leading-tight">
            Harmonogram
          </h3>
          <p className="text-[12px] text-brand-secondary/60">
            Plan wydarzenia i rezerwacje uczestniczek
          </p>
        </div>
      </div>

      {groupedSchedule.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-12 bg-white/40 rounded-2xl border border-white/50 border-dashed">
          <CalendarBlank
            size={40}
            weight="duotone"
            className="text-brand-secondary/30 mb-4"
          />
          <p className="text-[14px] font-bold text-brand-secondary/80">
            Brak zaplanowanych wydarzeń
          </p>
          <p className="text-[12px] text-brand-secondary/50 mt-1 max-w-[280px] text-center">
            Dodaj punkty harmonogramu w edytorze, aby pojawiły się tutaj.
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* NAWIGACJA DNI */}
          <div className="flex items-center justify-between bg-white/60 border border-gray-100 rounded-[18px] p-2 mb-6 shadow-sm">
            <button
              onClick={handlePrev}
              disabled={isFirstDay}
              className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white text-brand-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-0.5">
                Dzień {activeDayIndex + 1} z {groupedSchedule.length}
              </span>
              <span className="text-[14px] sm:text-[15px] font-bold text-brand-secondary text-center leading-tight">
                {activeDayData && formatDayHeader(activeDayData[1][0].startTime)}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={isLastDay}
              className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white text-brand-secondary hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>

          {/* LISTA WYDARZEŃ DLA AKTYWNEGO DNIA (waterfall + płynna animacja wysokości) */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
            className="relative min-h-[300px]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {activeDayData && (
                <motion.div
                  key={activeDayIndex}
                  variants={scheduleContainerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="relative border-l-2 border-gray-100 ml-4 space-y-4 pt-2"
                >
                  {activeDayData[1].map((item) => {
                    const isReservation = item.itemType === "RESERVATION";
                    const IconComponent =
                      (PhosphorIcons as any)[item.icon || ""] ||
                      PhosphorIcons.Sparkle;
                    const eventColor = colorForKey(item.icon || item.id);

                    return (
                      <motion.div
                        key={item.id}
                        variants={scheduleItemVariants}
                        className="relative pl-6"
                      >
                        {/* Kropka na osi czasu */}
                        <div
                          className={cn(
                            "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm",
                            isReservation ? "bg-brand-primary" : "bg-gray-300",
                          )}
                        />

                        {/* Karta wydarzenia */}
                        <div
                          className={cn(
                            "relative p-4 rounded-[20px] transition-all",
                            isReservation
                              ? "bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 shadow-[0_4px_12px_rgba(40,125,136,0.1)]"
                              : "bg-white border border-gray-100 shadow-sm",
                          )}
                        >
                          {/* Badge: kto zarezerwował */}
                          {isReservation && (
                            <div className="absolute top-0 right-4 -translate-y-1/2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 max-w-[60%] truncate">
                              <Star size={10} weight="fill" className="shrink-0" />
                              {item.who || "Rezerwacja"}
                            </div>
                          )}

                          <div className="flex items-start gap-3.5">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0",
                                isReservation
                                  ? "bg-white text-brand-primary shadow-sm"
                                  : eventColor,
                              )}
                            >
                              <IconComponent
                                size={20}
                                weight={isReservation ? "fill" : "duotone"}
                              />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p
                                className={cn(
                                  "text-[12px] font-bold uppercase tracking-wider mb-1",
                                  isReservation
                                    ? "text-brand-primary"
                                    : "text-gray-400",
                                )}
                              >
                                {formatScheduleTime(item.startTime)}
                                {item.endTime
                                  ? ` – ${formatScheduleTime(item.endTime)}`
                                  : ""}
                              </p>
                              <p
                                className={cn(
                                  "font-jakarta font-bold text-[15px] leading-tight",
                                  isReservation
                                    ? "text-brand-secondary"
                                    : "text-gray-700",
                                )}
                              >
                                {item.title}
                              </p>
                              {isReservation ? (
                                <p className="text-[12px] text-gray-500 mt-1.5 flex items-center gap-1">
                                  <User size={14} weight="duotone" />
                                  {item.who || "Uczestniczka"}
                                </p>
                              ) : (
                                item.place && (
                                  <p className="text-[12px] text-gray-500 mt-1.5 flex items-center gap-1">
                                    <MapPin size={14} weight="duotone" />
                                    {item.place}
                                  </p>
                                )
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
    </section>
  );
}
