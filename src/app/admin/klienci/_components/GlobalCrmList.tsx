"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Users,
  EnvelopeSimple,
  Phone,
  Tent,
  CurrencyCircleDollar,
  HeartStraight,
  CaretRight,
  Crown,
  ArrowsClockwise,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { CrmClient, Loyalty } from "@/lib/crm/types";
import { LOYALTY_META } from "@/lib/crm/loyalty";

interface GlobalCrmListProps {
  clients: CrmClient[];
}

/** Ikony segmentów — etykiety i kolory pochodzą ze współdzielonego LOYALTY_META (DRY). */
const LOYALTY_ICON: Record<Loyalty, React.ReactNode> = {
  VIP: <Crown size={14} weight="fill" />,
  RETURNING: <ArrowsClockwise size={14} weight="bold" />,
  NEW: <Sparkle size={14} weight="fill" />,
};

/** Inicjały z imienia/nazwiska na potrzeby awatara zastępczego. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Client Component — interaktywna lista CRM.
 * Filtrowanie realizujemy w `useMemo` po stanie `search` (reaktywnie, bez
 * dodatkowych zapytań sieciowych — dane przyszły już z serwera).
 */
export default function GlobalCrmList({ clients }: GlobalCrmListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [clients, search]);

  // Zagregowane statystyki nagłówka (liczone raz na zmianę danych).
  const stats = useMemo(() => {
    const vip = clients.filter((c) => c.loyalty === "VIP").length;
    const revenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    return { vip, revenue };
  }, [clients]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* NAGŁÓWEK + WYSZUKIWARKA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-[28px] rounded-tr-none shadow-sm">
        <div>
          <h1 className="font-jakarta font-bold text-2xl text-brand-secondary flex items-center gap-3 flex-wrap">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
              <Users size={24} weight="fill" />
            </div>
            Baza Klientów
            <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-sm text-brand-primary shadow-sm">
              {clients.length}
            </span>
          </h1>
          <p className="text-sm text-brand-secondary/60 mt-2 font-medium">
            {stats.vip} klientów VIP · łączny przychód{" "}
            <span className="font-bold text-brand-secondary">
              {stats.revenue.toLocaleString("pl-PL")} zł
            </span>
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40 group-focus-within:text-brand-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Szukaj po nazwisku lub e-mailu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-4 focus:ring-brand-primary/15 focus:border-brand-primary/30 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/60 border-b border-gray-100/60 text-[11px] uppercase tracking-widest text-brand-secondary/50 font-bold">
                <th className="p-5 font-bold whitespace-nowrap">Uczestnik</th>
                <th className="p-5 font-bold whitespace-nowrap">Kontakt</th>
                <th className="p-5 font-bold text-center whitespace-nowrap">
                  Lojalność
                </th>
                <th className="p-5 font-bold text-center whitespace-nowrap">
                  Statystyki (LTV)
                </th>
                <th className="p-5 font-bold text-center whitespace-nowrap">
                  Zdrowie
                </th>
                <th className="p-5 font-bold text-right whitespace-nowrap">
                  Akcja
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-gray-400 font-medium"
                  >
                    Brak wyników wyszukiwania.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const name = c.name || "Brak danych";
                  const loyalty = LOYALTY_META[c.loyalty];

                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="border-b border-white/50 hover:bg-white/80 transition-colors group"
                    >
                      {/* UCZESTNIK */}
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-yellow text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials(name)
                            )}
                          </div>
                          <div className="min-w-[120px]">
                            <p className="font-bold text-brand-secondary text-[15px]">
                              {name}
                            </p>
                            <p className="text-xs text-brand-secondary/50 font-medium mt-0.5">
                              ID: {c.id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* KONTAKT */}
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5 text-[13px] font-medium text-brand-secondary/70">
                          <div className="flex items-center gap-2">
                            <EnvelopeSimple
                              size={16}
                              className="text-brand-primary/50 shrink-0"
                            />
                            <span className="truncate max-w-[180px]">
                              {c.email || "Brak e-maila"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone
                              size={16}
                              className="text-brand-primary/50 shrink-0"
                            />
                            <span className="whitespace-nowrap">
                              {c.phone || "Brak telefonu"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LOJALNOŚĆ */}
                      <td className="p-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap ${loyalty.className}`}
                        >
                          {LOYALTY_ICON[c.loyalty]}
                          {loyalty.label}
                        </span>
                      </td>

                      {/* STATYSTYKI LTV */}
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-4">
                          <div
                            className="flex items-center gap-1.5 text-brand-secondary/80"
                            title="Liczba wyjazdów"
                          >
                            <Tent
                              size={18}
                              weight="duotone"
                              className="text-brand-primary/60"
                            />
                            <span className="font-bold text-sm tabular-nums">
                              {c.tripsCount}
                            </span>
                          </div>
                          <div className="w-px h-6 bg-gray-200/60" />
                          <div
                            className="flex items-center gap-1.5 text-brand-secondary"
                            title="Łączna wydana kwota (LTV)"
                          >
                            <CurrencyCircleDollar
                              size={18}
                              weight="duotone"
                              className="text-emerald-500/70"
                            />
                            <span className="font-bold text-sm tabular-nums whitespace-nowrap">
                              {c.totalSpent.toLocaleString("pl-PL")} zł
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ZDROWIE */}
                      <td className="p-5 text-center">
                        <div className="flex justify-center">
                          <div
                            title={
                              c.hasHealthProfile
                                ? "Karta zdrowia wypełniona"
                                : "Brak karty zdrowia"
                            }
                            className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                              c.hasHealthProfile
                                ? "bg-rose-50 text-rose-500 border-rose-100"
                                : "bg-gray-50 text-gray-300 border-gray-100"
                            }`}
                          >
                            <HeartStraight
                              size={20}
                              weight={c.hasHealthProfile ? "fill" : "regular"}
                            />
                          </div>
                        </div>
                      </td>

                      {/* AKCJA */}
                      <td className="p-5 text-right">
                        <Link
                          href={`/admin/klienci/${c.id}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-brand-secondary hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm shrink-0"
                          aria-label={`Zobacz profil: ${name}`}
                        >
                          <CaretRight size={18} weight="bold" />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
