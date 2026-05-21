"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Sparkle, CaretDown, Check } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface AiGeneratedData {
  title?: string;
  description?: string;
  locationName?: string;
  locationCity?: string;
  capacity?: string;
  price?: string;
  deposit?: string;
  startDate?: string;
  endDate?: string;
  allowBringFriend?: boolean; // <--- DODAJ TO
}

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, modelType: string) => void;
  prompt: string;
  setPrompt: (val: string) => void;
  description?: string;
  placeholder?: string;
}

const AI_MODELS = [
  // Najbezpieczniejszy i główny model - zawsze celuje w najnowszą, stabilną wersję Flash
  { id: "gemini-flash-latest", label: "⚡ Flash Latest (Zalecany)" },

  // Najlżejszy model z najnowszej generacji 3.1 - błyskawiczny i zużywa mało limitu
  { id: "gemini-3.1-flash-lite", label: "✨ 3.1 Flash Lite (Najszybszy)" },

  // Solidna alternatywa, gdyby nowsze wersje miały czkawkę
  { id: "gemini-2.5-flash", label: "🔋 2.5 Flash (Stabilny)" },
];

export default function AiGeneratorModal({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  setPrompt,
  description,
  placeholder,
}: AiGeneratorModalProps) {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- NOWOŚĆ: Stan kontrolujący ekran ładowania wewnątrz modala ---
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);

  const handleGenerateClick = () => {
    if (!prompt.trim()) return;
    setIsLocalGenerating(true); // Włączamy animację ładowania
    onSubmit(prompt, selectedModel); // Przekazujemy żądanie do parenta
  };

  // Resetujemy stan ładowania po zamknięciu modala, żeby przy kolejnym otwarciu był znowu formularz
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setIsLocalGenerating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
            className="bg-white w-full max-w-lg rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[360px] flex flex-col justify-center"
          >
            {/* PRZYCISK ZAMKNIĘCIA (Wyłączony podczas generowania) */}
            {!isLocalGenerating && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-10"
              >
                <X size={20} weight="bold" />
              </button>
            )}

            {/* MAGIA ANIMACJI: Przełączanie między Formularzem a Ładowaniem */}
            <AnimatePresence mode="wait">
              {!isLocalGenerating ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col"
                >
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
                            className="absolute right-0 top-full mt-1.5 min-w-[220px] bg-white border border-gray-100 rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden z-50 origin-top-right"
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
                    {description ??
                      "Opisz swój wyjazd. AI przygotuje dla Ciebie chwytliwy tytuł i dopasuje podstawowe informacje, takie jak lokalizacja czy ilość miejsc."}
                  </p>

                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        placeholder ??
                        "np. Weekendowy wyjazd w góry dla 10 kobiet z jogą, winem i masażami w Jarnołtówku..."
                      }
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
                        <Sparkle
                          size={20}
                          weight="fill"
                          className="text-white"
                        />
                      }
                    >
                      Wygeneruj
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center w-full relative py-8"
                >
                  {/* TŁO 1: Główny, oddychający neon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                    className="absolute w-40 h-40 bg-brand-primary/20 rounded-full blur-[40px] z-0"
                  />

                  {/* TŁO 2: Mniejszy, pulsujący środek dla głębi */}
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="absolute w-20 h-20 bg-brand-primary/40 rounded-full blur-[25px] z-0"
                  />

                  {/* DUŻA IKONA W CENTRUM (Statyczna, ewentualnie z wejściem) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 text-brand-primary mb-6 drop-shadow-md"
                  >
                    <Sparkle size={64} weight="fill" />
                  </motion.div>

                  {/* TEKST */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 text-[22px] font-jakarta font-bold text-[#0B3B4C] mb-2 text-center"
                  >
                    Budowanie struktury...
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10 text-sm text-gray-500 font-montserrat text-center animate-pulse"
                  >
                    Architekt AI analizuje wyjazd i układa optymalny układ.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
