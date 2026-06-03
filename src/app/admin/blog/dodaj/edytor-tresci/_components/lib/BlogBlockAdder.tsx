"use client";

import React, { useState } from "react";
import {
  Plus, TextH, TextAa, Star, X, Question,
  ArrowsOutLineVertical, YoutubeLogo, Image as ImageIcon,
  ListBullets, Cards, Table as TableIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Question as QuestionIcon } from "@phosphor-icons/react";
import { BlogBlockType } from "../hooks/useBlogAiGenerator";
import { Tooltip } from "@/components/ui/ToolTip";

interface BlogBlockAdderProps {
  onAddBlock: (type: BlogBlockType) => void;
}

export default function BlogBlockAdder({ onAddBlock }: BlogBlockAdderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const blockOptions: { type: BlogBlockType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: "heading",      label: "Nagłówek",       desc: "Duży tytuł sekcji",           icon: <TextH size={20} /> },
    { type: "paragraph",    label: "Akapit tekstu",  desc: "Zwykły blok tekstowy",         icon: <TextAa size={20} /> },
    { type: "highlight",    label: "Wyróżnik",       desc: "Cytat lub mocna myśl",         icon: <Star size={20} /> },
    { type: "bulletList",   label: "Lista punktowana", desc: "Lista z ikonką ptaszka",    icon: <ListBullets size={20} /> },
    { type: "featuresGrid", label: "Karty zalet",    desc: "Siatka kart z ikonkami",      icon: <Cards size={20} /> },
    { type: "table",        label: "Tabela",          desc: "Zestawienie / porównanie (lubi je AI)", icon: <TableIcon size={20} /> },
    { type: "faq",          label: "FAQ",             desc: "Pytania i odpowiedzi",        icon: <QuestionIcon size={20} /> },
    { type: "inlineImage",  label: "Zdjęcie",        desc: "Obrazek w treści artykułu",   icon: <ImageIcon size={20} /> },
    { type: "videoEmbed",   label: "Wideo",          desc: "Odtwarzacz YouTube",          icon: <YoutubeLogo size={20} /> },
    { type: "spacer",       label: "Przerwa",        desc: "Pusty odstęp między blokami", icon: <ArrowsOutLineVertical size={20} /> },
  ];

  const handleSelect = (type: BlogBlockType) => {
    onAddBlock(type);
    setIsOpen(false);
  };

  return (
    <div className="w-full mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[16px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
            <Plus size={18} weight="bold" />
          </div>
          <span className="font-montserrat font-medium text-sm">Kliknij, aby dodać element</span>
        </button>
      ) : (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-[16px] p-4 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">
              Wybierz rodzaj elementu
            </span>
            <div className="flex items-center gap-1">
              <Tooltip content="Dodawaj elementy jeden pod drugim. Użyj 'Przerwa' aby oddzielić sekcje." position="top">
                <button className="text-brand-primary hover:text-[#0B3B4C] p-1 rounded-md hover:bg-brand-primary/10 transition-colors cursor-help">
                  <Question size={18} weight="bold" />
                </button>
              </Tooltip>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {blockOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleSelect(opt.type)}
                className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-[12px] hover:border-brand-primary hover:shadow-md transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                  {opt.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-montserrat font-semibold text-sm text-[#0B3B4C] mb-0.5">{opt.label}</span>
                  <span className="text-[11px] text-gray-400">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
