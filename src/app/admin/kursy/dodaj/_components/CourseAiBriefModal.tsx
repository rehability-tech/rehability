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
  Stack,
  PlayCircle,
  Plus,
  Minus,
  ArrowLeft,
  CircleNotch,
  TestTube,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { VideoUploader } from "./VideoUploader";

/* ===========================================================================
 *  Dedykowany, PROWADZONY formularz briefu kursu dla AI.
 *
 *  Ekran 1 (brief): konkretne pytania (temat, dla kogo, efekt, poziom,
 *  wskazówki) → uporządkowany opis dla akcji `generateCourse`.
 *
 *  Ekran 2 (struktura — TYLKO format „sections"): twórca podaje ile modułów i
 *  ile lekcji w każdym module oraz krótko „o czym" — z tych briefów AI rozpisze
 *  tytuły i opisy. Liczność jest gwarantowana po stronie klienta.
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

const MAX_MODULES = 8;
const MAX_LESSONS = 12;

export interface CourseBriefAnswers {
  topic: string;
  audience: string;
  goal: string;
  level: Level;
  notes: string;
}

/** Brief struktury programu (ekran 2). Liczność = źródło prawdy dla kreatora.
 *  Wideo (embed Bunny) i długość są opcjonalne — można je wgrać tu od razu albo
 *  uzupełnić później w kroku „Program". */
export interface CourseStructureBrief {
  modules: {
    about: string;
    lessons: { about: string; video: string; durationSec?: number }[];
  }[];
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

type CourseFormat = "single" | "sections";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Format wybrany na kroku Start — decyduje, czy pokazać ekran struktury. */
  format: CourseFormat;
  /**
   * Otrzymuje gotowy brief (string) oraz — dla formatu „sections" — strukturę
   * programu do rozpisania przez AI. Zgodne z `startAutopilot`.
   */
  onSubmit: (prompt: string, structure?: CourseStructureBrief) => void;
  /**
   * Wywoływane raz na mount, gdy w localStorage jest niedokończony brief —
   * prosi rodzica o otwarcie modala i ustawienie zapamiętanego formatu, by
   * twardy refresh nie gubił wpisanych danych. W trybie edycji rodzic to ignoruje.
   */
  onRestore?: (format: CourseFormat) => void;
}

// Klucz utrwalania briefu (przed wygenerowaniem kursu nie ma jeszcze szkicu na
// serwerze, więc trzymamy formularz lokalnie, by przeżył odświeżenie strony).
// Eksportowany — „świeży start" kreatora (sidebar / krok Start) też go czyści.
export const BRIEF_STORAGE_KEY = "rehability:courseAiBrief";

const inputCls =
  "w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[14px] px-4 py-3 font-montserrat outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors placeholder:text-gray-400";

// Wycisza autouzupełnianie przeglądarki (Edge „Wallet / Save ID card", Chrome)
// oraz menedżery haseł — to są pola treści kursu, nie dane osobowe/płatnicze.
const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: true,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
} as const;

const emptyLesson = () => ({ about: "", video: "" });
const emptyModule = () => ({ about: "", lessons: [emptyLesson(), emptyLesson()] });

// Dane przykładowe (tylko dev) — szybkie wypełnienie briefu i struktury do testów.
const MOCK_BRIEF = {
  topic:
    "Mobilność bioder dla osób siedzących — ćwiczenia na sztywność i ulgę w lędźwiach",
  audience:
    "Osoby pracujące na siedząco (biuro, kierowcy, praca zdalna) z napięciem bioder i dołu pleców",
  goal: "Większa ruchomość bioder, mniej napięcia w lędźwiach i nawyk krótkiej rutyny mobilności 4× w tygodniu — bez sprzętu",
  level: "Początkujący" as Level,
  notes:
    "Ton spokojny i rzeczowy, ćwiczenia bez sprzętu, sesje 8–12 min, zaznacz przeciwwskazania i kiedy zgłosić się do fizjoterapeuty.",
  modules: [
    {
      about: "Dlaczego biodra sztywnieją od siedzenia — podstawy i samoocena",
      lessons: [
        "Co siedzenie robi z biodrami i lędźwiami",
        "Samoocena zakresu ruchu — proste testy",
        "Zasada bezpieczeństwa: zakres bez bólu",
      ],
    },
    {
      about: "Praktyka: mobilizacja i rozluźnianie bioder",
      lessons: [
        "Rozluźnienie zginaczy bioder po siedzeniu",
        "Mobilizacja rotacji i odwodzenia biodra",
        "Mini-rutyna mobilności 8 minut",
      ],
    },
    {
      about: "Wzmacnianie i utrzymanie efektu na co dzień",
      lessons: [
        "Aktywacja pośladków i stabilność miednicy",
        "Mikroprzerwy mobilności w ciągu dnia",
        "Plan na stałe + kiedy iść do specjalisty",
      ],
    },
  ],
} as const;

