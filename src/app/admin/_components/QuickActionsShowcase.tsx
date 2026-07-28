"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  PlayCircle,
  PenNib,
  Users,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";

const ACTIONS = [
  {
    icon: MapPin,
    title: "Nowe wydarzenie",
    sub: "Dodaj wydarzenie do kalendarza",
    href: "/admin/wydarzenia/dodaj",
    stat: "2 nadchodzące",
    gradient: "from-[#287d88] to-[#1a5c66]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
    statClass: "text-brand-primary bg-brand-primary/10",
  },
  {
    icon: PlayCircle,
    title: "Nowy kurs",
    sub: "Stwórz program VOD",
    href: "/admin/kursy/dodaj",
    stat: "12 kursantów",
    gradient: "from-[#c9993a] to-[#a87928]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
    statClass: "text-amber-700 bg-amber-100",
  },
  {
    icon: PenNib,
    title: "Nowy post",
    sub: "Napisz artykuł na blog",
    href: "/admin/blog/dodaj/dane-podstawowe",
    stat: "3 zaplanowane",
    gradient: "from-[#7c3aed] to-[#5b21b6]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)]",
    statClass: "text-violet-700 bg-violet-50",
  },
  {
    icon: Users,
    title: "Klienci",
    sub: "Przeglądaj bazę klientów",
    href: "/admin/klienci",
    stat: "47 łącznie",
    gradient: "from-[#e11d48] to-[#be123c]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(225,29,72,0.5)]",
    statClass: "text-rose-600 bg-rose-50",
  },
];

export default function QuickActionsShowcase() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <span className="font-montserrat text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 px-1">
        Szybkie akcje
      </span>

      <div className="flex flex-col gap-3 flex-1">
        {ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
              className="flex-1"
            >
              <Link
                href={a.href}
                className="group relative flex items-center gap-4 h-full min-h-[72px] rounded-3xl rounded-tr-none bg-gradient-to-br from-white/75 to-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_4px_18px_-8px_rgba(3,63,99,0.10)] px-5 py-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(3,63,99,0.20)]"
              >
                {/* Kolorowa gradientowa poświata za szkłem */}
                <div className={`absolute -left-6 -top-6 w-28 h-28 rounded-full bg-gradient-to-br ${a.gradient} opacity-20 blur-2xl pointer-events-none transition-all duration-300 group-hover:opacity-35`} />
                {/* Żółta poświata na hover */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-yellow/0 blur-2xl rounded-full pointer-events-none transition-all duration-300 group-hover:bg-brand-yellow/40" />

                {/* Ikona w gradientowym kafelku */}
                <div className={`relative w-12 h-12 rounded-2xl rounded-tr-none bg-gradient-to-br ${a.gradient} ${a.iconShadow} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={22} weight="duotone" className="text-white" />
                </div>

                {/* Tytuł + opis */}
                <div className="relative flex-1 min-w-0">
                  <p className="font-jakarta font-bold text-[14.5px] text-brand-secondary leading-tight group-hover:text-brand-primary transition-colors">
                    {a.title}
                  </p>
                  <p className="font-montserrat text-[10.5px] text-brand-secondary/45 mt-0.5">
                    {a.sub}
                  </p>
                </div>

                {/* Stat + strzałka */}
                <div className="relative flex flex-col items-end gap-2 shrink-0">
                  <ArrowUpRight
                    size={17}
                    className="text-brand-secondary/25 transition-all group-hover:text-brand-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${a.statClass}`}>
                    {a.stat}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
