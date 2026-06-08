"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretDown,
  Globe,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { AdminUser } from "./types";

export default function ProfileMenu({ user }: { user?: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isIOSStandalone =
      "standalone" in window.navigator &&
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    setIsPWA(isStandalone || Boolean(isIOSStandalone));
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="group flex items-center gap-2 pr-2 md:pr-3 pl-1 py-1 rounded-2xl hover:bg-white/70 transition"
      >
        <div className="relative">
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_16px_rgba(40,125,136,0.5)] opacity-90" />
          <div className="relative w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center overflow-hidden">
            {user?.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-bold text-[13px] text-white">
                {(user?.name?.trim()?.charAt(0) || "U").toUpperCase()}
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
        {open && (
          <>
            <div
              className="fixed inset-0 z-[150]"
              onClick={() => setOpen(false)}
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
                  {user?.role === "ADMIN" ? "Administrator" : "Użytkownik"}
                </p>
              </div>
              <div className="p-2">
                {!isPWA && (
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                  >
                    <Globe size={16} weight="duotone" />
                    Strona główna
                  </Link>
                )}

                <button
                  onClick={() => {
                    setOpen(false);
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
  );
}
