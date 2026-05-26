"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// ==========================================
// MOCK DATA (Zastąpisz danymi z Prisma)
// ==========================================

const CAMP_ACTIVITIES = [
  {
    id: 1,
    type: "PAYMENT",
    user: "Anna Kowalska",
    text: "Opłaciła resztę kwoty (1200 zł)",
    time: "15 min temu",
    icon: CurrencyCircleDollar,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-100",
  },
  {
    id: 2,
    type: "HEALTH",
    user: "Marta Wiśniewska",
    text: "Wypełniła Kartę Zdrowia",
    time: "2 godz. temu",
    icon: HeartStraight,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-100",
  },
  {
    id: 3,
    type: "SERVICE",
    user: "Joanna Lis",
    text: "Wykupiła masaż (Kobido)",
    time: "Wczoraj, 18:40",
    icon: Sparkle,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-100",
  },
  {
    id: 4,
    type: "NEW_BOOKING",
    user: "Karolina Maj",
    text: "Zarezerwowała miejsce (Przyjaciółka)",
    time: "Wczoraj, 12:15",
    icon: UserPlus,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    id: 5,
    type: "CHECK_IN",
    user: "Piotr Zając",
    text: "Został zameldowany na miejscu",
    time: "2 dni temu",
    icon: CheckCircle,
    color: "text-[#0B3B4C]",
    bg: "bg-gray-100 border-gray-200",
  },
];

const CAMP_SCHEDULE = [
  {
    dayNumber: 1,
    date: "12 Czerwca",
    events: [
      { time: "14:00", title: "Zakwaterowanie", location: "Recepcja główna" },
      {
        time: "16:00",
        title: "Powitanie uczestników",
        location: "Taras nad jeziorem",
      },
      { time: "18:00", title: "Kolacja integracyjna", location: "Restauracja" },
      { time: "20:00", title: "Krąg zapoznawczy", location: "Sala kominkowa" },
    ],
  },
  {
    dayNumber: 2,
    date: "13 Czerwca",
    events: [
      { time: "08:00", title: "Joga poranna (Vinyasa)", location: "Pomost" },
      { time: "09:30", title: "Śniadanie", location: "Restauracja" },
      {
        time: "11:00",
        title: "Warsztaty oddechowe",
        location: "Sala warsztatowa 1",
      },
      { time: "14:00", title: "Obiad", location: "Restauracja" },
      {
        time: "16:00",
        title: "Czas wolny / Strefa SPA",
        location: "Gabinet masażu",
      },
    ],
  },
];

export function TripActivityAndSchedule() {
  const [currentDayIdx, setCurrentDayIdx] = useState(0);
  const currentDay = CAMP_SCHEDULE[currentDayIdx];

  const handlePrevDay = () => {
    if (currentDayIdx > 0) setCurrentDayIdx((prev) => prev - 1);
  };
  const handleNextDay = () => {
    if (currentDayIdx < CAMP_SCHEDULE.length - 1)
      setCurrentDayIdx((prev) => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
      {/* ========================================= */}
      {/* LEWA: Ostatnie aktywności z wyjazdu       */}
      {/* ========================================= */}
      <div className="flex flex-col h-[450px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-[24px] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100/60 bg-white/50">
          <h3 className="font-jakarta text-[18px] font-bold text-[#0B3B4C] leading-none">
            Live Feed: Ten wyjazd
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
          <div className="flex flex-col gap-5">
            {CAMP_ACTIVITIES.map((act, idx) => (
              <div key={act.id} className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                    act.bg,
                    act.color,
                  )}
                >
                  <act.icon size={20} weight="fill" />
                </div>

                <div
                  className={cn(
                    "flex flex-col flex-1 pb-4",
                    idx !== CAMP_ACTIVITIES.length - 1 &&
                      "border-b border-gray-100",
                  )}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold text-[#0B3B4C] text-[14px]">
                      {act.user}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap ml-2">
                      {act.time}
                    </span>
                  </div>
                  <span className="text-gray-500 text-[13px] leading-snug">
                    {act.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* PRAWA: Harmonogram z dniami               */}
      {/* ========================================= */}
      <div className="flex flex-col h-[450px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-[24px] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100/60 bg-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-jakarta text-[18px] font-bold text-[#0B3B4C] leading-none">
            Harmonogram
          </h3>

          {/* Paginacja Dni */}
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full p-1 shadow-sm shrink-0">
            <button
              onClick={handlePrevDay}
              disabled={currentDayIdx === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition text-[#0B3B4C]"
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            <span className="text-[12px] font-bold text-[#0B3B4C] w-[110px] text-center whitespace-nowrap">
              Dzień {currentDay.dayNumber}{" "}
              <span className="text-gray-400 font-normal">
                ({currentDay.date})
              </span>
            </span>

            <button
              onClick={handleNextDay}
              disabled={currentDayIdx === CAMP_SCHEDULE.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition text-[#0B3B4C]"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 pl-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDayIdx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="relative border-l-[3px] border-brand-primary/20 space-y-8 pb-4"
            >
              {currentDay.events.map((ev, i) => (
                <div key={i} className="relative pl-6">
                  {/* Pływająca Kropka na Osi Czasu */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-primary ring-[5px] ring-white/90 shadow-sm" />

                  <div className="flex items-center gap-2 mb-1 mt-[-2px]">
                    <Clock
                      size={14}
                      className="text-brand-primary"
                      weight="bold"
                    />
                    <span className="text-[14px] font-extrabold text-brand-primary tracking-wide">
                      {ev.time}
                    </span>
                  </div>

                  <p className="font-semibold text-[#0B3B4C] text-[15px] mb-1.5 leading-snug">
                    {ev.title}
                  </p>

                  <div className="flex items-center gap-1.5 text-gray-500 text-[12px]">
                    <MapPin
                      size={14}
                      weight="duotone"
                      className="text-gray-400"
                    />
                    <span>{ev.location}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
