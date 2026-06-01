"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle,
  Clock,
  Coins,
  CircleNotch,
  MagnifyingGlass,
  Package,
  Image as ImageIcon,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { formatPLN, uploadServiceImage, type CatalogService } from "./types";

export function CatalogPicker({
  catalog,
  onAdd,
  onCreate,
}: {
  catalog: CatalogService[];
  // Dodaje wskazane usługi katalogowe do wyjazdu; zwraca po zakończeniu
  onAdd: (extraServiceIds: string[]) => Promise<void>;
  // Tworzy nową usługę w katalogu globalnym; zwraca id nowej usługi
  onCreate: (payload: {
    name: string;
    duration: string;
    price: string;
    description: string;
    image: string | null;
  }) => Promise<string | null>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    duration: "",
    price: "",
    description: "",
  });
  const [image, setImage] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalog, query]);

  const toggle = (id: string, inCamp: boolean) => {
    if (inCamp) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setIsAdding(true);
    try {
      await onAdd([...selected]);
      setSelected(new Set());
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.duration || !form.price) return;
    setCreating(true);
    try {
      const id = await onCreate({ ...form, image });
      if (id) {
        setForm({ name: "", duration: "", price: "", description: "" });
        setImage(null);
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-3xl rounded-tr-none border border-white/60 bg-white/70 backdrop-blur-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary">
            <Package size={18} weight="bold" />
          </span>
          <div>
            <h2 className="text-base font-bold text-brand-secondary">
              Katalog globalny
            </h2>
            <p className="text-[12px] text-slate-400 font-medium">
              Dodaj usługi z bazy do tego wyjazdu
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-primary/30 bg-white px-4 h-10 text-[13px] font-bold text-brand-primary transition-colors hover:bg-brand-primary/5"
        >
          <Plus size={16} weight="bold" /> Nowa usługa
        </button>
      </div>

      {/* Formularz tworzenia nowej usługi globalnej */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50/80 p-4">
              {/* Zdjęcie usługi */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-2xl rounded-tr-none overflow-hidden border border-slate-200 bg-white shrink-0 group">
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
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow-sm hover:bg-white"
                        title="Usuń zdjęcie"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full h-full flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                    >
                      {uploading ? (
                        <CircleNotch size={20} className="animate-spin" />
                      ) : (
                        <ImageIcon size={22} weight="duotone" />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-[12px] text-slate-400 font-medium">
                  {uploading
                    ? "Wysyłanie zdjęcia..."
                    : "Zdjęcie usługi (opcjonalnie)"}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nazwa usługi"
                className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="Czas (min)"
                inputMode="numeric"
                className="rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Cena (zł)"
                inputMode="decimal"
                className="rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm outline-none focus:border-brand-primary"
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Opis usługi"
                rows={2}
                className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary resize-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  creating ||
                  !form.name.trim() ||
                  !form.duration ||
                  !form.price ||
                  !form.description.trim()
                }
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 h-10 text-[13px] font-bold text-white disabled:opacity-50 transition-all hover:brightness-105"
              >
                {creating ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} weight="bold" />
                )}
                Zapisz w katalogu i dodaj do wyjazdu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wyszukiwarka */}
      <div className="relative mb-3">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj usługi..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 h-10 text-sm outline-none focus:border-brand-primary"
        />
      </div>

      {/* Lista katalogu */}
      <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400 italic">
            {catalog.length === 0
              ? "Katalog jest pusty — dodaj pierwszą usługę."
              : "Brak wyników."}
          </p>
        ) : (
          filtered.map((c) => {
            const checked = selected.has(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggle(c.id, c.inCamp)}
                disabled={c.inCamp}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  c.inCamp
                    ? "border-transparent bg-emerald-50/60 cursor-default"
                    : checked
                      ? "border-brand-primary/30 bg-brand-primary/5"
                      : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${
                    c.inCamp
                      ? "border-emerald-400 bg-emerald-400 text-white"
                      : checked
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-slate-300 bg-white"
                  }`}
                >
                  {(c.inCamp || checked) && (
                    <CheckCircle size={14} weight="fill" />
                  )}
                </span>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-xl rounded-tr-none object-cover shrink-0 border border-white shadow-sm"
                  />
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary shrink-0">
                    <ImageIcon size={18} weight="duotone" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-secondary truncate">
                    {c.name}
                  </p>
                  <div className="flex items-center gap-3 text-[12px] text-slate-400 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} weight="bold" /> {c.duration} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Coins size={12} weight="bold" /> {formatPLN(c.price)}
                    </span>
                  </div>
                </div>
                {c.inCamp && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    W wyjeździe
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {selected.size > 0 && (
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 h-11 text-sm font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 disabled:opacity-50 transition-all hover:brightness-105"
        >
          {isAdding ? (
            <CircleNotch size={18} className="animate-spin" />
          ) : (
            <Plus size={18} weight="bold" />
          )}
          Dodaj zaznaczone ({selected.size}) do wyjazdu
        </button>
      )}
    </div>
  );
}