export default function CourseAiBriefModal({
  isOpen,
  onClose,
  format,
  onSubmit,
  onRestore,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Ekran 1 — brief
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("Początkujący");
  const [notes, setNotes] = useState("");

  // Ekran 2 — struktura programu (tylko „sections")
  const [screen, setScreen] = useState<"brief" | "structure">("brief");
  const [modules, setModules] = useState<CourseStructureBrief["modules"]>([]);

  // Klucze lekcji (mi-li), których wideo TRWA przesyłanie — blokujemy generację,
  // by nie przerwać uploadu odmontowaniem ekranu struktury.
  const [uploading, setUploading] = useState<Set<string>>(() => new Set());
  const anyUploading = uploading.size > 0;
  const setLessonUploading = (mi: number, li: number, up: boolean) =>
    setUploading((prev) => {
      const key = `${mi}-${li}`;
      if (up === prev.has(key)) return prev;
      const next = new Set(prev);
      if (up) next.add(key);
      else next.delete(key);
      return next;
    });

  // Ekran „budowania" wewnątrz modala.
  const [generating, setGenerating] = useState(false);

  // Reset po zamknięciu — przy kolejnym otwarciu znów świeży formularz.
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setGenerating(false);
        setScreen("brief");
        setUploading(new Set());
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Wyczyść utrwalony brief (po starcie generacji lub anulowaniu).
  const clearBrief = () => {
    try {
      localStorage.removeItem(BRIEF_STORAGE_KEY);
    } catch {
      /* prywatny tryb / brak dostępu — ignorujemy */
    }
  };

  // Hydratacja z localStorage (raz na mount) — odtwarza brief po odświeżeniu
  // strony i prosi rodzica o otwarcie modala z zapamiętanym formatem.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<{
        screen: "brief" | "structure";
        format: CourseFormat;
        topic: string;
        audience: string;
        goal: string;
        level: Level;
        notes: string;
        modules: CourseStructureBrief["modules"];
      }>;
      const hasContent =
        !!s.topic?.trim() ||
        !!s.audience?.trim() ||
        !!s.goal?.trim() ||
        !!(s.modules && s.modules.length);
      if (!hasContent) return;
      setTopic(s.topic ?? "");
      setAudience(s.audience ?? "");
      setGoal(s.goal ?? "");
      setLevel(
        LEVELS.includes(s.level as Level) ? (s.level as Level) : "Początkujący",
      );
      setNotes(s.notes ?? "");
      if (s.modules?.length) setModules(s.modules);
      const fmt: CourseFormat = s.format === "single" ? "single" : "sections";
      setScreen(
        fmt === "sections" && s.screen === "structure" ? "structure" : "brief",
      );
      onRestore?.(fmt);
    } catch {
      /* uszkodzony wpis — ignorujemy */
    }
    // raz na mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utrwalanie briefu przy każdej zmianie, dopóki modal jest otwarty i nie trwa
  // generacja. Czyszczenie robi clearBrief (submit / anulowanie).
  useEffect(() => {
    if (!isOpen || generating) return;
    try {
      localStorage.setItem(
        BRIEF_STORAGE_KEY,
        JSON.stringify({
          screen,
          format,
          topic,
          audience,
          goal,
          level,
          notes,
          modules,
        }),
      );
    } catch {
      /* brak miejsca / prywatny tryb — pomijamy */
    }
  }, [
    isOpen,
    generating,
    screen,
    format,
    topic,
    audience,
    goal,
    level,
    notes,
    modules,
  ]);

  const briefOk =
    topic.trim().length > 0 &&
    audience.trim().length > 0 &&
    goal.trim().length > 0;

  const structureOk =
    modules.length > 0 &&
    modules.every(
      (m) =>
        m.about.trim().length > 0 &&
        m.lessons.length > 0 &&
        m.lessons.every((l) => l.about.trim().length > 0),
    );

  // --- Sterowanie strukturą -------------------------------------------------
  const setModuleCount = (n: number) =>
    setModules((prev) => {
      const next = Math.max(1, Math.min(MAX_MODULES, n));
      if (next === prev.length) return prev;
      if (next < prev.length) return prev.slice(0, next);
      return [...prev, ...Array.from({ length: next - prev.length }, emptyModule)];
    });

  const setLessonCount = (mi: number, n: number) =>
    setModules((prev) =>
      prev.map((m, i) => {
        if (i !== mi) return m;
        const next = Math.max(1, Math.min(MAX_LESSONS, n));
        if (next === m.lessons.length) return m;
        const lessons =
          next < m.lessons.length
            ? m.lessons.slice(0, next)
            : [
                ...m.lessons,
                ...Array.from({ length: next - m.lessons.length }, emptyLesson),
              ];
        return { ...m, lessons };
      }),
    );

  const updateModuleAbout = (mi: number, about: string) =>
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, about } : m)));

  const patchLesson = (
    mi: number,
    li: number,
    patch: Partial<CourseStructureBrief["modules"][number]["lessons"][number]>,
  ) =>
    setModules((prev) =>
      prev.map((m, i) =>
        i === mi
          ? {
              ...m,
              lessons: m.lessons.map((l, j) =>
                j === li ? { ...l, ...patch } : l,
              ),
            }
          : m,
      ),
    );

  const updateLessonAbout = (mi: number, li: number, about: string) =>
    patchLesson(mi, li, { about });

  // --- Akcje ----------------------------------------------------------------
  // DEV: wypełnij brief (i strukturę) danymi przykładowymi — do szybkich testów.
  const fillMock = () => {
    setTopic(MOCK_BRIEF.topic);
    setAudience(MOCK_BRIEF.audience);
    setGoal(MOCK_BRIEF.goal);
    setLevel(MOCK_BRIEF.level);
    setNotes(MOCK_BRIEF.notes);
    setModules(
      MOCK_BRIEF.modules.map((m) => ({
        about: m.about,
        lessons: m.lessons.map((about) => ({ about, video: "" })),
      })),
    );
  };

  const goToStructure = () => {
    if (!briefOk) return;
    if (modules.length === 0) setModules([emptyModule()]);
    setScreen("structure");
  };

  const submit = (structure?: CourseStructureBrief) => {
    // Brief został „skonsumowany" przez generację — czyścimy zapis, by następny
    // kurs startował czysto (i nie wskakiwał auto-restore po refreshu).
    clearBrief();
    setGenerating(true);
    onSubmit(
      buildCourseBriefPrompt({ topic, audience, goal, level, notes }),
      structure,
    );
  };

  // Anulowanie (X / „Anuluj") — porzucenie briefu czyści zapis, więc po refreshu
  // nie wraca. Refresh BEZ anulowania zostawia zapis → dane się odtworzą.
  const handleCancel = () => {
    clearBrief();
    onClose();
  };

  const handlePrimary = () => {
    if (generating) return;
    if (format === "sections") {
      if (screen === "brief") return goToStructure();
      // Nagrania mogą wciąż lecieć w tle (TUS nie jest przerywany zamknięciem
      // modala, a embed URL jest już znany) — nie blokujemy generacji.
      if (structureOk) submit({ modules });
      return;
    }
    if (briefOk) submit();
  };

  if (!mounted) return null;

  const showBriefScreen = !generating && screen === "brief";
  const showStructureScreen = !generating && screen === "structure";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center bg-[#0B3B4C]/40 backdrop-blur-sm p-0 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            // Fullscreen na mobile; okienko (z marginesem + zaokrągleniem) od sm.
            className="bg-white w-full h-full sm:w-[85vw] sm:h-[85vh] sm:max-h-[88vh] max-w-5xl rounded-none sm:rounded-[24px] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col"
          >
            {!generating && (
              <button
                onClick={handleCancel}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Zamknij"
              >
                <X size={20} weight="bold" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {showBriefScreen && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col flex-1 min-h-0"
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
                  <p className="text-sm text-gray-500 font-montserrat mb-3">
                    Odpowiedz na kilka pytań — AI ułoży tytuł, kategorię, opis i
                    {format === "sections" ? " program." : " pełny program."}
                  </p>

                  {/* DEV: szybkie wypełnienie przykładem (ukryte na produkcji) */}
                  {process.env.NODE_ENV === "development" && (
                    <button
                      type="button"
                      onClick={fillMock}
                      className="self-start inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg border border-dashed border-brand-primary/40 text-brand-primary text-[12px] font-montserrat font-semibold hover:bg-brand-primary/5 transition-colors"
                    >
                      <TestTube size={14} weight="bold" />
                      Wypełnij przykładem (dev)
                    </button>
                  )}

                  {/* Pola — przewijalne, gdy nie mieszczą się na małym ekranie */}
                  <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
                    <Field icon={BookOpen} label="O czym jest kurs?" required>
                      <textarea
                        {...NO_AUTOFILL}
                        rows={3}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="np. Zdrowy kręgosłup — ćwiczenia stabilizujące w domu"
                        className={cn(inputCls, "resize-none")}
                      />
                    </Field>

                    <Field icon={UsersThree} label="Dla kogo jest ten kurs?" required>
                      <textarea
                        {...NO_AUTOFILL}
                        rows={3}
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="np. osoby z bólem lędźwiowego odcinka, pracujące przy biurku"
                        className={cn(inputCls, "resize-none")}
                      />
                    </Field>

                    <Field icon={Target} label="Jaki efekt osiągnie kursant?" required>
                      <textarea
                        {...NO_AUTOFILL}
                        rows={3}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="np. zmniejszenie bólu pleców, lepsza mobilność i nawyk codziennych ćwiczeń"
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
                      <textarea
                        {...NO_AUTOFILL}
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="np. ton spokojny i wspierający, ćwiczenia bez sprzętu, ok. 20 minut"
                        className={cn(inputCls, "resize-none")}
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end gap-3 mt-5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-[12px] transition-colors"
                    >
                      Anuluj
                    </button>
                    <Button
                      onClick={handlePrimary}
                      disabled={!briefOk}
                      rightIcon={
                        format === "sections" ? (
                          <Stack size={18} weight="bold" className="text-white" />
                        ) : (
                          <Sparkle size={20} weight="fill" className="text-white" />
                        )
                      }
                    >
                      {format === "sections" ? "Dalej: struktura" : "Wygeneruj kurs"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {showStructureScreen && (
                <motion.div
                  key="structure"
                  initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col flex-1 min-h-0"
                >
                  {/* Nagłówek */}
                  <div className="flex items-center gap-3 mb-1 pr-8">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Stack size={20} weight="duotone" className="text-brand-primary" />
                    </div>
                    <h3 className="text-lg font-jakarta font-bold text-[#0B3B4C]">
                      Struktura programu
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 font-montserrat mb-4">
                    Ustaw moduły i lekcje, opisz krótko „o czym" — AI rozpisze
                    tytuły i opisy. Nagrania wgrasz później.
                  </p>

                  {/* Liczba modułów */}
                  <div className="flex items-center justify-between rounded-[14px] border border-gray-200 bg-gray-50 px-4 py-2.5 mb-3">
                    <span className="font-montserrat font-semibold text-[13px] text-brand-secondary">
                      Moduły
                    </span>
                    <Stepper
                      value={modules.length}
                      min={1}
                      max={MAX_MODULES}
                      onChange={setModuleCount}
                    />
                  </div>

                  {/* Lista modułów */}
                  <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
                    {modules.map((mod, mi) => (
                      <div
                        key={mi}
                        className="rounded-[16px] border border-gray-200 bg-white p-3 sm:p-3.5"
                      >
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="flex items-center justify-center size-6 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[12px]">
                            {mi + 1}
                          </span>
                          <input
                            {...NO_AUTOFILL}
                            value={mod.about}
                            onChange={(e) => updateModuleAbout(mi, e.target.value)}
                            placeholder={`O czym jest moduł ${mi + 1}? (np. fundamenty — diagnoza i podstawy)`}
                            className="flex-1 bg-transparent font-jakarta font-bold text-[14px] text-[#0B3B4C] placeholder:text-gray-300 placeholder:font-montserrat placeholder:font-semibold placeholder:text-[12.5px] outline-none border-b border-transparent focus:border-brand-primary/30"
                          />
                        </div>

                        <div className="flex items-center justify-between pl-1 sm:pl-8 mb-2">
                          <span className="inline-flex items-center gap-1.5 font-montserrat font-semibold text-[11.5px] text-gray-500">
                            <PlayCircle
                              size={14}
                              weight="duotone"
                              className="text-brand-primary"
                            />
                            Lekcje
                          </span>
                          <Stepper
                            value={mod.lessons.length}
                            min={1}
                            max={MAX_LESSONS}
                            onChange={(n) => setLessonCount(mi, n)}
                            small
                          />
                        </div>

                        <div className="flex flex-col gap-3 pl-1 sm:pl-8">
                          {mod.lessons.map((lesson, li) => (
                            <div
                              key={li}
                              className="rounded-[12px] border border-gray-100 bg-gray-50/60 p-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center size-5 shrink-0 rounded-md bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[10px]">
                                  {li + 1}
                                </span>
                                <input
                                  {...NO_AUTOFILL}
                                  value={lesson.about}
                                  onChange={(e) =>
                                    updateLessonAbout(mi, li, e.target.value)
                                  }
                                  placeholder={`O czym jest lekcja ${li + 1}?`}
                                  className="flex-1 bg-white border border-gray-200 rounded-[10px] px-3 py-2 font-montserrat text-[12.5px] text-brand-secondary placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary transition-colors"
                                />
                              </div>
                              <div className="mt-2 pl-0 sm:pl-7">
                                <VideoUploader
                                  value={lesson.video}
                                  onChange={(url) =>
                                    patchLesson(mi, li, { video: url })
                                  }
                                  onDuration={(s) =>
                                    patchLesson(mi, li, { durationSec: s })
                                  }
                                  onUploadingChange={(up) =>
                                    setLessonUploading(mi, li, up)
                                  }
                                  label={`Wideo lekcji ${li + 1} (opcjonalnie)`}
                                  hint="MP4 / MOV / WEBM — wgraj teraz albo później."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {anyUploading && (
                    <div className="flex items-center gap-2 mt-4 rounded-[12px] border border-brand-primary/20 bg-brand-primary/[0.05] px-3.5 py-2.5">
                      <CircleNotch
                        size={16}
                        weight="bold"
                        className="text-brand-primary animate-spin shrink-0"
                      />
                      <span className="font-montserrat text-[12.5px] text-brand-secondary">
                        Nagrania ({uploading.size}) prześlą się w tle — możesz już
                        wygenerować kurs. Postęp zobaczysz w pasku akcji.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setScreen("brief")}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-[12px] transition-colors"
                    >
                      <ArrowLeft size={16} weight="bold" /> Wstecz
                    </button>
                    <Button
                      onClick={handlePrimary}
                      disabled={!structureOk}
                      rightIcon={
                        <Sparkle size={20} weight="fill" className="text-white" />
                      }
                    >
                      Wygeneruj kurs
                    </Button>
                  </div>
                </motion.div>
              )}

              {generating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center w-full flex-1 relative py-8"
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

/* ------------------------------- Stepper ------------------------------- */

function Stepper({
  value,
  min,
  max,
  onChange,
  small,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  small?: boolean;
}) {
  const btn =
    "flex items-center justify-center rounded-full border border-gray-200 text-brand-primary disabled:text-gray-300 disabled:border-gray-100 hover:bg-brand-primary/5 transition-colors";
  const size = small ? "size-6" : "size-7";
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={cn(btn, size)}
        aria-label="Mniej"
      >
        <Minus size={small ? 12 : 14} weight="bold" />
      </button>
      <span
        className={cn(
          "font-jakarta font-bold text-brand-secondary tabular-nums text-center",
          small ? "w-4 text-[13px]" : "w-5 text-[15px]",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={cn(btn, size)}
        aria-label="Więcej"
      >
        <Plus size={small ? 12 : 14} weight="bold" />
      </button>
    </div>
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
