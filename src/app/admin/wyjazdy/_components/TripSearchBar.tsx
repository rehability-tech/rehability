"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";

interface TripSearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export function TripSearchBar({ value, onChange }: TripSearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <MagnifyingGlass
        size={18}
        weight="bold"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Szukaj po tytule wyjazdu…"
        className="w-full h-11 pl-11 pr-10 rounded-full bg-white border border-gray-200 font-montserrat text-[14px] text-[#0B3B4C] placeholder:text-gray-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Wyczyść wyszukiwanie"
        >
          <X size={12} weight="bold" />
        </button>
      )}
    </div>
  );
}
