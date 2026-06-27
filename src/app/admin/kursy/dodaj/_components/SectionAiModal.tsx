"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkle,
  Target,
  UsersThree,
  BookOpen,
  NotePencil,
  ListPlus,
  Check,
  Eraser,
  TestTube,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { BRIEF_STORAGE_KEY } from "./CourseAiBriefModal";

/* ===========================================================================
 *  Popup AI per-sekcja. Zbiera (i ZAPAMIĘTUJE między krokami) brief kursu, a na
 *  krokach innych niż „Dane" dokłada pole „dodatkowe uwagi do tej sekcji".
 *  Brief współdzieli klucz localStorage z CourseAiBriefModal (BRIEF_STORAGE_KEY),
 *  więc wypełniony raz — pamiętany wszędzie. Uwagi sekcji trzymamy per-krok.
 * ========================================================================= */

const LEVELS = [
  "Początkujący",
  "Średniozaawansowany",
  "Zaawansowany",
  "Mieszany",
] as const;
type Level = (typeof LEVELS)[number];

export type SectionStep = "dane" | "program" | "tresc" | "seo";

// Krok „Treść" generuje wybrane cele (multi): opis „O kursie" / Zawartość / FAQ.
export type TrescTarget = "opis" | "zawartosc" | "faq";
export interface TrescPick {
  target: TrescTarget;
  notes: string;
}
const TRESC_TARGETS: { id: TrescTarget; label: string }[] = [
  { id: "opis", label: "Opis „O kursie”" },
  { id: "zawartosc", label: "Zawartość" },
  { id: "faq", label: "FAQ" },
];

const sectionNotesKey = (step: string) => `rehability:courseSectionNotes:${step}`;
const TRESC_TARGETS_KEY = "rehability:courseTrescTargets";

// Dane przykładowe (tylko dev) do szybkiego wypełnienia briefu.
const MOCK = {
  topic:
    "Mobilność bioder dla osób siedzących — ćwiczenia na sztywność i ulgę w lędźwiach",
  audience:
    "Osoby pracujące na siedząco (biuro, kierowcy, praca zdalna) z napięciem bioder i dołu pleców",
  goal: "Większa ruchomość bioder, mniej napięcia w lędźwiach i nawyk krótkiej rutyny mobilności 4× w tygodniu — bez sprzętu",
  level: "Początkujący" as Level,
  notes:
    "Ton spokojny i rzeczowy, ćwiczenia bez sprzętu, sesje 8–12 min, zaznacz przeciwwskazania.",
};

const inputCls =
  "w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-[15px] leading-relaxed rounded-[14px] px-4 py-3.5 font-montserrat outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors placeholder:text-gray-400";

/** Textarea, która rośnie do wysokości swojej treści (zamiast wewnętrznego scrolla
 *  w polu). Dzięki temu na mobile widać cały wpisany tekst, a modal dopasowuje
 *  wysokość do zawartości (do limitu max-height). */
function AutoTextarea({
  value,
  minRows = 3,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  // Dopasuj wysokość po każdej zmianie wartości (wpis ręczny, hydratacja, mock).
  useEffect(() => {
    resize();
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onInput={resize}
      className={cn("overflow-hidden", className)}
      {...rest}
    />
  );
}

const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: true,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
} as const;

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
      <span className="inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12.5px] text-brand-secondary">
        {Icon && <Icon size={15} weight="duotone" className="text-brand-primary" />}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Krok, dla którego generujemy (decyduje o nagłówku i polu uwag). */
  step: SectionStep;
  /** Etykieta sekcji (np. „Treść", „SEO") do nagłówka. */
  label: string;
  /** Trwa generacja (spinner + blokada). */
  busy: boolean;
  /** Brief (gotowy prompt) + uwagi sekcji (puste dla „Dane") + wybrane cele „Treść". */
  onGenerate: (
    briefPrompt: string,
    sectionNotes: string,
    trescPicks?: TrescPick[],
  ) => void;
  /** DEV: wyczyść TREŚĆ bieżącej sekcji (kreator decyduje, co znaczy „treść"). */
  onClearSection?: () => void;
}

