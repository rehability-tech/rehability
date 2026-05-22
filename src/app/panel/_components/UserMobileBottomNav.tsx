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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/70 backdrop-blur-2xl border-t border-white/20 shadow-[0_-10px_40px_-12px_rgba(3,63,99,0.18)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="max-w-md mx-auto flex items-center justify-around px-2 h-16">
        {items.map(({ key, href, label, icon: Icon }) => {
          const fullHref = href
            ? `/panel/${bookingId}/${href}`
            : `/panel/${bookingId}`;
          const isActive = href
            ? pathname.startsWith(fullHref)
            : pathname === fullHref;

          return (
            <li key={key} className="flex-1">
              <Link
                href={fullHref}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2"
              >
                <span
                  className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition ${
                    isActive
                      ? "bg-brand-primary text-white shadow-[0_10px_24px_-8px_rgba(40,125,136,0.6)]"
                      : "text-brand-secondary/50"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -inset-1 rounded-2xl bg-brand-primary/30 blur-xl -z-10" />
                  )}
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "duotone"}
                  />
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isActive ? "text-brand-primary" : "text-brand-secondary/50"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
