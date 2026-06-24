"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  PlayCircle,
  PenNib,
  Users,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

const ACTIONS = [
  {
    icon: MapPin,
    title: "Nowy wyjazd",
    sub: "Dodaj wyjazd do kalendarza",
    href: "/admin/wyjazdy/dodaj",
    gradient: "from-[#287d88] to-[#1a5c66]",
    glow: "rgba(40,125,136,0.45)",
  },
  {
    icon: PlayCircle,
    title: "Nowy kurs",
    sub: "Stwórz program VOD",
    href: "/admin/kursy/dodaj",
    gradient: "from-[#c9993a] to-[#a87928]",
    glow: "rgba(242,217,103,0.45)",
  },
  {
    icon: PenNib,
    title: "Nowy post",
    sub: "Napisz artykuł na blog",
    href: "/admin/blog/dodaj",
    gradient: "from-[#7c3aed] to-[#5b21b6]",
    glow: "rgba(124,58,237,0.35)",
  },
  {
    icon: Users,
    title: "Klienci",
    sub: "Przeglądaj bazę klientów",
    href: "/admin/klienci",
    gradient: "from-[#e11d48] to-[#be123c]",
    glow: "rgba(225,29,72,0.35)",
  },
];

export default function QuickActions() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 px-1">
        <span className="font-montserrat text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
          Szybkie akcje
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.07 }}
              className="flex"
            >
              <Link
                href={action.href}
                className={`group relative flex flex-col justify-between w-full rounded-3xl rounded-tr-none bg-gradient-to-br ${action.gradient} p-5 overflow-hidden transition-all duration-250`}
                style={{
                  boxShadow: `0 4px 20px -4px ${action.glow}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 10px_30px_-6px ${action.glow}`;
                }}
              >
                {/* Świetlna kulka w tle */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl pointer-events-none transition-transform duration-300 group-hover:scale-150" />

                {/* Ikona */}
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-transform duration-200 group-hover:scale-105">
                  <Icon size={19} weight="duotone" className="text-white" />
                </div>

                {/* Tekst */}
                <div className="mt-4">
                  <p className="font-jakarta font-bold text-[14px] text-white leading-tight">
                    {action.title}
                  </p>
                  <p className="font-montserrat text-[10px] text-white/65 mt-0.5 leading-snug">
                    {action.sub}
                  </p>
                </div>

                {/* Strzałka */}
                <ArrowRight
                  size={14}
                  className="absolute bottom-4 right-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
