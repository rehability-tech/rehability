"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarBlank,
  Copy,
  CurrencyCircleDollar,
  Flask,
  PencilSimple,
  Trash,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import { formatGrosze } from "@/lib/discounts/format";

import type { PromoKind } from "./types";

/**
 * Wspólna anatomia karty promocji — kod, przecena i rabat mailowy różnią się
 * tylko nagłówkiem i wartością, więc reszta (cykl życia, limity, akcje)
 * mieszka tutaj jeden raz.
 */

export type PromoCardProps = {
  kind: PromoKind;
  /** Kod (mono, uppercase) albo nazwa promocji. */
  title: string;
  /** `−10%`, `−150 zł`, `cena 1 200 zł`. */
  valueLabel: string;
  note: string | null;
  isActive: boolean;
  /** Przechodzi bramkę cyklu życia (daty + limit) — inaczej „nie działa dziś". */
  eligible: boolean;
  isSandbox: boolean;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  stats: { uses: number; discountGrosze: number };
  /** Dodatkowe plakietki (np. „Łączy się z przeceną", liczba adresów). */
  badges?: React.ReactNode;
  children?: React.ReactNode;
  onToggle: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  busy?: boolean;
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PromoCard({
  kind,
  title,
  valueLabel,
  note,
  isActive,
  eligible,
  isSandbox,
  validFrom,
  validUntil,
  usageLimit,
  usedCount,
  stats,
  badges,
  children,
  onToggle,
  onEdit,
  onCopy,
  onDelete,
  busy = false,
}: PromoCardProps) {
  const from = formatDate(validFrom);
  const until = formatDate(validUntil);

  // Limit jest MIĘKKI — dwie równoległe płatności potrafią dobić licznik
  // ponad limit. Pasek przycinamy do 100%, ale liczba pokazuje prawdę (21/20).
  const usageRatio = usageLimit ? Math.min(100, (usedCount / usageLimit) * 100) : 0;
  const isExhausted = usageLimit != null && usedCount >= usageLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl rounded-tr-none border p-5 shadow-sm transition-shadow hover:shadow-md ${
        isActive && eligible
          ? "bg-white/70 backdrop-blur-xl border-white/80"
          : "bg-gray-50/70 backdrop-blur-xl border-gray-200/70"
      }`}
    >
      {isActive && eligible && (
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-brand-yellow/40 blur-[30px]" />
      )}

      <div className="relative z-10 flex flex-col gap-4">
        {/* Nagłówek: tytuł + wartość + akcje */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-bold text-brand-secondary truncate ${
                  kind === "CODE"
                    ? "font-mono text-[15px] uppercase tracking-wide"
                    : "font-jakarta text-[15px]"
                }`}
              >
                {title}
              </h3>

              <span className="shrink-0 rounded-lg bg-brand-primary/10 px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                {valueLabel}
              </span>

              {isSandbox && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  <Flask size={11} weight="bold" /> Testowa
                </span>
              )}
            </div>

            {note && (
              <p className="mt-1 text-[12px] text-brand-secondary/50 line-clamp-2">
                {note}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              disabled={busy}
              title="Edytuj"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-secondary/50 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary disabled:opacity-40"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onCopy}
              disabled={busy}
              title="Kopiuj do innych wydarzeń"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-secondary/50 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary disabled:opacity-40"
            >
              <Copy size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              title="Usuń"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-secondary/50 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Plakietki cyklu życia */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all disabled:opacity-40 ${
              isActive
                ? "border border-brand-yellow/30 bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                : "bg-gray-200/80 text-brand-secondary/60 hover:bg-gray-300/80"
            }`}
          >
            {isActive ? "Aktywna" : "Wyłączona"}
          </button>

          {(from || until) && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-secondary/5 px-2 py-1 text-[11px] font-semibold text-brand-secondary/60">
              <CalendarBlank size={12} weight="bold" />
              {from && until ? `${from} – ${until}` : from ? `od ${from}` : `do ${until}`}
            </span>
          )}

          {badges}

          {/* Aktywna, ale poza oknem dat lub po limicie — admin musi to widzieć. */}
          {isActive && !eligible && (
            <span className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600">
              {isExhausted ? "Pula wyczerpana" : "Poza terminem"}
            </span>
          )}
        </div>

        {/* Limit użyć */}
        {usageLimit != null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-brand-secondary/50">Wykorzystanie puli</span>
              <span
                className={
                  isExhausted ? "text-rose-600" : "text-brand-secondary/70"
                }
              >
                {usedCount} / {usageLimit}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-secondary/10">
              <div
                className={`h-full rounded-full transition-all ${
                  isExhausted
                    ? "bg-rose-400"
                    : "bg-gradient-to-r from-brand-primary to-brand-yellow"
                }`}
                style={{ width: `${usageRatio}%` }}
              />
            </div>
          </div>
        )}

        {/* Statystyki sprzedaży */}
        <div className="flex items-center gap-4 border-t border-brand-secondary/5 pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-secondary/60">
            <Users size={13} weight="bold" />
            {stats.uses} {stats.uses === 1 ? "zakup" : "zakupów"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-secondary/60">
            <CurrencyCircleDollar size={13} weight="bold" />
            Udzielono {formatGrosze(stats.discountGrosze)}
          </span>
        </div>

        {children}
      </div>
    </motion.div>
  );
}
