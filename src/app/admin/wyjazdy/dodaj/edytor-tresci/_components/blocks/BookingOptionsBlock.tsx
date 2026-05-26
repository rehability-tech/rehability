"use client";

import React from "react";
import { User, UsersFour, StarFour } from "@phosphor-icons/react/dist/ssr";

interface BookingOptionsContent {
  standardTitle: string;
  standardText: string;
  duoTitle: string;
  duoText: string;
}

interface BookingOptionsBlockProps {
  content: BookingOptionsContent;
  onChange: (newContent: BookingOptionsContent) => void;
}

export default function BookingOptionsBlock({
  content,
  onChange,
}: BookingOptionsBlockProps) {
  console.log(content);

  return (
    <div className="w-full px-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* KARTA 1: PAKIET SOLO */}
        <div className="flex flex-col bg-white border border-[#287D88]/15 rounded-[24px] shadow-sm hover:shadow-md transition-all overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-gray-100">
            <div className="w-11 h-11 rounded-[14px] bg-[#F1F5F9] flex items-center justify-center text-[#0B3B4C]/50 shrink-0">
              <User size={22} weight="duotone" />
            </div>
            <input
              type="text"
              value={content.standardTitle || ""}
              onChange={(e) =>
                onChange({ ...content, standardTitle: e.target.value })
              }
              placeholder="Nazwa pakietu (np. Pakiet Solo)"
              className="flex-1 font-jakarta font-bold text-[18px] text-[#0B3B4C] bg-transparent border-2 border-transparent rounded-[10px] px-2 py-1.5 focus:outline-none focus:bg-gray-50 focus:border-gray-200 transition-all placeholder:text-gray-300 placeholder:font-medium w-full"
            />
          </div>
          <textarea
            value={content.standardText?.replace(/<[^>]*>?/gm, "") || ""}
            onChange={(e) =>
              onChange({ ...content, standardText: `<p>${e.target.value}</p>` })
            }
            placeholder="Opisz krótko co zawiera ta opcja rezerwacji..."
            rows={5}
            className="w-full px-6 py-4 font-montserrat text-[14px] leading-relaxed text-gray-500 bg-transparent border-2 border-transparent focus:outline-none focus:bg-gray-50 focus:border-gray-200 rounded-b-[24px] resize-y transition-all placeholder:text-gray-300"
          />
        </div>

        {/* KARTA 2: PAKIET DUO — wyróżniona */}
        <div className="flex flex-col bg-white border border-[#287D88]/25 rounded-[24px] shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          {/* Akcent kolorystyczny na górze */}
          <div className="h-1 w-full bg-gradient-to-r from-[#287D88] to-[#659F9F]" />

          <div className="flex items-center gap-3 px-6 pt-5 pb-5 border-b border-[#287D88]/10">
            <div className="w-11 h-11 rounded-[14px] bg-[#287D88]/10 flex items-center justify-center text-[#287D88] shrink-0">
              <UsersFour size={22} weight="duotone" />
            </div>
            <input
              type="text"
              value={content.duoTitle || ""}
              onChange={(e) =>
                onChange({ ...content, duoTitle: e.target.value })
              }
              placeholder="Nazwa pakietu (np. Pakiet Duo)"
              className="flex-1 font-jakarta font-bold text-[18px] text-[#287D88] bg-transparent border-2 border-transparent rounded-[10px] px-2 py-1.5 focus:outline-none focus:bg-[#287D88]/5 focus:border-[#287D88]/20 transition-all placeholder:text-[#287D88]/30 placeholder:font-medium w-full"
            />
            {/* Badge "Polecane" */}
            <span className="shrink-0 flex items-center gap-1 font-montserrat text-[11px] font-semibold uppercase tracking-wide text-[#287D88] bg-[#287D88]/10 px-2.5 py-1 rounded-full border border-[#287D88]/20">
              <StarFour size={11} weight="fill" />
              Polecane
            </span>
          </div>

          <textarea
            value={content.duoText?.replace(/<[^>]*>?/gm, "") || ""}
            onChange={(e) =>
              onChange({ ...content, duoText: `<p>${e.target.value}</p>` })
            }
            placeholder="Opisz krótko co zawiera ta opcja rezerwacji..."
            rows={5}
            className="w-full px-6 py-4 font-montserrat text-[14px] leading-relaxed text-[#0B3B4C]/70 bg-transparent border-2 border-transparent focus:outline-none focus:bg-[#287D88]/5 focus:border-[#287D88]/20 rounded-b-[24px] resize-y transition-all placeholder:text-[#287D88]/30"
          />
        </div>
      </div>
    </div>
  );
}
