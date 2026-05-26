"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ForkKnife,
  Lightning,
  Leaf,
  Megaphone,
  CalendarBlank,
  Sparkle,
  CheckCircle,
  Clock,
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

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; dot: string }
> = {
  MEAL: {
    icon: <ForkKnife size={14} weight="fill" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    dot: "bg-orange-400",
  },
  ACTIVITY: {
    icon: <Lightning size={14} weight="fill" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    dot: "bg-blue-400",
  },
  WELLNESS_FREE: {
    icon: <Leaf size={14} weight="fill" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-400",
  },
  ANNOUNCEMENT: {
    icon: <Megaphone size={14} weight="fill" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    dot: "bg-purple-400",
  },
  GENERAL: {
    icon: <CalendarBlank size={14} weight="fill" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
  ORDER: {
    icon: <Sparkle size={14} weight="fill" />,
    color: "text-[#287D88] bg-[#EBF6F7] border-[#287D88]/30",
    dot: "bg-[#287D88]",
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function TimelineClient({
  timeline,
}: {
  timeline: TimelineItem[];
}) {
  // Grupuj po dniach
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of timeline) {
      const day = new Date(item.startTime).toDateString();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return Array.from(map.entries());
  }, [timeline]);

  if (timeline.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CalendarBlank size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Harmonogram nie został jeszcze opublikowany.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([day, items], gi) => (
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05 }}
        >
          {/* Nagłówek dnia */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {formatDay(items[0].startTime)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Oś czasu */}
          <div className="relative pl-6">
            {/* Linia pionowa */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-3">
              {items.map((item, i) => {
                const cfg =
                  EVENT_TYPE_CONFIG[item.type] ?? EVENT_TYPE_CONFIG["GENERAL"];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.05 + i * 0.04 }}
                    className="relative"
                  >
                    {/* Kropka na osi */}
                    <span
                      className={`absolute -left-6 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white ${cfg.dot} shadow-sm z-10`}
                    />

                    <div
                      className={`bg-white rounded-2xl border p-4 ${
                        item.kind === "order"
                          ? "border-[#287D88]/30 shadow-sm"
                          : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}
                            >
                              {cfg.icon}
                              {item.kind === "order" ? "Twój zabieg" : formatEventLabel(item.type)}
                            </span>
                            {item.kind === "order" && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.isPaid
                                    ? "text-emerald-600 bg-emerald-50"
                                    : "text-amber-600 bg-amber-50"
                                }`}
                              >
                                {item.isPaid ? (
                                  <CheckCircle size={10} weight="fill" />
                                ) : (
                                  <Clock size={10} weight="fill" />
                                )}
                                {item.isPaid ? "Opłacony" : "Do opłacenia"}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#0B3B4C] text-sm mt-1.5">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Godziny */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#0B3B4C] tabular-nums">
                            {formatTime(item.startTime)}
                          </p>
                          {item.endTime && (
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              –{formatTime(item.endTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
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
