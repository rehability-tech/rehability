"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle,
  HourglassMedium,
  XCircle,
  Envelope,
  CurrencyCircleDollar,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { SerializedEvent, BlockReservation } from "./timegrid/types";

interface Props {
  event: SerializedEvent;
  onClose: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

// Zaktualizowany status badge w stylu z designu
function StatusBadge({ status }: { status: BlockReservation["status"] }) {
  const cfg = {
    PAID: {
      label: "Opłacone",
      icon: <CheckCircle size={14} weight="fill" />,
      cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    PENDING: {
      label: "Oczekuje",
      icon: <HourglassMedium size={14} weight="bold" />,
      cls: "bg-amber-50 text-amber-600 border-amber-200",
    },
    CANCELLED: {
      label: "Anulowane",
      icon: <XCircle size={14} weight="fill" />,
      cls: "bg-gray-100 text-gray-500 border-gray-200",
    },
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border w-fit shadow-sm",
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function ReservationsModal({ event, onClose }: Props) {
  const reservations = event.reservations ?? [];
  const paidCount = reservations.filter((r) => r.status === "PAID").length;
  const pendingCount = reservations.filter(
    (r) => r.status === "PENDING",
  ).length;
  const totalPaidGrosze = reservations
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + r.amountGrosze, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-brand-secondary/60 backdrop-blur-sm"
      />

      <motion.aside
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto z-[201] flex flex-col bg-white rounded-t-[28px] sm:rounded-[32px] sm:w-[95vw] sm:max-w-2xl sm:h-fit sm:max-h-[85vh] max-h-[90vh] shadow-[0_-20px_60px_-20px_rgba(3,63,99,0.3)] sm:shadow-[0_40px_100px_-20px_rgba(3,63,99,0.4)] overflow-hidden"
      >
        <header className="px-5 sm:px-8 py-4 sm:py-6 border-b border-brand-secondary/10 shrink-0 bg-gradient-to-b from-gray-50/50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-brand-secondary/50 font-bold mb-1">
                Rezerwacje bloku
              </p>
              <h2 className="font-jakarta text-[20px] sm:text-[26px] font-bold text-brand-secondary leading-tight">
                {event.title}
              </h2>
              <p className="text-[12px] sm:text-[14px] text-brand-secondary/60 font-medium mt-1.5 tabular-nums flex items-center gap-1.5">
                <Clock size={14} weight="bold" />
                {formatDateLong(event.startTime)} ·{" "}
                {formatTime(event.startTime)}
                {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-brand-secondary hover:text-brand-primary transition shrink-0"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 sm:mt-6">
            <Metric
              label="Opłacone"
              value={String(paidCount)}
              accent="emerald"
            />
            <Metric
              label="Oczekuje"
              value={String(pendingCount)}
              accent="amber"
            />
            <Metric
              label="Przychód"
              value={`${(totalPaidGrosze / 100).toFixed(0)} zł`}
              accent="primary"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-6 bg-gray-50/50 custom-scrollbar">
          {reservations.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Clock size={28} weight="duotone" className="text-gray-400" />
              </div>
              <p className="text-[15px] sm:text-[17px] font-bold text-brand-secondary mb-1">
                Brak rezerwacji
              </p>
              <p className="text-[13px] sm:text-[14px] text-brand-secondary/55">
                Nikt jeszcze nie zarezerwował usługi w tym bloku.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3 sm:gap-4">
              {reservations.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border bg-white shadow-sm transition-all hover:shadow-md hover:border-brand-primary/20",
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6",
                    r.status === "CANCELLED"
                      ? "opacity-60 border-gray-200"
                      : "border-gray-100/80",
                  )}
                >
                  {/* LEWA STRONA: Info o osobie */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[18px] bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[14px] sm:text-[16px] font-bold tracking-wider shrink-0">
                      {initials(r.bookerName) || "?"}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-[16px] sm:text-[18px] font-bold text-brand-secondary truncate">
                        {r.bookerName}
                      </p>
                      {r.bookerEmail && (
                        <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-gray-400 truncate mt-0.5">
                          <Envelope size={14} />
                          {r.bookerEmail}
                        </p>
                      )}
                      <div className="mt-2.5">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>

                  {/* PIONOWA KRESKA ODDZIELAJĄCA (Tylko na desktopie) */}
                  <div className="hidden sm:block w-px h-16 bg-gray-100 shrink-0 mx-2" />

                  {/* PRAWA STRONA: Pigułki informacji */}
                  <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
                    {/* Czas */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl bg-gray-50/80 text-brand-secondary/70 text-[11px] sm:text-[12px] font-bold border border-gray-100/80">
                      <Clock size={14} weight="duotone" />
                      {formatTime(r.startTime)} – {formatTime(r.endTime)}
                    </span>
                    {/* Nazwa Usługi */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg sm:rounded-xl bg-gray-50/80 text-brand-secondary/80 text-[11px] sm:text-[12px] font-bold border border-gray-100/80 truncate max-w-[240px]">
                      {r.serviceName}
                    </span>
                    {/* Cena */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 text-[11px] sm:text-[12px] font-bold border border-emerald-100">
                      <CurrencyCircleDollar size={14} weight="duotone" />
                      {(r.amountGrosze / 100).toFixed(0)} zł
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "amber" | "primary";
}) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    primary: "bg-brand-primary/5 text-brand-primary border-brand-primary/10",
  }[accent];
  return (
    <div
      className={cn(
        "rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-3 border text-center transition-all hover:shadow-sm",
        cls,
      )}
    >
      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
        {label}
      </p>
      <p className="text-[16px] sm:text-[20px] font-bold tabular-nums">
        {value}
      </p>
    </div>
  );
}
