"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Receipt,
  WarningCircle,
  CheckCircle,
  Clock,
  Sparkle,
  Tent,
  CurrencyCircleDollar,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { STATUS_LABELS, formatZl } from "./constants";
import { cn } from "@/lib/utils";
import type { ParticipantData } from "@/types/participant";

// Formatowanie kwoty w złotówkach (wejście już w zł, nie groszach)
const formatPlnFromZl = (zl: number) =>
  zl.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatTxDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type Transaction = {
  id: string;
  label: string;
  date?: string | null;
  amountZl: number;
  isPaid: boolean;
  statusLabel: string;
  kind: "camp" | "service";
};

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Buduje listę wszystkich transakcji uczestnika w obrębie tego wyjazdu:
// wpłata za wyjazd (zadatek/dopłata) + każda zarezerwowana usługa SPA.
function buildTransactions(participant: ParticipantData): Transaction[] {
  const txs: Transaction[] = [];

  const amountPaid = participant.amountPaid || 0; // grosze
  const isFully = participant.status === "FULLY_PAID";

  // Transakcja za sam wyjazd (kwoty trzymamy łącznie w Booking.amountPaid).
  if (amountPaid > 0 || (participant.amountTotal || 0) > 0) {
    txs.push({
      id: `camp-${participant.id}`,
      label: "Rezerwacja wyjazdu",
      date:
        participant.remainderPaidAt ||
        participant.depositPaidAt ||
        participant.createdAt,
      amountZl: amountPaid / 100,
      isPaid: isFully,
      // Krótka etykieta do listy (pełny status jest w nagłówku karty)
      statusLabel: isFully
        ? "Opłacone"
        : participant.depositPaidAt
          ? "Zaliczka"
          : "Oczekuje",
      kind: "camp",
    });
  }

  // Transakcje za usługi dodatkowe / SPA
  for (const order of participant.serviceOrders || []) {
    const paid = order.status === "PAID";
    txs.push({
      id: order.id,
      label: order.service?.name || "Usługa SPA",
      date: order.paidAt || order.createdAt,
      amountZl: Number(order.price) || 0,
      isPaid: paid,
      statusLabel: paid ? "Opłacone" : "Oczekuje",
      kind: "service",
    });
  }

  // TODO: pozycje testowe — do usunięcia po podpięciu realnych danych.
  txs.push(
    {
      id: "test-1",
      label: "Masaż relaksacyjny (test)",
      date: "2026-05-20T10:30:00.000Z",
      amountZl: 180,
      isPaid: true,
      statusLabel: "Opłacone",
      kind: "service",
    },
    {
      id: "test-2",
      label: "Dopłata do pokoju premium (test)",
      date: "2026-05-18T14:00:00.000Z",
      amountZl: 350,
      isPaid: false,
      statusLabel: "Oczekuje",
      kind: "camp",
    },
  );

  // Najnowsze na górze
  return txs.sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });
}

