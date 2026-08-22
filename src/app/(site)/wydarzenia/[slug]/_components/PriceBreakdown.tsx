"use client";

import React from "react";
import { Tag } from "@phosphor-icons/react/dist/ssr";

import { formatGrosze } from "@/lib/discounts/format";
import type { PublicPricing } from "@/lib/discounts/publicPricing";

/**
 * Rozbicie ceny w podsumowaniu rezerwacji: cena wyjściowa, każda obniżka
 * osobno, cena po rabacie oraz zadatek do zapłaty teraz.
 *
 * Zadatek jest proporcjonalny do rabatu — uczestnik od razu płaci mniej,
 * a nie dopiero przy dopłacie reszty.
 */
export function PriceBreakdown({ pricing }: { pricing: PublicPricing }) {
  const hasDiscount = pricing.totalDiscount > 0;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-brand-secondary/60">Cena wydarzenia</span>
        <span
          className={
            hasDiscount
              ? "text-brand-secondary/40 line-through"
              : "font-bold text-brand-secondary"
          }
        >
          {formatGrosze(pricing.baseAmount)}
        </span>
      </div>

      {pricing.lines.map((line) => (
        <div
          key={line.id}
          className="mt-2 flex items-start justify-between gap-3 text-[13px]"
        >
          <span className="inline-flex min-w-0 items-start gap-1.5 text-brand-primary">
            <Tag size={14} weight="bold" className="mt-0.5 shrink-0" />
            <span className="min-w-0">{line.label}</span>
          </span>
          <span className="shrink-0 font-bold text-brand-primary">
            −{formatGrosze(line.amount)}
          </span>
        </div>
      ))}

      {hasDiscount && (
        <div className="mt-3 flex items-center justify-between border-t border-brand-secondary/10 pt-3 text-[13px]">
          <span className="font-semibold text-brand-secondary">Do zapłaty</span>
          <span className="font-jakarta text-lg font-bold text-brand-secondary">
            {formatGrosze(pricing.finalAmount)}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-brand-secondary/10 pt-3 text-[13px]">
        <span className="text-brand-secondary/60">Zadatek teraz</span>
        <span className="font-bold text-brand-secondary">
          {formatGrosze(pricing.depositGrosze)}
        </span>
      </div>

      {pricing.remainderGrosze > 0 && (
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-brand-secondary/50">Reszta później</span>
          <span className="font-semibold text-brand-secondary/60">
            {formatGrosze(pricing.remainderGrosze)}
          </span>
        </div>
      )}

      {hasDiscount && (
        <p className="mt-3 rounded-xl bg-brand-yellow/20 px-3 py-2 text-[12px] font-semibold text-brand-secondary/70">
          Oszczędzasz {formatGrosze(pricing.totalDiscount)} — zadatek też jest
          niższy.
        </p>
      )}
    </div>
  );
}
