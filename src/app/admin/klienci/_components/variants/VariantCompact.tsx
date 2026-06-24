"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CaretRight, CurrencyCircleDollar } from "@phosphor-icons/react/dist/ssr";
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
 * Wariant „Kompakt" — gęsta lista w stylu skrzynki / dashboardu SaaS.
 * Maksimum danych na ekranie; dobry przy dużych bazach i szybkim skanowaniu.
 */
export default function VariantCompact({
  contacts,
  style,
}: {
  contacts: CrmContact[];
  style: CrmStyle;
}) {
  const rowPad = style.density === "compact" ? "py-2 px-3" : "py-3 px-4";

  if (contacts.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-12 text-center text-gray-400 font-medium">
        Brak wyników. Kliknij „Synchronizuj", aby zaciągnąć kontakty.
      </div>
    );
  }

  return (
    <div
      className={`bg-white/55 backdrop-blur-xl border border-white/80 rounded-3xl rounded-tr-none ${glowClass(
        style,
      )} overflow-hidden divide-y divide-gray-100/70`}
    >
      {contacts.map((c, i) => {
        const name = c.name || "Brak nazwy";
        const inner = (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.012, 0.25) }}
            className={`group flex items-center gap-3 ${rowPad} hover:bg-white/90 transition-colors`}
          >
            <Avatar contact={c} size={style.density === "compact" ? 34 : 40} />

            {/* Nazwa + email */}
            <div className="min-w-0 w-[34%]">
              <p className="font-bold text-brand-secondary text-[13.5px] truncate">
                {name}
              </p>
              <p className="text-[11.5px] text-brand-secondary/50 font-medium truncate">
                {c.email}
              </p>
            </div>

            {/* Źródła */}
            <div className="hidden md:block flex-1 min-w-0">
              <SourceChips contact={c} max={3} />
            </div>

            {/* Status */}
            <div className="hidden lg:block shrink-0">
              <StatusBadge status={c.status} />
            </div>

            {/* Lojalność */}
            <div className="hidden xl:block shrink-0 w-[110px] text-right">
              <LoyaltyBadge loyalty={c.loyalty} />
            </div>

            {/* LTV */}
            <div className="shrink-0 w-[92px] text-right">
              {c.totalSpent > 0 ? (
                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-secondary tabular-nums">
                  <CurrencyCircleDollar
                    size={15}
                    weight="duotone"
                    className="text-emerald-500/70"
                  />
                  {c.totalSpent.toLocaleString("pl-PL")}
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>

            <div className="shrink-0 w-5 text-right">
              {c.userId && (
                <CaretRight
                  size={15}
                  weight="bold"
                  className="text-gray-300 group-hover:text-[var(--crm-accent)] transition-colors"
                />
              )}
            </div>
          </motion.div>
        );

        return c.userId ? (
          <Link key={c.id} href={`/admin/klienci/${c.userId}`} className="block">
            {inner}
          </Link>
        ) : (
          <div key={c.id}>{inner}</div>
        );
      })}
    </div>
  );
}
