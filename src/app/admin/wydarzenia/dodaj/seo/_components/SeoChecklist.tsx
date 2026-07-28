"use client";

import React from "react";
import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { SeoCheck } from "./utils";

export default function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);

  const color =
    pct >= 80
      ? "text-emerald-500"
      : pct >= 50
        ? "text-amber-500"
        : "text-red-500";

  const bgTrack =
    pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Szybka analiza (reguły)
        </span>
        <span className={cn("text-[22px] font-jakarta font-bold", color)}>
          {pct}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            bgTrack,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2.5">
            {check.ok ? (
              <CheckCircle
                size={16}
                weight="fill"
                className="text-emerald-500 mt-0.5 shrink-0"
              />
            ) : (
              <Warning
                size={16}
                weight="fill"
                className="text-amber-500 mt-0.5 shrink-0"
              />
            )}
            <div>
              <span
                className={cn(
                  "text-[13px] font-semibold font-montserrat",
                  check.ok ? "text-gray-600" : "text-gray-700",
                )}
              >
                {check.label}
              </span>
              {!check.ok && (
                <p className="text-[11px] font-montserrat text-gray-400 mt-0.5">
                  {check.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
