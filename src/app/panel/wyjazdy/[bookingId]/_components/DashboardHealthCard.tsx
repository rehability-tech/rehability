"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  CheckCircle,
  Warning,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export default function DashboardHealthCard({
  healthFilled,
}: {
  healthFilled: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className={`relative rounded-[24px] backdrop-blur-xl p-5 lg:p-6 overflow-hidden h-full flex flex-col ${
        healthFilled
          ? "bg-white/70 border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)]"
          : "bg-white/70 border border-rose-200/50 shadow-[0_0_0_1px_rgba(244,63,94,0.12),0_18px_45px_-15px_rgba(244,63,94,0.35)]"
      }`}
    >
      {/* Czerwony, pulsujący glow w tle jeśli brakuje karty */}
      {!healthFilled && (
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-rose-400/25 blur-3xl animate-pulse" />
      )}

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              healthFilled
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.6)]"
            }`}
          >
            <Heart size={20} weight="fill" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
              Karta Zdrowia
            </h3>
            <p className="text-[11px] text-brand-secondary/50">
              Diety, alergie, przeciwwskazania
            </p>
          </div>
        </div>
        {healthFilled ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary">
            <CheckCircle size={11} weight="fill" /> Wypełniono
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white">
            <Warning size={11} weight="fill" /> Wymaga akcji
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end relative z-10 mt-2">
        {!healthFilled ? (
          <>
            <p className="text-[12.5px] text-brand-secondary/80 leading-relaxed mb-4">
              Zanim ruszymy w drogę, musimy poznać Twoją dietę, ewentualne
              alergie i przeciwwskazania. Zajmie to maks. 2 minuty.
            </p>
            {/* Tutaj w przyszłości dodasz onClick otwierający formularz Karty Zdrowia */}
            <button className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[13px] font-bold transition shadow-[0_12px_30px_-8px_rgba(244,63,94,0.55)] animate-pulse">
              Uzupełnij dietę przed wyjazdem!
              <ArrowRight size={16} weight="bold" />
            </button>
          </>
        ) : (
          // Jeśli jest wypełniona, tutaj w przyszłości możesz wrzucić prawdziwe dane z bazy
          // (np. przekazane w nowym propie `healthProfile`), a na razie dajemy ładny placeholder
          <div className="grid grid-cols-3 gap-2 text-[11px] text-brand-secondary/70">
            <div className="rounded-xl bg-white/60 border border-white/40 p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                Dieta
              </p>
              <p className="mt-1 font-semibold text-brand-secondary">
                Zapisano
              </p>
            </div>
            <div className="rounded-xl bg-white/60 border border-white/40 p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                Alergie
              </p>
              <p className="mt-1 font-semibold text-brand-secondary">
                Zapisano
              </p>
            </div>
            <div className="rounded-xl bg-white/60 border border-white/40 p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                Urazy
              </p>
              <p className="mt-1 font-semibold text-brand-secondary">
                Zapisano
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
