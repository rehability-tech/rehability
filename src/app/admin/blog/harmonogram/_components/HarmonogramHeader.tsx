"use client";

import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";

export default function HarmonogramHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/10">
            <CalendarBlank
              size={20}
              weight="duotone"
              className="text-brand-primary"
            />
          </div>
          <h1 className="text-[22px] font-jakarta font-bold text-brand-secondary">
            Harmonogram bloga
          </h1>
        </div>
        <p className="text-[13px] text-brand-secondary/50 font-montserrat ml-[52px]">
          Miesięczny plan artykułów generowany automatycznie. Kliknij na dzień,
          aby otworzyć temat.
        </p>
      </div>
    </div>
  );
}
