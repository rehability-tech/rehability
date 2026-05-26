"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  BellRinging,
  Info,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

// Mockowane aktualności
const NEWS_ITEMS = [
  {
    id: 1,
    type: "important",
    title: "Harmonogram dostępny!",
    content:
      "Opublikowaliśmy pełny plan wyjazdu. Sprawdź, co dla Ciebie przygotowaliśmy.",
    date: "Dzisiaj",
    icon: (
      <BellRinging size={18} weight="duotone" className="text-brand-primary" />
    ),
  },
  {
    id: 2,
    type: "info",
    title: "Co zabrać ze sobą?",
    content:
      "Przypominamy o zabraniu wygodnego stroju do jogi oraz własnej maty.",
    date: "2 dni temu",
    icon: <Info size={18} weight="duotone" className="text-brand-yellow" />,
  },
  {
    id: 3,
    type: "highlight",
    title: "Nowe zabiegi SPA",
    content: "Dodaliśmy masaż Kobido do naszej oferty. Zapisy już otwarte!",
    date: "Tydzień temu",
    icon: <Sparkle size={18} weight="duotone" className="text-amber-500" />,
  },
];

export default function DashboardNews() {
  return (
    <div className="relative h-full">
      {/* --- GŁÓWNY BRAND PRIMARY REAR GLOW --- */}
      <div
        className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-brand-primary/40 via-brand-primary/10 to-brand-primary/5 blur-[100px] rounded-full animate-pulse-slow"
        style={{ animationDuration: "6s" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="relative rounded-[32px] bg-white/60 backdrop-blur-3xl border border-white/10 shadow-[0_25px_80px_-15px_rgba(3,63,99,0.2)] p-6 lg:p-7 overflow-hidden h-full z-10"
      >
        {/* Dekoracyjny glow w rogu (wewnątrz) */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none" />

        {/* HEADER SEKCIJI */}
        <div className="relative flex items-center gap-3.5 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(3,63,99,0.1)]">
            <Megaphone size={22} weight="duotone" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[16px] lg:text-[17px] text-brand-secondary tracking-tight">
              Aktualności
            </h3>
            <p className="text-[12px] text-brand-secondary/60">
              Wiadomości od organizatora
            </p>
          </div>
        </div>

        {/* LISTA AKTUALNOŚCI */}
        <div className="relative flex flex-col gap-4.5">
          {NEWS_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 p-4 rounded-3xl bg-gradient-to-br from-white via-white/80 to-white/60 hover:bg-white/100 border border-transparent hover:border-gray-50 transition-all duration-300 shadow-[0_12px_25px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.12)]"
            >
              {/* IKONA (WŁASNĄ PIGUŁKĄ) */}
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-100/60 border border-gray-100/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.04)]">
                {item.icon}
              </div>

              {/* TREŚĆ */}
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h4 className="font-jakarta font-semibold text-[13.5px] lg:text-[14px] text-brand-secondary leading-snug tracking-tight">
                    {item.title}
                  </h4>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40 font-montserrat">
                    {item.date}
                  </span>
                </div>
                <p className="text-[12px] lg:text-[12.5px] text-brand-secondary/80 leading-relaxed font-montserrat pr-4 line-clamp-2">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
