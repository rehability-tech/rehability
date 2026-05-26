"use client";

import React from "react";
import { motion } from "framer-motion";
// Pobieramy cały słownik ikon, aby móc je renderować dynamicznie po nazwie
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";

export default function DashboardAgendaPreview({
  agendaPreview = [],
}: {
  agendaPreview: any[];
}) {
  // Funkcja konwertująca datę ISO z bazy danych na samą godzinę (np. "10:30")
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString; // Fallback
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      // Zwróć uwagę, że usunąłem 'lg:col-span-12', bo ten element leży teraz gładko w flex-col
      className="relative rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6 overflow-hidden"
    >
      <div className="absolute -top-12 right-1/4 w-44 h-44 rounded-full bg-brand-yellow/30 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-yellow/40 text-brand-secondary flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(3,63,99,0.05)]">
            <PhosphorIcons.Sparkle size={20} weight="duotone" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
              Twój najbliższy dzień
            </h3>
            <p className="text-[11px] text-brand-secondary/50">
              Sneak peek pierwszego dnia wyjazdu
            </p>
          </div>
        </div>
        {agendaPreview.length > 0 && (
          <button className="text-[12px] font-bold text-brand-primary px-3 py-1.5 rounded-full hover:bg-brand-primary/10 transition">
            Pełny plan →
          </button>
        )}
      </div>

      {agendaPreview.length > 0 ? (
        <ol className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {agendaPreview.map((item: any, i: number) => {
            // Dynamiczne wyciąganie ikony na podstawie stringa (np. "Sun", "Barbell").
            // Jeśli podano błędną nazwę, domyślnie załaduje "Sparkle"
            const IconComponent =
              (PhosphorIcons as any)[item.icon] || PhosphorIcons.Sparkle;

            return (
              <li
                key={i}
                className="relative rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4 hover:bg-white transition shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
              >
                <div className="absolute top-3 right-3 text-[10px] font-bold text-brand-secondary/30">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <IconComponent size={16} weight="duotone" />
                </div>
                <p className="text-[11px] font-bold text-brand-primary uppercase tracking-wider mt-3">
                  {formatTime(item.time)}
                </p>
                <p className="font-jakarta font-bold text-[13.5px] text-brand-secondary leading-tight mt-1 line-clamp-2">
                  {item.title}
                </p>
                <p className="text-[11px] text-brand-secondary/50 mt-1 truncate">
                  {item.place}
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        // --- STAN PUSTY (EMPTY STATE) GDY BRAK HARMONOGRAMU ---
        <div className="relative flex flex-col items-center justify-center py-10 bg-white/40 rounded-2xl border border-white/50 border-dashed">
          <PhosphorIcons.CalendarBlank
            size={32}
            weight="duotone"
            className="text-brand-secondary/30 mb-3"
          />
          <p className="text-[13px] font-medium text-brand-secondary/70">
            Harmonogram jest w trakcie przygotowywania.
          </p>
          <p className="text-[11px] text-brand-secondary/40 mt-1">
            Poinformujemy Cię, gdy tylko się pojawi!
          </p>
        </div>
      )}
    </motion.section>
  );
}
