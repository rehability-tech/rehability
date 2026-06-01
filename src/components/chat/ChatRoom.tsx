"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperPlaneRight,
  CircleNotch,
  ChatCircleDots,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  isAdmin: boolean;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  senderRole: "ADMIN" | "USER" | string;
  isMine: boolean;
}

interface ChatResponse {
  currentUserId: string;
  messages: ChatMessage[];
}

interface ChatRoomProps {
  tripId: string;
  /** "admin" = panel organizatora, "panel" = panel uczestniczki. Wpływa na drobne etykiety. */
  variant?: "panel" | "admin";
  title?: string;
  subtitle?: string;
}

const fetcher = async (url: string): Promise<ChatResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Nie udało się pobrać wiadomości");
  }
  return res.json();
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Dzisiaj";
  if (date.toDateString() === yesterday.toDateString()) return "Wczoraj";
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ChatRoom({
  tripId,
  variant = "panel",
  title = "Czat wyjazdowy",
  subtitle = "Bądź na bieżąco z organizatorem i grupą",
}: ChatRoomProps) {
  const { data, error, isLoading, mutate } = useSWR<ChatResponse>(
    `/api/wyjazdy/${tripId}/chat`,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true },
  );

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  // Płynne scrollowanie do dołu: na start (instant) oraz przy nowych wiadomościach (smooth).
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({
      behavior: didInitialScroll.current ? "smooth" : "auto",
      block: "end",
    });
    didInitialScroll.current = true;
  }, [messages.length]);

  // Grupowanie po dniach dla separatorów dat.
  const grouped = useMemo(() => {
    const map = new Map<string, ChatMessage[]>();
    for (const m of messages) {
      const day = new Date(m.createdAt).toDateString();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setDraft("");

    try {
      const res = await fetch(`/api/wyjazdy/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("send-failed");
      const created: ChatMessage = await res.json();

      // Optymistyczne dołączenie + rewalidacja w tle.
      await mutate(
        (prev) =>
          prev
            ? { ...prev, messages: [...prev.messages, created] }
            : prev,
        { revalidate: true },
      );
    } catch {
      setDraft(text); // przywróć treść przy błędzie
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="relative flex flex-col h-full rounded-3xl rounded-tr-none border border-white/60 bg-white/40 backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(3,63,99,0.15)] overflow-hidden">
      {/* Poświata w tle */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-24 -right-16 w-72 h-72 bg-brand-yellow/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-brand-primary/15 rounded-full blur-[90px]" />
      </div>

      {/* Nagłówek */}
      <header className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-white/50 bg-white/30 backdrop-blur-xl shrink-0">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30">
          <ChatCircleDots size={22} weight="fill" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-yellow/50 blur-[10px] rounded-full" />
        </div>
        <div className="min-w-0">
          <h2 className="font-jakarta font-bold text-[15px] text-brand-secondary leading-tight truncate">
            {title}
          </h2>
          <p className="text-[12px] text-brand-secondary/50 font-medium truncate">
            {subtitle}
          </p>
        </div>
      </header>

      {/* Lista wiadomości */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-brand-secondary/40">
            <CircleNotch size={28} className="animate-spin mb-2" />
            <p className="text-xs font-semibold">Wczytywanie czatu…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-rose-500/70 text-center px-6">
            <p className="text-sm font-semibold">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-brand-secondary/40 text-center px-6">
            <ChatCircleDots size={40} weight="duotone" className="mb-3 opacity-50" />
            <p className="text-sm font-semibold">Tu jeszcze cicho…</p>
            <p className="text-xs mt-1">Napisz pierwszą wiadomość, aby rozpocząć rozmowę.</p>
          </div>
        )}

        {grouped.map(([day, items]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 bg-white/50 backdrop-blur px-3 py-1 rounded-full border border-white/60">
                {formatDayLabel(items[0].createdAt)}
              </span>
            </div>

            <AnimatePresence initial={false}>
              {items.map((m) => (
                <MessageBubble key={m.id} message={m} variant={variant} />
              ))}
            </AnimatePresence>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Pole wprowadzania */}
      <form
        onSubmit={handleSend}
        className="relative z-10 flex items-end gap-2 px-4 py-3 border-t border-white/50 bg-white/40 backdrop-blur-xl shrink-0"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={1}
          placeholder="Napisz wiadomość…"
          className="flex-1 resize-none max-h-32 rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm text-brand-secondary placeholder:text-brand-secondary/40 outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/15 transition-all custom-scrollbar"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="relative flex items-center justify-center w-11 h-11 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shrink-0"
          aria-label="Wyślij wiadomość"
        >
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-yellow/50 blur-[10px] rounded-full pointer-events-none" />
          {isSending ? (
            <CircleNotch size={20} weight="bold" className="animate-spin" />
          ) : (
            <PaperPlaneRight size={20} weight="fill" />
          )}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  variant,
}: {
  message: ChatMessage;
  variant: "panel" | "admin";
}) {
  const { isMine, isAdmin, senderName, senderImage, senderRole, text, createdAt } =
    message;

  // Admin wykrywany po fladze wiadomości LUB aktualnej roli nadawcy.
  const isAdminSender = isAdmin || senderRole === "ADMIN";

  // Wyróżniamy dymki organizatora gradientem brand-primary niezależnie od strony.
  const isHighlighted = isAdminSender;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-end gap-2", isMine ? "justify-end" : "justify-start")}
    >
      {!isMine && <Avatar name={senderName} image={senderImage} isAdmin={isAdminSender} />}

      <div className={cn("max-w-[75%] flex flex-col", isMine ? "items-end" : "items-start")}>
        {!isMine && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-brand-secondary/70 mb-1 px-1">
            {senderName}
            {isAdminSender && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                <ShieldCheck size={10} weight="fill" /> Administrator
              </span>
            )}
          </span>
        )}

        <div
          className={cn(
            "relative px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
            isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md",
            isHighlighted
              ? "bg-gradient-to-br from-brand-primary to-[#1f6671] text-white border border-brand-yellow/20"
              : isMine
                ? "bg-brand-secondary text-white"
                : "bg-white/80 text-brand-secondary border border-white/70",
          )}
        >
          {isHighlighted && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-yellow/40 blur-[12px] rounded-full pointer-events-none" />
          )}
          {text}
        </div>

        <span className="text-[10px] text-brand-secondary/40 mt-1 px-1 tabular-nums">
          {formatTime(createdAt)}
          {variant === "admin" && isMine && " · Ty"}
        </span>
      </div>

      {isMine && <Avatar name={senderName} image={senderImage} isAdmin={isAdminSender} />}
    </motion.div>
  );
}

function Avatar({
  name,
  image,
  isAdmin,
}: {
  name: string;
  image: string | null;
  isAdmin: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold overflow-hidden border",
        isAdmin
          ? "bg-brand-primary text-white border-brand-yellow/30"
          : "bg-white/70 text-brand-secondary/70 border-white/70",
      )}
    >
      {image ? (
        <Image src={image} alt={name} fill className="object-cover" sizes="32px" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
