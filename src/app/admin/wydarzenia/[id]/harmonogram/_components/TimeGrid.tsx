"use client";

import React, {
  useMemo,
  useState,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  PencilSimple,
  Users,
  PaperPlaneTilt,
  WarningCircle,
  EyeSlash,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SerializedEvent } from "./timegrid/types";
import {
  buildDayList,
  dayKey,
  layoutOverlappingEvents,
} from "./timegrid/utils";
import { DAYS_TO_SHOW, HOUR_HEIGHT, HOURS } from "./timegrid/constants";
import EventModal, { EventDraft } from "./EventModal";
import ReservationsModal from "./ReservationsModal";
import TimeGridHeader from "./timegrid/TimeGridHeader";
import TimeGridEventCard from "./timegrid/TimeGridEventCard";

type ViewMode = "edit" | "reservations";

export interface TripServiceOption {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Props {
  tripId: string;
  startDate: string;
  endDate: string;
  initialEvents: SerializedEvent[];
  services: TripServiceOption[];
  isSchedulePublished: boolean;
}

export default function TimeGrid({
  tripId,
  startDate,
  endDate,
  initialEvents,
  services,
  isSchedulePublished,
}: Props) {
  const router = useRouter();

  // POTRZEBNE DO REACT PORTAL (aby uniknąć błędu hydratacji SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SYNCHRONIZACJA ZDARZEŃ
  const [events, setEvents] = useState<SerializedEvent[]>(initialEvents);
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [reservationsFor, setReservationsFor] =
    useState<SerializedEvent | null>(null);

  // STATUS PUBLIKACJI I MODAL
  const [isPublished, setIsPublished] = useState(isSchedulePublished);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    setIsPublished(isSchedulePublished);
  }, [isSchedulePublished]);

  // DETEKCJA MOBILE
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // WŁAŚCIWA FUNKCJA PUBLIKACJI (Odpalana z Popupa)
  const confirmPublishToggle = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/wydarzenia/${tripId}/harmonogram/publish`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished: !isPublished }),
          },
        );
        if (!res.ok) throw new Error();

        toast.success(
          isPublished
            ? "Harmonogram został ukryty."
            : "Harmonogram opublikowany!",
        );
        setIsPublished(!isPublished);
        setIsPublishModalOpen(false);
        router.refresh();
      } catch {
        toast.error("Błąd podczas zmiany statusu publikacji.");
      }
    });
  };

  const days = useMemo(
    () => buildDayList(startDate, endDate),
    [startDate, endDate],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentDaysToShow = isMobile ? 1 : DAYS_TO_SHOW;
  const [startIndex, setStartIndex] = useState(0);
  const maxIndex = Math.max(0, days.length - currentDaysToShow);

  useEffect(() => {
    if (startIndex > maxIndex) setStartIndex(maxIndex);
  }, [maxIndex, startIndex]);

  const visibleDays = useMemo(() => {
    return days.slice(startIndex, startIndex + currentDaysToShow);
  }, [days, startIndex, currentDaysToShow]);

  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | {
        mode: "create";
        day: Date;
        defaultTime: string;
        maxTime?: string | null;
      }
    | { mode: "edit"; event: SerializedEvent }
  >({ mode: "closed" });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const ev of events) {
      const k = dayKey(new Date(ev.startTime));
      if (map.has(k)) map.get(k)!.push(ev);
      else map.set(k, [ev]);
    }
    return map;
  }, [events]);

  const handleSaved = (saved: SerializedEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const copy = prev.slice();
      copy[idx] = saved;
      return copy;
    });
    setModalState({ mode: "closed" });
  };

  const handleDelete = (ev: SerializedEvent) => {
    const isBlock = ev.isBookable === true;
    if (
      !window.confirm(
        isBlock
          ? "Usunąć ten blok usług z harmonogramu?"
          : "Usunąć ten punkt z harmonogramu?",
      )
    )
      return;
    const url = isBlock
      ? `/api/admin/wydarzenia/${tripId}/slots/${ev.id}`
      : `/api/admin/wydarzenia/${tripId}/harmonogram/${ev.id}`;
    startTransition(async () => {
      try {
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? "Błąd usuwania.");
          return;
        }
        setEvents((prev) => prev.filter((e) => e.id !== ev.id));
        toast.success("Usunięto pomyślnie");
        setModalState({ mode: "closed" });
      } catch {
        toast.error("Błąd sieci.");
      }
    });
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    let earliestMinutes = 24 * 60;

    visibleDays.forEach((day) => {
      const k = dayKey(day);
      const dayEvents = eventsByDay.get(k) || [];
      dayEvents.forEach((ev) => {
        const d = new Date(ev.startTime);
        const mins = d.getHours() * 60 + d.getMinutes();
        if (mins < earliestMinutes) earliestMinutes = mins;
      });
    });

    const scrollMinutes =
      earliestMinutes < 24 * 60 ? Math.max(0, earliestMinutes - 30) : 8 * 60;

    const offsetPx = (scrollMinutes / 60) * HOUR_HEIGHT;

    setTimeout(() => {
      if (!scrollRef.current) return;
      const gridTop =
        scrollRef.current.getBoundingClientRect().top + window.scrollY;
      const targetY = gridTop + offsetPx - 100;

      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }, 300);
  }, [startIndex]);

  const initialDraftFor = (state: typeof modalState): EventDraft | null => {
    if (state.mode === "create") {
      const d = state.day;
      const [h, m] = state.defaultTime.split(":").map(Number);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      return {
        title: "",
        description: "",
        startTime: start.toISOString(),
        endTime: null,
        type: "GENERAL",
        icon: null,
        maxTime: state.maxTime,
      };
    }
    if (state.mode === "edit") {
      return {
        id: state.event.id,
        title: state.event.title,
        description: state.event.description ?? "",
        startTime: state.event.startTime,
        endTime: state.event.endTime,
        type: state.event.type,
        icon: state.event.icon,
        isBookable: state.event.isBookable,
        capacity: state.event.capacity,
        spotsTaken: state.event.spotsTaken,
      };
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1200px] mx-auto">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Lewa strona: Tryb widoku */}
        <div className="flex bg-brand-secondary/5 p-1 rounded-2xl border border-brand-secondary/5 shadow-inner w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 text-[12.5px] font-bold rounded-xl transition-all",
              viewMode === "edit"
                ? "bg-white text-brand-primary shadow-sm"
                : "text-brand-secondary/55 hover:text-brand-secondary",
            )}
          >
            <PencilSimple size={14} weight="bold" /> Edycja
          </button>
          <button
            type="button"
            onClick={() => setViewMode("reservations")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 text-[12.5px] font-bold rounded-xl transition-all",
              viewMode === "reservations"
                ? "bg-white text-brand-primary shadow-sm"
                : "text-brand-secondary/55 hover:text-brand-secondary",
            )}
          >
            <Users size={14} weight="bold" /> Rezerwacje
          </button>
        </div>

        {/* Prawa strona: Status Publikacji i Dodaj (Tylko w trybie edycji) */}
        {viewMode === "edit" && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* ODDZIELNY ZNACZNIK STATUSU I PRZYCISK */}
            <div className="flex items-center w-full sm:w-auto bg-white border border-gray-200 rounded-2xl px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                <div className="relative flex items-center justify-center">
                  <span
                    className={cn(
                      "absolute w-2.5 h-2.5 rounded-full",
                      isPublished
                        ? "bg-emerald-500 animate-ping opacity-75"
                        : "hidden",
                    )}
                  />
                  <span
                    className={cn(
                      "relative w-2.5 h-2.5 rounded-full",
                      isPublished ? "bg-emerald-500" : "bg-gray-400",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[13px] font-bold",
                    isPublished
                      ? "text-emerald-700"
                      : "text-brand-secondary/60",
                  )}
                >
                  {isPublished ? "Opublikowany" : "Szkic"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                className={cn(
                  "pl-3 text-[13px] font-bold transition-colors",
                  isPublished
                    ? "text-brand-secondary/50 hover:text-rose-600"
                    : "text-brand-primary hover:text-brand-primary/80",
                )}
              >
                {isPublished ? "Cofnij" : "Opublikuj plan"}
              </button>
            </div>

            {/* Przycisk Dodaj */}
            <button
              onClick={() =>
                setModalState({
                  mode: "create",
                  day: visibleDays[0],
                  defaultTime: "10:00",
                })
              }
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-2xl sm:rounded-xl bg-brand-primary text-white text-[13.5px] font-bold shadow-md hover:bg-brand-primary/90 transition-all active:scale-95"
            >
              <Plus size={16} weight="bold" /> Dodaj
            </button>
          </div>
        )}
      </div>

      {/* SIATKA HARMONOGRAMU */}
      <div className="flex flex-col w-full bg-white border border-gray-200 shadow-sm rounded-[24px] overflow-hidden relative">
        <TimeGridHeader
          allDays={days}
          visibleDays={visibleDays}
          startIndex={startIndex}
          maxIndex={maxIndex}
          handlePrev={() => setStartIndex((p) => Math.max(0, p - 1))}
          handleNext={() => setStartIndex((p) => Math.min(maxIndex, p + 1))}
        />
        <div className="flex-1 flex relative bg-white" ref={scrollRef}>
          <div className="w-[50px] sm:w-[70px] shrink-0 sticky left-0 z-30 bg-white border-r border-gray-100">
            <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
              {HOURS.map((hour) => (
                <div
                  key={`axis-${hour}`}
                  className="absolute w-full flex justify-center -mt-2.5"
                  style={{ top: hour * HOUR_HEIGHT }}
                >
                  <span className="text-[11px] font-bold text-gray-400 bg-white px-1 relative z-10">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex relative z-10">
            <div className="absolute inset-0 pointer-events-none z-0">
              {HOURS.map((hour) => (
                <div
                  key={`line-${hour}`}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: hour * HOUR_HEIGHT }}
                />
              ))}
            </div>
            <AnimatePresence mode="popLayout">
              {visibleDays.map((day, idx) => {
                const k = dayKey(day);
                const dayEvents = eventsByDay.get(k) || [];
                const isEven = idx % 2 === 0;

                const sortedDayEvents = [...dayEvents].sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime(),
                );
                const eventLayouts = layoutOverlappingEvents(dayEvents);
                const eventRanges = sortedDayEvents.map((ev) => {
                  const s = new Date(ev.startTime);
                  const e = ev.endTime
                    ? new Date(ev.endTime)
                    : new Date(s.getTime() + 60 * 60 * 1000);
                  return [
                    s.getHours() * 60 + s.getMinutes(),
                    e.getHours() * 60 + e.getMinutes(),
                  ] as [number, number];
                });
                const eventStartMinutes = eventRanges.map(([sm]) => sm);

                const fragments: Array<{ startMin: number; endMin: number }> =
                  [];
                for (let hour = 0; hour < 24; hour++) {
                  const hStart = hour * 60;
                  const hEnd = (hour + 1) * 60;
                  const occInHour = eventRanges
                    .map(
                      ([sm, em]) =>
                        [Math.max(sm, hStart), Math.min(em, hEnd)] as [
                          number,
                          number,
                        ],
                    )
                    .filter(([a, b]) => a < b)
                    .sort((a, b) => a[0] - b[0]);
                  let cursor = hStart;
                  for (const [oStart, oEnd] of occInHour) {
                    if (oStart > cursor)
                      fragments.push({ startMin: cursor, endMin: oStart });
                    cursor = Math.max(cursor, oEnd);
                  }
                  if (cursor < hEnd)
                    fragments.push({ startMin: cursor, endMin: hEnd });
                }

                return (
                  <motion.div
                    key={`col-${k}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "flex-1 border-r border-gray-200 relative group transition-colors min-w-[200px] sm:min-w-[240px]",
                      isEven ? "bg-transparent" : "bg-gray-50/50",
                    )}
                  >
                    <div
                      style={{ height: 24 * HOUR_HEIGHT }}
                      className="w-full relative z-10"
                    >
                      {fragments.map((frag, fragIdx) => {
                        const h = Math.floor(frag.startMin / 60);
                        const m = frag.startMin % 60;
                        const defaultTimeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        const nextIdx = eventStartMinutes.findIndex(
                          (mins) => mins >= frag.startMin,
                        );
                        let maxTime: string | null = null;
                        if (nextIdx !== -1) {
                          const ns = new Date(
                            sortedDayEvents[nextIdx].startTime,
                          );
                          maxTime = `${String(ns.getHours()).padStart(2, "0")}:${String(ns.getMinutes()).padStart(2, "0")}`;
                        }
                        const top = (frag.startMin / 60) * HOUR_HEIGHT;
                        const height =
                          ((frag.endMin - frag.startMin) / 60) * HOUR_HEIGHT;
                        return (
                          <div
                            key={`frag-${fragIdx}`}
                            onClick={() => {
                              if (viewMode === "edit") {
                                setModalState({
                                  mode: "create",
                                  day,
                                  defaultTime: defaultTimeStr,
                                  maxTime,
                                });
                              }
                            }}
                            className={cn(
                              "absolute left-0 right-0 z-10 transition-colors",
                              viewMode === "edit"
                                ? "cursor-pointer hover:bg-brand-primary/10"
                                : "cursor-default",
                            )}
                            style={{ top, height }}
                          />
                        );
                      })}
                      {dayEvents.map((ev) => (
                        <TimeGridEventCard
                          key={ev.id}
                          ev={ev}
                          layout={eventLayouts.get(ev.id)}
                          onClick={(e) => {
                            if (viewMode === "reservations") {
                              if (e.isBookable) setReservationsFor(e);
                              return;
                            }
                            setModalState({ mode: "edit", event: e });
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODALE DANYCH */}
      <AnimatePresence>
        {modalState.mode !== "closed" && (
          <EventModal
            tripId={tripId}
            initial={initialDraftFor(modalState)!}
            isEdit={modalState.mode === "edit"}
            services={services}
            onClose={() => setModalState({ mode: "closed" })}
            onSaved={handleSaved}
            onDelete={
              modalState.mode === "edit"
                ? () => handleDelete(modalState.event)
                : undefined
            }
          />
        )}
        {reservationsFor && (
          <ReservationsModal
            event={reservationsFor}
            onClose={() => setReservationsFor(null)}
          />
        )}
      </AnimatePresence>

      {/* REACT PORTAL: MODAL PUBLIKACJI */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isPublishModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isPending && setIsPublishModalOpen(false)}
                  className="fixed inset-0 z-[9998] bg-brand-secondary/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
                >
                  <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] pointer-events-auto p-6 sm:p-8 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-5",
                        isPublished
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-600",
                      )}
                    >
                      {isPublished ? (
                        <EyeSlash size={32} weight="duotone" />
                      ) : (
                        <PaperPlaneTilt size={32} weight="duotone" />
                      )}
                    </div>

                    <h3 className="font-jakarta text-[22px] font-bold text-brand-secondary mb-3">
                      {isPublished
                        ? "Ukryć harmonogram?"
                        : "Opublikować harmonogram?"}
                    </h3>

                    <p className="text-[14px] text-brand-secondary/70 leading-relaxed mb-6">
                      {isPublished
                        ? "Harmonogram zniknie z paneli uczestników. Nie wpłynie to na już dokonane rezerwacje, ale zablokuje możliwość dodawania nowych, dopóki ponownie nie opublikujesz planu."
                        : "Uczestnicy otrzymają powiadomienie o dostępności planu."}
                    </p>

                    {!isPublished && (
                      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-8 text-left">
                        <WarningCircle
                          size={20}
                          weight="fill"
                          className="text-amber-600 shrink-0 mt-0.5"
                        />
                        <p className="text-[12px] font-medium text-amber-800 leading-snug">
                          <strong>Uwaga:</strong> Jeśli ktoś zarezerwuje usługę
                          w wolnym bloku, nie będziesz mógł usunąć tego bloku
                          ani zmienić jego ram czasowych.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={() => setIsPublishModalOpen(false)}
                        disabled={isPending}
                        className="flex-1 py-3.5 rounded-xl font-bold text-[14px] text-brand-secondary/60 hover:text-brand-secondary hover:bg-gray-50 transition-colors"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={confirmPublishToggle}
                        disabled={isPending}
                        className={cn(
                          "flex-1 py-3.5 rounded-xl font-bold text-[14px] text-white shadow-lg transition-all active:scale-95 disabled:opacity-70",
                          isPublished
                            ? "bg-gray-800 hover:bg-gray-900 hover:shadow-gray-900/30"
                            : "bg-brand-primary hover:bg-brand-primary/90 hover:shadow-brand-primary/40",
                        )}
                      >
                        {isPending
                          ? "Zapisywanie..."
                          : isPublished
                            ? "Tak, ukryj"
                            : "Tak, opublikuj"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
