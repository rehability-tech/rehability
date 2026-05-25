"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Tent,
  PlayCircle,
  Article,
  ArrowRight,
  Sparkle,
  Megaphone,
} from "@phosphor-icons/react/dist/ssr";

// Typ odpowiadający naszemu modelowi w Prismie
interface SystemUpdate {
  id: string;
  type: "VOD" | "CAMP" | "BLOG" | "SYSTEM";
  title: string;
  description: string;
  link: string | null;
  createdAt: string;
}

// Funkcja dobierająca styl wizualny w zależności od typu nowości
const getUpdateStyles = (type: string) => {
  switch (type) {
    case "VOD":
      return {
        icon: PlayCircle,
        color: "text-brand-primary",
        bgColor: "bg-brand-primary/10",
        badgeColor: "text-brand-primary bg-brand-primary/10",
        typeLabel: "Platforma Cyfrowa",
      };
    case "CAMP":
      return {
        icon: Tent,
        color: "text-sky-700",
        bgColor: "bg-sky-50",
        badgeColor: "text-sky-700 bg-sky-100",
        typeLabel: "Wyjazdy",
      };
    case "BLOG":
      return {
        icon: Article,
        color: "text-brand-secondary",
        bgColor: "bg-brand-secondary/10",
        badgeColor: "text-brand-secondary bg-brand-secondary/10",
        typeLabel: "Wiedza",
      };
    default:
      return {
        icon: Megaphone,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        badgeColor: "text-gray-700 bg-gray-200",
        typeLabel: "System",
      };
  }
};

// Funkcja zmieniająca datę na przyjazny format
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Dzisiaj";
  if (date.toDateString() === yesterday.toDateString()) return "Wczoraj";

  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
};

export default function HubRecentUpdates() {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/api/panel/updates");
        if (res.ok) {
          const data = await res.json();
          setUpdates(data.updates);
        }
      } catch (error) {
        console.error("Błąd pobierania nowości:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  // STAN ŁADOWANIA (Skeleton Loader)
  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex flex-col gap-3 lg:gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 lg:gap-5 p-5 lg:p-6 rounded-3xl bg-white/50 border border-white/80 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-200/50 shrink-0" />
              <div className="flex-1 min-w-0 pt-1 space-y-3">
                <div className="flex justify-between">
                  <div className="w-24 h-5 bg-gray-200/50 rounded-md" />
                  <div className="w-12 h-4 bg-gray-200/50 rounded-md" />
                </div>
                <div className="w-3/4 h-5 bg-gray-200/50 rounded-md" />
                <div className="w-full h-4 bg-gray-200/50 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STAN PUSTY (Brak wiadomości z serwera)
  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
          <Sparkle size={28} weight="duotone" />
        </div>
        <h4 className="font-jakarta font-bold text-brand-secondary text-[17px]">
          Brak nowych wiadomości
        </h4>
        <p className="text-[14px] text-brand-secondary/60 mt-2 max-w-sm">
          Nie ma tu nic do przeczytania w tym momencie. Oczekuj na powiadomienia
          o nowych campach i VOD!
        </p>
      </div>
    );
  }

  // WIDOK AKTYWNY (Pobrano dane)
  return (
    <div className="relative">
      {/* Tło dekoracyjne dla całej sekcji nowości */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[120%] h-full bg-gradient-to-b from-brand-primary/5 to-transparent blur-[80px] -z-10" />

      {/* Lista wypukłych kart */}
      <div className="flex flex-col gap-3 lg:gap-4">
        {updates.map((update) => {
          const styles = getUpdateStyles(update.type);
          const Icon = styles.icon;

          return (
            <Link
              key={update.id}
              href={update.link || "#"}
              className="group relative flex flex-col sm:flex-row items-start gap-4 lg:gap-5 p-5 lg:p-6 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_-15px_rgba(3,63,99,0.08)] hover:bg-white/90 hover:shadow-[0_15px_40px_-15px_rgba(40,125,136,0.15)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Ikonka z efektem "Halo" (ring) */}
              <div
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md ring-4 ring-white/60 ${styles.bgColor}`}
              >
                <Icon size={26} weight="duotone" className={styles.color} />
              </div>

              {/* Treść */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-3">
                    {/* Odznaka (Badge) */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.12em] ${styles.badgeColor}`}
                    >
                      {styles.typeLabel}
                    </span>
                    <span className="text-[12px] font-medium text-brand-secondary/40 whitespace-nowrap">
                      {formatRelativeDate(update.createdAt)}
                    </span>
                  </div>
                </div>

                <h4 className="font-jakarta font-bold text-[16px] lg:text-[17px] text-brand-secondary mb-2 transition-colors group-hover:text-brand-primary">
                  {update.title}
                </h4>

                <p className="text-[14px] text-brand-secondary/60 leading-relaxed max-w-3xl mb-4 line-clamp-2">
                  {update.description}
                </p>

                {/* Subtelny przycisk akcji */}
                <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-secondary/50 group-hover:text-brand-primary transition-colors">
                  Zobacz szczegóły
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Eleganckie zamknięcie sekcji */}
      <div className="mt-6 flex items-center justify-center gap-2 text-brand-secondary/40 text-[13px] font-medium">
        <Sparkle size={16} weight="duotone" />
        <p>To wszystkie nowości na ten moment</p>
        <Sparkle size={16} weight="duotone" />
      </div>
    </div>
  );
}
