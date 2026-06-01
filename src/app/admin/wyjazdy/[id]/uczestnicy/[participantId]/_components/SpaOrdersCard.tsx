"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Sparkle,
  Clock,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { ORDER_STATUS_LABELS, formatTime } from "./constants";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// TODO: pozycje testowe — do usunięcia po podpięciu realnych danych.
const TEST_ORDERS = [
  {
    id: "test-spa-1",
    status: "PAID",
    price: 220,
    startTime: "2026-05-21T11:00:00.000Z",
    service: { name: "Masaż gorącymi kamieniami (test)" },
  },
  {
    id: "test-spa-2",
    status: "PENDING",
    price: 140,
    startTime: "2026-05-22T09:30:00.000Z",
    service: { name: "Zabieg na twarz (test)" },
  },
];

export const SpaOrdersCard = ({ orders }: { orders: any[] }) => {
  // Łączymy realne zamówienia z pozycjami testowymi
  const allOrders = useMemo(() => [...orders, ...TEST_ORDERS], [orders]);

  // Paginacja — max 3 karty na stronę
  const PAGE_SIZE = 3;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = allOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(168,85,247,0.6)] transition-shadow duration-300 border border-white/80 overflow-hidden"
    >
      {/* Fioletowy glow w tle karty */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-400/10 rounded-full blur-[50px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <Sparkle size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-xl text-slate-800 leading-tight">
              Usługi Dodatkowe & SPA
            </h2>
            {/* Mobile: ilość pod nazwą karty */}
            <span className="sm:hidden inline-flex mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
              Ilość: {allOrders.length}
            </span>
          </div>
        </div>
        {/* Desktop: ilość po prawej */}
        <span className="hidden sm:inline-flex shrink-0 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-bold border border-slate-200">
          Ilość: {allOrders.length}
        </span>
      </div>

      {allOrders.length > 0 ? (
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
          {pageItems.map((order: any) => {
            const time =
              formatTime(order.startTime) ||
              formatTime(order.spaBlock?.startTime);
            const isPaid = order.status === "PAID";

            return (
              <motion.div
                key={order.id}
                variants={itemVariants}
                className="flex flex-col lg:h-[164px] p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-primary/30 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-[15px] leading-tight group-hover:text-brand-primary transition-colors pr-2 line-clamp-2">
                    {order.service?.name || "Nieznana usługa"}
                  </h3>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm text-purple-500 shrink-0">
                    <Sparkle size={16} weight="duotone" />
                  </div>
                </div>

                {time && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
                    <Clock size={14} weight="bold" /> {time}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="text-[14px] font-extrabold text-slate-700">
                    {Number(order.price).toLocaleString("pl-PL")} zł
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Placeholdery dopełniające siatkę do PAGE_SIZE (tylko desktop) — stała wysokość */}
          {Array.from({
            length: Math.max(0, PAGE_SIZE - pageItems.length),
          }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              aria-hidden
              className="hidden lg:block lg:h-[164px] rounded-2xl border border-transparent"
            />
          ))}
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-400">
                Strona {currentPage} z {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Poprzednia strona"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Następna strona"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-500">
            Brak wykupionych usług dodatkowych.
          </p>
        </div>
      )}
    </motion.div>
  );
};
