"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ImageSquare,
  X,
  MagnifyingGlass,
  Check,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import DraggablePricingItem from "./DraggablePricingItem";
import { safeUuid } from "@/lib/utils";
import Portal from "@/components/ui/Portal";

export default function PricingListBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const priceItems = content?.items || [];
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingSelectedDbIds, setPendingSelectedDbIds] = useState<string[]>(
    [],
  );

  const openServicePicker = async () => {
    setPendingSelectedDbIds(
      priceItems.map((item: any) => item.originalId).filter(Boolean),
    );
    setQuery("");
    setIsServicePickerOpen(true);
    if (!servicesLoaded) {
      try {
        // Globalna baza usług = katalog ∪ usługi ze wszystkich wyjazdów
        // (agregowane po stronie /api/admin/uslugi) — komplet z opisem i zdjęciem.
        const res = await fetch("/api/admin/uslugi");
        if (res.ok) {
          const data = await res.json();
          setDbServices(Array.isArray(data) ? data : (data.services ?? []));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setServicesLoaded(true);
      }
    }
  };

  // Esc zamyka modal wyboru z bazy.
  useEffect(() => {
    if (!isServicePickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsServicePickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isServicePickerOpen]);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dbServices;
    return dbServices.filter((s) =>
      `${s.name ?? ""}`.toLowerCase().includes(q),
    );
  }, [dbServices, query]);

  const toggleDbId = (id: string, checked: boolean) =>
    setPendingSelectedDbIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const confirmDbServicesSelection = () => {
    const manualItems = priceItems.filter((item: any) => !item.originalId);
    const newDbItems = pendingSelectedDbIds.map((dbId) => {
      const existing = priceItems.find((item: any) => item.originalId === dbId);
      const dbRef = dbServices.find((s) => s.id === dbId);
      // Brak referencji (np. usługa usunięta z katalogu) — zachowaj istniejącą kopię.
      if (!dbRef) return existing;
      // Zawsze odświeżamy WSZYSTKIE pola z bazy (tytuł, opis, cena, czas, zdjęcie),
      // zachowując tylko lokalne id pozycji. Dzięki temu re-wybór nie gubi danych.
      return {
        id: existing?.id ?? safeUuid(),
        originalId: dbRef.id,
        name: dbRef.name,
        duration: dbRef.duration?.toString() || "",
        price: dbRef.price?.toString() || "",
        description: dbRef.description ?? "",
        image: dbRef.image ?? null,
      };
    });
    onChange({ items: [...manualItems, ...newDbItems] });
    setIsServicePickerOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <Reorder.Group
        axis="y"
        values={priceItems}
        onReorder={(items) => onChange({ items })}
        className="flex flex-col gap-2 w-full"
      >
        {priceItems.map((item: any, idx: number) => (
          <DraggablePricingItem
            key={item.id}
            item={item}
            onUpdate={(updatedItem: any) => {
              const newItems = [...priceItems];
              newItems[idx] = updatedItem;
              onChange({ items: newItems });
            }}
            onRemove={() =>
              onChange({
                items: priceItems.filter((_: any, i: number) => i !== idx),
              })
            }
            onMoveUp={() => {
              if (idx === 0) return;
              const next = [...priceItems];
              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
              onChange({ items: next });
            }}
            onMoveDown={() => {
              if (idx === priceItems.length - 1) return;
              const next = [...priceItems];
              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
              onChange({ items: next });
            }}
          />
        ))}
      </Reorder.Group>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <button
          onClick={() =>
            onChange({
              items: [
                ...priceItems,
                {
                  id: safeUuid(),
                  name: "",
                  duration: "",
                  price: "",
                  description: "",
                  image: null,
                },
              ],
            })
          }
          className="flex items-center cursor-pointer justify-center gap-2 flex-1 p-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[20px] hover:bg-gray-100 hover:border-[#287D88]/30 transition-colors text-gray-500 hover:text-[#287D88] font-montserrat text-sm font-semibold"
        >
          <Plus size={18} weight="bold" /> Dodaj pustą usługę
        </button>
        <button
          onClick={openServicePicker}
          className="flex cursor-pointer items-center justify-center gap-2 flex-1 p-3.5 rounded-[20px] transition-all font-montserrat text-sm font-semibold border bg-white text-[#287D88] border-[#287D88]/30 hover:bg-[#287D88]/5 hover:border-[#287D88]"
        >
          <Storefront size={18} weight="duotone" /> Wybierz z bazy
        </button>
      </div>

      {/* MODAL PEŁNOEKRANOWY: wybór usług z bazy (przez portal — nad sidebarem) */}
      <Portal>
        <AnimatePresence>
          {isServicePickerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsServicePickerOpen(false)}
                className="fixed inset-0 z-[400] bg-brand-secondary/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-[401] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b border-gray-100 shrink-0">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                        Cennik
                      </p>
                      <h3 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#0B3B4C] leading-tight mt-0.5">
                        Wybierz usługi z bazy
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsServicePickerOpen(false)}
                      aria-label="Zamknij"
                      className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#0B3B4C] transition shrink-0"
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-5 sm:px-7 pt-4 pb-3 shrink-0">
                    <div className="relative">
                      <MagnifyingGlass
                        size={18}
                        weight="bold"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Szukaj usługi..."
                        className="w-full h-12 pl-11 pr-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] font-montserrat text-[#0B3B4C] placeholder:text-gray-400 focus:outline-none focus:border-[#287D88] focus:ring-2 focus:ring-[#287D88]/20 transition"
                      />
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-4 custom-scrollbar">
                    {!servicesLoaded ? (
                      <p className="text-sm text-gray-400 italic py-8 text-center">
                        Ładowanie z bazy...
                      </p>
                    ) : filteredServices.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-8 text-center">
                        {dbServices.length === 0
                          ? "Brak usług w bazie. Dodaj usługi w sklepie wyjazdu lub w katalogu."
                          : "Brak usług pasujących do wyszukiwania."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
                        {filteredServices.map((dbService) => {
                          const isChecked = pendingSelectedDbIds.includes(
                            dbService.id,
                          );
                          return (
                            <label
                              key={dbService.id}
                              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors border ${isChecked ? "bg-[#287D88]/5 border-[#287D88]/40" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? "bg-[#287D88] border-[#287D88]" : "bg-white border-gray-300"}`}
                              >
                                {isChecked && (
                                  <Check
                                    size={14}
                                    weight="bold"
                                    className="text-white"
                                  />
                                )}
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  toggleDbId(dbService.id, e.target.checked)
                                }
                                className="sr-only"
                              />
                              {dbService.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={dbService.image}
                                  alt=""
                                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-300">
                                  <ImageSquare size={20} weight="duotone" />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-montserrat text-sm font-bold text-[#0B3B4C] truncate">
                                  {dbService.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {dbService.duration} min • {dbService.price} zł
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0"
                    style={{
                      paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
                    }}
                  >
                    <span className="text-[12px] font-montserrat font-semibold text-gray-500">
                      Wybrano: {pendingSelectedDbIds.length}
                    </span>
                    <button
                      onClick={confirmDbServicesSelection}
                      className="bg-[#287D88] hover:bg-[#1f626a] text-white font-montserrat font-bold text-sm px-6 py-3 rounded-2xl transition-colors shadow-sm"
                    >
                      Zatwierdź wybrane
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
