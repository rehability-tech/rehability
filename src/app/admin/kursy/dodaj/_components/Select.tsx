"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretDown,
  Check,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Dropdown w stylu panelu (zastępuje natywny <select>): animowane otwieranie
 * (Framer Motion), zaznaczona pozycja, zamykanie kliknięciem poza / Escape.
 *
 * `creatable` → combobox: pole wyszukiwania + opcja „Dodaj «…»", gdy wpisana
 * nazwa nie pasuje do listy (np. nowa kategoria kursu).
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Wybierz…",
  creatable = false,
  createLabel = "Dodaj",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  creatable?: boolean;
  createLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    // Autofocus pola wyszukiwania w trybie creatable.
    if (creatable) window.setTimeout(() => inputRef.current?.focus(), 30);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, creatable]);

  const q = query.trim();
  const filtered = q
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
    : options;
  const exact = options.some((o) => o.toLowerCase() === q.toLowerCase());
  const canCreate = creatable && q.length > 0 && !exact;

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full h-12 items-center justify-between gap-2 px-4 rounded-xl border bg-white font-montserrat text-[14px] outline-none transition-all ${
          open
            ? "border-brand-primary ring-4 ring-brand-primary/10"
            : "border-gray-200 hover:border-gray-300"
        } ${value ? "text-[#0B3B4C]" : "text-gray-300"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0 text-brand-primary/60"
        >
          <CaretDown size={16} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-30 mt-2 w-full rounded-xl rounded-tr-none border border-gray-100 bg-white p-1.5 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.35)]"
          >
            {creatable && (
              <div className="relative mb-1.5">
                <MagnifyingGlass
                  size={14}
                  weight="bold"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-secondary/35"
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canCreate) pick(q);
                      else if (filtered.length === 1) pick(filtered[0]);
                    }
                  }}
                  placeholder="Szukaj lub dodaj…"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50/60 font-montserrat text-[13px] text-brand-secondary placeholder:text-gray-300 outline-none focus:border-brand-primary/40 focus:bg-white"
                />
              </div>
            )}

            <ul role="listbox" className="max-h-56 overflow-y-auto">
              {filtered.map((opt) => {
                const active = opt === value;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(opt)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-montserrat text-[13.5px] transition-colors ${
                        active
                          ? "bg-brand-primary/10 text-brand-primary font-bold"
                          : "text-brand-secondary/80 hover:bg-brand-primary/[0.05]"
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {active && (
                        <Check size={15} weight="bold" className="shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}

              {canCreate && (
                <li>
                  <button
                    type="button"
                    onClick={() => pick(q)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-montserrat text-[13.5px] font-semibold text-brand-primary hover:bg-brand-primary/[0.08] transition-colors"
                  >
                    <Plus size={15} weight="bold" className="shrink-0" />
                    <span className="truncate">
                      {createLabel} „{q}"
                    </span>
                  </button>
                </li>
              )}

              {filtered.length === 0 && !canCreate && (
                <li className="px-3 py-2.5 font-montserrat text-[13px] text-gray-400">
                  Brak wyników.
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
