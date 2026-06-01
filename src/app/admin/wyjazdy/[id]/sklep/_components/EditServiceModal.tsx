"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  CircleNotch,
  Warning,
  House,
  Globe,
  Image as ImageIcon,
  UploadSimple,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { uploadServiceImage, type CampService } from "./types";

export type EditScope = "camp" | "global";

export interface EditServicePayload {
  name: string;
  duration: string;
  price: string;
  description: string;
  image: string | null;
}

export function EditServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: CampService;
  onClose: () => void;
  onSave: (scope: EditScope, payload: EditServicePayload) => Promise<boolean>;
}) {
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<EditScope>("camp");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: service.name,
    duration: String(service.duration),
    price: String(service.price),
    description: service.description ?? "",
  });
  const [image, setImage] = useState<string | null>(service.image ?? null);

  const canGlobal = service.isLinked;

  useEffect(() => setMounted(true), []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadServiceImage(file);
    setUploading(false);
    if (url) setImage(url);
    else toast.error("Nie udało się przesłać zdjęcia.");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.duration || !form.price) return;
    setSaving(true);
    try {
      const ok = await onSave(scope, { ...form, image });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-auto rounded-3xl rounded-tr-none border border-white/60 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl"
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
              <House size={16} weight="bold" /> Tylko ten wyjazd
            </button>
            <button
              type="button"
              onClick={() => canGlobal && setScope("global")}
              disabled={!canGlobal}
              title={
                canGlobal
                  ? "Zmieni usługę w katalogu i wszystkich powiązanych wyjazdach"
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
                      {service.linkedCampsCount === 1 ? "wyjeździe" : "wyjazdach"}
                    </strong>
                    , które ją mają. Ceny już złożonych rezerwacji pozostaną bez
                    zmian.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Górny rząd: zdjęcie + podstawowe pola */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Zdjęcie */}
            <div className="shrink-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Zdjęcie
              </label>
              <div className="mt-1 relative w-full sm:w-32 h-32 rounded-2xl rounded-tr-none overflow-hidden border border-slate-200 bg-slate-50 group">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Podgląd"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow-sm hover:bg-white"
                      title="Usuń zdjęcie"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                  >
                    {uploading ? (
                      <CircleNotch size={22} className="animate-spin" />
                    ) : (
                      <ImageIcon size={24} weight="duotone" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      {uploading ? "Wysyłanie" : "Dodaj"}
                    </span>
                  </button>
                )}
              </div>
              {image && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-primary hover:underline"
                >
                  <UploadSimple size={13} weight="bold" /> Zmień
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {/* Nazwa / czas / cena */}
            <div className="flex-1 grid grid-cols-2 gap-3 content-start">
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
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
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
            </div>
          </div>

          {/* Opis (duży na desktop) */}
          <div className="mt-4">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Opis
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={6}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand-primary resize-y min-h-[140px] lg:min-h-[240px]"
            />
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
                uploading ||
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
    </AnimatePresence>,
    document.body,
  );
}
