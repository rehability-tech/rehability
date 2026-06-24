"use client";

import React from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  PlayCircle,
  CurrencyCircleDollar,
  MapPin,
  Student,
  BookOpen,
  TrendUp,
  Mountains,
} from "@phosphor-icons/react/dist/ssr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StatsData {
  users: { total: number };
  vod: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    monthEnrollments: number;
    revenueTotal: number;
    revenueMonth: number;
  };
  trips: {
    publishedTrips: number;
    upcomingTrips: number;
    totalBookings: number;
    monthBookings: number;
    revenueTotal: number;
    revenueMonth: number;
  };
}

function formatPln(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M zł`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k zł`;
  return `${value.toLocaleString("pl-PL")} zł`;
}

interface StatItem {
  label: string;
  value: string | number;
  sub: string;
  delta: string | null;
  icon: React.ElementType;
  gradient: string;
  iconShadow: string;
  statClass: string;
}

function buildItems(data: StatsData): { vod: StatItem[]; trips: StatItem[] } {
  const { vod, trips } = data;
  return {
    vod: [
      {
        label: "Kursanci",
        value: vod.totalEnrollments,
        sub: "łącznie zapisów",
        delta: vod.monthEnrollments > 0 ? `+${vod.monthEnrollments}` : null,
        icon: Student,
        gradient: "from-[#c9993a] to-[#a87928]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
        statClass: "text-amber-700 bg-amber-100",
      },
      {
        label: "Kursy",
        value: vod.publishedCourses,
        sub: `${vod.draftCourses} w przygotowaniu`,
        delta: null,
        icon: PlayCircle,
        gradient: "from-[#287d88] to-[#1a5c66]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
        statClass: "text-brand-primary bg-brand-primary/10",
      },
      {
        label: "Przychód VOD",
        value: formatPln(vod.revenueTotal),
        sub: "w tym miesiącu",
        delta: vod.revenueMonth > 0 ? `+${formatPln(vod.revenueMonth)}` : null,
        icon: CurrencyCircleDollar,
        gradient: "from-[#10b981] to-[#059669]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]",
        statClass: "text-emerald-700 bg-emerald-50",
      },
    ],
    trips: [
      {
        label: "Rezerwacje",
        value: trips.totalBookings,
        sub: "łącznie",
        delta: trips.monthBookings > 0 ? `+${trips.monthBookings}` : null,
        icon: BookOpen,
        gradient: "from-[#287d88] to-[#1a5c66]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
        statClass: "text-brand-primary bg-brand-primary/10",
      },
      {
        label: "Nadchodzące",
        value: trips.upcomingTrips,
        sub: `${trips.publishedTrips} opublikowanych`,
        delta: null,
        icon: MapPin,
        gradient: "from-[#e11d48] to-[#be123c]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(225,29,72,0.5)]",
        statClass: "text-rose-600 bg-rose-50",
      },
      {
        label: "Przychód wyjazdy",
        value: formatPln(trips.revenueTotal),
        sub: "w tym miesiącu",
        delta:
          trips.revenueMonth > 0 ? `+${formatPln(trips.revenueMonth)}` : null,
        icon: CurrencyCircleDollar,
        gradient: "from-[#c9993a] to-[#a87928]",
        iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
        statClass: "text-amber-700 bg-amber-100",
      },
    ],
  };
}

// ─── Karta Gradient Glass ─────────────────────────────────────────
function StatCard({ item, delay }: { item: StatItem; delay: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative flex flex-col justify-between rounded-3xl rounded-tr-none p-4 lg:p-5 min-h-[124px] overflow-hidden bg-gradient-to-br from-white/75 to-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_4px_16px_-6px_rgba(3,63,99,0.08)]"
    >
      <div className={`absolute -left-5 -top-5 w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-15 blur-2xl pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-2xl rounded-tr-none bg-gradient-to-br ${item.gradient} ${item.iconShadow} flex items-center justify-center shrink-0`}>
          <Icon size={17} weight="duotone" className="text-white" />
        </div>
        {item.delta && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold font-montserrat px-1.5 py-0.5 rounded-full ${item.statClass}`}>
            <TrendUp size={10} weight="bold" />
            {item.delta}
          </span>
        )}
      </div>
      <div className="relative mt-3">
        <p className="font-jakarta font-extrabold text-[24px] leading-none text-brand-secondary">{item.value}</p>
        <p className="font-montserrat font-semibold text-[11px] text-brand-secondary/55 mt-1.5">{item.label}</p>
        <p className="font-montserrat text-[10px] text-brand-secondary/35 mt-0.5">{item.sub}</p>
      </div>
    </motion.div>
  );
}

function GroupBlock({
  title,
  icon: GroupIcon,
  items,
  baseDelay,
}: {
  title: string;
  icon: React.ElementType;
  items: StatItem[];
  baseDelay: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <GroupIcon size={13} weight="duotone" className="text-brand-primary" />
        <span className="font-montserrat text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
          {title}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {items.map((item, i) => (
          <StatCard key={item.label} item={item} delay={baseDelay + i * 0.05} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl rounded-tr-none bg-white border border-gray-100 p-4 lg:p-5 min-h-[124px] animate-pulse flex flex-col justify-between">
      <div className="w-9 h-9 rounded-2xl bg-gray-100" />
      <div className="mt-3 space-y-2">
        <div className="h-7 w-14 bg-gray-100 rounded-lg" />
        <div className="h-3 w-24 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

export default function StatsGrid() {
  const { data, isLoading } = useSWR<StatsData>("/api/admin/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="grid grid-cols-3 gap-3 lg:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const { vod, trips } = buildItems(data);

  return (
    <div className="flex flex-col gap-5">
      <GroupBlock title="Platforma VOD" icon={PlayCircle} items={vod} baseDelay={0} />
      <GroupBlock title="Wyjazdy" icon={Mountains} items={trips} baseDelay={0.15} />
    </div>
  );
}
