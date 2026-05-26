"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash,
  X,
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";
import RichTextInput from "../lib/RichTextInput";

const ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
};

export default function FeaturesGridBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const [openIconPickerId, setOpenIconPickerId] = useState<string | null>(null);
  const items = content?.items || [];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
        {items.map((item: any, idx: number) => {
          const isPickerOpen = openIconPickerId === item.id;
          const hasSelectedIcon = !!item.icon && ICONS[item.icon];
          const SelectedIcon = hasSelectedIcon ? ICONS[item.icon] : Plus;

          return (
            <div
              key={item.id}
              className="flex flex-col items-start gap-4 p-5 w-full bg-[#287D88] rounded-[20px] shadow-sm relative group/card transition-all"
            >
              <button
                onClick={() =>
                  onChange({
                    items: items.filter((_: any, i: number) => i !== idx),
                  })
                }
                className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer z-10"
                title="Usuń kartę"
              >
                <Trash size={14} weight="bold" />
              </button>
              <button
                onClick={() =>
                  setOpenIconPickerId(isPickerOpen ? null : item.id)
                }
                className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all cursor-pointer border-2 ${hasSelectedIcon ? "bg-white/10 border-transparent hover:bg-white/20" : "bg-transparent border-dashed border-white/50 hover:border-white hover:bg-white/10"}`}
                title="Zmień ikonę"
              >
                <SelectedIcon
                  size={24}
                  weight={hasSelectedIcon ? "duotone" : "bold"}
                  className="text-white"
                />
              </button>

              {isPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute top-[75px] left-5 z-50 w-[260px] bg-white p-4 rounded-2xl shadow-xl border border-gray-100 origin-top-left"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Wybierz ikonę
                    </span>
                    <button
                      onClick={() => setOpenIconPickerId(null)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ICONS).map(([key, IconComp]) => {
                      const isActive = item.icon === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            const newItems = [...items];
                            newItems[idx].icon = key;
                            onChange({ items: newItems });
                            setOpenIconPickerId(null);
                          }}
                          className={`p-2 rounded-xl cursor-pointer transition-all ${isActive ? "bg-[#287D88] text-white shadow-md scale-110" : "text-gray-500 hover:bg-gray-100 hover:text-[#0B3B4C]"}`}
                          title={key}
                        >
                          <IconComp
                            size={22}
                            weight={isActive ? "fill" : "duotone"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              <div className="w-full mt-1">
                <RichTextInput
                  value={item.text || ""}
                  onChange={(newHtml) => {
                    const newItems = [...items];
                    newItems[idx].text = newHtml;
                    onChange({ items: newItems });
                  }}
                  className="text-white font-montserrat font-medium text-[14px] leading-relaxed placeholder:text-white/40"
                />
              </div>
            </div>
          );
        })}
        <button
          onClick={() => {
            const newItemId = crypto.randomUUID();
            onChange({
              items: [
                ...items,
                { id: newItemId, text: "<p>Nowa zaleta</p>", icon: "" },
              ],
            });
            setOpenIconPickerId(newItemId);
          }}
          className="flex flex-col items-center justify-center gap-4 p-5 w-full bg-[#287D88]/5 border-2 border-dashed border-[#287D88]/30 rounded-[20px] transition-all hover:bg-[#287D88]/10 hover:border-[#287D88]/60 cursor-pointer min-h-[160px] group/ghost"
        >
          <div className="w-14 h-14 flex items-center justify-center bg-[#287D88]/10 group-hover:bg-[#287D88]/20 transition-colors rounded-full text-[#287D88]/60 group-hover:text-[#287D88]">
            <Plus size={28} weight="bold" />
          </div>
          <span className="font-montserrat font-bold text-[14px] text-[#287D88]/60 group-hover:text-[#287D88] transition-colors">
            Dodaj kolejną kartę
          </span>
        </button>
      </div>
    </div>
  );
}
