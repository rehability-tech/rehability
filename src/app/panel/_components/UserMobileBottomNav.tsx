"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Tent,
  MonitorPlay,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// CZYSTSZA NAWIGACJA: Tylko 4 główne filary platformy
const items = [
  { key: "hub", href: "/panel", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/panel/wyjazdy", label: "Wyjazdy", icon: Tent },
  { key: "vod", href: "/panel/vod", label: "VOD", icon: MonitorPlay },
  { key: "profil", href: "/panel/profil", label: "Profil", icon: User },
];

export default function UserMobileBottomNav() {
  const pathname = usePathname();

  return (
    <div
      // md:hidden ukrywa ten pasek na tabletach i komputerach
      className="fixed inset-x-0 bottom-0 z-50 md:hidden flex justify-center pointer-events-none px-4"
      // PB chroni przed Home Indicatorem na iPhone'ach bez przycisku
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-md relative overflow-hidden",
          "rounded-full",
          // Chłodne, jasne szkło (White/60 z mocnym blurem), pasujące do tła panelu
          "bg-white/60 backdrop-blur-3xl",
          "border border-white",
          // Subtelny bazowy cień
          "shadow-[0_10px_40px_-15px_rgba(3,63,99,0.1)]",
          "px-2 py-2",
        )}
      >
        {/* Słoneczna poświata w prawym dolnym rogu (całego paska) */}
        <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-brand-yellow/30 rounded-full blur-2xl pointer-events-none" />

        <ul className="relative z-10 flex items-center justify-between gap-1.5">
          {items.map(({ key, href, label, icon: Icon }) => {
            // Unikamy błędu, gdzie np. wejście do /panel/vod podświetlałoby też /panel
            const isActive =
              href === "/panel"
                ? pathname === "/panel"
                : pathname?.startsWith(href);

            return (
              <li
                key={key}
                className={cn(
                  "transition-[flex-grow] duration-300 ease-out",
                  isActive ? "flex-grow" : "flex-grow-0",
                )}
              >
                <Link
                  href={href}
                  aria-label={label}
                  className={cn(
                    "relative flex items-center justify-center gap-2",
                    "h-11 rounded-full overflow-hidden", // Overflow-hidden by poświata nie wychodziła poza pigułkę
                    "transition-all duration-300 ease-out",
                    isActive
                      ? // Aktywny przycisk
                        "bg-brand-primary px-4 text-white shadow-[0_4px_12px_-2px_rgba(242,217,103,0.3)] border border-brand-yellow/20"
                      : // Nieaktywny przycisk
                        "w-11 border border-transparent text-brand-secondary/40 hover:text-brand-primary hover:bg-white/60",
                  )}
                >
                  {/* Mini-poświata wewnątrz aktywnego przycisku */}
                  {isActive && (
                    <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                  )}

                  <Icon
                    size={22}
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "relative z-10 shrink-0 transition-colors duration-300",
                      isActive ? "text-white" : "",
                    )}
                  />

                  {isActive && (
                    <span className="relative z-10 font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1 text-white animate-in fade-in slide-in-from-left-1 duration-300">
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
