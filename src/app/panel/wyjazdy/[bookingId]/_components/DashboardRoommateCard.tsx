"use client";

import React from "react";
import { UsersThree, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface BookingPackage {
  partnerName: string | null;
  partnerStatus: string;
  relation: "inviter" | "guest";
  active: boolean;
}

export default function DashboardRoommateCard({
  pkg,
}: {
  pkg: BookingPackage;
}) {
  const partner = pkg.partnerName || "Druga uczestniczka";
  const partnerPaid =
    pkg.partnerStatus === "DEPOSIT_PAID" || pkg.partnerStatus === "FULLY_PAID";

  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 sm:p-6">
      {/* żółta poświata */}
      <div className="pointer-events-none absolute -bottom-10 -right-8 w-32 h-32 bg-brand-yellow/40 rounded-full blur-2xl" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 shrink-0">
          <UsersThree size={24} weight="fill" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
              Jedziecie razem
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                pkg.active
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100",
              )}
            >
              {pkg.active ? (
                <>
                  <CheckCircle size={11} weight="fill" /> Pakiet aktywny
                </>
              ) : (
                <>
                  <Clock size={11} weight="fill" /> Pakiet oczekuje
                </>
              )}
            </span>
          </div>

          <p className="text-[13px] text-brand-secondary/70 leading-relaxed mt-1">
            Dzielisz pokój z <strong className="text-brand-primary">{partner}</strong>.
          </p>

          {!pkg.active && (
            <p className="text-[12px] text-brand-secondary/50 mt-1.5">
              {partnerPaid
                ? "Opłać swój zadatek, aby aktywować pakiet."
                : `Pakiet aktywuje się, gdy ${partner} opłaci zadatek.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
