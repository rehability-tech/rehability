"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SquaresFour,
  Article,
  Tent,
  MonitorPlay,
  Users,
  ChartBar,
  Star,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// 1. Główne opcje nawigacji
const mainItems = [
  { key: "dashboard", href: "/admin", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/admin/campy", label: "Campy", icon: Tent },
  { key: "blog", href: "/admin/blog", label: "Blog", icon: Article },
  { key: "vod", href: "/admin/vod", label: "VOD", icon: MonitorPlay },
];

// 2. Opcje nawigacji dla trybu "Campy" (po prawej stronie)
// Dodałem 'action' żeby odróżnić standardowe linki od przycisku wstecz
const subItems = [
  {
    key: "sub-users",
    href: "/admin/campy/users",
    label: "Ludzie",
    icon: Users,
  },
  {
    key: "sub-stats",
    href: "/admin/campy/stats",
    label: "Wykresy",
    icon: ChartBar,
  },
  {
    key: "sub-extras",
    href: "/admin/campy/extras",
    label: "Więcej",
    icon: Star,
  },
  { key: "sub-back", action: "back", label: "Wróć", icon: ArrowLeft },
];

export default function AdminMobileNavBar() {
  const pathname = usePathname();
  const router = useRouter(); // Używamy routera do cofania

  // Przełącznik: czy jesteśmy w jakiejś zakładce /admin/campy?
  const isCampyMode = pathname?.startsWith("/admin/campy");

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 md:hidden flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-md relative overflow-hidden",
          "rounded-full",
          "bg-white/80 backdrop-blur-2xl",
          "border border-white",
          "shadow-[0_8px_30px_-10px_rgba(3,63,99,0.1)]",
          "px-2 py-2",
        )}
      >
        <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-brand-yellow/30 rounded-full blur-2xl pointer-events-none" />

        <ul className="relative z-10 flex items-center justify-between">
          {/* GŁÓWNE MENU */}
          {mainItems.map((item) => {
            const isCampyPill = item.key === "campy";
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            // Całkowicie ukrywamy (razem z pointer-events) inne przyciski główne
            const isHidden = isCampyMode && !isCampyPill;
            // Sprawdzamy czy przycisk Campy powinien być nieklikalny
            const isCampyDisabled = isCampyMode && isCampyPill;

            return (
              <li
                key={item.key}
                className={cn(
                  "transition-all duration-500 ease-in-out flex justify-center overflow-hidden",
                  isActive ? "flex-grow" : "flex-grow-0",
                  isHidden
                    ? "max-w-0 opacity-0 px-0 mx-0 border-0 pointer-events-none" // Wyłączamy pointer events dla ukrytych
                    : isActive
                      ? "max-w-full px-0.5"
                      : "max-w-[44px] px-0.5",
                )}
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  onClick={(e) => {
                    // Blokada linku, gdy jesteśmy w trybie campy
                    if (isCampyDisabled) {
                      e.preventDefault();
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center gap-2",
                    "h-11 rounded-full overflow-hidden shrink-0",
                    "transition-all duration-500 ease-in-out",
                    isCampyDisabled ? "pointer-events-none" : "", // Zabezpieczenie przed klikaniem
                    isActive
                      ? "bg-brand-primary px-4 w-full text-white shadow-[0_4px_12px_-2px_rgba(242,217,103,0.2)] border border-brand-yellow/20"
                      : "w-11 border border-transparent text-brand-secondary/40 hover:text-brand-primary hover:bg-white/60",
                  )}
                >
                  {isActive && (
                    <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                  )}

                  <item.icon
                    size={22}
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "relative z-10 shrink-0 transition-colors duration-300",
                      isActive ? "text-white" : "",
                    )}
                  />

                  {isActive && (
                    <span className="relative z-10 font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1 text-white">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* SUB-MENU CAMPY (Pojawia się po prawej) */}
          {subItems.map((item) => {
            const isActive = pathname?.startsWith(item.href || "fallback");
            const isVisible = isCampyMode;
            const isBackButton = item.action === "back";

            return (
              <li
                key={item.key}
                className={cn(
                  "transition-all duration-500 ease-in-out flex justify-center overflow-hidden",
                  isActive ? "flex-grow" : "flex-grow-0",
                  !isVisible
                    ? "max-w-0 opacity-0 px-0 mx-0 border-0 pointer-events-none"
                    : isActive
                      ? "max-w-full px-0.5"
                      : "max-w-[44px] px-0.5",
                )}
              >
                {isBackButton ? (
                  // Renderujemy zwykły <button> dla akcji cofania
                  <button
                    onClick={() => router.back()}
                    aria-label={item.label}
                    className={cn(
                      "relative flex items-center justify-center gap-2",
                      "h-11 w-11 rounded-full overflow-hidden shrink-0",
                      "transition-all duration-500 ease-in-out",
                      "border border-transparent text-brand-secondary/40 hover:text-brand-primary hover:bg-white/60",
                    )}
                  >
                    <item.icon
                      size={22}
                      weight="regular"
                      className="relative z-10 shrink-0 transition-colors duration-300"
                    />
                  </button>
                ) : (
                  // Renderujemy normalny <Link> dla zakładek Campy
                  <Link
                    href={item.href!}
                    aria-label={item.label}
                    className={cn(
                      "relative flex items-center justify-center gap-2",
                      "h-11 rounded-full overflow-hidden shrink-0",
                      "transition-all duration-500 ease-in-out",
                      isActive
                        ? "bg-brand-primary px-4 w-full text-white shadow-[0_4px_12px_-2px_rgba(242,217,103,0.2)] border border-brand-yellow/20"
                        : "w-11 border border-transparent text-brand-secondary/40 hover:text-brand-primary hover:bg-white/60",
                    )}
                  >
                    {isActive && (
                      <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                    )}

                    <item.icon
                      size={22}
                      weight={isActive ? "fill" : "regular"}
                      className={cn(
                        "relative z-10 shrink-0 transition-colors duration-300",
                        isActive ? "text-white" : "",
                      )}
                    />

                    {isActive && (
                      <span className="relative z-10 font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1 text-white">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
