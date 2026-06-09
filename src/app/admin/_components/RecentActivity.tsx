"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  CurrencyCircleDollar,
  PlayCircle,
  Article,
  HeartStraight,
  UserPlus,
  Sparkle,
  DotsThreeOutline,
  Funnel,
  BellRinging,
  BellSlash,
  CheckSquareOffset,
  Clock,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";

// Paginacja zamiast scrolla — inna liczba na stronę zależnie od wysokości widoku.
// Desktopowy widget jest wyższy (dopasowuje się do lewej kolumny), więc mieści więcej.
const MOBILE_PAGE_SIZE = 5;
const DESKTOP_PAGE_SIZE = 7;

type ActivityPillar = "CAMP" | "VOD" | "BLOG" | "SYSTEM";

interface ActivityEntry {
  id: string;
  pillar: ActivityPillar;
  kind:
    | "PAYMENT"
    | "VOD_PURCHASE"
    | "POST_PUBLISHED"
    | "HEALTH_FILLED"
    | "SIGNUP"
    | "SERVICE_BOUGHT"
    | "CHECK_IN";
  who: string;
  text: string;
  meta?: string;
  createdAt: string; // Przepięte na realną datę z bazy!
}

// Prosty fetcher dla SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Mapowanie ikon i kolorów (zachowane bez zmian)
const KIND_VISUAL: Record<
  ActivityEntry["kind"],
  { icon; bg: string; color: string }
> = {
  PAYMENT: {
    icon: CurrencyCircleDollar,
    bg: "bg-brand-primary/10",
    color: "text-brand-primary",
  },
  VOD_PURCHASE: {
    icon: PlayCircle,
    bg: "bg-brand-yellow/30",
    color: "text-brand-secondary",
  },
  POST_PUBLISHED: {
    icon: Article,
    bg: "bg-brand-secondary/10",
    color: "text-brand-secondary",
  },
  HEALTH_FILLED: {
    icon: HeartStraight,
    bg: "bg-rose-50",
    color: "text-rose-500",
  },
  SIGNUP: {
    icon: UserPlus,
    bg: "bg-brand-primary/10",
    color: "text-brand-primary",
  },
  SERVICE_BOUGHT: {
    icon: Sparkle,
    bg: "bg-brand-yellow/30",
    color: "text-brand-secondary",
  },
  CHECK_IN: {
    icon: CheckSquareOffset,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
  },
};

// Fallback dla nieznanych kindÃ³w (np. legacy z bazy lub nowe nie dopisane jeszcze).
const FALLBACK_VISUAL = {
  icon: Clock,
  bg: "bg-gray-100",
  color: "text-gray-500",
};

