"use client";

import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Trash, Plus, Minus, List } from "@phosphor-icons/react/dist/ssr";
import { Tooltip } from "@/components/ui/ToolTip";
import RichTextInput from "../lib/RichTextInput";

interface DraggableFaqItemProps {
  item: any;
  index: number;
  onUpdate: (updatedItem: any) => void;
  onRemove: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function DraggableFaqItem({
  item,
  index,
  onUpdate,
  onRemove,
  isOpen,
  onToggle,
}: DraggableFaqItemProps) {
  const dragControls = useDragControls();
  const formattedNumber = String(index + 1).padStart(2, "0");

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className={`relative flex flex-col min-[600px]:flex-row min-[600px]:items-start gap-4 min-[600px]:gap-10 py-6 md:py-10 border-b border-[#0B3B4C]/20 group/faq transition-colors w-full bg-white ${
        index === 0 ? "border-t" : ""
      }`}
    >
      {/* MINI TOOLBAR */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/faq:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm">
        <Tooltip content="Przeciągnij by zmienić kolejność" position="top">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors"
          >
            <List size={16} weight="bold" />
          </div>
        </Tooltip>
        <div className="w-px h-3 bg-gray-200 mx-0.5" />
        <Tooltip content="Usuń pytanie" position="top">
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={16} weight="bold" />
          </button>
        </Tooltip>
      </div>

      {/* 1. GÓRNY PASEK NA MOBILE / LEWA KOLUMNA NA DESKTOP */}
      <div className="flex justify-between items-center w-full min-[600px]:w-auto">
        <div className="font-jakarta font-bold text-[40px] min-[600px]:text-[48px] min-[600px]:self-center leading-none text-[#0B3B4C] min-[600px]:mt-1">
          {formattedNumber}
        </div>
        <button
          onClick={onToggle}
          className="min-[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out"
        >
          <div
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            {isOpen ? (
              <Minus size={18} weight="bold" />
            ) : (
              <Plus size={18} weight="bold" />
            )}
          </div>
        </button>
      </div>

      {/* 2. TREŚĆ (Pytanie + Odpowiedź) */}
      <div className="flex-1 flex flex-col w-full pr-0 md:pr-4">
        <textarea
          value={item.question || ""}
          onChange={(e) => onUpdate({ ...item, question: e.target.value })}
          rows={1}
          className={`font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] transition-all duration-300 outline-none resize-none overflow-hidden w-full placeholder:text-gray-400 bg-gray-50/80 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus:bg-white focus:border-[#287D88]/30 rounded-xl px-4 py-3 ${
            isOpen
              ? "text-[#287D88]"
              : "text-[#0B3B4C] group-hover/faq:text-[#287D88]"
          }`}
          placeholder="Wpisz tutaj swoje pytanie..."
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = "0px";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="w-full bg-gray-50/80 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus-within:bg-white focus-within:border-[#287D88]/30 rounded-xl px-4 py-3 transition-all duration-300">
              <RichTextInput
                value={item.answer || ""}
                onChange={(newHtml) => onUpdate({ ...item, answer: newHtml })}
                className="font-montserrat text-[#0B3B4C]/80 text-[14px] md:text-[15px] leading-[170%] min-h-[40px] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRZYCISK DESKTOP */}
      <button
        onClick={onToggle}
        className="hidden min-[600px]:flex w-10 h-10 self-start shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out mt-1 hover:scale-105 cursor-pointer"
      >
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          {isOpen ? (
            <Minus size={18} weight="bold" />
          ) : (
            <Plus size={18} weight="bold" />
          )}
        </div>
      </button>
    </Reorder.Item>
  );
}
