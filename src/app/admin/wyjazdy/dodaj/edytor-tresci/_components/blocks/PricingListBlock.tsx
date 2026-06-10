"use client";
import React, { useState } from "react";
import { Reorder, motion } from "framer-motion";
import { Plus, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import DraggablePricingItem from "./DraggablePricingItem";
import { safeUuid } from "@/lib/utils";

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
  const [pendingSelectedDbIds, setPendingSelectedDbIds] = useState<string[]>(
    [],
  );

  const loadServicesFromDb = async () => {
    if (!isServicePickerOpen) {
      setPendingSelectedDbIds(
        priceItems.map((item: any) => item.originalId).filter(Boolean),
      );
    }
    setIsServicePickerOpen((prev) => !prev);
    if (dbServices.length === 0) {
      try {
        const res = await fetch("/api/admin/uslugi");
        if (res.ok) setDbServices(await res.json());
      } catch (error) {
        console.error(error);
      }
    }
  };

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
          />
        ))}
      </Reorder.Group>

      <div className="relative flex flex-col sm:flex-row gap-3 mt-2">
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
          onClick={loadServicesFromDb}
          className={`flex cursor-pointer items-center justify-center gap-2 flex-1 p-3.5 rounded-[20px] transition-all font-montserrat text-sm font-semibold border ${isServicePickerOpen ? "bg-[#287D88] text-white border-[#287D88] shadow-md" : "bg-white text-[#287D88] border-[#287D88]/30 hover:bg-[#287D88]/5 hover:border-[#287D88]"}`}
        >
          Wybierz z bazy
        </button>

        {isServicePickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full right-0 mt-3 z-50 w-full sm:w-[340px] bg-white border border-gray-100 rounded-[24px] shadow-xl p-5 origin-top-right flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {dbServices.length === 0 ? (
                <span className="text-sm text-gray-400 italic py-2">
                  Ładowanie z bazy...
                </span>
              ) : (
                dbServices.map((dbService) => {
                  const isChecked = pendingSelectedDbIds.includes(dbService.id);
                  return (
                    <label
                      key={dbService.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors group border border-transparent ${isChecked ? "bg-[#287D88]/5 border-[#287D88]/20" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setPendingSelectedDbIds((prev) =>
                            e.target.checked
                              ? [...prev, dbService.id]
                              : prev.filter((id) => id !== dbService.id),
                          )
                        }
                        className="w-5 h-5 cursor-pointer accent-[#287D88]"
                      />
                      {dbService.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dbService.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-300">
                          <ImageSquare size={18} weight="duotone" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-montserrat text-sm font-bold text-[#0B3B4C] truncate">
                          {dbService.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {dbService.duration} min • {dbService.price} zł
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <button
              onClick={confirmDbServicesSelection}
              className="w-full bg-[#287D88] hover:bg-[#1f626a] text-white font-montserrat font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
            >
              Zatwierdź wybrane
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
