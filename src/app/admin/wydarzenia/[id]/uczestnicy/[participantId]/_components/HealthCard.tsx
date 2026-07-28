"use client";

import React from "react";
import {
  HeartStraight,
  ForkKnife,
  Pill,
  Bandaids,
  FirstAidKit,
  Warning,
  NotePencil,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import { DIET_LABELS } from "./constants";
import { cn } from "@/lib/utils";

const DataRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => (
  <div className="flex gap-3.5 items-start p-3 hover:bg-white/50 rounded-xl transition-colors">
    <div className="text-rose-400 mt-0.5 shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-rose-50">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-[14px] leading-tight break-words",
          value
            ? "font-semibold text-slate-700"
            : "font-medium text-slate-400 italic",
        )}
      >
        {value || "Brak"}
      </p>
    </div>
  </div>
);

export const HealthCard = ({ health }: { health: any }) => {
  if (!health) {
    return (
      <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_-12px_rgba(225,29,72,0.15)] border border-rose-100/50 h-full flex flex-col items-center justify-center text-center min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 to-transparent pointer-events-none" />
        <div className="relative z-10 w-20 h-20 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mb-5 border border-rose-100 shadow-inner">
          <HeartStraight size={36} weight="duotone" />
        </div>
        <h3 className="relative z-10 font-jakarta font-bold text-slate-700 text-[18px] mb-2">
          Brak karty zdrowia
        </h3>
        <p className="relative z-10 text-sm font-medium text-slate-500 max-w-[250px]">
          Karta zdrowia nie została jeszcze wypełniona.
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_-15px_rgba(225,29,72,0.25)] border border-rose-100 h-full flex flex-col overflow-hidden">
      {/* Czerwony Ambient Glow w tle karty */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-400/10 blur-[80px] rounded-full pointer-events-none" />

      {/* NAGŁÓWEK */}
      <div className="relative z-10 flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
          <HeartStraight size={24} weight="fill" />
        </div>
        <h2 className="font-jakarta font-bold text-[19px] text-brand-secondary leading-tight">
          Karta Zdrowia
        </h2>
      </div>

      {/* DANE */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 backdrop-blur-sm p-4 rounded-[24px] border border-slate-200/60 shadow-inner flex-1 content-start">
        <DataRow
          icon={<ForkKnife size={18} weight="duotone" />}
          label="Dieta"
          value={DIET_LABELS[health.dietType] || health.dietType}
        />
        <DataRow
          icon={<Warning size={18} weight="duotone" />}
          label="Alergie"
          value={health.allergies}
        />
        <DataRow
          icon={<FirstAidKit size={18} weight="duotone" />}
          label="Choroby przewlekłe"
          value={health.chronicConditions}
        />
        <DataRow
          icon={<Pill size={18} weight="duotone" />}
          label="Leki"
          value={health.medications}
        />
        <DataRow
          icon={<Bandaids size={18} weight="duotone" />}
          label="Urazy/Kontuzje"
          value={health.injuries}
        />

        <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200/60">
          <DataRow
            icon={<ForkKnife size={18} weight="duotone" />}
            label="Nietolerancje pokarmowe"
            value={
              health.foodIntolerances?.length
                ? health.foodIntolerances.join(", ")
                : null
            }
          />
          {health.foodNotes && (
            <DataRow
              icon={<NotePencil size={18} weight="duotone" />}
              label="Uwagi żywieniowe"
              value={health.foodNotes}
            />
          )}
        </div>
      </div>
    </div>
  );
};
