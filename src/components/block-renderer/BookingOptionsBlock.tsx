import React from "react";
import parse from "html-react-parser";
import { User, UsersFour, StarFour } from "@phosphor-icons/react/dist/ssr";

export default function BookingOptionsBlock({ content }: { content: any }) {
  if (!content) return null;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 mt-8 mb-12 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* === KARTA 1: PAKIET SOLO === */}
        <div className="flex flex-col bg-white border border-[#287D88]/15 rounded-[24px] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-gray-100">
            <div className="w-11 h-11 rounded-[14px] bg-[#F1F5F9] flex items-center justify-center text-[#0B3B4C]/50 shrink-0">
              <User size={22} weight="duotone" />
            </div>
            <h4 className="flex-1 font-jakarta font-bold text-[18px] text-[#0B3B4C] m-0">
              {content.standardTitle || "Pakiet Standard (1 osoba)"}
            </h4>
          </div>
          <div className="px-6 py-5 font-montserrat text-[14px] leading-relaxed text-gray-600 [&_p]:m-0 [&_p+p]:mt-3">
            {parse(content.standardText || "")}
          </div>
        </div>

        {/* === KARTA 2: PAKIET DUO === */}
        <div className="flex flex-col bg-white border border-[#287D88]/25 rounded-[24px] shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
          <div className="h-1 w-full bg-gradient-to-r from-[#287D88] to-[#659F9F]" />
          <div className="flex flex-wrap items-center gap-3 px-6 pt-5 pb-5 border-b border-[#287D88]/10">
            <div className="w-11 h-11 rounded-[14px] bg-[#287D88]/10 flex items-center justify-center text-[#287D88] shrink-0">
              <UsersFour size={22} weight="duotone" />
            </div>
            <h4 className="flex-1 font-jakarta font-bold text-[18px] text-[#287D88] m-0 min-w-[200px]">
              {content.duoTitle || "Pakiet Wyjazd we Dwoje (2 osoby)"}
            </h4>
            <span className="shrink-0 flex items-center gap-1 font-montserrat text-[11px] font-semibold uppercase tracking-wide text-[#287D88] bg-[#287D88]/10 px-2.5 py-1 rounded-full border border-[#287D88]/20">
              <StarFour size={11} weight="fill" />
              Polecane
            </span>
          </div>
          <div className="px-6 py-5 font-montserrat text-[14px] leading-relaxed text-[#0B3B4C]/80 [&_p]:m-0 [&_p+p]:mt-3">
            {parse(content.duoText || "")}
          </div>
        </div>
      </div>
    </div>
  );
}
