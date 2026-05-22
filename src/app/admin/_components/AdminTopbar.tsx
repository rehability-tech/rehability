"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Gear,
  SquaresFour,
  SignOut,
  CaretDown,
  ArrowLeft,
  X,
  Tent,
  PlayCircle,
  Article,
  House,
  CaretRight,
  Globe, // <-- DODANA IKONA
} from "@phosphor-icons/react/dist/ssr";

export interface AdminTopbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

const getInitials = (name?: string | null) => {
  if (!name) return "AD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

function sectionLabel(pathname: string): { label: string; isHub: boolean } {
  if (pathname === "/admin") return { label: "Admin Hub", isHub: true };
  if (pathname.startsWith("/admin/campy"))
    return { label: "Admin / Campy", isHub: false };
  if (pathname.startsWith("/admin/klientki"))
    return { label: "Admin / Klientki", isHub: false };
  if (pathname.startsWith("/admin/vod"))
    return { label: "Admin / VOD", isHub: false };
  if (pathname.startsWith("/admin/blog"))
    return { label: "Admin / Blog", isHub: false };
  if (pathname.startsWith("/admin/ustawienia"))
    return { label: "Admin / Ustawienia", isHub: false };
  return { label: "Admin", isHub: false };
}

const drawerSections = [
  {
    label: "Powrót do Launchera",
    href: "/admin",
    icon: House,
    accent: "from-brand-primary to-brand-secondary",
    iconBg: "bg-white/20 text-white",
    highlight: true,
  },
  {
    label: "System Campów",
    href: "/admin/campy",
    icon: Tent,
    iconBg: "bg-brand-primary/10 text-brand-primary",
  },
  {
    label: "Platforma VOD",
    href: "/admin/vod",
    icon: PlayCircle,
    iconBg: "bg-brand-yellow/30 text-brand-secondary",
  },
  {
    label: "Blog i Treści",
    href: "/admin/blog",
    icon: Article,
    iconBg: "bg-brand-secondary/10 text-brand-secondary",
  },
];

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  const { label, isHub } = sectionLabel(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // Detekcja trybu PWA (Standalone) tylko po stronie klienta
  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    // Fallback dla specyficznego zachowania na starszych iOS
    const isIOSStandalone =
      "standalone" in window.navigator && (window.navigator as any).standalone;

    setIsPWA(isStandalone || isIOSStandalone);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[100] h-16 px-4 lg:px-6 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.12)]">
        {/* LEWA: Global Hub (drawer) + section breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Otwórz globalne menu"
            className="group relative w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_8px_22px_-8px_rgba(40,125,136,0.55)] hover:shadow-[0_10px_26px_-6px_rgba(40,125,136,0.7)] transition shrink-0 cursor-pointer"
          >
            <SquaresFour size={20} weight="fill" />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
          </button>

          {!isHub && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-brand-secondary/70 hover:text-brand-secondary hover:bg-white/60 transition"
            >
              <ArrowLeft size={12} weight="bold" />
              <span className="uppercase tracking-wider">Menu</span>
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden md:inline text-[12px] uppercase tracking-[0.18em] font-bold text-brand-secondary/40">
              Sekcja
            </span>
            <span className="font-jakarta text-[14px] md:text-[15px] font-bold text-brand-secondary truncate">
              {label}
            </span>
          </div>
        </div>

        {/* PRAWA: Ikony narzędzi + Avatar */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button className="relative w-10 h-10 rounded-2xl bg-white/60 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition shadow-[0_4px_14px_-6px_rgba(3,63,99,0.15)]">
            <Bell size={18} weight="duotone" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(40,125,136,0.9)]" />
          </button>

          <Link
            href="/admin/ustawienia"
            aria-label="Ustawienia"
            className="w-10 h-10 rounded-2xl bg-white/60 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition shadow-[0_4px_14px_-6px_rgba(3,63,99,0.15)]"
          >
            <Gear size={18} weight="duotone" />
          </Link>

          <div className="hidden md:block h-8 w-px bg-brand-secondary/10 mx-1" />

          <div className="relative">
            <button
              onClick={() => setProfileOpen((s) => !s)}
              className="group flex items-center gap-2 pr-2 md:pr-3 pl-1 py-1 rounded-2xl hover:bg-white/70 transition"
            >
              <div className="relative">
                <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_16px_rgba(40,125,136,0.5)] opacity-90" />
                <div className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-bold text-[12px] text-brand-secondary">
                      {getInitials(user?.name)}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="font-bold text-[12px] text-brand-secondary leading-none">
                  {user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-brand-secondary/50 mt-0.5">
                  {user?.role === "ADMIN" ? "Administrator" : "Użytkownik"}
                </span>
              </div>
              <CaretDown
                size={14}
                weight="bold"
                className="hidden md:block text-brand-secondary/40 group-hover:text-brand-secondary transition"
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[150]"
                    onClick={() => setProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-60 z-[160] rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_-20px_rgba(3,63,99,0.3)] overflow-hidden"
                  >
                    <div className="p-4 border-b border-brand-secondary/5">
                      <p className="font-bold text-[13px] text-brand-secondary">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-[11px] text-brand-secondary/50 mt-0.5">
                        {user?.role === "ADMIN"
                          ? "Administrator"
                          : "Użytkownik"}
                      </p>
                    </div>
                    <div className="p-2">
                      {/* NOWY LINK: Pokazywany tylko jeśli NIE jesteśmy w PWA */}
                      {!isPWA && (
                        <Link
                          href="/"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                        >
                          <Globe size={16} weight="duotone" />
                          Strona główna
                        </Link>
                      )}

                      <Link
                        href="/admin/ustawienia"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                      >
                        <Gear size={16} weight="duotone" />
                        Ustawienia
                      </Link>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut({ callbackUrl: "/logowanie" });
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-yellow/30 transition w-full text-left"
                      >
                        <SignOut size={16} weight="duotone" />
                        Wyloguj się
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ========= GLOBAL DRAWER (Menu) ========= */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[200] bg-brand-secondary/40 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 bottom-0 z-[201] w-[88%] sm:w-[420px] bg-white/80 backdrop-blur-2xl border-r border-white/40 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] flex flex-col"
            >
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-32 -left-20 w-[360px] h-[360px] rounded-full bg-brand-primary/25 blur-[120px]" />
                <div className="absolute bottom-0 -right-20 w-[320px] h-[320px] rounded-full bg-brand-yellow/30 blur-[120px]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(40,125,136,0.5)]">
                    <SquaresFour size={20} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/50 font-bold">
                      Globalne menu
                    </p>
                    <p className="font-jakarta text-[15px] font-bold text-brand-secondary leading-tight">
                      Admin Hub
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Zamknij menu"
                  className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
                    },
                  }}
                  className="space-y-2"
                >
                  {drawerSections.map((item) => (
                    <motion.li
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        show: { opacity: 1, x: 0 },
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`group flex items-center gap-4 p-3.5 rounded-2xl transition shadow-[0_4px_18px_-10px_rgba(3,63,99,0.18)] ${
                          item.highlight
                            ? `bg-gradient-to-br ${item.accent} text-white hover:shadow-[0_12px_30px_-8px_rgba(40,125,136,0.55)]`
                            : "bg-white/70 backdrop-blur-md border border-white/40 hover:bg-white"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconBg}`}
                        >
                          <item.icon size={20} weight="duotone" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-jakarta font-bold text-[14px] ${
                              item.highlight
                                ? "text-white"
                                : "text-brand-secondary"
                            }`}
                          >
                            {item.label}
                          </p>
                          {item.highlight && (
                            <p className="text-[11px] text-white/70 mt-0.5">
                              Wybierz inny moduł
                            </p>
                          )}
                        </div>
                        <CaretRight
                          size={16}
                          weight="bold"
                          className={
                            item.highlight
                              ? "text-white/80"
                              : "text-brand-secondary/40 group-hover:text-brand-primary"
                          }
                        />
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>

                <div className="mt-6 px-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-bold mb-2">
                    Konto
                  </p>
                  <Link
                    href="/admin/ustawienia"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-white/70 transition"
                  >
                    <Gear size={18} weight="duotone" />
                    Ustawienia
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div
                className="border-t border-white/30 p-4 shrink-0"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
                }}
              >
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-white/40">
                  <div className="relative">
                    <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary opacity-90" />
                    <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[12px] text-brand-secondary overflow-hidden">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-brand-secondary truncate">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-[11px] text-brand-secondary/50 truncate">
                      {user?.role === "ADMIN" ? "Administrator" : "Użytkownik"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      signOut({ callbackUrl: "/logowanie" });
                    }}
                    className="w-10 h-10 rounded-xl bg-brand-yellow/40 hover:bg-brand-yellow text-brand-secondary flex items-center justify-center transition"
                    aria-label="Wyloguj się"
                  >
                    <SignOut size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
