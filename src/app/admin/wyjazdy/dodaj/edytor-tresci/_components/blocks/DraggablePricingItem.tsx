"use client";

import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Trash, List } from "@phosphor-icons/react/dist/ssr";
import { Clock } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/ToolTip";

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

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88] group/price transition-colors duration-300 w-full bg-white"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* MINI TOOLBAR */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1 opacity-0 group-hover/price:opacity-100 transition-opacity bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-1 rounded-xl">
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

      {/* ZAWARTOSĆ KARTY (LEWA STRONA) */}
      <div className="relative z-10 flex flex-col gap-1.5 w-full sm:w-2/3 pr-2 sm:pr-8">
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

      {/* ZAWARTOSĆ KARTY (PRAWA STRONA - CENA) */}
      <div className="relative z-10 mt-3 sm:mt-0 flex items-center justify-start sm:justify-end w-full sm:w-1/3 pr-20 sm:pr-14">
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
    </Reorder.Item>
  );
}
