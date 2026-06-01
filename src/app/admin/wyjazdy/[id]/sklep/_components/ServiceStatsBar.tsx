"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingBagOpen,
  CurrencyCircleDollar,
  Crown,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { formatPLN, type ShopStats } from "./types";

function StatCard({
  icon,
  label,
  value,
  sub,
  index,
  accent = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  index: number;
  accent?: "primary" | "yellow" | "emerald" | "purple";
}) {
  const accentRing = {
    primary: "text-brand-primary",
    yellow: "text-amber-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-3xl rounded-tr-none border border-white/60 bg-white/70 backdrop-blur-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]"
    >
      {/* żółta poświata w rogu */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-brand-yellow/30 blur-[34px] opacity-60" />

      <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span className={accentRing}>{icon}</span>
        {label}
      </div>
      <p className="relative mt-3 text-2xl font-extrabold tracking-tight text-brand-secondary">
        {value}
      </p>
      {sub && (
        <p className="relative mt-1 text-[12px] font-medium text-slate-400 truncate">
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export function ServiceStatsBar({ stats }: { stats: ShopStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        index={0}
        accent="emerald"
        icon={<ShoppingBagOpen size={16} weight="bold" />}
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
        icon={<CurrencyCircleDollar size={16} weight="bold" />}
        label="Przychód"
        value={formatPLN(stats.totalRevenue)}
        sub="z opłaconych usług"
      />
      <StatCard
        index={2}
        accent="yellow"
        icon={<Crown size={16} weight="bold" />}
        label="Najpopularniejsza"
        value={stats.topService ? stats.topService.name : "—"}
        sub={
          stats.topService
            ? `${stats.topService.sold} rezerwacji`
            : "brak sprzedaży"
        }
      />
      <StatCard
        index={3}
        accent="purple"
        icon={<Users size={16} weight="bold" />}
        label="Kupujący"
        value={String(stats.distinctBuyers)}
        sub={`${stats.servicesCount} usług w ofercie`}
      />
    </div>
  );
}
