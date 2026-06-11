"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Reorder, useDragControls } from "framer-motion";
import {
  Trash,
  List,
  ImageSquare,
  X,
  Pencil,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Clock } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/ToolTip";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";

interface DraggablePricingItemProps {
  item: any;
  onUpdate: (updatedItem: any) => void;
  onRemove: () => void;
}

export default function DraggablePricingItem({
  item,
  onUpdate,
  onRemove,
}: DraggablePricingItemProps) {
  const dragControls = useDragControls();
  // Zdjęcie usługi wybieramy tak jak wszędzie — przez wspólny picker
  // (Pexels + własny upload). Picker sam wgrywa plik do magazynu i zwraca URL.
  const [pickerOpen, setPickerOpen] = useState(false);

  const description = item.description ?? "";
  const hasDescription = description.trim().length > 0;

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      // tabIndex: tapnięcie karty usługi fokusuje ją i — przez group-focus-within
      // — pokazuje przybornik (przeciągnij / usuń) na mobile.
      tabIndex={0}
      className="relative flex flex-col gap-4 p-5 md:p-6 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88] group/price transition-colors duration-300 w-full bg-white focus:outline-none"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[24px]" />

      {/* MINI TOOLBAR */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1 opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100 transition-opacity bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-1 rounded-xl">
        <Tooltip content="Przeciągnij by zmienić kolejność" position="left">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors"
          >
            <List size={18} weight="bold" />
          </div>
        </Tooltip>
        <div className="w-5 h-px bg-gray-200 my-0.5" />
        <Tooltip content="Usuń usługę" position="left">
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={18} weight="bold" />
          </button>
        </Tooltip>
      </div>

      {/* GÓRNY WIERSZ — NAZWA / CZAS / CENA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex flex-col gap-1.5 w-full sm:w-2/3 pr-2 sm:pr-8">
          <input
            type="text"
            value={item.name || ""}
            onChange={(e) => onUpdate({ ...item, name: e.target.value })}
            className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C] bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-full placeholder:text-gray-300 pb-0.5 transition-colors"
            placeholder="Nazwa usługi"
          />
          <div className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
            <Clock size={16} weight="duotone" className="text-[#287D88]" />
            <input
              type="number"
              value={item.duration || ""}
              onChange={(e) => onUpdate({ ...item, duration: e.target.value })}
              className="w-12 bg-transparent outline-none border-b border-transparent focus:border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300 text-center transition-colors"
              placeholder="Czas"
            />
            <span>minut</span>
          </div>
        </div>

        <div className="flex items-center justify-start sm:justify-end w-full sm:w-1/3 pr-20 sm:pr-14">
          <input
            type="number"
            value={item.price || ""}
            onChange={(e) => onUpdate({ ...item, price: e.target.value })}
            className="w-20 text-left sm:text-right font-montserrat font-bold text-xl md:text-2xl text-[#287D88] bg-transparent outline-none border-b border-transparent focus:border-[#287D88]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[#287D88]/40 transition-colors"
            placeholder="0"
          />
          <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88] ml-1">
            zł
          </span>
        </div>
      </div>

      {/* DOLNY WIERSZ — OPIS + ZDJĘCIE */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4 relative z-10">
        {/* OPIS (wymagany) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 font-montserrat text-[11px] font-bold uppercase tracking-wide text-[#0B3B4C]/70">
            Opis usługi
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) =>
              onUpdate({ ...item, description: e.target.value })
            }
            placeholder="Krótko opisz, czego uczestniczka może się spodziewać po tej usłudze..."
            rows={3}
            className={`w-full px-3 py-2.5 font-montserrat text-sm leading-relaxed text-[#0B3B4C] bg-gray-50/60 border-2 rounded-[14px] resize-y focus:outline-none focus:bg-white focus:border-[#287D88]/40 transition-all placeholder:text-gray-400 ${
              hasDescription
                ? "border-gray-100"
                : "border-rose-200/70"
            }`}
          />
          {!hasDescription && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
              <WarningCircle size={12} weight="fill" />
              Opis jest wymagany
            </span>
          )}
        </div>

        {/* ZDJĘCIE (opcjonalne) — wybierane przez wspólny picker (Pexels + upload) */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 font-montserrat text-[11px] font-bold uppercase tracking-wide text-[#0B3B4C]/70">
            Zdjęcie
            <span className="text-gray-400 font-medium normal-case tracking-normal">
              (opcjonalne)
            </span>
          </label>

          {item.image ? (
            <div className="relative h-[100px] w-full rounded-[14px] overflow-hidden border border-gray-100 group/img">
              <Image
                src={item.image}
                alt={item.name || "Zdjęcie usługi"}
                fill
                sizes="180px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#0B3B4C] hover:bg-white transition"
                  title="Zmień zdjęcie"
                >
                  <Pencil size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, image: null })}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-rose-500 hover:bg-white transition"
                  title="Usuń zdjęcie"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-[100px] w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-[14px] text-gray-400 hover:text-[#287D88] hover:border-[#287D88]/40 hover:bg-[#287D88]/5 transition-colors text-xs font-semibold"
            >
              <ImageSquare size={22} weight="duotone" />
              <span>Dodaj zdjęcie</span>
            </button>
          )}
        </div>
      </div>

      <BlogCoverPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onUpdate({ ...item, image: url });
          setPickerOpen(false);
        }}
        defaultQuery={item.name || "spa masaż wellness"}
        heading="Zdjęcie usługi"
        subheading="Wybierz zdjęcie z Pexels albo wgraj własne — trafi prosto do naszego magazynu."
      />
    </Reorder.Item>
  );
}
