"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  SquaresFour,
  Columns,
  ListBullets,
  ChartBar,
  Sliders,
  X,
  Drop,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import {
  ACCENT,
  type CrmStyle,
  type CrmVariant,
  type CrmAccent,
  type CrmDensity,
} from "./crmShared";

const VARIANTS: { id: CrmVariant; label: string; icon: React.ReactNode }[] = [
  { id: "pro", label: "Pro", icon: <ChartBar size={18} weight="duotone" /> },
  { id: "cards", label: "Karty", icon: <SquaresFour size={18} weight="duotone" /> },
  { id: "columns", label: "Kolumny", icon: <Columns size={18} weight="duotone" /> },
  { id: "compact", label: "Kompakt", icon: <ListBullets size={18} weight="duotone" /> },
  { id: "table", label: "Tabela", icon: <Table size={18} weight="duotone" /> },
];

const DENSITIES: { id: CrmDensity; label: string }[] = [
  { id: "comfort", label: "Komfort" },
  { id: "compact", label: "Gęsto" },
];

const ACCENTS: CrmAccent[] = ["orange", "teal", "navy", "gold"];

export default function CrmDebugBar({
  style,
  onChange,
}: {
  style: CrmStyle;
  onChange: (next: CrmStyle) => void;
}) {
  const [open, setOpen] = useState(true);
  const set = <K extends keyof CrmStyle>(key: K, value: CrmStyle[K]) =>
    onChange({ ...style, [key]: value });

  return (
    <div className="fixed bottom-5 right-5 z-[60] print:hidden">
      <AnimatePresence mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="flex flex-col gap-3 bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl rounded-tr-none shadow-[0_18px_50px_-12px_rgba(3,63,99,0.35)] px-4 py-3.5 w-[min(92vw,560px)]"
          >
            {/* Nagłówek */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary/60">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-yellow/30 text-amber-700">
                  <Sliders size={12} weight="bold" /> Debug
                </span>
                Style panelu
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-secondary/50 hover:bg-black/5 transition-colors"
                aria-label="Zwiń"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Warianty */}
            <div className="grid grid-cols-5 gap-1.5">
              {VARIANTS.map((v) => {
                const active = style.variant === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => set("variant", v.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-2xl border text-[11px] font-bold transition-all ${
                      active
                        ? "bg-brand-primary text-white border-brand-primary shadow-[0_4px_12px_-2px_rgba(40,125,136,0.4)]"
                        : "bg-white/70 text-brand-secondary/60 border-gray-200 hover:bg-white"
                    }`}
                  >
                    {v.icon}
                    {v.label}
                  </button>
                );
              })}
            </div>

            {/* Suwaki stylu */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-1">
              {/* Akcent */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40">
                  Akcent
                </span>
                <div className="flex items-center gap-1.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => set("accent", a)}
                      title={ACCENT[a].label}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        style.accent === a
                          ? "scale-110 border-brand-secondary/40"
                          : "border-white"
                      }`}
                      style={{ background: ACCENT[a].main }}
                    />
                  ))}
                </div>
              </div>

              {/* Gęstość */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40">
                  Gęstość
                </span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => set("density", d.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        style.density === d.id
                          ? "bg-white text-brand-secondary shadow-sm"
                          : "text-brand-secondary/50"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poświata */}
              <button
                onClick={() => set("glow", !style.glow)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  style.glow
                    ? "bg-brand-yellow/20 text-amber-700 border-brand-yellow/40"
                    : "bg-white text-brand-secondary/50 border-gray-200"
                }`}
              >
                <Drop size={14} weight={style.glow ? "fill" : "regular"} />
                Poświata
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ y: 24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-primary text-white pl-3 pr-4 py-2.5 rounded-2xl rounded-tr-none shadow-[0_8px_24px_-6px_rgba(40,125,136,0.6)] border border-brand-yellow/30 font-bold text-sm"
          >
            <Sparkle size={16} weight="fill" className="text-brand-yellow" />
            Style panelu
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
