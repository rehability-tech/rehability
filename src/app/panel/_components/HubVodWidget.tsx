"use client";

import Link from "next/link";
import {
  MonitorPlay,
  ArrowRight,
  Sparkle,
  LockKey,
  PlayCircle,
  VideoCamera,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

interface HubVodWidgetProps {
  hasAccess: boolean;
}

export default function HubVodWidget({ hasAccess }: HubVodWidgetProps) {
  if (!hasAccess) {
    return (
      <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col">
        {/* Dekoracyjne blury */}
        <div className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-brand-yellow/30 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-gray-300/30 blur-[80px]" />

        {/* TOP: Pigułka i Ikonka */}
        <div className="flex justify-between items-start mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 h-max">
            <Wrench size={14} weight="fill" className="text-brand-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">
              W budowie
            </span>
          </div>

          <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.15)] flex items-center justify-center shrink-0">
            <MonitorPlay size={40} weight="duotone" className="text-gray-400" />
            <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(0,0,0,0.2)]">
              <LockKey size={14} weight="fill" className="text-white" />
            </span>
          </div>
        </div>

        {/* TREŚĆ */}
        <div className="flex-1">
          <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-brand-secondary leading-tight mb-3">
            Platforma VOD
            <br />
            jest w budowie
          </h3>
          <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-sm">
            Pracujemy nad biblioteką treningów wideo — joga, rozciąganie
            powięziowe i programy domowe. Wkrótce udostępnimy ją w panelu.
          </p>
        </div>

        {/* AKCJA */}
        <div className="mt-8">
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 font-semibold text-[14px] cursor-not-allowed select-none"
          >
            <LockKey size={16} weight="fill" />
            Wkrótce dostępne
          </span>
        </div>
      </div>
    );
  }

  // WIDOK AKTYWNY (Ma dostęp do VOD)
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col">
      <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-brand-yellow/30 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-brand-primary/20 blur-[80px]" />

      <div className="flex justify-between items-start mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/30 h-max">
          <Sparkle size={14} weight="fill" className="text-brand-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">
            Aktywna Subskrypcja
          </span>
        </div>

        <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.2)] flex items-center justify-center shrink-0">
          <MonitorPlay
            size={40}
            weight="duotone"
            className="text-brand-secondary"
          />
          <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow-[0_4px_15px_0px_rgba(40,125,136,0.4)]">
            <PlayCircle size={14} weight="fill" className="text-white" />
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-brand-secondary leading-tight mb-4">
          Witaj na platformie
        </h3>

        {/* Przykładowy element - Ostatnio oglądane */}
        <div className="bg-white/50 border border-gray-100 rounded-2xl p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-1.5 text-brand-primary">
            <VideoCamera size={14} weight="fill" />
            <p className="text-[10px] font-bold uppercase tracking-wider">
              Kontynuuj
            </p>
          </div>
          <p className="font-montserrat font-semibold text-[13px] text-brand-secondary truncate">
            Moduł 3: Trening powięziowy
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/panel/vod"
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-secondary text-white font-semibold text-[14px] shadow-[0_4px_15px_0px_rgba(11,59,76,0.3)] hover:shadow-[0_6px_20px_0px_rgba(11,59,76,0.4)] transition"
        >
          Otwórz bibliotekę wideo
          <ArrowRight
            size={16}
            weight="bold"
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}
