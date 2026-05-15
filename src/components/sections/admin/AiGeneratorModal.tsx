"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Sparkle, CaretDown, Check } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface AiGeneratedData {
  title: string;
  location: string;
  capacity: string;
  price?: string;
  deposit?: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, modelType: string) => void;
  prompt: string;
  setPrompt: (val: string) => void;
}

// --- NOWOŚĆ: ROZBUDOWANA LISTA MODELI ---
const AI_MODELS = [
  { id: "gemini-3.1-flash-lite", label: "✨ 3.1 Flash Lite (Najszybszy)" },
  { id: "gemini-3.1-flash", label: "⚡ 3.1 Flash (Główny)" },
  { id: "gemini-3.1-pro", label: "🧠 3.1 Pro (Najmądrzejszy)" },
  { id: "gemini-2.5-flash", label: "🔋 2.5 Flash (Zapasowy)" },
  { id: "gemini-2.5-pro", label: "🛠️ 2.5 Pro (Zapasowy PRO)" },
];

export default function AiGeneratorModal({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  setPrompt,
}: AiGeneratorModalProps) {
  // Domyślnie Flash Lite (pierwszy element z listy)
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleGenerateClick = () => {
    if (!prompt.trim()) return;
    onSubmit(prompt, selectedModel);
  };

  // Zamykanie dropdowna po kliknięciu poza niego
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const activeModelLabel = AI_MODELS.find((m) => m.id === selectedModel)?.label;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B3B4C]/40 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-lg rounded-[24px] p-6 md:p-8 shadow-2xl relative"
          >
            {/* PRZYCISK ZAMKNIĘCIA */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>

            {/* HEADER Z TYTUŁEM I DROPDOWNEM */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Sparkle
                    size={20}
                    weight="fill"
                    className="text-brand-primary"
                  />
                </div>
                <h3 className="text-lg font-jakarta font-bold text-[#0B3B4C]">
                  Asystent AI
                </h3>
              </div>

              {/* CUSTOMOWY DROPDOWN */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[12px] font-semibold py-1.5 pl-3 pr-2.5 rounded-[10px] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {activeModelLabel}
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CaretDown
                      size={14}
                      weight="bold"
                      className="text-gray-400"
                    />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      // Dodano min-w-[200px] i zmieniono right-0, aby ładnie mieścił dłuższe nazwy
                      className="absolute  right-0 top-full mt-1.5 min-w-[220px] bg-white border border-gray-100 rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden z-50 origin-top-right"
                    >
                      <div className="flex flex-col p-1">
                        {AI_MODELS.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "flex cursor-pointer items-center justify-between w-full text-left px-3 py-2 text-[12px] font-medium rounded-[8px] transition-colors",
                              selectedModel === model.id
                                ? "bg-brand-primary/10 text-brand-primary"
                                : "text-gray-600 hover:bg-gray-50",
                            )}
                          >
                            {model.label}
                            {selectedModel === model.id && (
                              <Check size={14} weight="bold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-montserrat mb-4">
              Opisz swój wyjazd. AI przygotuje dla Ciebie chwytliwy tytuł i
              dopasuje podstawowe informacje, takie jak lokalizacja czy ilość
              miejsc.
            </p>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="np. Weekendowy wyjazd w góry dla 10 kobiet z jogą, winem i masażami w Jarnołtówku..."
                className="w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[16px] p-4 min-h-[120px] font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-none"
              />
              <Sparkle
                size={80}
                weight="fill"
                className="absolute right-4 bottom-4 text-gray-200/50 pointer-events-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-[12px] transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <Button
                onClick={handleGenerateClick}
                disabled={!prompt.trim()}
                rightIcon={
                  <Sparkle size={20} weight="fill" className="text-white" />
                }
              >
                Wygeneruj
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
