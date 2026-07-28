"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CalendarBlank,
  Users,
  Eye,
  Coins,
  PencilSimple,
  ChatCircleDots,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface TripData {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  checkedIn: number;
  totalCapacity: number;
  price: number;
  status: string;
  heroImage?: string | null;
  views: number;
}

interface TripHeroCardProps {
  trip: TripData;
}

export function TripHeroCard({ trip }: TripHeroCardProps) {
  const router = useRouter();
  const fillPercentage =
    trip.totalCapacity > 0 ? (trip.checkedIn / trip.totalCapacity) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-[28px] p-6 sm:p-8 flex flex-col lg:flex-row justify-between gap-8 overflow-hidden shadow-[0_12px_40px_-15px_rgba(3,63,99,0.25)] border border-white/20"
    >
      {/* TŁO KARTY: Zdjęcie */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: `url(${trip.heroImage || "/images/static/camp.png"})`,
        }}
      />

      {/* TŁO KARTY: Inteligentny, luksusowy miks nakładek */}
      <div className="absolute inset-0 bg-brand-secondary/75 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/90 via-brand-secondary/85 to-brand-yellow/20 backdrop-blur-[1px]" />

      {/* LEWA STRONA: Główne informacje o wydarzeniu */}
      <div className="flex flex-col z-10 justify-center items-start">
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-white font-bold">
              Zarządzanie Live
            </span>
          </div>
        </div>

        <h2 className="font-jakarta text-2xl sm:text-4xl font-bold text-white leading-tight mb-4 drop-shadow-sm max-w-2xl">
          {trip.title}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[13.5px] font-medium text-white/80 mb-6">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-brand-yellow/80" />
            <span>{trip.location}</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
          <div className="flex items-center gap-2">
            <CalendarBlank size={18} className="text-white/60" />
            <span>{trip.dateRange}</span>
          </div>
        </div>

        {/* --- PRZYCISKI AKCJI POD TEKSTEM Z DELIKATNĄ ZŁOTĄ POŚWIATĄ --- */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/wydarzenia/dodaj/edytor-tresci?id=${trip.id}`)
            }
            className="group relative inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-[13px] shadow-md hover:bg-white/20 hover:border-white/20 transition-all duration-300 overflow-hidden"
          >
            {/* Delikatna złota sfera aktywowana na hover */}
            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/0 rounded-full blur-md pointer-events-none group-hover:bg-brand-yellow/30 transition-colors duration-300" />

            <PencilSimple
              size={16}
              weight="bold"
              className="relative z-10 text-white/80 group-hover:text-white group-hover:rotate-12 transition-all duration-300"
            />
            <span className="relative z-10 tracking-wide text-white/90 group-hover:text-white transition-colors">
              Edytuj wydarzenie
            </span>
          </button>
        </div>
      </div>

      {/* PRAWA STRONA: Szklany widget statystyk (Cena, Uczestnicy, Odsłony) */}
      <div className="flex flex-col justify-end min-w-[260px] lg:max-w-[320px] w-full z-10 border-t border-white/10 lg:border-none pt-6 lg:pt-0">
        <div className="bg-white/10 backdrop-blur-xl rounded-[22px] p-5 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Mikro żółta poświata wewnątrz panelu bocznego dla głębi */}
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-brand-yellow/20 rounded-full blur-xl pointer-events-none" />

          {/* SEKCJA 1: Licznik uczestników */}
          <div className="flex justify-between items-end mb-2 text-white">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} weight="bold" /> Uczestnicy
            </span>
            <span className="text-[16px] font-bold tabular-nums leading-none">
              {trip.checkedIn}{" "}
              <span className="text-white/40 font-semibold text-[13px]">
                / {trip.totalCapacity}
              </span>
            </span>
          </div>

          {/* Progres napełnienia */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_currentColor]",
                fillPercentage >= 100 ? "bg-brand-yellow" : "bg-emerald-400",
              )}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>

          {/* Dwa kafelki dolne: Cena i Odsłony */}
          <div className="flex flex-col gap-2">
            {/* Kafelek finansowy wydarzenia */}
            <div className="flex items-center justify-between gap-2 py-2 px-3 bg-white/5 rounded-xl border border-white/5 text-white">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                <Coins size={14} weight="bold" /> Cena katalogowa
              </span>
              <span className="text-[14px] font-bold tracking-tight">
                {trip.price.toLocaleString("pl-PL")} zł
              </span>
            </div>

            {/* Kafelek odsłon */}
            <div className="flex items-center justify-between gap-2 py-2 px-3 bg-white/5 rounded-xl border border-white/5 text-white">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={14} weight="bold" /> Odsłony oferty
              </span>
              <span className="text-[13px] font-bold tabular-nums">
                {trip.views.toLocaleString("pl-PL")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
