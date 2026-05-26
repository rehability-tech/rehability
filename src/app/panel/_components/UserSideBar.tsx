"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  SquaresFour,
  House,
  Tent,
  SignOut,
  MonitorPlay,
  User as UserIcon,
  Heartbeat, // Nowa ikona do dokumentów/karty zdrowia
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// Nowa, wielosekcyjna struktura nawigacji
const MENU_SECTIONS = [
  {
    title: "Przegląd",
    items: [{ key: "hub", href: "/panel", label: "Start", icon: SquaresFour }],
  },
  {
    title: "Strefa Wyjazdów",
    items: [
      { key: "campy", href: "/panel/wyjazdy", label: "Moje Wyjazdy", icon: Tent },
      {
        key: "karta",
        href: "/panel/karta-zdrowia",
        label: "Karta Zdrowia",
        icon: Heartbeat,
      },
    ],
  },
  {
    title: "Strefa Cyfrowa",
    items: [
      {
        key: "vod",
        href: "/panel/vod",
        label: "Platforma VOD",
        icon: MonitorPlay,
      },
    ],
  },
  {
    title: "Konto",
    items: [
      {
        key: "profil",
        href: "/panel/profil",
        label: "Mój Profil",
        icon: UserIcon,
      },
    ],
  },
];

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 left-0 h-screen w-[260px] z-40 hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* LOGO */}
      <div className="flex items-center justify-center h-[72px] shrink-0 border-b border-gray-100/50 mb-2">
        <Link href="/">
          <Image
            src="/logotypy/logo-primary.svg"
            alt="Rehability"
            width={130}
            height={36}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* GŁÓWNA NAWIGACJA (Przewijana) */}
      <nav className="flex-1 flex flex-col overflow-y-auto px-4 pb-6 custom-scrollbar">
        {MENU_SECTIONS.map((section, index) => (
          <div
            key={section.title}
            className={cn("flex flex-col", index !== 0 && "mt-6")}
          >
            {/* Nagłówek Sekcji */}
            <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-bold mb-2">
              {section.title}
            </span>

            {/* Elementy w danej sekcji */}
            <div className="flex flex-col gap-1">
              {section.items.map(({ key, href, label, icon: Icon }) => {
                const isActive =
                  href === "/panel"
                    ? pathname === "/panel"
                    : pathname?.startsWith(href);

                return (
                  <Link key={key} href={href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                        isActive
                          ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)]"
                          : "text-brand-secondary/60 hover:bg-gray-50 hover:text-brand-secondary",
                      )}
                    >
                      {isActive && (
                        <div className="absolute -bottom-3 -right-2 w-12 h-12 bg-white/20 rounded-full blur-md pointer-events-none" />
                      )}
                      <Icon
                        size={20}
                        weight={isActive ? "fill" : "duotone"}
                        className={
                          isActive
                            ? "text-white relative z-10"
                            : "text-brand-secondary/40 group-hover:text-brand-secondary/70 relative z-10 transition-colors"
                        }
                      />
                      <span className="font-montserrat text-[13.5px] font-semibold tracking-wide relative z-10">
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* EKSPLORUJ (Oddzielone na samym dole nawigacji) */}
        <div className="mt-8">
          <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-bold mb-2 block">
            Eksploruj
          </span>
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-secondary/60 hover:bg-gray-50 hover:text-brand-secondary transition-all duration-200 group">
              <House
                size={20}
                weight="duotone"
                className="text-brand-secondary/40 group-hover:text-brand-secondary/70 transition-colors"
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Strona główna
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* WYLOGUJ (Przyklejone do samego dołu ekranu) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/logowanie" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-secondary/60 hover:text-red-600 hover:bg-red-50 transition-all w-full text-left cursor-pointer group"
        >
          <SignOut
            size={20}
            className="text-brand-secondary/40 group-hover:text-red-500 transition-colors"
          />
          <span className="font-montserrat text-[13px] font-medium tracking-wide">
            Wyloguj się
          </span>
        </button>
      </div>
    </aside>
  );
}
