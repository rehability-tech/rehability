"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  CalendarBlank,
  Users,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface CampData {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  checkedIn: number;
  totalCapacity: number;
  status: string;
  heroImage?: string | null;
  views: number; // <--- DODANE POLE WIDOKÓW
}

interface CampHeroCardProps {
  camp: CampData;
}

export function CampHeroCard({ camp }: CampHeroCardProps) {
  const fillPercentage =
    camp.totalCapacity > 0 ? (camp.checkedIn / camp.totalCapacity) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[24px] p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-8 overflow-hidden shadow-[0_10px_40px_-10px_rgba(3,63,99,0.3)] border border-white/20"
    >
      {/* TŁO KARTY: Zdjęcie */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${camp.heroImage || "/images/static/camp.png"})`,
        }}
      />

      {/* TŁO KARTY: Gradientowy Overlay (Morski -> Żółty) */}
      <div className="absolute inset-0 bg-[#0B3B4C]/80 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/95 via-[#0B3B4C]/90 to-brand-yellow/30 backdrop-blur-[2px]" />

      {/* LEWA STRONA: Informacje tekstowe */}
      <div className="flex flex-col z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-white font-bold">
              Zarządzanie na żywo
            </span>
          </div>
        </div>

        <h2 className="font-jakarta text-[28px] sm:text-[32px] font-bold text-white leading-tight mb-4 drop-shadow-sm">
          {camp.title}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[14px] font-montserrat text-white/80">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-white/60" />
            <span className="font-medium">{camp.location}</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
          <div className="flex items-center gap-2">
            <CalendarBlank size={18} className="text-white/60" />
            <span className="font-medium">{camp.dateRange}</span>
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: Pasek miejsc i licznik odsłon */}
      <div className="flex flex-col justify-end min-w-[240px] z-10 border-t border-white/20 md:border-none pt-6 md:pt-0">
        {/* Szklany panel boczny na ciemnym tle */}
        <div className="bg-white/10 backdrop-blur-md rounded-[16px] p-5 border border-white/20 shadow-lg">
          <div className="flex justify-between items-end mb-2 text-white">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} weight="bold" /> Uczestnicy
            </span>
            <span className="text-[16px] font-bold tabular-nums leading-none">
              {camp.checkedIn}{" "}
              <span className="text-white/50 font-semibold text-[13px]">
                / {camp.totalCapacity}
              </span>
            </span>
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]",
                fillPercentage >= 100 ? "bg-red-400" : "bg-emerald-400",
              )}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>

          {/* ZMIANA: Zamiast buttona, elegancki panel z odsłonami */}
          <div className="w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={14} weight="bold" /> Odsłony
            </span>
            <span className="text-[14px] font-bold text-white tabular-nums leading-none">
              {(camp.views || 0).toLocaleString("pl-PL")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
