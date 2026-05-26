import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour,
  X,
  Browser,
  Cards,
  Article,
} from "@phosphor-icons/react/dist/ssr";

export type CampViewMode = "home_section" | "card" | "description";

export interface AdminViewToolbarProps {
  viewMode: CampViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<CampViewMode>>;
}

export default function ToolBar({
  viewMode,
  setViewMode,
}: AdminViewToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // ZMIANA: Zmienione "fixed top-6 left-6" na "relative"
    <div className="relative z-50 flex items-center gap-3">
      {/* GŁÓWNA IKONA ROZWIJAJĄCA */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-[#287D88] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#1f636c] transition-transform duration-300 hover:scale-105 cursor-pointer z-10"
      >
        {isOpen ? (
          <X size={24} weight="bold" />
        ) : (
          <SquaresFour size={24} weight="duotone" />
        )}
      </button>

      {/* ROZWIJANE MENU WIDOKÓW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-gray-200"
          >
            <TooltipButton
              icon={
                <Browser
                  size={22}
                  weight={viewMode === "home_section" ? "fill" : "duotone"}
                />
              }
              tooltip="Sekcja na stronie głównej"
              isActive={viewMode === "home_section"}
              onClick={() => setViewMode("home_section")}
            />
            <div className="w-px h-6 bg-gray-200" />
            <TooltipButton
              icon={
                <Cards
                  size={22}
                  weight={viewMode === "card" ? "fill" : "duotone"}
                />
              }
              tooltip="Karta wyjazdu"
              isActive={viewMode === "card"}
              onClick={() => setViewMode("card")}
            />
            <div className="w-px h-6 bg-gray-200" />
            <TooltipButton
              icon={
                <Article
                  size={22}
                  weight={viewMode === "description" ? "fill" : "duotone"}
                />
              }
              tooltip="Opis wyjazdu"
              isActive={viewMode === "description"}
              onClick={() => setViewMode("description")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-komponent dla czytelności kodu (DRY)
function TooltipButton({ icon, tooltip, isActive, onClick }: any) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
          isActive
            ? "bg-[#EBF4F5] text-[#287D88]"
            : "text-gray-500 hover:bg-gray-100 hover:text-[#0B3B4C]"
        }`}
      >
        {icon}
      </button>

      {/* Tooltip CSS (Pojawia się na hover) */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-montserrat font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
        {tooltip}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-gray-800" />
      </div>
    </div>
  );
}
