"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  PencilSimple,
  Trash,
  LinkSimple,
  Coins,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { formatPLN, type CampService } from "./types";

function StatChip({
  label,
  value,
  tone = "secondary",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "secondary" | "emerald" | "primary";
}) {
  const valueColor = {
    secondary: "text-brand-secondary",
    emerald: "text-emerald-600",
    primary: "text-brand-primary",
  }[tone];

  return (
    <div className="flex-1 lg:flex-none lg:min-w-[78px] rounded-xl bg-slate-50/80 px-3 py-1.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[13px] font-extrabold tabular-nums ${valueColor}`}
      >
        {value}
      </p>
    </div>
  );
}

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), ease: "easeOut" }}
      className="group relative flex flex-col gap-4 lg:flex-row lg:items-center overflow-hidden rounded-3xl rounded-tr-none border border-white/60 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-brand-yellow/40 hover:shadow-[0_12px_30px_-10px_rgba(40,125,136,0.22)]"
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-yellow/30 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* TOŻSAMOŚĆ USŁUGI */}
      <div className="relative flex items-start gap-3.5 flex-1 min-w-0">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
            className="w-14 h-14 rounded-2xl rounded-tr-none object-cover shrink-0 border border-white shadow-[0_4px_12px_-3px_rgba(3,63,99,0.3)]"
          />
        ) : (
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl rounded-tr-none bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.45)] shrink-0">
            <Sparkle size={22} weight="fill" />
          </span>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-brand-secondary truncate">
              {service.name}
            </h3>
            {service.isLinked ? (
              <span
                title={`Powiązana z katalogiem (w ${service.linkedCampsCount} ${
                  service.linkedCampsCount === 1 ? "wyjeździe" : "wyjazdach"
                })`}
                className="inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary"
              >
                <LinkSimple size={11} weight="bold" /> Katalog
              </span>
            ) : (
              <span className="inline-flex items-center shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Tylko wyjazd
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[12px] font-medium text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} weight="bold" /> {service.duration} min
            </span>
            <span className="inline-flex items-center gap-1 text-brand-primary font-bold">
              <Coins size={14} weight="bold" /> {formatPLN(service.price)}
            </span>
            {hasOrders && (
              <span className="text-slate-400">
                • {service.stats.buyers}{" "}
                {service.stats.buyers === 1 ? "kupująca" : "kupujących"}
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400 line-clamp-1">
              {service.description}
            </p>
          )}
        </div>
      </div>

      {/* STATYSTYKI */}
      <div className="relative flex items-stretch gap-2 shrink-0">
        <StatChip label="Aktywne" value={service.stats.ordersActive} />
        <StatChip
          label="Opłacone"
          value={service.stats.ordersPaid}
          tone="emerald"
        />
        <StatChip
          label="Przychód"
          value={formatPLN(service.stats.revenuePaid)}
          tone="primary"
        />
      </div>

      {/* AKCJE */}
      <div className="relative flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 h-10 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 transition-all hover:brightness-105"
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
              : "Usuń usługę z wyjazdu"
          }
          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors shrink-0 ${
            hasOrders
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : "border-rose-200 text-rose-500 hover:bg-rose-50"
          }`}
        >
          <Trash size={16} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}
