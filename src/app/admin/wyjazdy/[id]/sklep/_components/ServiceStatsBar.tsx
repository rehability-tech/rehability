"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingBagOpen,
  CurrencyCircleDollar,
  Crown,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { formatPLN, type ShopStats } from "./types";

type Accent = "primary" | "yellow" | "emerald" | "purple";

const ACCENT_TILE: Record<Accent, string> = {
  primary: "bg-brand-primary/10 text-brand-primary",
  yellow: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  index,
  accent = "primary",
  valueClassName,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  index: number;
  accent?: Accent;
  valueClassName?: string;
  title?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl rounded-tr-none border border-white/60 bg-white/70 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]"
    >
      {/* żółta poświata w rogu */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-brand-yellow/30 blur-[34px] opacity-60" />

      <div className="relative flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl rounded-tr-none",
            ACCENT_TILE[accent],
          )}
        >
          {icon}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
          {label}
        </span>
      </div>

      <div className="relative mt-3 flex flex-1 flex-col justify-end">
        <p
          title={title}
          className={cn(
            "font-extrabold tracking-tight text-brand-secondary",
            valueClassName ?? "text-2xl",
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-[12px] font-medium text-slate-400 truncate">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ServiceStatsBar({ stats }: { stats: ShopStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
      <StatCard
        index={0}
        accent="emerald"
        icon={<ShoppingBagOpen size={18} weight="bold" />}
        label="Sprzedane usługi"
        value={String(stats.totalSold)}
        sub={
          stats.pendingCount > 0
            ? `+ ${stats.pendingCount} oczekujących`
            : "opłacone rezerwacje"
        }
      />
      <StatCard
        index={1}
        accent="primary"
        icon={<CurrencyCircleDollar size={18} weight="bold" />}
        label="Przychód"
        value={formatPLN(stats.totalRevenue)}
        sub="z opłaconych usług"
      />
      <StatCard
        index={2}
        accent="yellow"
        icon={<Crown size={18} weight="bold" />}
        label="Najpopularniejsza"
        value={stats.topService ? stats.topService.name : "—"}
        title={stats.topService?.name}
        valueClassName="text-[15px] leading-snug line-clamp-2"
        sub={
          stats.topService
            ? `${stats.topService.sold} rezerwacji`
            : "brak sprzedaży"
        }
      />
      <StatCard
        index={3}
        accent="purple"
        icon={<Users size={18} weight="bold" />}
        label="Kupujący"
        value={String(stats.distinctBuyers)}
        sub={`${stats.servicesCount} usług w ofercie`}
      />
    </div>
  );
}
