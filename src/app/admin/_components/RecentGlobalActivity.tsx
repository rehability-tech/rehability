"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CurrencyCircleDollar,
  PlayCircle,
  Article,
  HeartStraight,
  UserPlus,
  Sparkle,
  DotsThreeOutline,
  type Icon,
} from "@phosphor-icons/react/dist/ssr";

export type ActivityPillar = "CAMP" | "VOD" | "BLOG";

export interface ActivityEntry {
  id: string;
  pillar: ActivityPillar;
  kind:
    | "PAYMENT"
    | "VOD_PURCHASE"
    | "POST_PUBLISHED"
    | "HEALTH_FILLED"
    | "SIGNUP"
    | "SERVICE_ORDER";
  who: string;
  text: string;
  meta?: string;
  time: string;
}

const PILLAR_LABEL: Record<ActivityPillar, string> = {
  CAMP: "Camp",
  VOD: "VOD",
  BLOG: "Blog",
};

const KIND_VISUAL: Record<
  ActivityEntry["kind"],
  { icon: Icon; bg: string; color: string }
> = {
  PAYMENT: {
    icon: CurrencyCircleDollar,
    bg: "bg-brand-primary/10",
    color: "text-brand-primary",
  },
  VOD_PURCHASE: {
    icon: PlayCircle,
    bg: "bg-brand-yellow/30",
    color: "text-brand-secondary",
  },
  POST_PUBLISHED: {
    icon: Article,
    bg: "bg-brand-secondary/10",
    color: "text-brand-secondary",
  },
  HEALTH_FILLED: {
    icon: HeartStraight,
    bg: "bg-rose-50",
    color: "text-rose-500",
  },
  SIGNUP: {
    icon: UserPlus,
    bg: "bg-brand-primary/10",
    color: "text-brand-primary",
  },
  SERVICE_ORDER: {
    icon: Sparkle,
    bg: "bg-brand-yellow/30",
    color: "text-brand-secondary",
  },
};

const PILLAR_CHIP: Record<ActivityPillar, string> = {
  CAMP: "bg-brand-primary/15 text-brand-primary",
  VOD: "bg-brand-yellow/40 text-brand-secondary",
  BLOG: "bg-brand-secondary/15 text-brand-secondary",
};

interface Props {
  entries: ActivityEntry[];
}

export default function RecentGlobalActivity({ entries }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-primary/15 blur-3xl" />

      <div className="relative flex items-center justify-between px-5 lg:px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Sparkle size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-brand-secondary text-[15px]">
              Globalny feed aktywności
            </h3>
            <p className="text-[11px] text-brand-secondary/50 mt-0.5">
              Wszystkie filary · live
            </p>
          </div>
        </div>
        <button className="text-brand-secondary/40 hover:text-brand-secondary">
          <DotsThreeOutline size={18} weight="duotone" />
        </button>
      </div>

      <ol className="relative px-5 lg:px-6 pb-5 space-y-3">
        {entries.map((e, i) => {
          const v = KIND_VISUAL[e.kind];
          const Icon = v.icon;
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/30 hover:bg-white/80 transition cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl ${v.bg} ${v.color} flex items-center justify-center shrink-0`}
              >
                <Icon size={18} weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[13px] text-brand-secondary truncate">
                    {e.who}
                  </p>
                  <span
                    className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PILLAR_CHIP[e.pillar]}`}
                  >
                    {PILLAR_LABEL[e.pillar]}
                  </span>
                </div>
                <p className="text-[12px] text-brand-secondary/60 truncate">
                  {e.text}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                {e.meta && (
                  <span className={`text-[12px] font-bold ${v.color}`}>
                    {e.meta}
                  </span>
                )}
                <span className="text-[10px] text-brand-secondary/40 mt-0.5">
                  {e.time}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </motion.section>
  );
}
