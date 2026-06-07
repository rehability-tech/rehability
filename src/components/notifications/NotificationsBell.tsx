"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CaretLeft,
  CaretRight,
  X,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AttentionDot from "@/components/ui/AttentionDot";

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

export default function NotificationsBell() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Portal + pozycjonowanie (dropdown na desktopie kotwiczymy do dzwonka).
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

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

  // Mount (portal) + obserwacja breakpointu
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Pozycja panelu (desktop) względem dzwonka — liczona przy otwarciu i przy scroll/resize.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = wrapperRef.current?.getBoundingClientRect();
      if (r) setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Klik poza dzwonkiem i poza panelem (panel jest w portalu) → zamknij
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const t = event.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
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
      setOpen(false);
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

  // Czyszczenie — usuwa przeczytane (nieprzeczytane zostają, by nic nie umknęło).
  async function handleClearRead() {
    setLoading(true);
    await fetch("/api/notifications?scope=read", { method: "DELETE" });
    setPage(1);
    setLoading(false);
    fetchNotifications();
  }

  const hasReadToClear = items.some((n) => n.isRead) || filter === "all";

  const panelStyle: React.CSSProperties = isDesktop
    ? { top: coords.top, right: coords.right }
    : { top: 0, left: 0, right: 0, paddingTop: "env(safe-area-inset-top)" };

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={panelStyle}
          className={cn(
            "fixed z-[1000] flex flex-col overflow-hidden",
            "w-full h-[100dvh] bg-white rounded-none", // mobile: fullscreen
            "sm:w-[360px] sm:h-auto sm:rounded-2xl sm:bg-white/95 sm:backdrop-blur-xl sm:border sm:border-white/60 sm:shadow-[0_20px_40px_-10px_rgba(3,63,99,0.2)]",
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-brand-secondary/10 flex justify-between items-center bg-white/50">
            <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
              Powiadomienia
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                  {unreadCount} nowe
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-brand-secondary/5 text-brand-secondary/60 hover:bg-brand-secondary/10 transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Zakładki: Wszystkie / Nieprzeczytane */}
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

          {/* Lista — mobile rośnie i scrolluje, desktop stała wysokość */}
          <div className="flex-1 overflow-y-auto custom-scrollbar sm:flex-none sm:min-h-[280px] sm:max-h-[360px]">
            {items.length > 0 ? (
              <ul className="flex flex-col">
                {items.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleItemClick(notif)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-brand-primary/5 transition-colors border-b border-brand-secondary/5 last:border-0",
                        !notif.isRead && "bg-brand-primary/[0.03]",
                      )}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p
                          className={cn(
                            "font-montserrat text-[13px] leading-tight",
                            !notif.isRead
                              ? "font-bold text-brand-secondary"
                              : "font-medium text-brand-secondary/80",
                          )}
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
              <div className="h-full min-h-[280px] flex items-center justify-center text-brand-secondary/50 font-montserrat text-[13px]">
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
                Strona <span className="text-brand-primary">{page}</span> z{" "}
                {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-brand-secondary/10 hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-brand-secondary transition-all text-brand-secondary"
              >
                <CaretRight size={12} weight="bold" />
              </button>
            </div>
          )}

          {/* Stopka: oznacz wszystkie / wyczyść przeczytane */}
          <div className="p-2 bg-brand-secondary/[0.02] border-t border-brand-secondary/10 flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              disabled={loading || unreadCount === 0}
              className="flex-1 py-2 text-[12px] font-bold text-brand-primary hover:text-brand-secondary transition-colors rounded-lg hover:bg-brand-secondary/5 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Oznacz przeczytane
            </button>
            <button
              onClick={handleClearRead}
              disabled={loading || !hasReadToClear}
              title="Usuń przeczytane powiadomienia"
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-bold text-brand-secondary/60 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-brand-secondary/60"
            >
              <Trash size={14} weight="bold" />
              Wyczyść
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group",
          open
            ? "bg-brand-primary text-white shadow-[0_8px_20px_-6px_rgba(40,125,136,0.6)] -translate-y-0.5"
            : "bg-brand-primary/20 text-brand-primary shadow-[0_4px_12px_-4px_rgba(40,125,136,0.2)] hover:bg-brand-primary/30 hover:shadow-[0_6px_16px_-4px_rgba(40,125,136,0.3)] hover:-translate-y-0.5",
        )}
        aria-label="Powiadomienia"
      >
        <Bell
          size={20}
          weight="fill"
          className="transition-transform duration-300 origin-top group-hover:rotate-[15deg]"
        />
        {unreadCount > 0 && <AttentionDot className="absolute top-1.5 right-2" />}
      </button>

      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
