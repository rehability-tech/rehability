"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretDown,
  Check,
  SortAscending,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export type SortKey = "newest" | "startDate" | "views" | "capacity";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Najnowsze (dodane)" },
  { key: "startDate", label: "Najbliższy termin" },
  { key: "views", label: "Najwięcej wyświetleń" },
  { key: "capacity", label: "Największe zapełnienie" },
];

interface CampSortDropdownProps {
  value: SortKey;
  onChange: (v: SortKey) => void;
}

export function CampSortDropdown({ value, onChange }: CampSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.key === value) ?? OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-11 px-4 inline-flex items-center gap-2 rounded-full font-montserrat text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer",
          open
            ? "bg-[#0B3B4C] text-white shadow-md"
            : "bg-white text-[#0B3B4C] border border-gray-200 hover:bg-gray-50",
        )}
      >
        <SortAscending size={16} weight="bold" />
        <span className="hidden sm:inline">Sortuj:&nbsp;</span>
        <span>{current.label}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-30 overflow-hidden"
          >
            {OPTIONS.map((opt) => {
              const active = opt.key === value;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 font-montserrat text-[13px] font-semibold transition-colors",
                    active
                      ? "text-brand-primary bg-brand-primary/5"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#0B3B4C]",
                  )}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={14} weight="bold" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
