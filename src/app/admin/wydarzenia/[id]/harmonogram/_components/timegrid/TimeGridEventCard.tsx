// timegrid/TimeGridEventCard.tsx
import React from "react";
import { SerializedEvent } from "./types";
import { HOUR_HEIGHT } from "./constants";
import type { EventLayout } from "./utils";
import { cn } from "@/lib/utils";

import {
  Sparkle,
  BowlFood,
  PersonSimpleRun,
  Drop,
  Megaphone,
  Calendar,
  Lock,
  Users,
} from "@phosphor-icons/react/dist/ssr";

function getIconForType(type: string, iconKey: string | null) {
  if (iconKey === "Sparkle") return <Sparkle size={14} weight="fill" />;
  if (type === "MEAL") return <BowlFood size={14} weight="fill" />;
  if (type === "ACTIVITY") return <PersonSimpleRun size={14} weight="fill" />;
  if (type === "WELLNESS_FREE") return <Drop size={14} weight="fill" />;
  if (type === "ANNOUNCEMENT") return <Megaphone size={14} weight="fill" />;
  return <Calendar size={14} weight="fill" />;
}

export default function TimeGridEventCard({
  ev,
  onClick,
  layout,
}: {
  ev: SerializedEvent;
  onClick: (e: SerializedEvent) => void;
  layout?: EventLayout;
}) {
  const start = new Date(ev.startTime);
  const end = ev.endTime
    ? new Date(ev.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const top = startHour * HOUR_HEIGHT;
  const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24);

  const isBlock = ev.isBookable;
  const spotsTaken = ev.spotsTaken ?? 0;
  const capacity = ev.capacity ?? 0;
  const hasReservations = isBlock && spotsTaken > 0;
  const fillRatio = capacity > 0 ? spotsTaken / capacity : 0;
  const fillColor =
    fillRatio >= 1
      ? "bg-rose-500"
      : fillRatio >= 0.66
        ? "bg-amber-500"
        : "bg-emerald-500";

  const GAP_PX = 2;
  const horizontalStyle = layout
    ? {
        left: `calc(${(layout.col / layout.total) * 100}% + ${GAP_PX / 2}px)`,
        width: `calc(${100 / layout.total}% - ${GAP_PX}px)`,
      }
    : { left: undefined, right: undefined, width: undefined };
  const positionClass = layout ? "" : "left-1 right-1 sm:left-2 sm:right-2";

  if (isBlock) {
    return (
      <div
        onClick={() => onClick(ev)}
        className={cn(
          "absolute rounded-xl cursor-pointer shadow-sm border-2 transition-all z-20 overflow-hidden flex flex-col",
          positionClass,
          ev.isOpen
            ? "bg-brand-yellow/10 border-brand-yellow/60 hover:border-brand-yellow"
            : "bg-brand-primary/10 border-brand-primary/60 hover:border-brand-primary",
          "hover:shadow-md hover:-translate-y-[1px]",
        )}
        style={{ top: `${top}px`, height: `${height}px`, ...horizontalStyle }}
      >
        <div className="flex flex-col h-full p-2 gap-1 min-h-0">
          <div className="flex items-start gap-1.5 text-brand-secondary shrink-0">
            <div
              className={cn(
                "p-1 rounded-md shrink-0",
                ev.isOpen
                  ? "bg-white text-amber-600"
                  : "bg-white text-brand-primary",
              )}
            >
              <Drop size={14} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-jakarta font-bold text-[12px] truncate leading-tight">
                {ev.title}
              </p>
              <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-wider tabular-nums">
                {start.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" – "}
                {end.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {hasReservations && (
              <div
                className="shrink-0 w-5 h-5 rounded-full bg-white border border-brand-secondary/10 flex items-center justify-center"
                title="Blok ma aktywne rezerwacje — nie można usunąć"
              >
                <Lock
                  size={10}
                  weight="fill"
                  className="text-brand-secondary/70"
                />
              </div>
            )}
          </div>

          {/* LISTA REZERWACJI (zamiast "Każda usługa z katalogu") */}
          {height >= 72 && (
            <div className="flex-1 min-h-0 overflow-hidden">
              {ev.isOpen ? (
                ev.reservations && ev.reservations.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {ev.reservations.slice(0, 3).map((res) => (
                      <div
                        key={res.id}
                        className="flex items-center justify-between gap-1 text-[10px] font-bold bg-white/70 rounded-md px-1.5 py-0.5"
                      >
                        <span className="truncate text-brand-secondary">
                          {res.bookerName}
                        </span>
                        <span className="truncate text-brand-primary shrink-0 max-w-[65px]">
                          {res.serviceName}
                        </span>
                      </div>
                    ))}
                    {ev.reservations.length > 3 && (
                      <span className="text-[9px] text-brand-secondary/50 px-1">
                        +{ev.reservations.length - 3} więcej…
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700/80 bg-white/60 rounded-md px-1.5 py-1">
                    <Sparkle size={10} weight="fill" />
                    Brak rezerwacji
                  </div>
                )
              ) : ev.services && ev.services.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {ev.services.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-1 text-[10px] font-bold bg-white/70 rounded-md px-1.5 py-0.5"
                    >
                      <span className="truncate text-brand-secondary">
                        {s.name}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums shrink-0",
                          s.spotsTaken >= s.capacity
                            ? "text-rose-600"
                            : "text-brand-primary",
                        )}
                      >
                        {s.spotsTaken}/{s.capacity}
                      </span>
                    </div>
                  ))}
                  {ev.services.length > 3 && (
                    <span className="text-[9px] text-brand-secondary/50 px-1">
                      +{ev.services.length - 3} więcej…
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {capacity > 0 && (
            <div className="mt-auto pt-1 flex items-center gap-1.5 shrink-0">
              <Users
                size={10}
                weight="bold"
                className="text-brand-secondary/60"
              />
              <div className="flex-1 h-1 rounded-full bg-white/70 overflow-hidden">
                <div
                  className={cn("h-full transition-all", fillColor)}
                  style={{ width: `${Math.min(100, fillRatio * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold tabular-nums text-brand-secondary/80 shrink-0">
                {spotsTaken}/{capacity}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(ev)}
      className={cn(
        "absolute rounded-xl p-2 cursor-pointer shadow-sm border transition-all z-20 overflow-hidden bg-white border-brand-secondary/10 hover:border-brand-primary hover:shadow-md hover:-translate-y-[1px]",
        positionClass,
      )}
      style={{ top: `${top}px`, height: `${height}px`, ...horizontalStyle }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1.5 mb-1 text-brand-secondary">
          <div className="p-1 rounded-md bg-brand-primary/5 text-brand-primary">
            {getIconForType(ev.type, ev.icon)}
          </div>
          <span className="font-jakarta font-bold text-[12px] truncate leading-tight">
            {ev.title}
          </span>
        </div>
        <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-widest pl-1">
          {start.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" – "}
          {end.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
