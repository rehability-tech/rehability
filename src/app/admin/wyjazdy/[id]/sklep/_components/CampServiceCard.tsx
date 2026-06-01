"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  PencilSimple,
  Trash,
  LinkSimple,
  ShoppingBag,
  Coins,
} from "@phosphor-icons/react/dist/ssr";
import { formatPLN, type CampService } from "./types";

export function CampServiceCard({
  service,
  index,
  onEdit,
  onDelete,
}: {
  service: CampService;
  index: number;
  onEdit: (s: CampService) => void;
  onDelete: (s: CampService) => void;
}) {
  const hasOrders = service.stats.ordersActive > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-3xl rounded-tr-none border border-white/60 bg-white/80 backdrop-blur-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-brand-yellow/40 hover:shadow-[0_12px_30px_-10px_rgba(40,125,136,0.22)]"
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-yellow/30 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Nagłówek: nazwa + badge powiązania */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-brand-secondary truncate">
            {service.name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-[12px] font-medium text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} weight="bold" /> {service.duration} min
            </span>
            <span className="inline-flex items-center gap-1 text-brand-primary font-bold">
              <Coins size={14} weight="bold" /> {formatPLN(service.price)}
            </span>
          </div>
        </div>
        {service.isLinked ? (
          <span
            title={`Powiązana z katalogiem (w ${service.linkedCampsCount} ${
              service.linkedCampsCount === 1 ? "campie" : "campach"
            })`}
            className="inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary"
          >
            <LinkSimple size={12} weight="bold" /> Katalog
          </span>
        ) : (
          <span className="inline-flex items-center shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Tylko camp
          </span>
        )}
      </div>

      {service.description && (
        <p className="relative mt-3 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Mini-statystyki */}
      <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 p-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Aktywne
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-brand-secondary tabular-nums">
            {service.stats.ordersActive}
          </p>
        </div>
        <div className="border-x border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Opłacone
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-emerald-600 tabular-nums">
            {service.stats.ordersPaid}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Przychód
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-brand-primary tabular-nums">
            {formatPLN(service.stats.revenuePaid)}
          </p>
        </div>
      </div>

      {/* Akcje */}
      <div className="relative mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 h-10 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 transition-all hover:brightness-105"
        >
          <PencilSimple size={16} weight="bold" /> Edytuj
        </button>
        <button
          type="button"
          onClick={() => onDelete(service)}
          disabled={hasOrders}
          title={
            hasOrders
              ? "Nie można usunąć — usługa ma aktywne rezerwacje"
              : "Usuń usługę z campu"
          }
          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
            hasOrders
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : "border-rose-200 text-rose-500 hover:bg-rose-50"
          }`}
        >
          <Trash size={16} weight="bold" />
        </button>
      </div>

      {hasOrders && (
        <p className="relative mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <ShoppingBag size={12} weight="bold" />
          {service.stats.buyers}{" "}
          {service.stats.buyers === 1 ? "uczestniczka" : "uczestniczek"} ma tę
          usługę
        </p>
      )}
    </motion.div>
  );
}
