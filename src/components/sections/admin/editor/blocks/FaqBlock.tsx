"use client";
import React, { useState } from "react";
import { Reorder } from "framer-motion";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import DraggableFaqItem from "./DraggableFaqItem";

export default function FaqBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const faqItems = content?.items || [];

  return (
    <div className="w-full flex flex-col bg-white">
      <div className="w-full max-w-[900px] flex flex-col mx-auto">
        <Reorder.Group
          axis="y"
          values={faqItems}
          onReorder={(items) => onChange({ items })}
          className="flex flex-col w-full"
        >
          {faqItems.map((item: any, idx: number) => (
            <DraggableFaqItem
              key={item.id}
              index={idx}
              item={item}
              isOpen={openFaqIndex === idx}
              onToggle={() =>
                setOpenFaqIndex(openFaqIndex === idx ? null : idx)
              }
              onUpdate={(updatedItem: any) => {
                const newItems = [...faqItems];
                newItems[idx] = updatedItem;
                onChange({ items: newItems });
              }}
              onRemove={() =>
                onChange({
                  items: faqItems.filter((_: any, i: number) => i !== idx),
                })
              }
            />
          ))}
        </Reorder.Group>
        <button
          onClick={() => {
            const newItems = [
              ...faqItems,
              { id: crypto.randomUUID(), question: "", answer: "" },
            ];
            onChange({ items: newItems });
            setOpenFaqIndex(newItems.length - 1);
          }}
          className="flex items-center justify-center gap-3 w-full p-4 mt-6 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl opacity-60 hover:opacity-100 hover:bg-gray-50 hover:border-[#287D88]/50 transition-all group/add cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover/add:bg-white shadow-sm transition-colors text-gray-400 group-hover/add:text-[#287D88]">
            <Plus size={18} weight="bold" />
          </div>
          <span className="font-montserrat font-semibold text-sm text-gray-500 group-hover/add:text-[#287D88] transition-colors">
            Dodaj kolejne pytanie
          </span>
        </button>
      </div>
    </div>
  );
}
