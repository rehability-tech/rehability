"use client";

import React, { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  ForkKnife,
  Lightning,
  Leaf,
  Megaphone,
  CalendarBlank,
  Sparkle,
  Clock,
  PencilSimple,
  Coffee,
  Barbell,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import type { CampEventType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { deleteEvent } from "@/app/actions/camp-events";
import EventModal, { type EventDraft } from "./EventModal";

export interface SerializedEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  type: CampEventType;
  icon: string | null;
  isPublished: boolean;
  sortOrder: number;
}

interface Props {
  campId: string;
  startDate: string;
  endDate: string;
  initialEvents: SerializedEvent[];
}

const TYPE_STYLE: Record<
  CampEventType,
  { label: string; chip: string; iconBg: string; dot: string; defaultIcon: React.ReactNode; highlight: boolean }
> = {
  GENERAL: {
    label: "Ogólne",
    chip: "bg-brand-secondary/10 text-brand-secondary",
    iconBg: "bg-brand-secondary/10 text-brand-secondary",
    dot: "bg-brand-secondary",
    defaultIcon: <CalendarBlank size={16} weight="duotone" />,
    highlight: false,
  },
  MEAL: {
    label: "Posiłek",
    chip: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-100 text-orange-600",
    dot: "bg-orange-400",
    defaultIcon: <ForkKnife size={16} weight="duotone" />,
    highlight: false,
  },
  ACTIVITY: {
    label: "Aktywność",
    chip: "bg-brand-primary/10 text-brand-primary",
    iconBg: "bg-brand-primary/15 text-brand-primary",
    dot: "bg-brand-primary",
    defaultIcon: <Lightning size={16} weight="duotone" />,
    highlight: true,
  },
  WELLNESS_FREE: {
    label: "Wellness",
    chip: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-emerald-100 text-emerald-600",
    dot: "bg-emerald-400",
    defaultIcon: <Leaf size={16} weight="duotone" />,
    highlight: false,
  },
  ANNOUNCEMENT: {
    label: "Ogłoszenie",
    chip: "bg-brand-yellow/40 text-brand-secondary",
    iconBg: "bg-brand-yellow/40 text-brand-secondary",
    dot: "bg-brand-yellow",
    defaultIcon: <Megaphone size={16} weight="duotone" />,
    highlight: true,
  },
};

export const ICON_OPTIONS: { value: string; label: string; node: React.ReactNode }[] = [
  { value: "ForkKnife", label: "Posiłek", node: <ForkKnife size={20} weight="duotone" /> },
  { value: "Coffee", label: "Kawa", node: <Coffee size={20} weight="duotone" /> },
  { value: "Barbell", label: "Sport", node: <Barbell size={20} weight="duotone" /> },
  { value: "Lightning", label: "Energia", node: <Lightning size={20} weight="duotone" /> },
  { value: "Leaf", label: "Relaks", node: <Leaf size={20} weight="duotone" /> },
  { value: "Sparkle", label: "Spa", node: <Sparkle size={20} weight="duotone" /> },
  { value: "Sun", label: "Plener", node: <Sun size={20} weight="duotone" /> },
  { value: "Megaphone", label: "Ogłoszenie", node: <Megaphone size={20} weight="duotone" /> },
  { value: "CalendarBlank", label: "Ogólne", node: <CalendarBlank size={20} weight="duotone" /> },
];

function iconNodeFor(name: string | null): React.ReactNode | null {
  if (!name) return null;
  const found = ICON_OPTIONS.find((i) => i.value === name);
  return found?.node ?? null;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildDayList(startISO: string, endISO: string): Date[] {
  const start = startOfLocalDay(new Date(startISO));
  const end = startOfLocalDay(new Date(endISO));
  const days: Date[] = [];
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DAY_NAMES = ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."];
const MONTH_NAMES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

export default function TimeGrid({ campId, startDate, endDate, initialEvents }: Props) {
  const [events, setEvents] = useState<SerializedEvent[]>(initialEvents);
  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "create"; day: Date }
    | { mode: "edit"; event: SerializedEvent }
  >({ mode: "closed" });
  const [, startTransition] = useTransition();

  const days = useMemo(() => buildDayList(startDate, endDate), [startDate, endDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const ev of events) {
      const k = dayKey(new Date(ev.startTime));
      const arr = map.get(k);
      if (arr) arr.push(ev);
      else map.set(k, [ev]);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime() ||
          a.sortOrder - b.sortOrder,
      );
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

  const handleDelete = (id: string) => {
    if (!window.confirm("Usunąć ten punkt z harmonogramu?")) return;
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.success("Usunięto punkt harmonogramu");
        setModalState({ mode: "closed" });
      } else {
        toast.error(res.error);
      }
    });
  };

  const initialDraftFor = (state: typeof modalState): EventDraft | null => {
    if (state.mode === "create") {
      const d = state.day;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0);
      return {
        title: "",
        description: "",
        startTime: start.toISOString(),
        endTime: null,
        type: "GENERAL",
        icon: null,
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
      };
    }
    return null;
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:snap-none lg:grid lg:gap-4 lg:overflow-visible"
        style={{
          gridTemplateColumns: `repeat(${days.length}, minmax(260px, 1fr))`,
        }}
      >
        {days.map((day, idx) => {
          const k = dayKey(day);
          const items = eventsByDay.get(k) ?? [];
          const isFirst = idx === 0;
          const isLast = idx === days.length - 1;
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="snap-start shrink-0 w-[80vw] sm:w-[320px] lg:w-auto rounded-3xl rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-brand-secondary/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-secondary/40">
                    Dzień {idx + 1}
                    {isFirst && " · Przyjazd"}
                    {isLast && " · Wyjazd"}
                  </p>
                  <h3 className="font-jakarta text-[16px] font-bold text-brand-secondary leading-tight mt-0.5">
                    {DAY_NAMES[day.getDay()]} {day.getDate()} {MONTH_NAMES[day.getMonth()]}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-brand-secondary/40">
                  {items.length}
                </span>
              </div>

              <div
                className="flex-1 px-3 py-3 space-y-2 min-h-[160px] cursor-pointer group/col"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setModalState({ mode: "create", day });
                  }
                }}
              >
                {items.length === 0 && (
                  <div
                    onClick={() => setModalState({ mode: "create", day })}
                    className="h-full min-h-[120px] flex items-center justify-center text-[12px] text-brand-secondary/30 italic rounded-2xl border border-dashed border-brand-secondary/15 hover:border-brand-primary hover:text-brand-primary transition pointer-events-auto"
                  >
                    Pusty dzień — kliknij, aby dodać punkt
                  </div>
                )}

                {items.map((ev) => {
                  const style = TYPE_STYLE[ev.type];
                  const customIcon = iconNodeFor(ev.icon);
                  return (
                    <motion.button
                      key={ev.id}
                      layout
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ mode: "edit", event: ev });
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl transition group/card relative",
                        style.highlight
                          ? "rounded-3xl rounded-tr-none bg-gradient-to-br from-white to-brand-primary/5 border border-brand-primary/20 shadow-[0_8px_24px_-12px_rgba(40,125,136,0.3)]"
                          : "bg-white/80 border border-brand-secondary/5 hover:border-brand-primary/30 hover:shadow-[0_6px_18px_-8px_rgba(40,125,136,0.2)]",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center",
                            style.iconBg,
                          )}
                        >
                          {customIcon ?? style.defaultIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-secondary/70">
                            <Clock size={11} weight="bold" />
                            <span>{formatTime(ev.startTime)}</span>
                            {ev.endTime && (
                              <>
                                <span className="text-brand-secondary/30">–</span>
                                <span>{formatTime(ev.endTime)}</span>
                              </>
                            )}
                          </div>
                          <p className="font-jakarta font-bold text-[13.5px] text-brand-secondary leading-tight mt-1 truncate">
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", style.chip)}>
                              {style.label}
                            </span>
                            {!ev.isPublished && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary/60">
                                Szkic
                              </span>
                            )}
                          </div>
                        </div>
                        <PencilSimple
                          size={14}
                          weight="bold"
                          className="text-brand-secondary/20 group-hover/card:text-brand-primary transition shrink-0 mt-1"
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={() => setModalState({ mode: "create", day })}
                className="m-3 mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-primary/5 hover:bg-brand-primary text-brand-primary hover:text-white text-[12px] font-bold transition"
              >
                <Plus size={14} weight="bold" />
                Dodaj punkt
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {modalState.mode !== "closed" && (
          <EventModal
            campId={campId}
            initial={initialDraftFor(modalState)!}
            isEdit={modalState.mode === "edit"}
            onClose={() => setModalState({ mode: "closed" })}
            onSaved={handleSaved}
            onDelete={
              modalState.mode === "edit"
                ? () => handleDelete(modalState.event.id)
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
