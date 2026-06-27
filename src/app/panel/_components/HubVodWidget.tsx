"use client";

import Link from "next/link";
import {
  MonitorPlay,
  Sparkle,
  LockKey,
  PlayCircle,
  VideoCamera,
  ShoppingBag,
} from "@phosphor-icons/react/dist/ssr";

const FALLBACK_COVER = "/images/kursy/kurs-1.png";

interface HubVodWidgetProps {
  hasAccess: boolean;
  /** Kurs do „Kontynuuj" (ostatnio oglądany / kupiony). */
  continueCourse?: { title: string; slug: string; cover?: string } | null;
}

export default function HubVodWidget({
  hasAccess,
  continueCourse,
}: HubVodWidgetProps) {
  if (!hasAccess) {
    return (
      <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col">
        {/* Dekoracyjne blury */}
        <div className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-brand-yellow/30 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-gray-300/30 blur-[80px]" />

        {/* TOP: Pigułka i Ikonka */}
        <div className="flex justify-between items-start mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 h-max">
            <LockKey size={14} weight="fill" className="text-brand-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">
              Zablokowane
            </span>
          </div>

          <div className="relative w-10 h-10 rounded-xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.15)] flex items-center justify-center shrink-0">
            <MonitorPlay size={22} weight="duotone" className="text-brand-primary/60" />
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-secondary flex items-center justify-center shadow-[0_4px_15px_0px_rgba(0,0,0,0.2)]">
              <LockKey size={14} weight="fill" className="text-white" />
            </span>
          </div>
        </div>

        {/* TREŚĆ */}
        <div className="flex-1">
          <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-brand-secondary leading-tight mb-3">
            Odblokuj
            <br />
            platformę VOD
          </h3>
          <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-sm">
            Autorskie programy wideo od fizjoterapeutów — ćwicz we własnym
            tempie, z dożywotnim dostępem. Kup pierwszy kurs, aby odblokować
            bibliotekę.
          </p>
        </div>

        {/* AKCJA */}
        <div className="mt-8">
          <Link
            href="/kursy"
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl rounded-tr-[3px] bg-brand-primary text-white font-bold text-[14px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-2">
              <ShoppingBag size={16} weight="duotone" />
              Przeglądaj kursy
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // WIDOK AKTYWNY (Ma dostęp do VOD) — w tle okładka aktualnego kursu (jak w Strefie Wyjazdów)
  const bgImage = continueCourse?.cover || FALLBACK_COVER;

  return (
    <div
      className="relative overflow-hidden rounded-3xl rounded-tr-none border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-brand-secondary/80 z-0" />
      <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-brand-primary/20 blur-3xl z-0" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/30 h-max shadow-sm">
          <Sparkle size={14} weight="fill" className="text-brand-yellow" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Aktywna Subskrypcja
          </span>
        </div>

        <div className="relative w-10 h-10 rounded-xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.2)] flex items-center justify-center shrink-0">
          <MonitorPlay
            size={22}
            weight="duotone"
            className="text-brand-secondary"
          />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shadow-[0_4px_15px_0px_rgba(40,125,136,0.4)]">
            <PlayCircle size={14} weight="fill" className="text-white" />
          </span>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-white leading-tight mb-4">
          Witaj na platformie
        </h3>

        {/* Ostatnio oglądane / kontynuuj (realny kurs) */}
        {continueCourse ? (
          <Link
            href={`/panel/vod/${continueCourse.slug}`}
            className="group block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 max-w-sm hover:bg-white/20 hover:border-white/40 transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5 text-brand-yellow">
              <VideoCamera size={14} weight="fill" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Kontynuuj
              </p>
            </div>
            <p className="font-montserrat font-semibold text-[13px] text-white truncate">
              {continueCourse.title}
            </p>
          </Link>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 max-w-sm">
            <div className="flex items-center gap-2 mb-1.5 text-brand-yellow">
              <VideoCamera size={14} weight="fill" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Twoja biblioteka
              </p>
            </div>
            <p className="font-montserrat font-semibold text-[13px] text-white truncate">
              Rozpocznij pierwszy trening
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Twoje kursy (biblioteka VOD) */}
        <Link
          href="/panel/vod"
          className="group relative inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl rounded-tr-[3px] bg-brand-primary text-white font-bold text-[14px] border border-brand-yellow/30 shadow-[0_6px_18px_-4px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
        >
          <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
          <span className="relative inline-flex items-center gap-1.5">
            <PlayCircle size={16} weight="fill" />
            Twoje kursy
          </span>
        </Link>

        {/* Przeglądaj / kup nowe kursy */}
        <Link
          href="/kursy"
          className="group inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-tr-[3px] bg-white/15 backdrop-blur-md border border-white/30 text-white font-bold text-[14px] hover:bg-white/25 hover:border-white/50 transition-all"
        >
          <ShoppingBag size={16} weight="duotone" className="text-brand-yellow" />
          Przeglądaj kursy
        </Link>
      </div>
    </div>
  );
}