export default function SectionAiModal({
  isOpen,
  onClose,
  step,
  label,
  busy,
  onGenerate,
  onClearSection,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Gdy popup otwarty — blokujemy scroll tła (body), żeby nie przewijać strony pod spodem.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("Początkujący");
  const [notes, setNotes] = useState("");
  const [sectionNotes, setSectionNotes] = useState("");
  // Krok „Treść": wybór celów (multi) + uwagi per-cel.
  const [picks, setPicks] = useState<Record<TrescTarget, boolean>>({
    opis: true,
    zawartosc: false,
    faq: false,
  });
  const [pickNotes, setPickNotes] = useState<Record<TrescTarget, string>>({
    opis: "",
    zawartosc: "",
    faq: "",
  });

  const showNotes = step !== "dane";
  const showTargets = step === "tresc";

  // Hydratacja przy otwarciu: brief (współdzielony) + uwagi sekcji (per-krok).
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<{
          topic: string;
          audience: string;
          goal: string;
          level: Level;
          notes: string;
        }>;
        setTopic(s.topic ?? "");
        setAudience(s.audience ?? "");
        setGoal(s.goal ?? "");
        setLevel(LEVELS.includes(s.level as Level) ? (s.level as Level) : "Początkujący");
        setNotes(s.notes ?? "");
      }
      setSectionNotes(localStorage.getItem(sectionNotesKey(step)) ?? "");
      if (step === "tresc") {
        const t = localStorage.getItem(TRESC_TARGETS_KEY);
        if (t) {
          const p = JSON.parse(t) as {
            picks?: Partial<Record<TrescTarget, boolean>>;
            pickNotes?: Partial<Record<TrescTarget, string>>;
          };
          if (p.picks)
            setPicks({
              opis: !!p.picks.opis,
              zawartosc: !!p.picks.zawartosc,
              faq: !!p.picks.faq,
            });
          if (p.pickNotes)
            setPickNotes({
              opis: p.pickNotes.opis ?? "",
              zawartosc: p.pickNotes.zawartosc ?? "",
              faq: p.pickNotes.faq ?? "",
            });
        }
      }
    } catch {
      /* uszkodzony wpis — ignorujemy */
    }
  }, [isOpen, step]);

  // Utrwalanie briefu (MERGE — nie kasujemy format/modules zapisanych przez
  // CourseAiBriefModal) oraz uwag sekcji.
  useEffect(() => {
    if (!isOpen || !mounted) return;
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      const cur = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        BRIEF_STORAGE_KEY,
        JSON.stringify({ ...cur, topic, audience, goal, level, notes }),
      );
    } catch {
      /* pomijamy */
    }
  }, [isOpen, mounted, topic, audience, goal, level, notes]);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    try {
      localStorage.setItem(sectionNotesKey(step), sectionNotes);
    } catch {
      /* pomijamy */
    }
  }, [isOpen, mounted, step, sectionNotes]);

  useEffect(() => {
    if (!isOpen || !mounted || step !== "tresc") return;
    try {
      localStorage.setItem(TRESC_TARGETS_KEY, JSON.stringify({ picks, pickNotes }));
    } catch {
      /* pomijamy */
    }
  }, [isOpen, mounted, step, picks, pickNotes]);

  const briefOk =
    topic.trim().length > 0 && audience.trim().length > 0 && goal.trim().length > 0;
  const trescPicks: TrescPick[] = TRESC_TARGETS.filter((t) => picks[t.id]).map(
    (t) => ({ target: t.id, notes: pickNotes[t.id].trim() }),
  );
  const canGenerate = briefOk && (!showTargets || trescPicks.length > 0);

  const submit = () => {
    if (!canGenerate || busy) return;
    const briefPrompt = [
      `Temat kursu: ${topic.trim()}`,
      audience.trim() && `Dla kogo (grupa docelowa): ${audience.trim()}`,
      goal.trim() && `Efekt — co kursant osiągnie / czego się nauczy: ${goal.trim()}`,
      `Poziom zaawansowania: ${level}`,
      notes.trim() && `Dodatkowe wskazówki twórcy: ${notes.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    if (showTargets) onGenerate(briefPrompt, "", trescPicks);
    else onGenerate(briefPrompt, showNotes ? sectionNotes.trim() : "");
  };

  // DEV: wypełnij brief (i uwagi/cele) danymi przykładowymi — szybkie testy.
  const fillMock = () => {
    setTopic(MOCK.topic);
    setAudience(MOCK.audience);
    setGoal(MOCK.goal);
    setLevel(MOCK.level);
    setNotes(MOCK.notes);
    if (showTargets) {
      setPicks({ opis: true, zawartosc: true, faq: true });
      setPickNotes({
        opis: "więcej o korzyściach, mniej teorii",
        zawartosc: "przegląd programu krok po kroku",
        faq: "obawy początkujących i przeciwwskazania",
      });
    } else if (showNotes) {
      setSectionNotes(
        step === "seo"
          ? "podkreśl frazę „mobilność bioder”, ton ekspercki"
          : "zacznij od diagnozy, każdy moduł zakończ planem",
      );
    }
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B3B4C]/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] rounded-[24px] p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col"
          >
            {!busy && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Zamknij"
              >
                <X size={20} weight="bold" />
              </button>
            )}

            {/* Nagłówek */}
            <div className="flex items-center gap-3 mb-1 pr-8">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                <Sparkle size={20} weight="fill" className="text-brand-primary" />
              </div>
              <h3 className="text-lg font-jakarta font-bold text-[#0B3B4C]">
                AI — wygeneruj: {label}
              </h3>
            </div>
            <p className="text-sm text-gray-500 font-montserrat mb-4">
              {showNotes
                ? "Brief jest zapamiętany między krokami. Dopisz uwagi do tej sekcji i generuj."
                : "Odpowiedz na kilka pytań — zapamiętamy je do kolejnych sekcji."}
            </p>

            {/* Pola */}
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
              <Field icon={BookOpen} label="O czym jest kurs?" required>
                <AutoTextarea
                  {...NO_AUTOFILL}
                  minRows={3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="np. Mobilność bioder dla osób siedzących"
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              <Field icon={UsersThree} label="Dla kogo jest ten kurs?" required>
                <AutoTextarea
                  {...NO_AUTOFILL}
                  minRows={3}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="np. osoby pracujące na siedząco, z napięciem w lędźwiach"
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              <Field icon={Target} label="Jaki efekt osiągnie kursant?" required>
                <AutoTextarea
                  {...NO_AUTOFILL}
                  minRows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="np. większa ruchomość bioder, mniej napięcia, nawyk ćwiczeń"
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              <Field label="Poziom zaawansowania">
                <div className="flex flex-wrap gap-2 justify-center">
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
                <AutoTextarea
                  {...NO_AUTOFILL}
                  minRows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="np. ton spokojny, bez sprzętu, sesje 8–12 minut"
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              {/* Krok „Treść": wybór CELÓW (multi) + uwagi per-cel */}
              {showTargets && (
                <Field icon={ListPlus} label="Co wygenerować? (możesz zaznaczyć kilka)">
                  <div className="flex flex-col gap-2.5">
                    {TRESC_TARGETS.map((t) => {
                      const on = picks[t.id];
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "rounded-[14px] border p-3 transition-colors",
                            on
                              ? "border-brand-primary/40 bg-brand-primary/[0.04]"
                              : "border-gray-200 bg-gray-50",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPicks((p) => ({ ...p, [t.id]: !p[t.id] }))
                            }
                            className="flex items-center gap-2.5 w-full text-left"
                          >
                            <span
                              className={cn(
                                "flex items-center justify-center size-5 rounded-md border shrink-0 transition-colors",
                                on
                                  ? "bg-brand-primary border-brand-primary text-white"
                                  : "bg-white border-gray-300 text-transparent",
                              )}
                            >
                              <Check size={13} weight="bold" />
                            </span>
                            <span className="font-montserrat font-semibold text-[13px] text-brand-secondary">
                              {t.label}
                            </span>
                          </button>
                          {on && (
                            <AutoTextarea
                              {...NO_AUTOFILL}
                              minRows={2}
                              value={pickNotes[t.id]}
                              onChange={(e) =>
                                setPickNotes((n) => ({ ...n, [t.id]: e.target.value }))
                              }
                              placeholder={`Dodatkowe uwagi do: ${t.label} (opcjonalnie)`}
                              className={cn(inputCls, "resize-none mt-2.5")}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              {/* Uwagi do sekcji — poza „Dane" i „Treść" (czyli Program / SEO) */}
              {showNotes && !showTargets && (
                <Field icon={ListPlus} label={`Dodatkowe uwagi do sekcji „${label}”`}>
                  <AutoTextarea
                    {...NO_AUTOFILL}
                    minRows={3}
                    value={sectionNotes}
                    onChange={(e) => setSectionNotes(e.target.value)}
                    placeholder={
                      step === "seo"
                        ? "np. podkreśl frazę „ból lędźwi”, ton ekspercki"
                        : "np. zacznij od diagnozy, każdy moduł zakończ planem"
                    }
                    className={cn(inputCls, "resize-none")}
                  />
                </Field>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
              {/* DEV: narzędzia testowe (ukryte na produkcji) */}
              {process.env.NODE_ENV === "development" ? (
                <div className="flex gap-2 order-last sm:order-none">
                  <button
                    type="button"
                    onClick={fillMock}
                    disabled={busy}
                    title="Wypełnij brief danymi przykładowymi"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-brand-primary/40 text-brand-primary text-[12px] font-montserrat font-semibold hover:bg-brand-primary/5 transition-colors disabled:opacity-50"
                  >
                    <TestTube size={14} weight="bold" />
                    Mock (dev)
                  </button>
                  <button
                    type="button"
                    onClick={onClearSection}
                    disabled={busy || !onClearSection}
                    title="Wyczyść treść bieżącej sekcji"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-rose-300 text-rose-500 text-[12px] font-montserrat font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    <Eraser size={14} weight="bold" />
                    Wyczyść treść (dev)
                  </button>
                </div>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-[12px] transition-colors disabled:opacity-50"
                >
                  Anuluj
                </button>
                <Button
                  onClick={submit}
                  disabled={!canGenerate || busy}
                  rightIcon={
                    busy ? (
                      <CircleNotch size={18} weight="bold" className="text-white animate-spin" />
                    ) : (
                      <Sparkle size={20} weight="fill" className="text-white" />
                    )
                  }
                >
                  {busy ? "Generuję…" : `Generuj: ${label}`}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
