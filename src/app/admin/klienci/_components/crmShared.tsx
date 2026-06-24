"use client";

/**
 * Współdzielone elementy prezentacji CRM — używane przez wszystkie warianty
 * wyglądu panelu „Baza Kontaktów" (DRY). Trzymamy tu meta źródeł/statusów,
 * konfigurację stylu (debug bar) oraz drobne komponenty prezentacyjne
 * (avatar, chipy źródeł, badge statusu/lojalności).
 */
import React from "react";
import {
  Tent,
  GraduationCap,
  Megaphone,
  UserPlus,
  Crown,
  ArrowsClockwise,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { CrmContact, Loyalty, ContactStatus } from "@/lib/crm/types";
import { LOYALTY_META } from "@/lib/crm/loyalty";

// ─── Konfiguracja stylu (debug bar) ───────────────────────────────────────────

export type CrmVariant = "pro" | "cards" | "columns" | "compact" | "table";
export type CrmAccent = "orange" | "teal" | "navy" | "gold";
export type CrmDensity = "comfort" | "compact";

export interface CrmStyle {
  variant: CrmVariant;
  accent: CrmAccent;
  density: CrmDensity;
  glow: boolean;
}

export const DEFAULT_CRM_STYLE: CrmStyle = {
  variant: "pro",
  accent: "orange",
  density: "comfort",
  glow: false,
};

export const ACCENT: Record<
  CrmAccent,
  { main: string; soft: string; text: string; label: string }
> = {
  orange: {
    main: "#f97316",
    soft: "rgba(249,115,22,0.12)",
    text: "#ffffff",
    label: "Pomarańcz",
  },
  teal: {
    main: "#287d88",
    soft: "rgba(40,125,136,0.10)",
    text: "#ffffff",
    label: "Morski",
  },
  navy: {
    main: "#033f63",
    soft: "rgba(3,63,99,0.10)",
    text: "#ffffff",
    label: "Granat",
  },
  gold: {
    main: "#f2d967",
    soft: "rgba(242,217,103,0.20)",
    text: "#033f63",
    label: "Złoty",
  },
};

/** Zmienne CSS wstrzykiwane na wrapperze — warianty używają var(--crm-accent). */
export function accentVars(style: CrmStyle): React.CSSProperties {
  const a = ACCENT[style.accent];
  return {
    ["--crm-accent" as string]: a.main,
    ["--crm-accent-soft" as string]: a.soft,
    ["--crm-accent-text" as string]: a.text,
  };
}

/** Klasa poświaty (żółty glow zgodny z systemem designu) lub neutralny cień. */
export function glowClass(style: CrmStyle): string {
  return style.glow
    ? "shadow-[0_4px_15px_0px_rgba(242,217,103,0.30)]"
    : "shadow-sm";
}

// ─── Meta źródeł / statusów / lojalności ──────────────────────────────────────

export const SOURCE_META: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  Wyjazdy: {
    label: "Wyjazdy",
    className: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    icon: <Tent size={12} weight="fill" />,
  },
  VOD: {
    label: "VOD",
    className: "bg-violet-50 text-violet-600 border-violet-200",
    icon: <GraduationCap size={12} weight="fill" />,
  },
  Newsletter: {
    label: "Newsletter",
    className: "bg-amber-50 text-amber-600 border-amber-200",
    icon: <Megaphone size={12} weight="fill" />,
  },
  Ręczny: {
    label: "Ręczny",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <UserPlus size={12} weight="fill" />,
  },
};

export const ALL_SOURCES = ["Wyjazdy", "VOD", "Newsletter", "Ręczny"] as const;

export const STATUS_META: Record<
  ContactStatus,
  { label: string; className: string; dot: string }
> = {
  SUBSCRIBED: {
    label: "Subskrybuje",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },
  UNSUBSCRIBED: {
    label: "Wypisany",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
  BOUNCED: {
    label: "Odbicie",
    className: "bg-rose-50 text-rose-600 border-rose-200",
    dot: "bg-rose-500",
  },
  COMPLAINED: {
    label: "Skarga",
    className: "bg-rose-50 text-rose-600 border-rose-200",
    dot: "bg-rose-500",
  },
};

export const LOYALTY_ICON: Record<Loyalty, React.ReactNode> = {
  VIP: <Crown size={13} weight="fill" />,
  RETURNING: <ArrowsClockwise size={13} weight="bold" />,
  NEW: <Sparkle size={13} weight="fill" />,
};

// ─── Helpery ──────────────────────────────────────────────────────────────────

/**
 * Wylicza „score" kontaktu 0–10 z dostępnych sygnałów zaangażowania
 * (lojalność, liczba wyjazdów, liczba źródeł, status, wydatki). Wizualizacja
 * w `ScoreBars` (jak SCORE w referencyjnym CRM).
 */
export function computeScore(c: CrmContact): number {
  let s = 0;
  if (c.loyalty === "VIP") s += 4;
  else if (c.loyalty === "RETURNING") s += 2;
  else if (c.loyalty === "NEW") s += 1;
  s += Math.min(c.tripsCount, 3);
  s += Math.min(c.sources.length, 2);
  if (c.status === "SUBSCRIBED") s += 1;
  if (c.totalSpent > 1000) s += 1;
  return Math.max(0, Math.min(10, s));
}

function scoreColor(i: number): string {
  if (i < 3) return "#ef4444"; // red
  if (i < 5) return "#f97316"; // orange
  if (i < 7) return "#eab308"; // yellow
  return "#22c55e"; // green
}

export function ScoreBars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-[2px] h-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full transition-colors"
            style={{
              height: `${45 + i * 5.5}%`,
              background: i < score ? scoreColor(i) : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-brand-secondary/70 tabular-nums">
        {score}/10
      </span>
    </div>
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Komponenty prezentacyjne ─────────────────────────────────────────────────

export function Avatar({
  contact,
  size = 48,
}: {
  contact: CrmContact;
  size?: number;
}) {
  const name = contact.name || "Brak nazwy";
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-yellow text-white flex items-center justify-center font-bold shadow-sm overflow-hidden shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {contact.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contact.image}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export function SourceChips({
  contact,
  max,
}: {
  contact: CrmContact;
  max?: number;
}) {
  const shown = max ? contact.sources.slice(0, max) : contact.sources;
  const rest = max ? contact.sources.length - shown.length : 0;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.length === 0 && <span className="text-xs text-gray-300">—</span>}
      {shown.map((s) => {
        const meta = SOURCE_META[s] ?? {
          label: s,
          className: "bg-gray-100 text-gray-500 border-gray-200",
          icon: null,
        };
        return (
          <span
            key={s}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${meta.className}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        );
      })}
      {rest > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border bg-gray-50 text-gray-400 border-gray-200">
          +{rest}
        </span>
      )}
      {contact.tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border bg-brand-yellow/15 text-amber-700 border-brand-yellow/30"
        >
          #{t}
        </span>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${meta.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function LoyaltyBadge({ loyalty }: { loyalty: Loyalty | null }) {
  if (!loyalty) return <span className="text-xs text-gray-300">—</span>;
  const meta = LOYALTY_META[loyalty];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${meta.className}`}
    >
      {LOYALTY_ICON[loyalty]}
      {meta.label}
    </span>
  );
}

export type { CrmContact };
