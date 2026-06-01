"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CircleNotch,
  Warning,
  House,
  Globe,
} from "@phosphor-icons/react/dist/ssr";
import type { CampService } from "./types";

export type EditScope = "camp" | "global";

export function EditServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: CampService;
  onClose: () => void;
  onSave: (
    scope: EditScope,
    payload: {
      name: string;
      duration: string;
      price: string;
      description: string;
    },
  ) => Promise<boolean>;
}) {
  const [scope, setScope] = useState<EditScope>("camp");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: service.name,
    duration: String(service.duration),
    price: String(service.price),
    description: service.description ?? "",
  });

  const canGlobal = service.isLinked;

  const handleSave = async () => {
    if (!form.name.trim() || !form.duration || !form.price) return;
    setSaving(true);
    try {
      const ok = await onSave(scope, form);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl rounded-tr-none border border-white/60 bg-white/95 backdrop-blur-2xl p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-brand-secondary">
                Edytuj usługę
              </h2>
              <p className="text-[13px] text-slate-400 font-medium">
                {service.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Przełącznik zakresu */}
          <div className="grid grid-cols-2 gap-2 mb-5 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setScope("camp")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 h-10 text-[13px] font-bold transition-all ${
                scope === "camp"
                  ? "bg-white text-brand-secondary shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <House size={16} weight="bold" /> Tylko ten camp
            </button>
            <button
              type="button"
              onClick={() => canGlobal && setScope("global")}
              disabled={!canGlobal}
              title={
                canGlobal
                  ? "Zmieni usługę w katalogu i wszystkich powiązanych campach"
                  : "Usługa nie jest powiązana z katalogiem globalnym"
              }
              className={`flex items-center justify-center gap-2 rounded-xl px-3 h-10 text-[13px] font-bold transition-all ${
                scope === "global"
                  ? "bg-white text-brand-secondary shadow-sm"
                  : "text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              <Globe size={16} weight="bold" /> Globalnie
            </button>
          </div>

          {/* Ostrzeżenie przy edycji globalnej */}
          <AnimatePresence>
            {scope === "global" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-4 flex gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-700">
                  <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>
                    Zmiana zaktualizuje tę usługę w katalogu oraz w{" "}
                    <strong>
                      {service.linkedCampsCount}{" "}
                      {service.linkedCampsCount === 1 ? "campie" : "campach"}
                    </strong>
                    , które ją mają. Ceny już złożonych rezerwacji pozostaną bez
                    zmian.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formularz */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Nazwa
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Czas (min)
              </label>
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cena (zł)
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Opis
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 h-11 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                !form.name.trim() ||
                !form.duration ||
                !form.price ||
                !form.description.trim()
              }
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 h-11 text-sm font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 disabled:opacity-50 transition-all hover:brightness-105"
            >
              {saving && <CircleNotch size={18} className="animate-spin" />}
              Zapisz zmiany
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
