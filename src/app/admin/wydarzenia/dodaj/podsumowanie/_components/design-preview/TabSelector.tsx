"use client";

import React from "react";
import { Browser, Cards, TextAlignLeft } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

export type TabType = "strona_glowna" | "karta" | "opis";

export const DESIGN_TABS = [
  { id: "strona_glowna", label: "Strona główna", icon: Browser },
  { id: "karta", label: "Karta w liście wydarzeń", icon: Cards },
  { id: "opis", label: "Strona wydarzenia (Pełny Opis)", icon: TextAlignLeft },
] as const;

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabSelector({
  activeTab,
  onTabChange,
}: TabSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-6 border-b border-gray-100 w-full overflow-x-auto no-scrollbar pb-1">
      {DESIGN_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`relative flex items-center gap-2 pb-2 px-1 font-montserrat text-[14px] whitespace-nowrap transition-colors duration-200 ${
              isActive
                ? "text-brand-primary font-semibold"
                : "text-gray-400 hover:text-brand-primary font-medium"
            }`}
          >
            <Icon size={18} weight={isActive ? "fill" : "regular"} />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="designTabUnderline"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-6 bg-brand-primary rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
