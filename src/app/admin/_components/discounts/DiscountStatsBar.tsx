"use client";

import React from "react";
import {
  ChartLineUp,
  Flask,
  Tag,
  TrendDown,
} from "@phosphor-icons/react/dist/ssr";

import { formatGrosze } from "@/lib/discounts/format";

import type { DiscountPanelPayload } from "./types";

/**
 * Pasek KPI. Liczby pochodzą WYŁĄCZNIE z opłaconych rezerwacji spoza
 * piaskownicy — zakupy testowe nie zawyżają statystyk.
 */
export function DiscountStatsBar({
  summary,
}: {
  summary: DiscountPanelPayload["summary"];
}) {
  const tiles = [
    {
      icon: <Tag size={18} weight="bold" />,
      label: "Aktywne promocje",
      value: String(summary.activePromotions),
    },
    {
      icon: <ChartLineUp size={18} weight="bold" />,
      label: "Wykorzystania",
      value: String(summary.totalUses),
    },
    {
      icon: <TrendDown size={18} weight="bold" />,
      label: "Udzielone rabaty",
      value: formatGrosze(summary.totalDiscountGrosze),
    },
    {
      icon: <TrendDown size={18} weight="bold" />,
      label: "Średni rabat",
      value: formatGrosze(summary.averageDiscountGrosze),
    },
    {
      icon: <Flask size={18} weight="bold" />,
      label: "Szkice testowe",
      value: String(summary.sandboxDrafts),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-3xl rounded-tr-none border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            {tile.icon}
          </div>
          <p className="font-jakarta text-lg font-bold leading-none text-brand-secondary">
            {tile.value}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-secondary/40">
            {tile.label}
          </p>
        </div>
      ))}
    </div>
  );
}
