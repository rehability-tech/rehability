"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  EnvelopeSimple,
  Phone,
  CurrencyCircleDollar,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import {
  Avatar,
  SourceChips,
  StatusBadge,
  LoyaltyBadge,
  glowClass,
  type CrmContact,
  type CrmStyle,
} from "../crmShared";

/**
 * Wariant „Karty" — grid wizytówek z efektem premium glass + żółta poświata.
 * Najbardziej wizualny układ; dobry przy mniejszych bazach i przeglądaniu.
 */
export default function VariantCards({
  contacts,
  style,
}: {
  contacts: CrmContact[];
  style: CrmStyle;
}) {
  const pad = style.density === "compact" ? "p-4" : "p-5";

  if (contacts.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {contacts.map((c, i) => {
        const name = c.name || "Brak nazwy";
        const card = (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.3) }}
            whileHover={{ y: -3 }}
            className={`group relative h-full bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl rounded-tr-none ${pad} ${glowClass(
              style,
            )} overflow-hidden`}
          >
            {/* poświata w rogu */}
            {style.glow && (
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-yellow/30 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            <div className="relative flex items-start gap-3.5">
              <Avatar contact={c} size={style.density === "compact" ? 44 : 52} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-secondary text-[15px] truncate">
                  {name}
                </p>
                <p className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary/55 mt-0.5">
                  <EnvelopeSimple size={13} className="shrink-0 opacity-60" />
                  <span className="truncate">{c.email}</span>
                </p>
                {c.phone && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-brand-secondary/55 mt-0.5">
                    <Phone size={13} className="shrink-0 opacity-60" />
                    {c.phone}
                  </p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="relative mt-4">
              <SourceChips contact={c} max={4} />
            </div>

            <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-gray-100/70">
              <div className="flex items-center gap-3">
                <LoyaltyBadge loyalty={c.loyalty} />
                {c.totalSpent > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-secondary tabular-nums">
                    <CurrencyCircleDollar
                      size={16}
                      weight="duotone"
                      className="text-emerald-500/70"
                    />
                    {c.totalSpent.toLocaleString("pl-PL")} zł
                  </span>
                )}
              </div>
              {c.userId && (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--crm-accent)] text-[color:var(--crm-accent-text)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={15} weight="bold" />
                </span>
              )}
            </div>
          </motion.div>
        );

        return c.userId ? (
          <Link key={c.id} href={`/admin/klienci/${c.userId}`} className="block">
            {card}
          </Link>
        ) : (
          <div key={c.id}>{card}</div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-12 text-center text-gray-400 font-medium">
      Brak wyników. Kliknij „Synchronizuj", aby zaciągnąć kontakty.
    </div>
  );
}
