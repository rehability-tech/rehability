"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export interface PillarSubStat {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
}

export interface PillarStatCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  mainStat: {
    value: string;
    label: string;
  };
  subStats: PillarSubStat[];
  href: string;
  badge?: string;
  accentColor: "primary" | "yellow" | "secondary";
  index?: number;
}

const accentMap = {
  primary: {
    glow: "from-brand-primary/40 to-brand-primary/0",
    iconBg: "bg-brand-primary/10 text-brand-primary",
    chip: "bg-brand-primary text-white",
    trend: "text-brand-primary",
    progress: "from-brand-primary to-brand-secondary",
  },
  yellow: {
    glow: "from-brand-yellow/50 to-brand-yellow/0",
    iconBg: "bg-brand-yellow/30 text-brand-secondary",
    chip: "bg-brand-yellow text-brand-secondary",
    trend: "text-brand-secondary",
    progress: "from-brand-yellow to-brand-primary",
  },
  secondary: {
    glow: "from-brand-secondary/40 to-brand-secondary/0",
    iconBg: "bg-brand-secondary/10 text-brand-secondary",
    chip: "bg-brand-secondary text-white",
    trend: "text-brand-secondary",
    progress: "from-brand-secondary to-brand-primary",
  },
};

export default function PillarStatCard({
  title,
  subtitle,
  icon,
  mainStat,
  subStats,
  href,
  badge,
  accentColor,
  index = 0,
}: PillarStatCardProps) {
  const a = accentMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 0.61, 0.36, 1] as const,
      }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={href}
        className="group relative block h-full rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] hover:shadow-[0_28px_70px_-20px_rgba(3,63,99,0.35)] transition-shadow duration-300 overflow-hidden p-6 lg:p-7"
      >
        <div
          className={`absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br ${a.glow} blur-3xl opacity-70 group-hover:opacity-100 transition`}
        />
        <div className="absolute inset-px rounded-[calc(1.5rem-1px)] border border-white/40 pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${a.iconBg} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]`}
          >
            {icon}
          </div>
          {badge && (
            <span
              className={`text-[10px] uppercase tracking-[0.18em] font-bold px-2.5 py-1 rounded-full ${a.chip}`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="relative mt-6">
          <h3 className="font-jakarta text-[20px] font-bold text-brand-secondary leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12.5px] text-brand-secondary/55 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative mt-6">
          <p className="font-jakarta text-[34px] font-bold text-brand-secondary leading-none">
            {mainStat.value}
          </p>
          <p className="text-[12px] text-brand-secondary/55 mt-1.5 font-semibold uppercase tracking-wider">
            {mainStat.label}
          </p>
        </div>

        <div className="relative mt-5 h-px bg-gradient-to-r from-transparent via-brand-secondary/15 to-transparent" />

        <ul className="relative mt-4 space-y-2">
          {subStats.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 px-3 py-2"
            >
              <span className="text-[11.5px] text-brand-secondary/60 font-medium">
                {s.label}
              </span>
              <span
                className={`text-[12.5px] font-bold ${
                  s.trend === "up"
                    ? a.trend
                    : s.trend === "down"
                      ? "text-rose-500"
                      : "text-brand-secondary"
                }`}
              >
                {s.trend === "up" && "↑ "}
                {s.trend === "down" && "↓ "}
                {s.value}
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mt-5 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-brand-primary">
            Otwórz moduł
          </span>
          <div className="w-10 h-10 rounded-full bg-white/70 group-hover:bg-brand-primary group-hover:text-white text-brand-primary flex items-center justify-center transition shadow-[0_8px_20px_-8px_rgba(3,63,99,0.2)]">
            <ArrowUpRight size={18} weight="bold" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
