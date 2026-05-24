"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  SignOut,
  CaretDown,
  Globe,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

export interface UserTopbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  bookingId: string;
}

const getInitials = (name?: string | null) => {
  if (!name) return "UC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

function sectionLabel(pathname: string, base: string): string {
  if (pathname === base) return "Panel uczestniczki";
  if (pathname.startsWith(`${base}/harmonogram`)) return "Panel / Mój Plan";
  if (pathname.startsWith(`${base}/sklep`)) return "Panel / Masaże";
  if (pathname.startsWith(`${base}/karta-zdrowia`)) return "Panel / Profil";
  if (pathname.startsWith(`${base}/finanse`)) return "Panel / Finanse";
  return "Panel uczestniczki";
}

export default function UserTopbar({ user, bookingId }: UserTopbarProps) {
  const pathname = usePathname();
  const base = `/panel/${bookingId}`;
  const label = sectionLabel(pathname, base);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] h-16 px-4 lg:px-6 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.12)]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden md:inline text-[12px] uppercase tracking-[0.18em] font-bold text-brand-secondary/40">
            Sekcja
          </span>
          <span className="font-jakarta text-[14px] md:text-[15px] font-bold text-brand-secondary truncate">
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <button
          aria-label="Powiadomienia"
          className="relative w-10 h-10 rounded-2xl bg-white/60 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition shadow-[0_4px_14px_-6px_rgba(3,63,99,0.15)]"
        >
          <Bell size={18} weight="duotone" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(40,125,136,0.9)]" />
        </button>

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
                {user?.name || "Uczestniczka"}
              </span>
              <span className="text-[10px] text-brand-secondary/50 mt-0.5">
                Panel uczestniczki
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
                      {user?.name || "Uczestniczka"}
                    </p>
                    {user?.email && (
                      <p className="text-[11px] text-brand-secondary/50 mt-0.5 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="p-2">
                    <Link
                      href="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                    >
                      <Globe size={16} weight="duotone" />
                      Strona główna
                    </Link>

                    <Link
                      href={`${base}/karta-zdrowia`}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                    >
                      <UserIcon size={16} weight="duotone" />
                      Mój profil
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
  );
}
