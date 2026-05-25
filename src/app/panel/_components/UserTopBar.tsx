"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Bell,
  SignOut,
  CaretDown,
  Globe,
  MagnifyingGlass,
  X,
  SquaresFour,
  Tent,
  MonitorPlay,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

export interface UserTopbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
}

const getInitials = (name?: string | null) => {
  if (!name) return "UC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// ----------------------------------------------------------------------
// 1. SUB-KOMPONENT: WYSZUKIWARKA (Dostosowana do panelu uczestniczki)
// ----------------------------------------------------------------------
const mockSearchData = [
  { id: "1", title: "Mój Start", href: "/panel", icon: SquaresFour },
  { id: "2", title: "Moje Campy", href: "/panel/campy", icon: Tent },
  { id: "3", title: "Platforma VOD", href: "/panel/vod", icon: MonitorPlay },
  { id: "4", title: "Mój Profil", href: "/panel/profil", icon: UserIcon },
];

function UserSearchBar() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredResults =
    query.trim() === ""
      ? []
      : mockSearchData.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`
          flex items-center transition-all duration-300 ease-out h-10
          ${isFocused ? "w-[280px] md:w-[320px] bg-white shadow-[0_4px_15px_rgba(3,63,99,0.1)] border-brand-primary/30" : "w-10 md:w-[240px] bg-white/50 border-white/60"}
          rounded-full border overflow-hidden backdrop-blur-md
        `}
      >
        <button
          onClick={() => setIsFocused(true)}
          className="w-10 h-10 flex shrink-0 items-center justify-center text-brand-secondary/60 hover:text-brand-primary transition-colors"
          aria-label="Szukaj"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>
        <input
          type="text"
          placeholder="Czego szukasz?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`
            bg-transparent border-none outline-none font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/40 w-full pr-4
            ${isFocused || "hidden md:block"}
          `}
        />
        {isFocused && query && (
          <button
            onClick={() => setQuery("")}
            className="px-3 text-brand-secondary/40 hover:text-brand-secondary"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-[280px] md:w-[320px] z-[160] bg-white/95 backdrop-blur-xl border border-brand-secondary/10 rounded-2xl shadow-[0_20px_40px_-10px_rgba(3,63,99,0.2)] overflow-hidden"
          >
            {filteredResults.length > 0 ? (
              <ul className="py-2">
                {filteredResults.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => {
                        router.push(result.href);
                        setIsFocused(false);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-secondary/5 flex items-center justify-center text-brand-secondary/50 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                        <result.icon size={16} weight="duotone" />
                      </div>
                      <span className="font-montserrat text-[13px] font-medium text-brand-secondary truncate">
                        {result.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center">
                <p className="font-montserrat text-[13px] text-brand-secondary/50">
                  Brak wyników dla &quot;{query}&quot;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. SUB-KOMPONENT: POWIADOMIENIA (Identyczne jak u Admina)
// ----------------------------------------------------------------------
interface NotificationData {
  id: string;
  title: string;
  message: string | null;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const POLL_INTERVAL_MS = 60_000;

function UserNotifications() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [items, setItems] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ciche odświeżenie
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemClick(notif: NotificationData) {
    if (!notif.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${notif.id}/read`, { method: "POST" });
    }
    if (notif.link) {
      setNotificationsOpen(false);
      router.push(notif.link);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setLoading(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
    setLoading(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className={`
          relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group
          ${
            notificationsOpen
              ? "bg-brand-primary text-white shadow-[0_8px_20px_-6px_rgba(40,125,136,0.6)] -translate-y-0.5"
              : "bg-brand-primary/20 text-brand-primary shadow-[0_4px_12px_-4px_rgba(40,125,136,0.2)] hover:bg-brand-primary/30 hover:shadow-[0_6px_16px_-4px_rgba(40,125,136,0.3)] hover:-translate-y-0.5"
          }
        `}
      >
        <Bell
          size={20}
          weight="fill"
          className="transition-transform duration-300 origin-top group-hover:rotate-[15deg]"
        />
        {unreadCount > 0 && (
          <span
            className={`
              absolute top-2 right-2.5 w-2 h-2 rounded-full bg-brand-yellow border-[1.5px] shadow-[0_0_8px_rgba(242,217,103,0.8)] transition-colors duration-300
              ${notificationsOpen ? "border-brand-primary" : "border-white"}
            `}
          />
        )}
      </button>

      <AnimatePresence>
        {notificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+8px)] w-[300px] sm:w-[340px] z-[160] bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_40px_-10px_rgba(3,63,99,0.2)] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-brand-secondary/10 flex justify-between items-center bg-white/50">
              <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
                Powiadomienia
              </p>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                  {unreadCount} nowe
                </span>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {items.length > 0 ? (
                <ul className="flex flex-col">
                  {items.map((notif) => (
                    <li key={notif.id}>
                      <button
                        onClick={() => handleItemClick(notif)}
                        className={`w-full text-left p-4 hover:bg-brand-primary/5 transition-colors border-b border-brand-secondary/5 last:border-0 ${!notif.isRead ? "bg-brand-primary/[0.03]" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <p
                            className={`font-montserrat text-[13px] leading-tight ${!notif.isRead ? "font-bold text-brand-secondary" : "font-medium text-brand-secondary/80"}`}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1 shrink-0 shadow-[0_0_6px_rgba(40,125,136,0.5)]" />
                          )}
                        </div>
                        {notif.message && (
                          <p className="font-montserrat text-[12px] text-brand-secondary/60 leading-snug mt-1">
                            {notif.message}
                          </p>
                        )}
                        <p className="font-montserrat text-[10px] font-semibold text-brand-secondary/40 mt-2">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                            locale: pl,
                          })}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-brand-secondary/50 font-montserrat text-[13px]">
                  Brak nowych powiadomień
                </div>
              )}
            </div>

            <div className="p-2 bg-brand-secondary/[0.02] border-t border-brand-secondary/10">
              <button
                onClick={handleMarkAllRead}
                disabled={loading || unreadCount === 0}
                className="w-full py-2 text-[12px] font-bold text-brand-primary hover:text-brand-secondary transition-colors rounded-xl hover:bg-brand-secondary/5 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. SUB-KOMPONENT: MENU PROFILU
// ----------------------------------------------------------------------
function UserProfileMenu({ user }: { user?: UserTopbarProps["user"] }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setProfileOpen((s) => !s)}
        className="group flex items-center gap-2 pr-2 md:pr-3 pl-1 py-1 rounded-2xl hover:bg-white/70 transition"
      >
        <div className="relative">
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_16px_rgba(40,125,136,0.3)] opacity-90" />
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
            {user?.name || "Konto"}
          </span>
          <span className="text-[10px] text-brand-secondary/50 mt-0.5">
            Ustawienia
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
              className="absolute right-0 top-full mt-2 w-60 z-[160] rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_-20px_rgba(3,63,99,0.3)] overflow-hidden"
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
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] text-brand-secondary hover:bg-brand-primary/10 transition"
                >
                  <Globe size={16} weight="duotone" />
                  Strona główna
                </Link>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    signOut({ callbackUrl: "/logowanie" });
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] text-brand-secondary hover:bg-brand-yellow/30 transition w-full text-left mt-1"
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

// ----------------------------------------------------------------------
// GŁÓWNY EKSPORT KOMPONENTU
// ----------------------------------------------------------------------
export default function UserTopbar({ user }: UserTopbarProps) {
  return (
    <header className="sticky top-0 z-[100] h-16 px-4 lg:px-8 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.08)]">
      {/* LEWA STRONA: Wyszukiwarka */}
      <div className="flex items-center flex-1 min-w-0">
        <UserSearchBar />
      </div>

      {/* PRAWA STRONA: Powiadomienia + Profil */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <UserNotifications />
        <div className="hidden md:block h-6 w-px bg-brand-secondary/10 mx-1" />
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
