"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkle,
  Target,
  UsersThree,
  BookOpen,
  NotePencil,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ===========================================================================
 *  Dedykowany, PROWADZONY formularz briefu kursu dla AI.
 *
 *  Zamiast jednego pola na prompt zadajemy konkretne pytania (temat, dla kogo,
 *  efekt, poziom, wskazówki) i składamy z nich uporządkowany opis, który leci
 *  do akcji `generateCourse`. Dzięki temu twórca nie musi wiedzieć „jak pisać
 *  prompt" — odpowiada na pytania, a my budujemy brief za niego.
 *
 *  Modal jest SPECYFICZNY dla kursów (współdzielony AiGeneratorModal zostaje
 *  nietknięty dla bloga i wyjazdów).
 * ========================================================================= */

const LEVELS = [
  "Początkujący",
  "Średniozaawansowany",
  "Zaawansowany",
  "Mieszany",
] as const;
type Level = (typeof LEVELS)[number];

export interface CourseBriefAnswers {
  topic: string;
  audience: string;
  goal: string;
  level: Level;
  notes: string;
}

/** Składa odpowiedzi w czytelny brief dla modelu (pomija puste opcjonalne). */
export function buildCourseBriefPrompt(a: CourseBriefAnswers): string {
  return [
    `Temat kursu: ${a.topic.trim()}`,
    a.audience.trim() && `Dla kogo (grupa docelowa): ${a.audience.trim()}`,
    a.goal.trim() &&
      `Efekt — co kursant osiągnie / czego się nauczy po ukończeniu: ${a.goal.trim()}`,
    `Poziom zaawansowania: ${a.level}`,
    a.notes.trim() && `Dodatkowe wskazówki twórcy: ${a.notes.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Otrzymuje gotowy, złożony brief (string) — zgodny z `startAutopilot`. */
  onSubmit: (prompt: string) => void;
}

const inputCls =
  "w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[14px] px-4 py-3 font-montserrat outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors placeholder:text-gray-400";

export default function CourseAiBriefModal({ isOpen, onClose, onSubmit }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("Początkujący");
  const [notes, setNotes] = useState("");

  // Ekran „budowania" wewnątrz modala (jak w AiGeneratorModal).
  const [generating, setGenerating] = useState(false);

  // Reset po zamknięciu — przy kolejnym otwarciu znów świeży formularz.
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setGenerating(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const canSubmit =
    topic.trim().length > 0 && audience.trim().length > 0 && goal.trim().length > 0;

  const handleGenerate = () => {
    if (!canSubmit || generating) return;
    setGenerating(true);
    onSubmit(buildCourseBriefPrompt({ topic, audience, goal, level, notes }));
  };

  if (!mounted) return null;

  return createPortal(
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
            {!generating && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Zamknij"
              >
                <X size={20} weight="bold" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {!generating ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col"
                >
                  {/* Nagłówek */}
                  <div className="flex items-center gap-3 mb-1 pr-8">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Sparkle size={20} weight="fill" className="text-brand-primary" />
                    </div>
                    <h3 className="text-lg font-jakarta font-bold text-[#0B3B4C]">
                      Brief kursu dla AI
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 font-montserrat mb-5">
                    Odpowiedz na kilka pytań — AI ułoży tytuł, kategorię, opis i
                    pełny program.
                  </p>

                  {/* Pola — przewijalne, gdy nie mieszczą się na małym ekranie */}
                  <div className="flex flex-col gap-4 max-h-[52vh] overflow-y-auto pr-1 -mr-1">
                    <Field
                      icon={BookOpen}
                      label="O czym jest kurs?"
                      required
                    >
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="np. Zdrowy kręgosłup — ćwiczenia stabilizujące w domu"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={UsersThree} label="Dla kogo jest ten kurs?" required>
                      <input
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="np. osoby z bólem lędźwiowego odcinka, pracujące przy biurku"
                        className={inputCls}
                      />
                    </Field>

                    <Field icon={Target} label="Jaki efekt osiągnie kursant?" required>
                      <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="np. zmniejszenie bólu pleców, lepsza mobilność i nawyk codziennych ćwiczeń"
                        className={cn(inputCls, "min-h-[76px] resize-none")}
                      />
                    </Field>

                    <Field label="Poziom zaawansowania">
                      <div className="flex flex-wrap gap-2">
                        {LEVELS.map((lvl) => {
                          const active = lvl === level;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLevel(lvl)}
                              className={cn(
                                "px-3.5 py-2 rounded-full text-[12.5px] font-montserrat font-semibold border transition-all",
                                active
                                  ? "bg-brand-primary text-white border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                                  : "bg-white text-brand-secondary/65 border-gray-200 hover:border-brand-primary/30",
                              )}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <Field icon={NotePencil} label="Dodatkowe wskazówki (opcjonalnie)">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="np. ton spokojny i wspierający, ćwiczenia bez sprzętu, ok. 20 minut"
                        className={cn(inputCls, "min-h-[64px] resize-none")}
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-[12px] transition-colors"
                    >
                      Anuluj
                    </button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!canSubmit}
                      rightIcon={<Sparkle size={20} weight="fill" className="text-white" />}
                    >
                      Wygeneruj kurs
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
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute w-40 h-40 bg-brand-primary/20 rounded-full blur-[40px] z-0"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="absolute w-20 h-20 bg-brand-primary/40 rounded-full blur-[25px] z-0"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 text-brand-primary mb-6 drop-shadow-md"
                  >
                    <Sparkle size={64} weight="fill" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 text-[22px] font-jakarta font-bold text-[#0B3B4C] mb-2 text-center"
                  >
                    Budowanie kursu...
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10 text-sm text-gray-500 font-montserrat text-center animate-pulse"
                  >
                    Architekt AI analizuje brief i układa program kursu.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------- Pole ------------------------------- */

function Field({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon?: React.ElementType;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12.5px] text-brand-secondary/70">
        {Icon && <Icon size={15} weight="duotone" className="text-brand-primary" />}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}
