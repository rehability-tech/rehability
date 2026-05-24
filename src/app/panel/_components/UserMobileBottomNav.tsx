"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarBlank,
  Sparkle,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const items = [
  { key: "dashboard", href: "", label: "Dashboard", icon: SquaresFour },
  { key: "plan", href: "harmonogram", label: "Mój Plan", icon: CalendarBlank },
  { key: "sklep", href: "sklep", label: "Masaże", icon: Sparkle },
  { key: "profil", href: "karta-zdrowia", label: "Profil", icon: User },
];

export default function UserMobileBottomNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const bookingId = segments[1] ?? "";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-md relative overflow-hidden",
          "rounded-full",
          // Jasne szkło (White/20 z mocnym blurem)
          "bg-white/20 backdrop-blur-2xl",
          "border border-white/40",
          // Subtelny bazowy cień oddzielający od tła
          "shadow-[0_8px_30px_-10px_rgba(11,59,76,0.1)]",
          "px-2 py-2",
        )}
      >
        {/* Słoneczna poświata w prawym dolnym rogu (całego paska) */}
        <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-brand-yellow/40 rounded-full blur-2xl pointer-events-none" />

        <ul className="relative z-10 flex items-center justify-between gap-1">
          {items.map(({ key, href, label, icon: Icon }) => {
            const fullHref = href
              ? `/panel/${bookingId}/${href}`
              : `/panel/${bookingId}`;
            const isActive = href
              ? pathname === fullHref || pathname.startsWith(`${fullHref}/`)
              : pathname === fullHref;

            return (
              <li
                key={key}
                className={cn(
                  "transition-[flex-grow] duration-300 ease-out",
                  isActive ? "flex-grow" : "flex-grow-0",
                )}
              >
                <Link
                  href={fullHref}
                  aria-label={label}
                  className={cn(
                    "relative flex items-center justify-center gap-2",
                    "h-11 rounded-full overflow-hidden", // Dodane overflow-hidden by poświata nie wychodziła poza pigułkę
                    "transition-all duration-300 ease-out",
                    isActive
                      ? // Aktywny przycisk: Brand Primary, stonowany żółty cień i bardzo delikatna ramka
                        "bg-brand-primary px-4 text-white shadow-[0_4px_12px_-2px_rgba(242,217,103,0.2)] border border-brand-yellow/20"
                      : // Nieaktywny przycisk
                        "w-11 border border-transparent text-brand-secondary/60 hover:text-brand-primary hover:bg-white/40",
                  )}
                >
                  {/* Mini-poświata wewnątrz samego aktywnego przycisku (prawy dolny róg) */}
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
                    <span className="relative z-10 font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1 text-white">
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
