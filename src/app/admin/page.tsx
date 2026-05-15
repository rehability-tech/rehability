"use client";

import React from "react";
import {
  Users,
  Tent,
  CalendarCheck,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Aktywne Campy",
    value: "3",
    icon: <Tent size={32} />,
    color: "text-[#287D88]",
    bg: "bg-[#287D88]/10",
  },
  {
    title: "Nowe Zapisy",
    value: "14",
    icon: <Users size={32} />,
    color: "text-[#0B3B4C]",
    bg: "bg-[#0B3B4C]/10",
  },
  {
    title: "Najbliższy wyjazd",
    value: "za 12 dni",
    icon: <CalendarCheck size={32} />,
    color: "text-[#E58B76]",
    bg: "bg-[#E58B76]/10",
  },
  {
    title: "Odwiedziny strony",
    value: "+24%",
    icon: <TrendUp size={32} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default function AdminDashboard() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-10">
        <h1 className="font-jakarta font-bold text-[32px] text-[#0B3B4C]">
          Cześć, Zespole! 👋
        </h1>
        <p className="font-montserrat text-gray-500 text-[15px] mt-1">
          Oto podsumowanie tego, co dzieje się na platformie.
        </p>
      </header>

      {/* KARTY STATYSTYK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-50 flex items-center gap-5"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="font-montserrat text-gray-400 text-[12px] font-semibold uppercase tracking-wider">
                {stat.title}
              </p>
              <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] leading-tight">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* MIEJSCE NA DODATKOWE WIDGETY (np. Ostatnie Zgłoszenia) */}
      <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-50">
        <h3 className="font-jakarta font-bold text-[20px] text-[#0B3B4C] mb-6">
          Ostatnie zgłoszenia
        </h3>
        <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-100 rounded-2xl">
          <p className="font-montserrat text-gray-400 text-[14px]">
            Tutaj wpadnie tabela z najnowszymi zapisami z bazy danych.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
