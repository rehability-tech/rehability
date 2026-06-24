"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import {
  Avatar,
  StatusBadge,
  SOURCE_META,
  ALL_SOURCES,
  glowClass,
  type CrmContact,
  type CrmStyle,
} from "../crmShared";

/**
 * Wariant „Kolumny segmentów" — kanban z kolumną per źródło (Wyjazdy / VOD /
 * Newsletter / Ręczny). Kontakt z wieloma źródłami pojawia się w kilku kolumnach.
 * Najmocniej pokazuje segmentację — pod kampanie do konkretnej grupy.
 */
export default function VariantColumns({
  contacts,
  style,
}: {
  contacts: CrmContact[];
  style: CrmStyle;
}) {
  const bySource = useMemo(() => {
    const map: Record<string, CrmContact[]> = {};
    for (const s of ALL_SOURCES) map[s] = [];
    for (const c of contacts)
      for (const s of c.sources) if (map[s]) map[s].push(c);
    return map;
  }, [contacts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {ALL_SOURCES.map((source, col) => {
        const meta = SOURCE_META[source];
        const list = bySource[source] ?? [];
        return (
          <motion.div
            key={source}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: col * 0.06 }}
            className={`flex flex-col bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl rounded-tr-none ${glowClass(
              style,
            )} overflow-hidden`}
          >
            {/* Nagłówek kolumny */}
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-gray-100/70 bg-white/40">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${meta.className}`}
              >
                {meta.icon}
                {meta.label}
              </span>
              <span className="text-sm font-bold text-brand-secondary/70 tabular-nums">
                {list.length}
              </span>
            </div>

            {/* Lista */}
            <div className="flex flex-col gap-1.5 p-2.5 max-h-[640px] overflow-y-auto custom-scrollbar">
              {list.length === 0 ? (
                <p className="text-center text-xs text-gray-300 font-medium py-8">
                  Brak kontaktów
                </p>
              ) : (
                list.map((c, i) => {
                  const name = c.name || "Brak nazwy";
                  const inner = (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.2) }}
                      className="group flex items-center gap-2.5 p-2 rounded-2xl hover:bg-white/90 transition-colors"
                    >
                      <Avatar contact={c} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-brand-secondary text-[13px] truncate">
                          {name}
                        </p>
                        <p className="text-[11px] text-brand-secondary/50 font-medium truncate">
                          {c.email}
                        </p>
                      </div>
                      {c.status !== "SUBSCRIBED" ? (
                        <span className="shrink-0">
                          <StatusBadge status={c.status} />
                        </span>
                      ) : c.userId ? (
                        <CaretRight
                          size={15}
                          weight="bold"
                          className="text-gray-300 group-hover:text-[var(--crm-accent)] transition-colors shrink-0"
                        />
                      ) : null}
                    </motion.div>
                  );
                  return c.userId ? (
                    <Link key={c.id} href={`/admin/klienci/${c.userId}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={c.id}>{inner}</div>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
