"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

type FilterTab = "all" | "unread";

const POLL_INTERVAL_MS = 60_000;
const PAGE_SIZE = 5;

export default function NotificationsDropdown() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setnotificationsOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        filter,
      });
      const res = await fetch(`/api/notifications?${qs.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: Notification[];
        unreadCount: number;
        totalPages: number;
      };
      setItems(data.items);
      setUnreadCount(data.unreadCount);
      setTotalPages(Math.max(1, data.totalPages));
    } catch {
      // milcz — odświeży się przy następnym pollingu
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  // Reset paginacji przy zmianie filtra
  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setnotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemClick(notif: Notification) {
    if (!notif.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${notif.id}/read`, { method: "POST" });
    }
    if (notif.link) {
      setnotificationsOpen(false);
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
    fetchNotifications();
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setnotificationsOpen(!notificationsOpen)}
        className={`
    relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group
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
            className="absolute right-0 top-[calc(100%+8px)] w-[320px] sm:w-[360px] z-[160] bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_20px_40px_-10px_rgba(3,63,99,0.2)] overflow-hidden flex flex-col"
          >
            {/* Header z tytułem + badge */}
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

            {/* Segmented tab: Wszystkie / Nieprzeczytane */}
            <div className="px-4 pt-3 pb-2 flex gap-1.5 bg-white/30">
              {(["all", "unread"] as FilterTab[]).map((tab) => {
                const active = filter === tab;
                const label = tab === "all" ? "Wszystkie" : "Nieprzeczytane";
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all",
                      active
                        ? "bg-brand-primary text-white shadow-[0_4px_12px_-4px_rgba(40,125,136,0.4)]"
                        : "bg-white/80 text-brand-secondary/60 hover:bg-white border border-white/60",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Lista — stała wysokość na 5 wpisów, bez scrolla */}
            <div className="min-h-[280px]">
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
                <div className="h-[280px] flex items-center justify-center text-brand-secondary/50 font-montserrat text-[13px]">
                  {filter === "unread"
                    ? "Brak nieprzeczytanych powiadomień"
                    : "Brak powiadomień"}
                </div>
              )}
            </div>

            {/* Paginacja */}
            {totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-brand-secondary/10 flex items-center justify-between bg-white/50">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-brand-secondary/10 hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary transition-all text-brand-secondary"
                >
                  <CaretLeft size={12} weight="bold" />
                </button>
                <span className="text-[11px] font-bold text-brand-secondary/60">
                  Strona{" "}
                  <span className="text-brand-primary">{page}</span> z{" "}
                  {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-brand-secondary/10 hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary transition-all text-brand-secondary"
                >
                  <CaretRight size={12} weight="bold" />
                </button>
              </div>
            )}

            {/* Stopka: oznacz wszystkie */}
            <div className="p-2 bg-brand-secondary/[0.02] border-t border-brand-secondary/10">
              <button
                onClick={handleMarkAllRead}
                disabled={loading || unreadCount === 0}
                className="w-full py-2 text-[12px] font-bold text-brand-primary hover:text-brand-secondary transition-colors rounded-lg hover:bg-brand-secondary/5 disabled:opacity-40 disabled:hover:bg-transparent"
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
