"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Article,
  CaretRight,
  Gear,
  House,
  PlayCircle,
  SignOut,
  SquaresFour,
  Tent,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { AdminUser, getInitials } from "./types";

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
    label: "System Wyjazdów",
    href: "/admin/wyjazdy",
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

interface Props {
  open: boolean;
  onClose: () => void;
  user?: AdminUser;
}

export default function GlobalDrawer({ open, onClose, user }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
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
                onClick={onClose}
                aria-label="Zamknij menu"
                className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-white border border-white/40 flex items-center justify-center text-brand-secondary transition"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

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
                      onClick={onClose}
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
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-brand-secondary hover:bg-white/70 transition"
                >
                  <Gear size={18} weight="duotone" />
                  Ustawienia
                </Link>
              </div>
            </nav>

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
                    onClose();
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
  );
}
