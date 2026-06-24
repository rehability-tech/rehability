"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CaretRight,
  CurrencyCircleDollar,
  EnvelopeSimple,
  Phone,
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
 * Wariant „Tabela" — klasyczny, gęsty układ tabelaryczny (obecny wygląd panelu),
 * dostosowany do suwaków stylu (akcent / gęstość / poświata).
 */
export default function VariantTable({
  contacts,
  style,
}: {
  contacts: CrmContact[];
  style: CrmStyle;
}) {
  const cell = style.density === "compact" ? "p-3" : "p-5";

  return (
    <div
      className={`bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none ${glowClass(
        style,
      )} overflow-hidden`}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/60 border-b border-gray-100/60 text-[11px] uppercase tracking-widest text-brand-secondary/50 font-bold">
              <th className={`${cell} font-bold whitespace-nowrap`}>Kontakt</th>
              <th className={`${cell} font-bold whitespace-nowrap`}>Źródła</th>
              <th className={`${cell} font-bold text-center whitespace-nowrap`}>
                Status
              </th>
              <th className={`${cell} font-bold text-center whitespace-nowrap`}>
                Lojalność
              </th>
              <th className={`${cell} font-bold text-center whitespace-nowrap`}>
                LTV
              </th>
              <th className={`${cell} font-bold text-right whitespace-nowrap`}>
                Akcja
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-gray-400 font-medium"
                >
                  Brak wyników. Kliknij „Synchronizuj", aby zaciągnąć kontakty.
                </td>
              </tr>
            ) : (
              contacts.map((c, i) => {
                const name = c.name || "Brak nazwy";
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    className="border-b border-white/50 hover:bg-white/80 transition-colors group"
                  >
                    <td className={cell}>
                      <div className="flex items-center gap-4">
                        <Avatar
                          contact={c}
                          size={style.density === "compact" ? 40 : 48}
                        />
                        <div className="min-w-[140px]">
                          <p className="font-bold text-brand-secondary text-[15px]">
                            {name}
                          </p>
                          <div className="flex flex-col gap-0.5 mt-1 text-xs font-medium text-brand-secondary/60">
                            <span className="flex items-center gap-1.5">
                              <EnvelopeSimple
                                size={13}
                                className="text-brand-primary/50 shrink-0"
                              />
                              <span className="truncate max-w-[200px]">
                                {c.email}
                              </span>
                            </span>
                            {c.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone
                                  size={13}
                                  className="text-brand-primary/50 shrink-0"
                                />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className={cell}>
                      <div className="max-w-[220px]">
                        <SourceChips contact={c} />
                      </div>
                    </td>

                    <td className={`${cell} text-center`}>
                      <StatusBadge status={c.status} />
                    </td>

                    <td className={`${cell} text-center`}>
                      <LoyaltyBadge loyalty={c.loyalty} />
                    </td>

                    <td className={cell}>
                      <div className="flex items-center justify-center gap-1.5 text-brand-secondary">
                        <CurrencyCircleDollar
                          size={18}
                          weight="duotone"
                          className="text-emerald-500/70"
                        />
                        <span className="font-bold text-sm tabular-nums whitespace-nowrap">
                          {c.totalSpent.toLocaleString("pl-PL")} zł
                        </span>
                      </div>
                    </td>

                    <td className={`${cell} text-right`}>
                      {c.userId ? (
                        <Link
                          href={`/admin/klienci/${c.userId}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--crm-accent)] text-[color:var(--crm-accent-text)] hover:opacity-90 transition-all shadow-sm shrink-0"
                          aria-label={`Zobacz profil: ${name}`}
                        >
                          <CaretRight size={18} weight="bold" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-300 shrink-0">
                          <CaretRight size={18} weight="bold" />
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
