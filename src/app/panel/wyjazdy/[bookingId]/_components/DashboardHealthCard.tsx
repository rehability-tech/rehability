"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  CheckCircle,
  Warning,
  ArrowRight,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardHealthCard({
  healthFilled,
  bookingId,
}: {
  healthFilled: boolean;
  bookingId: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className={cn(
        "relative rounded-[24px] backdrop-blur-xl p-5 lg:p-6 overflow-hidden h-full flex flex-col transition-all duration-500",
        healthFilled
          ? "bg-white/70 border border-white/60 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.12)]"
          : "bg-white/70 border border-rose-200/60 shadow-[0_12px_40px_-15px_rgba(244,63,94,0.2)]",
      )}
    >
      {/* Tło Ambientowe */}
      {healthFilled ? (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />
      ) : (
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-rose-400/20 blur-3xl pointer-events-none" />
      )}

      {/* HEADER KARTY */}
      <div className="relative flex items-center justify-between mb-5 z-10">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(255,255,255,0.8)]",
              healthFilled
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-rose-50 text-rose-500 border border-rose-100",
            )}
          >
            <Heart size={20} weight={healthFilled ? "duotone" : "fill"} />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[15.5px] text-brand-secondary leading-tight">
              Karta Zdrowia
            </h3>
            <p className="text-[11px] text-brand-secondary/50 font-medium mt-0.5">
              Diety, alergie, wykluczenia
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}
        {healthFilled ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase border border-emerald-100/50 shadow-sm">
            <CheckCircle size={13} weight="fill" /> Wypełniono
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
            <Warning size={13} weight="bold" /> Wymaga akcji
          </span>
        )}
      </div>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <div className="flex-1 flex flex-col justify-end relative z-10">
        {!healthFilled ? (
          <>
            <p className="text-[13px] text-brand-secondary/75 leading-relaxed mb-5">
              Musimy poznać Twoją dietę oraz stan zdrowia przed wyjazdem.
              Pozwoli nam to zapewnić Ci 100% bezpieczeństwa i idealnie dobrane
              menu.
            </p>
            <Link
              href={`/panel/wyjazdy/${bookingId}/karta-zdrowia`}
              className="mt-auto group relative w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-[18px] bg-rose-500 hover:bg-rose-600 text-white text-[13px] font-bold transition-all shadow-[0_8px_20px_-6px_rgba(244,63,94,0.5)] active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Uzupełnij szczegóły przed wyjazdem!
              <ArrowRight
                size={16}
                weight="bold"
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </>
        ) : (
          <>
            <p className="text-[13px] text-brand-secondary/70 leading-relaxed mb-4">
              Twoje dane zostały bezpiecznie zapisane. Nasz zespół przeanalizuje
              je, aby dostosować menu i atrakcje pod Twoje potrzeby.
            </p>
            <Link
              href={`/panel/wyjazdy/${bookingId}/karta-zdrowia`}
              className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] bg-white border border-gray-200 text-brand-secondary text-[13px] font-bold transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-[0.98]"
            >
              <PencilSimple size={16} weight="bold" />
              Edytuj lub sprawdź swoje dane
            </Link>
          </>
        )}
      </div>
    </motion.section>
  );
}
