"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import { isToday, isTomorrow, format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  CalendarBlank,
  CheckCircle,
  CircleDashed,
  PenNib,
  ArrowRight,
  MonitorPlay,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";

// Fetcher dla SWR — rzuca błąd na nie-OK i pilnuje, by wynik był tablicą,
// dzięki czemu odpowiedź błędu (obiekt) nie wywala renderowania widgetu.
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Błąd pobierania harmonogramu (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// Nasz typ z bazy danych
type Status = "PLANNED" | "IN_PROGRESS" | "SCHEDULED" | "PUBLISHED" | "SKIPPED";

interface ScheduleEntry {
  id: string;
  scheduledDate: string;
  title: string;
  category: string;
  status: Status;
}

const STATUS_CONFIG: Record<string, any> = {
  PLANNED: {
    icon: CircleDashed,
    text: "Zaplanowano",
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-100",
  },
  IN_PROGRESS: {
    icon: PenNib,
    text: "Szkic w toku",
    color: "text-indigo-500",
    bg: "bg-indigo-50/50",
    border: "border-indigo-100",
    iconBg: "bg-indigo-100",
  },
  PUBLISHED: {
    icon: CheckCircle,
    text: "Opublikowano",
    color: "text-brand-primary",
    bg: "bg-brand-primary/5",
    border: "border-brand-primary/20",
    iconBg: "bg-brand-primary/10",
  },
  // Fallback dla innych statusów (np. SCHEDULED, SKIPPED)
  DEFAULT: {
    icon: CircleDashed,
    text: "Oczekujący",
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconBg: "bg-gray-100",
  },
};

// Funkcja do formatowania daty w przyjazny sposób
const formatFriendlyDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Dzisiaj";
  if (isTomorrow(date)) return "Jutro";

  // Format typu "Wto, 22.10"
  const formatted = format(date, "EEE, dd.MM", { locale: pl });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// --- WIDGET LOADER ---
const ScheduleSkeleton = () => (
  <div className="flex gap-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="min-w-[260px] h-[140px] rounded-2xl bg-gray-50/50 border border-gray-100 p-4 flex flex-col justify-between animate-pulse"
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="w-16 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-5 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-4 bg-gray-200 rounded mb-1.5" />
          <div className="w-2/3 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100/60">
          <div className="w-6 h-6 rounded-lg bg-gray-200" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default function BlogWeeklySchedule() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(true);
  const [showLeftFade, setShowLeftFade] = useState(false);

  // Szerokość jednej karty + odstęp (260px + gap-4 = 16px) — krok strzałek.
  const CARD_STEP = 276;

  const scrollByDir = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -CARD_STEP : CARD_STEP,
      behavior: "smooth",
    });
  };

  // Pobieranie danych z naszego nowego endpointu
  const {
    data: entries,
    error,
    isLoading,
  } = useSWR<ScheduleEntry[]>("/api/admin/blog/schedule/upcoming", fetcher, {
    revalidateOnFocus: true,
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowRightFade(scrollLeft + clientWidth < scrollWidth - 5);
      setShowLeftFade(scrollLeft > 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [entries]); // Ponownie sprawdzamy scroll po załadowaniu danych

  return (
    <div className="w-full rounded-3xl bg-white border border-gray-100 shadow-[0_10px_30px_-10px_rgba(3,63,99,0.05)] flex flex-col relative overflow-hidden">
      {/* --- NAGŁÓWEK WIDGETU --- */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 z-10 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-secondary/5 text-brand-secondary flex items-center justify-center">
            <CalendarBlank size={20} weight="duotone" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-brand-secondary text-[15px] leading-tight">
              Harmonogram publikacji
            </h3>
            <p className="font-montserrat text-[11px] text-brand-secondary/50 font-medium mt-0.5">
              Najbliższe planowane wpisy
            </p>
          </div>
        </div>

        {/* Linkowanie do strony z kalendarzem */}
        <button
          onClick={() => router.push("/admin/blog/harmonogram")} // Podmień na poprawną ścieżkę do Twojego HarmonogramPage
          className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-xl text-brand-secondary/60 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors font-jakarta text-[12px] font-bold group"
        >
          Przejdź do harmonogramu
          <ArrowRight
            size={14}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>

      {/* --- KONTENER ZE SCROLLEM I GRADIENTEM --- */}
      <div className="relative min-h-[188px] flex items-center">
        {/* Obsługa błędów */}
        {error && (
          <div className="w-full text-center text-rose-500 font-montserrat text-[13px] py-8">
            Nie udało się załadować harmonogramu.
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto custom-scrollbar p-6 gap-4 relative z-0 w-full"
        >
          {/* Skeleton podczas ładowania */}
          {isLoading && <ScheduleSkeleton />}

          {/* Renderowanie prawdziwych danych */}
          {!isLoading &&
            entries &&
            entries.length > 0 &&
            entries.map((entry, i) => {
              const config =
                STATUS_CONFIG[entry.status] || STATUS_CONFIG.DEFAULT;
              const Icon = config.icon;
              const displayDate = formatFriendlyDate(entry.scheduledDate);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`min-w-[260px] max-w-[260px] flex flex-col justify-between p-4 rounded-2xl border ${config.border} ${config.bg} transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group bg-white`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-jakarta text-[11px] font-extrabold text-brand-secondary/70 tracking-wide uppercase">
                        {displayDate}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-white border border-gray-100 text-[10px] font-bold text-brand-secondary/60 shadow-sm truncate max-w-[100px]">
                        {entry.category}
                      </span>
                    </div>
                    <h4 className="font-montserrat font-bold text-[13.5px] text-brand-secondary leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                      {entry.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-gray-100/60">
                    <div
                      className={`w-6 h-6 rounded-lg ${config.iconBg} ${config.color} flex items-center justify-center shrink-0`}
                    >
                      <Icon
                        size={14}
                        weight={entry.status === "PUBLISHED" ? "fill" : "bold"}
                      />
                    </div>
                    <span
                      className={`font-montserrat text-[11px] font-bold ${config.color}`}
                    >
                      {config.text}
                    </span>
                  </div>
                </motion.div>
              );
            })}

          {/* Pusty stan, jeśli w bazie nie ma żadnych przyszłych wpisów */}
          {!isLoading && entries && entries.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center py-6 text-brand-secondary/40">
              <CalendarBlank
                size={32}
                weight="duotone"
                className="mb-2 opacity-50"
              />
              <p className="font-jakarta font-bold text-[14px]">Brak planów</p>
              <p className="font-montserrat text-[12px] text-center mt-1">
                Wygeneruj harmonogram na najbliższy miesiąc.
              </p>
            </div>
          )}
        </div>

        {/* Gradient Fade — lewa strona */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${
            showLeftFade && entries && entries.length > 0
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Gradient Fade — prawa strona */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${
            showRightFade && entries && entries.length > 0
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Strzałki nawigacji — tylko desktop (na mobile wystarcza swipe).
            Pojawiają się, gdy w danym kierunku jest co przewijać. */}
        {entries && entries.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => scrollByDir("left")}
              aria-label="Poprzednie wpisy"
              className={`hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-100 text-brand-secondary shadow-[0_6px_20px_-6px_rgba(3,63,99,0.25)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary ${
                showLeftFade
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <CaretLeft size={18} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => scrollByDir("right")}
              aria-label="Następne wpisy"
              className={`hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-100 text-brand-secondary shadow-[0_6px_20px_-6px_rgba(3,63,99,0.25)] transition-all hover:bg-brand-primary hover:text-white hover:border-brand-primary ${
                showRightFade
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
