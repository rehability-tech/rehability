"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PencilSimple,
  ForkKnife,
  HeartStraight,
  Warning,
  FirstAidKit,
  Pill,
  Bandaids,
  NotePencil,
  Phone,
  ShieldCheck,
  ClockClockwise,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { DIET_OPTIONS, type HealthData } from "./health-types";

const DataRow = ({
  icon,
  label,
  value,
  isAlert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode | null;
  isAlert?: boolean;
}) => (
  <div className="flex gap-3.5 items-start p-3 hover:bg-white/40 rounded-xl transition-colors">
    <div
      className={cn(
        "mt-0.5 shrink-0 bg-white p-2 rounded-xl shadow-sm border",
        isAlert
          ? "text-rose-500 border-rose-100 shadow-rose-100/50"
          : "text-brand-primary border-brand-primary/10 shadow-brand-primary/5",
      )}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0 pt-0.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <div
        className={cn(
          "text-[14px] leading-relaxed break-words",
          value
            ? "font-semibold text-brand-secondary"
            : "font-medium text-slate-400 italic",
        )}
      >
        {value || "Brak / Nie zgłoszono"}
      </div>
    </div>
  </div>
);

// Helper do formatowania daty aktualizacji
const formatUpdateDate = (dateString?: string | null) => {
  if (!dateString) return "Dane zapisane i bezpieczne";
  return `Aktualizacja: ${new Date(dateString).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

interface Props {
  data: HealthData & { updatedAt?: string | null };
  onEdit: () => void;
}

export default function HealthSummary({ data, onEdit }: Props) {
  // Pobieranie labelki diety z Twojego istniejącego słownika
  const dietLabel =
    DIET_OPTIONS.find((o) => o.value === data.dietType)?.label ||
    "Nie określono";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[32px] shadow-[0_12px_40px_-15px_rgba(40,125,136,0.15)] overflow-hidden flex flex-col w-full"
    >
      {/* GLOWS W TLE */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-brand-yellow/20 blur-[80px] rounded-full pointer-events-none" />

      {/* NAGŁÓWEK */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-white/50 bg-white/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-[#1f646d] text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 shrink-0">
            <ShieldCheck size={24} weight="fill" />
          </div>
          <div>
            <h2 className="font-jakarta font-extrabold text-[20px] text-brand-secondary leading-tight">
              Karta Zdrowia
            </h2>
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-brand-primary/80 uppercase tracking-widest mt-1.5">
              {data.updatedAt ? (
                <ClockClockwise size={14} weight="bold" />
              ) : (
                <ShieldCheck size={14} weight="bold" />
              )}
              {formatUpdateDate(data.updatedAt)}
            </p>
          </div>
        </div>

        {/* PRZYCISK EDYCJI */}
        <button
          onClick={onEdit}
          className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-brand-primary/15 text-brand-primary font-bold text-[13px] rounded-xl shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <div className="absolute inset-0 w-full h-full bg-brand-primary/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          <PencilSimple size={16} weight="bold" className="relative z-10" />
          <span className="relative z-10">Edytuj dane</span>
        </button>
      </div>

      {/* ZAWARTOŚĆ */}
      <div className="relative z-10 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
        {/* KOLUMNA 1: DIETA */}
        <div className="flex flex-col gap-2 bg-white/40 p-5 rounded-[24px] border border-white/60 shadow-sm">
          <div className="flex items-center gap-2 mb-2 px-2">
            <ForkKnife
              size={20}
              weight="duotone"
              className="text-brand-yellow"
            />
            <h3 className="font-bold text-brand-secondary">
              Profil żywieniowy
            </h3>
          </div>
          <DataRow
            icon={<ForkKnife size={18} weight="duotone" />}
            label="Rodzaj diety"
            value={dietLabel}
          />
          <DataRow
            icon={<Warning size={18} weight="duotone" />}
            label="Nietolerancje pokarmowe"
            value={
              data.foodIntolerances && data.foodIntolerances.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {data.foodIntolerances.map((i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[11px] font-bold"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              ) : null
            }
          />
          <DataRow
            icon={<NotePencil size={18} weight="duotone" />}
            label="Dodatkowe uwagi do diety"
            value={data.foodNotes}
          />
        </div>

        {/* KOLUMNA 2: ZDROWIE */}
        <div className="flex flex-col gap-2 bg-white/40 p-5 rounded-[24px] border border-white/60 shadow-sm">
          <div className="flex items-center gap-2 mb-2 px-2">
            <HeartStraight
              size={20}
              weight="duotone"
              className="text-rose-400"
            />
            <h3 className="font-bold text-brand-secondary">
              Informacje medyczne
            </h3>
          </div>
          <DataRow
            icon={<Warning size={18} weight="duotone" />}
            label="Alergie i uczulenia"
            value={data.allergies}
            isAlert={!!data.allergies}
          />
          <DataRow
            icon={<FirstAidKit size={18} weight="duotone" />}
            label="Choroby przewlekłe"
            value={data.chronicConditions}
          />
          <DataRow
            icon={<Pill size={18} weight="duotone" />}
            label="Przyjmowane leki"
            value={data.medications}
          />
          <DataRow
            icon={<Bandaids size={18} weight="duotone" />}
            label="Urazy / Kontuzje"
            value={data.injuries}
          />
        </div>

        {/* KOLUMNA 3: KONTAKT ALARMOWY */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-50/50 to-white/40 p-5 rounded-[24px] border border-rose-100/50 shadow-sm mt-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
              <Phone size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-500/70 uppercase tracking-widest mb-0.5">
                Kontakt w razie nagłych wypadków (ICE)
              </p>
              <p className="text-[16px] font-bold text-brand-secondary">
                {data.emergencyName || "Nie podano imienia"}
              </p>
            </div>
          </div>

          {data.emergencyPhone ? (
            <a
              href={`tel:${data.emergencyPhone.replace(/\s+/g, "")}`}
              className="px-5 py-3 rounded-xl bg-white border border-rose-100 font-bold text-rose-600 shadow-sm hover:shadow-md hover:border-rose-200 transition-all text-sm w-full sm:w-auto text-center"
            >
              {data.emergencyPhone}
            </a>
          ) : (
            <span className="px-5 py-3 rounded-xl bg-gray-50/50 border border-gray-100 font-medium text-gray-400 text-sm w-full sm:w-auto text-center">
              Brak numeru telefonu
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