export const FinanceCard = ({
  participant,
}: {
  participant: ParticipantData;
}) => {
  const statusInfo =
    STATUS_LABELS[participant.status || "PENDING"] || STATUS_LABELS.PENDING;
  const amountPaid = participant.amountPaid || 0;
  const amountTotal = participant.amountTotal || 0;
  const remaining = Math.max(0, amountTotal - amountPaid);

  const progress =
    amountTotal > 0
      ? Math.min(100, Math.round((amountPaid / amountTotal) * 100))
      : 0;
  const isFullyPaid = remaining === 0 && amountTotal > 0;

  const transactions = useMemo(
    () => buildTransactions(participant),
    [participant],
  );
  const totalSpentZl =
    amountPaid / 100 +
    (participant.serviceOrders || []).reduce(
      (sum, o) => (o.status === "PAID" ? sum + (Number(o.price) || 0) : sum),
      0,
    );

  // Paginacja historii transakcji
  const PAGE_SIZE = 3;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-[32px] p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(16,185,129,0.6)] transition-shadow duration-300 h-full lg:h-[490px] flex flex-col overflow-hidden"
    >
      {/* Zielony glow w tle karty */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-[50px] pointer-events-none" />

      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between gap-4 mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Receipt size={24} weight="fill" />
          </div>
          <h2 className="font-jakarta font-bold text-xl text-brand-secondary leading-tight">
            Finanse
          </h2>
        </div>

        <span
          className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-xl uppercase tracking-wider border shadow-sm whitespace-nowrap ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* CIAŁO: lewa kolumna = podsumowanie, prawa = lista transakcji */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 relative z-10">
        {/* PODSUMOWANIE */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/50 border border-white rounded-[24px] p-5 shadow-sm">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[11px] font-bold text-brand-secondary/50 uppercase tracking-wider">
                Postęp opłat
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {progress}%
              </span>
            </div>

            <div className="h-2.5 w-full bg-gray-200/50 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest mb-0.5">
                  Wpłacono (wyjazd)
                </p>
                <p className="text-xl sm:text-2xl font-bold text-brand-secondary tabular-nums leading-none">
                  {formatZl(amountPaid)} zł
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest mb-0.5">
                  Całkowita
                </p>
                <p className="text-sm font-bold text-brand-secondary/70 tabular-nums leading-none mt-1">
                  {formatZl(amountTotal)} zł
                </p>
              </div>
            </div>
          </div>

          {/* Suma wszystkich wpłat (wyjazd + usługi) */}
          <div className="mt-auto flex items-center justify-between p-4 bg-emerald-600 rounded-[20px] shadow-md shadow-emerald-500/20">
            <span className="flex items-center gap-2 text-[12px] font-bold text-white/80 uppercase tracking-wider">
              <CurrencyCircleDollar size={18} weight="bold" /> Łącznie wpłacone
            </span>
            <span className="text-lg font-extrabold text-white tabular-nums">
              {formatPlnFromZl(totalSpentZl)} zł
            </span>
          </div>
        </div>

        {/* LISTA TRANSAKCJI */}
        <div className="lg:col-span-3 bg-white/50 border border-white rounded-[24px] p-2 shadow-sm flex flex-col min-h-[260px]">
          <p className="px-4 pt-3 pb-2 text-[11px] font-bold text-brand-secondary/50 uppercase tracking-wider">
            Historia transakcji ({transactions.length})
          </p>

          {transactions.length > 0 ? (
            <div className="flex flex-1 flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-1.5 px-2 pb-2"
                >
                {pageItems.map((tx) => (
                  <motion.div
                    key={tx.id}
                    variants={itemVariants}
                    className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 p-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-100 sm:border-transparent sm:hover:border-slate-100 transition-colors"
                  >
                    {/* Ikona + nazwa/data */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          tx.kind === "camp"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-purple-50 text-purple-600",
                        )}
                      >
                        {tx.kind === "camp" ? (
                          <Tent size={20} weight="duotone" />
                        ) : (
                          <Sparkle size={20} weight="fill" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-brand-secondary truncate leading-tight">
                          {tx.label}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
                          <Clock size={12} weight="bold" />{" "}
                          {formatTxDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    {/* Cena + status (na mobile pod spodem, na desktop po prawej) */}
                    <div className="flex items-center justify-between gap-2 pl-[52px] sm:pl-0 border-t border-slate-100 pt-2.5 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:gap-0 shrink-0">
                      <span className="text-[14px] font-extrabold text-brand-secondary tabular-nums">
                        {formatPlnFromZl(tx.amountZl)} zł
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider sm:mt-0.5 whitespace-nowrap",
                          tx.isPaid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {tx.statusLabel}
                      </span>
                    </div>
                  </motion.div>
                ))}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="mt-auto flex items-center justify-between gap-2 px-3 pt-3 pb-1 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">
                    Strona {currentPage} z {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Poprzednia strona"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretLeft size={16} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      aria-label="Następna strona"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretRight size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Receipt
                size={36}
                weight="duotone"
                className="text-slate-200 mb-3"
              />
              <p className="text-sm font-medium text-slate-400">
                Brak zarejestrowanych transakcji.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
