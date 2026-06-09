"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useChatUnreadLinks } from "@/hooks/useChatUnreadLinks";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour,
  House,
  Suitcase,
  SignOut,
  MonitorPlay,
  Heartbeat,
  CalendarBlank,
  ChatCircle,
  Storefront,
  Lock,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface MenuItem {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
    className?: string;
  }>;
  disabled?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// Wielosekcyjna struktura nawigacji (usunięto Profil)
const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Przegląd",
    items: [{ key: "hub", href: "/panel", label: "Start", icon: SquaresFour }],
  },
  {
    title: "Strefa Wyjazdów",
    items: [
      {
        key: "campy",
        href: "/panel/wyjazdy",
        label: "Moje Wyjazdy",
        icon: Suitcase,
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
        disabled: true,
      },
    ],
  },
];

export default function UserSidebar() {
  const pathname = usePathname();

  // Nieprzeczytane wiadomości czatu → pulsująca kropka na zakładce "Czat".
  const { links: chatUnreadLinks, refresh: refreshChatUnread } =
    useChatUnreadLinks();
  useEffect(() => {
    refreshChatUnread();
  }, [pathname, refreshChatUnread]);

  // LOGIKA WYKRYWANIA KONTEKSTU WYJAZDU
  const segments = pathname?.split("/") || [];
  const isTripContext =
    segments[1] === "panel" &&
    segments[2] === "wyjazdy" &&
    segments.length >= 4;
  const tripId = isTripContext ? segments[3] : null;

  // Submenu wyjazdu
  const tripItems = [
    {
      key: "trip-home",
      href: `/panel/wyjazdy/${tripId}`,
      label: "Panel",
      icon: House,
    },
    {
      key: "sklep",
      href: `/panel/wyjazdy/${tripId}/sklep`,
      label: "Sklep",
      icon: Storefront,
    },
    {
      key: "chat",
      href: `/panel/wyjazdy/${tripId}/chat`,
      label: "Czat",
      icon: ChatCircle,
    },
    {
      key: "harmonogram",
      href: `/panel/wyjazdy/${tripId}/harmonogram`,
      label: "Plan",
      icon: CalendarBlank,
    },
    {
      key: "karta",
      href: `/panel/wyjazdy/${tripId}/karta-zdrowia`,
      label: "Zdrowie",
      icon: Heartbeat,
      needsAttention: true,
    },
  ];

  return (
    <aside className="sticky top-0 left-0 h-screen w-[260px] z-40 hidden lg:flex flex-col bg-white/60 backdrop-blur-2xl border-r border-gray-100/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* --- AKCENTY W TLE SIDEBARA --- */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-brand-primary/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-brand-yellow/20 rounded-full blur-[100px]" />
      </div>

      {/* LOGO */}
      <div className="relative z-10 flex items-center justify-center h-[72px] shrink-0 border-b border-brand-primary/5 mb-2">
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

      {/* GŁÓWNA NAWIGACJA */}
      <nav className="relative z-10 flex-1 flex flex-col overflow-y-auto px-4 pb-6 custom-scrollbar">
        {MENU_SECTIONS.map((section, index) => (
          <div
            key={section.title}
            className={cn("flex flex-col", index !== 0 && "mt-6")}
          >
            <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-bold mb-2">
              {section.title}
            </span>

            <div className="flex flex-col gap-1">
              {section.items.map(
                ({ key, href, label, icon: Icon, disabled }) => {
                  // Jeśli jesteśmy w wyjeździe i to jest przycisk "Moje Wyjazdy", traktujemy go jako "Otwarty Folder"
                  const isOpenParent = key === "campy" && isTripContext;
                  const isActive =
                    href === "/panel"
                      ? pathname === "/panel"
                      : pathname?.startsWith(href);

                  if (disabled) {
                    return (
                      <div
                        key={key}
                        title="Platforma VOD jest w budowie"
                        className="relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-brand-secondary/25 opacity-60 cursor-not-allowed select-none"
                      >
                        <div className="relative flex items-center justify-center shrink-0">
                          <Icon size={20} weight="regular" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-secondary/80 flex items-center justify-center shadow-[0_2px_6px_0px_rgba(3,63,99,0.3)]">
                            <Lock
                              size={9}
                              weight="fill"
                              className="text-white"
                            />
                          </span>
                        </div>
                        <span className="font-montserrat text-[13.5px] font-semibold tracking-wide">
                          {label}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="flex flex-col">
                      <Link href={href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            isActive && !isOpenParent
                              ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                              : isOpenParent
                                ? "bg-brand-primary/10 text-brand-primary" // Otwarty folder ma delikatne tło
                                : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
                          )}
                        >
                          {isActive && !isOpenParent && (
                            <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
                          )}
                          <Icon
                            size={20}
                            weight={isActive ? "fill" : "duotone"}
                            className={cn(
                              "relative z-10 transition-colors",
                              isActive && !isOpenParent
                                ? "text-white"
                                : isOpenParent
                                  ? "text-brand-primary"
                                  : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                            )}
                          />
                          <span className="font-montserrat text-[13.5px] font-semibold tracking-wide relative z-10">
                            {label}
                          </span>
                        </div>
                      </Link>

                      {/* --- INTELIGENTNE SUBMENU WYJAZDU --- */}
                      <AnimatePresence>
                        {isOpenParent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            // Wcięcie i linia odniesienia do rodzica
                            className="flex flex-col gap-1 ml-5 pl-3 mt-1.5 border-l border-brand-primary/15 overflow-hidden"
                          >
                            {tripItems.map((subItem) => {
                              const isSubActive =
                                subItem.key === "trip-home"
                                  ? pathname === subItem.href
                                  : pathname?.startsWith(subItem.href);
                              // Kropka: statyczny alert (Karta Zdrowia) LUB
                              // nieprzeczytany czat (API zwraca deep-link czatu).
                              const needsAttention =
                                subItem.needsAttention ||
                                chatUnreadLinks.has(subItem.href);

                              return (
                                <Link key={subItem.key} href={subItem.href}>
                                  <div
                                    className={cn(
                                      // Mniejszy padding (py-2), mniejsze zaokrąglenie, smuklejszy wygląd
                                      "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                                      isSubActive
                                        ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                                        : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
                                    )}
                                  >
                                    {isSubActive && (
                                      <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                                    )}

                                    <div className="relative flex items-center justify-center shrink-0">
                                      <subItem.icon
                                        size={18} // Mniejsza ikona
                                        weight={
                                          isSubActive ? "fill" : "duotone"
                                        }
                                        className={cn(
                                          "relative z-10 transition-colors",
                                          isSubActive
                                            ? "text-white"
                                            : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                                        )}
                                      />
                                      {/* Alert: Karta Zdrowia lub nieprzeczytany czat */}
                                      {needsAttention &&
                                        !isSubActive && (
                                          <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 border border-white" />
                                          </span>
                                        )}
                                    </div>

                                    <span className="font-montserrat text-[12.5px] font-semibold tracking-wide relative z-10">
                                      {subItem.label}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* WYLOGUJ (Przyklejone na dole ekranu) */}
      <div className="relative z-10 p-4 border-t border-brand-primary/5 bg-white/30 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/logowanie" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-secondary/60 hover:text-rose-600 hover:bg-white/50 transition-all w-full text-left cursor-pointer group"
        >
          <SignOut
            size={20}
            className="text-brand-secondary/40 group-hover:text-rose-500 transition-colors"
          />
          <span className="font-montserrat text-[13px] font-medium tracking-wide">
            Wyloguj się
          </span>
        </button>
      </div>
    </aside>
  );
}
