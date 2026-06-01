"use client";

import React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface SerpPreviewProps {
  metaTitle: string;
  metaDescription: string;
  tripId: string;
}

export default function SerpPreview({
  metaTitle,
  metaDescription,
  tripId,
}: SerpPreviewProps) {
  const displayTitle = metaTitle || "Tytuł wyjazdu pojawi się tutaj...";
  const displayDesc =
    metaDescription ||
    "Opis meta wyjazdu pojawi się tutaj. Opisz krótko gdzie, kiedy i dla kogo jest ten trip.";
  const displayUrl = `rehability.pl › wyjazdy › ${tripId || "twoj-wyjazd"}`;

  const titleLen = metaTitle.length;
  const descLen = metaDescription.length;

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MagnifyingGlass size={16} className="text-gray-400" />
        <span className="text-xs font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Podgląd w Google (SERP)
        </span>
      </div>

      <div className="border border-gray-100 rounded-[12px] p-4 bg-gray-50/50">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
            R
          </div>
          <span className="text-[13px] font-montserrat text-gray-600 truncate">
            {displayUrl}
          </span>
        </div>

        <h3
          className={cn(
            "font-montserrat text-[20px] leading-[130%] mb-1 truncate",
            metaTitle ? "text-[#1a0dab]" : "text-gray-300 italic",
          )}
        >
          {displayTitle}
        </h3>

        <p
          className={cn(
            "font-montserrat text-[14px] leading-[160%] line-clamp-2",
            metaDescription ? "text-gray-600" : "text-gray-300 italic",
          )}
        >
          {displayDesc}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <CharCounter label="Tytuł" value={titleLen} max={60} />
        <CharCounter label="Opis" value={descLen} max={160} />
      </div>
    </div>
  );
}

function CharCounter({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-montserrat text-gray-500">
        {label}:
      </span>
      <span
        className={cn(
          "text-[11px] font-bold font-montserrat",
          value === 0
            ? "text-gray-300"
            : value <= max
              ? "text-emerald-500"
              : "text-red-500",
        )}
      >
        {value}/{max}
      </span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value === 0
              ? "bg-gray-200"
              : value <= max
                ? "bg-emerald-400"
                : "bg-red-400",
          )}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
