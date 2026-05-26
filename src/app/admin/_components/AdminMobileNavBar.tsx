"use client";

import React, { useMemo } from "react";
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
  Layout,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  icon: Icon;
  href?: string;
  exact?: boolean;
  action?: "back";
};

// 1. Główne opcje nawigacji
const mainItems = [
  { key: "dashboard", href: "/admin", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/admin/wyjazdy", label: "Wyjazdy", icon: Tent },
  { key: "blog", href: "/admin/blog", label: "Blog", icon: Article },
  { key: "vod", href: "/admin/vod", label: "VOD", icon: MonitorPlay },
];

// Opcja "Wstecz", stała
const backButton: NavItem = {
  key: "sub-back",
  action: "back",
  label: "Wróć",
  icon: ArrowLeft,
};

export default function AdminMobileNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Sprawdzamy czy jesteśmy w jakiejś zakładce /admin/wyjazdy
  const isCampyMode = pathname?.startsWith("/admin/wyjazdy");

  // Magia: wyciągamy ID (lub slug) wyjazdu z obecnego URLa!
  // Pasuje do wzorca np. /admin/wyjazdy/clr9k0b4s0000.../cokolwiek
  const campIdMatch = pathname?.match(/\/admin\/wyjazdy\/([a-zA-Z0-9_-]+)/);
  const currentCampId = campIdMatch ? campIdMatch[1] : null;

  // 2. Dynamiczne sub-menu zależne od tego, w jakim wyjeździe jesteśmy
  const subItems = useMemo<NavItem[]>(() => {
    // Jeśli nie jesteśmy wewnątrz konkretnego wyjazdu (np. na liście wszystkich wyjazdów)
    // nie chcemy w ogóle pokazywać paska z sub-menu
    if (!currentCampId) return [];

    return [
      {
        key: "sub-hub",
        href: `/admin/wyjazdy/${currentCampId}`,
        label: "Pulpit",
        icon: Layout,
        exact: true, // Wymaga dokładnego matchu, by nie podświetlać się wszędzie
      },
      {
        key: "sub-users",
        href: `/admin/wyjazdy/${currentCampId}/uczestnicy`, // Przykładowa dynamiczna ścieżka
        label: "Ludzie",
        icon: Users,
      },
      {
        key: "sub-stats",
        href: `/admin/wyjazdy/${currentCampId}/finanse`,
        label: "Finanse",
        icon: ChartBar,
      },
      backButton,
    ];
  }, [currentCampId]);

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

            // Całkowicie ukrywamy inne przyciski jeśli jesteśmy WEWNĄTRZ konkretnego wyjazdu
            const isHidden = !!currentCampId && !isCampyPill;
            const isCampyDisabled = !!currentCampId && isCampyPill;

            return (
              <li
                key={item.key}
                className={cn(
                  "transition-all duration-500 ease-in-out flex justify-center overflow-hidden",
                  isActive && !currentCampId ? "flex-grow" : "flex-grow-0",
                  isHidden
                    ? "max-w-0 opacity-0 px-0 mx-0 border-0 pointer-events-none"
                    : isActive && !currentCampId
                      ? "max-w-full px-0.5"
                      : "max-w-[44px] px-0.5",
                )}
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  onClick={(e) => {
                    if (isCampyDisabled) e.preventDefault();
                  }}
                  className={cn(
                    "relative flex items-center justify-center gap-2",
                    "h-11 rounded-full overflow-hidden shrink-0",
                    "transition-all duration-500 ease-in-out",
                    isCampyDisabled ? "pointer-events-none" : "",
                    isActive
                      ? "bg-brand-primary px-4 w-full text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.5)] border border-brand-yellow/20"
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

                  {/* Etykietę głównego menu pokazujemy tylko na Dashboardzie, żeby nie psuła sub-menu */}
                  {isActive && !currentCampId && (
                    <span className="relative z-10 font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1 text-white">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* SUB-MENU DLA KONKRETNEGO CAMPU */}
          {subItems.map((item) => {
            let isActive = false;
            if (item.href) {
              isActive = item.exact
                ? pathname === item.href // np. Pulpit (/admin/wyjazdy/[id]) musi pasować w 100%
                : pathname?.startsWith(item.href); // np. Ludzie (/admin/wyjazdy/[id]/uczestnicy)
            }

            const isVisible = !!currentCampId; // Pokaż submenu tylko jeśli jesteśmy wewnątrz wyjazdu
            const isBackButton = item.action === "back";

            return (
              <li
                key={item.key}
                className={cn(
                  "transition-all duration-500 ease-in-out flex justify-center overflow-hidden",
                  isActive && !isBackButton ? "flex-grow" : "flex-grow-0",
                  !isVisible
                    ? "max-w-0 opacity-0 px-0 mx-0 border-0 pointer-events-none"
                    : isActive && !isBackButton
                      ? "max-w-full px-0.5"
                      : "max-w-[44px] px-0.5",
                )}
              >
                {isBackButton ? (
                  <button
                    onClick={() => router.push("/admin/wyjazdy")} // Bezpieczny powrót na główną listę wyjazdów
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
                  <Link
                    href={item.href!}
                    aria-label={item.label}
                    className={cn(
                      "relative flex items-center justify-center gap-2",
                      "h-11 rounded-full overflow-hidden shrink-0",
                      "transition-all duration-500 ease-in-out",
                      isActive
                        ? "bg-brand-primary px-4 w-full text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.5)] border border-brand-yellow/20"
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
