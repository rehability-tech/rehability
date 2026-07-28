"use client";

import React from "react";
import Link from "next/link";
import {
  UsersThree,
  CheckCircle,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import type { PackagePartnerData } from "@/types/participant";

interface Props {
  partner: PackagePartnerData;
  tripId: string;
}

export function PackageCard({ partner, tripId }: Props) {
  const name = partner.name || "Druga uczestniczka";
  const relationLabel =
    partner.relation === "guest"
      ? "Zaprosił(a) tę osobę"
      : "Została zaproszona przez tę osobę";

  return (
    <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-slate-200 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
      <div className="absolute -top-10 -right-8 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <UsersThree size={18} weight="fill" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-[15px]">
            Pakiet (jadą razem)
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
            partner.active
              ? "bg-emerald-100/80 text-emerald-700"
              : "bg-amber-100/80 text-amber-700"
          }`}
        >
          {partner.active ? (
            <>
              <CheckCircle size={13} weight="fill" /> Aktywny
            </>
          ) : (
            <>
              <Clock size={13} weight="fill" /> Oczekuje
            </>
          )}
        </span>
      </div>

      <Link
        href={`/admin/wydarzenia/${tripId}/uczestnicy/${partner.bookingId}`}
        className="relative z-10 group flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-brand-primary/30 hover:bg-white transition-all"
      >
        <div className="min-w-0">
          <p className="font-bold text-slate-800 text-[14px] truncate group-hover:text-brand-primary transition-colors">
            {name}
          </p>
          <p className="text-[11.5px] text-slate-400 font-medium">
            {relationLabel}
          </p>
        </div>
        <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
          <ArrowRight size={15} weight="bold" />
        </span>
      </Link>
    </div>
  );
}