// --- WIDGET LOADER ---
// Elegancki szkielet wyświetlany podczas pierwszego pobierania danych
const ActivitySkeleton = () => (
  <div className="flex flex-col gap-3 p-2 w-full h-full">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-start gap-3 w-full opacity-60 animate-pulse p-2"
      >
        <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-2 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export default function RecentActivity() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | ActivityPillar>(
    "ALL",
  );
  const [isMuted, setIsMuted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Paginacja na każdym viewporcie (zamiast scrolla). Rozmiar strony zależy
  // od wysokości widgetu — mobile mieści mniej niż wysoki widget desktopowy.
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // --- LOGIKA BIZNESOWA: POBIERANIE DANYCH (SWR) ---
  // refreshInterval: 60000 = co 60 sekund uderza w tle po świeże powiadomienia!
  const {
    data: entries,
    error,
    isLoading,
  } = useSWR<ActivityEntry[]>("/api/admin/activities", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true, // Odśwież gdy admin wróci do zakładki
  });

  // Filtrowanie (zabezpieczone pustą tablicą zanim dane spłyną)
  const filteredEntries = (entries || []).filter(
    (e) => activeFilter === "ALL" || e.pillar === activeFilter,
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));

  // Reset strony przy zmianie filtra
  useEffect(() => {
    setPage(0);
  }, [activeFilter]);

  // Pilnujemy, by strona nie wyszła poza zakres (np. po odświeżeniu danych)
  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  // Zawsze pokazujemy tylko bieżącą stronę (paginacja, bez scrolla).
  const visibleEntries = filteredEntries.slice(
    page * pageSize,
    page * pageSize + pageSize,
  );

  // Zamykanie menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Włącz/Wyłącz powiadomienia
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    setIsMenuOpen(false);
    if (!isMuted) {
      toast.info("Live feed wyciszony", {
        description: "Nie będziesz otrzymywać alertów.",
      });
    } else {
      toast.success("Live feed włączony", {
        description: "Powiadomienia o nowej aktywności są aktywne.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col w-full h-full min-h-[500px] max-h-[800px] rounded-[24px] bg-white border border-gray-100 shadow-[0_10px_24px_-8px_rgba(3,63,99,0.06)] overflow-visible"
    >
      {/* Nagłówek widgetu */}
      <div className="relative flex flex-col border-b border-gray-100/60 shrink-0 z-20">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Sparkle size={18} weight="duotone" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-brand-secondary text-[15px] leading-tight">
                Aktywność
              </h3>
              <p className="font-montserrat text-[11px] text-brand-secondary/50 font-medium mt-0.5">
                Live feed systemu
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isMenuOpen
                  ? "bg-gray-100 text-brand-secondary"
                  : "text-brand-secondary/40 hover:bg-gray-50 hover:text-brand-primary"
              }`}
            >
              <DotsThreeOutline size={18} weight="fill" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-48 rounded-2xl bg-white border border-gray-100 shadow-[0_15px_40px_-10px_rgba(3,63,99,0.15)] z-50 p-2 overflow-hidden font-montserrat"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setShowFilters(!showFilters);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left text-[12px] font-semibold text-brand-secondary transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Funnel
                          size={16}
                          className={
                            showFilters
                              ? "text-brand-primary"
                              : "text-brand-secondary/60"
                          }
                        />
                        Filtruj widok
                      </span>
                      {activeFilter !== "ALL" && (
                        <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      )}
                    </button>
                    <div className="h-px w-full bg-gray-100 my-1" />
                    <button
                      onClick={handleToggleMute}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-brand-primary/5 hover:text-brand-primary text-left text-[12px] font-semibold text-brand-secondary transition-colors"
                    >
                      {isMuted ? (
                        <BellSlash
                          size={16}
                          className="text-brand-secondary/60"
                        />
                      ) : (
                        <BellRinging
                          size={16}
                          className="text-brand-primary/60"
                        />
                      )}
                      {isMuted ? "Włącz powiadomienia" : "Wycisz feed"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50/50"
            >
              <div className="flex items-center gap-2 px-6 pb-4 pt-1 font-montserrat overflow-x-auto custom-scrollbar">
                {(["ALL", "CAMP", "VOD", "BLOG"] as const).map((pillar) => (
                  <button
                    key={pillar}
                    onClick={() => setActiveFilter(pillar)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap ${
                      activeFilter === pillar
                        ? "bg-brand-primary text-white"
                        : "bg-white border border-gray-200 text-brand-secondary/60 hover:text-brand-secondary hover:border-gray-300"
                    }`}
                  >
                    {pillar === "ALL"
                      ? "Wszystko"
                      : pillar === "CAMP"
                        ? "Tylko Wyjazdy"
                        : pillar === "VOD"
                          ? "Platforma VOD"
                          : "Publikacje"}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex-1 overflow-hidden px-4 py-4 space-y-2">
        {/* Renderujemy Szkielet, dopóki dane po raz pierwszy się nie załadują */}
        {isLoading && <ActivitySkeleton />}

        {/* Błąd pobierania */}
        {error && !isLoading && (
          <div className="text-center text-rose-500 font-montserrat text-xs mt-10">
            Błąd pobierania aktywności z serwera.
          </div>
        )}

        {/* Gotowe dane */}
        {!isLoading && !error && (
          <AnimatePresence mode="popLayout">
            {visibleEntries.length > 0 ? (
              visibleEntries.map((e, i) => {
                const v = KIND_VISUAL[e.kind] ?? FALLBACK_VISUAL;
                const Icon = v.icon;

                // Zamieniamy suchą datę z bazy na np. "15 minut temu"
                const timeAgo = formatDistanceToNow(new Date(e.createdAt), {
                  addSuffix: true,
                  locale: pl,
                });

                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 border border-transparent transition-all cursor-default group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${v.bg} ${v.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={16} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start gap-2 font-montserrat">
                        <p className="font-semibold text-[13px] text-brand-secondary truncate">
                          {e.who}
                        </p>
                        <span className="text-[10px] font-medium text-brand-secondary/40 shrink-0">
                          {timeAgo}
                        </span>
                      </div>
                      <p className="font-montserrat text-[11px] text-brand-secondary/60 leading-snug mt-0.5">
                        {e.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-brand-secondary/40 font-montserrat mt-10"
              >
                <Funnel
                  size={32}
                  weight="duotone"
                  className="mb-2 opacity-50"
                />
                <p className="text-[13px] font-semibold">Brak aktywności</p>
                <p className="text-[11px]">Nie ma zdarzeń dla tego filtru.</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Paginacja — na każdym viewporcie, gdy jest więcej niż jedna strona */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100/60 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-brand-secondary/70 transition-colors enabled:hover:bg-brand-primary/10 enabled:hover:text-brand-primary disabled:opacity-30"
            aria-label="Poprzednia strona"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          <span className="font-montserrat text-[12px] font-semibold text-brand-secondary/60">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-brand-secondary/70 transition-colors enabled:hover:bg-brand-primary/10 enabled:hover:text-brand-primary disabled:opacity-30"
            aria-label="Następna strona"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
