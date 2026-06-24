"use client";

import { motion } from "framer-motion";
import {
  Sparkle,
  PencilSimpleLine,
  PlayCircle,
  Stack,
  CaretRight,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import type { CourseFormat } from "./useCourseAutosave";

/* ===========================================================================
 *  Krok 0 kreatora kursu — dwie fazy:
 *  1) „method"  — Jak chcesz stworzyć kurs? (AI / ręcznie)
 *  2) „format"  — Jeden film czy podział na lekcje?
 * ========================================================================= */

type Props = {
  phase: "method" | "format";
  onAi: () => void;
  onManual: () => void;
  onFormat: (f: CourseFormat) => void;
};

export function StartStep({ phase, onAi, onManual, onFormat }: Props) {
  return phase === "format" ? (
    <FormatPhase onFormat={onFormat} />
  ) : (
    <MethodPhase onAi={onAi} onManual={onManual} />
  );
}

/* ----------------------------- Faza: metoda ----------------------------- */

function MethodPhase({
  onAi,
  onManual,
}: {
  onAi: () => void;
  onManual: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto text-center py-2"
    >
      <span className="relative inline-flex items-center justify-center size-16 rounded-2xl rounded-tr-none bg-brand-primary text-white border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] mb-5">
        <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-7 rounded-full bg-brand-yellow/50 blur-[10px]" />
        <Sparkle size={30} weight="fill" className="relative" />
      </span>
      <h2 className="font-jakarta font-bold text-[22px] text-[#0B3B4C]">
        Jak chcesz stworzyć kurs?
      </h2>
      <p className="font-montserrat text-[14px] text-gray-500 mt-2 mb-6 mx-auto max-w-sm">
        Wybierz sposób — szczegóły dopracujesz w kolejnych krokach.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
        <button
          type="button"
          onClick={onAi}
          className="group relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-brand-primary text-white font-montserrat font-bold text-[14px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] hover:-translate-y-0.5 transition-all"
        >
          <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
          <span className="relative inline-flex items-center gap-2">
            <Sparkle size={16} weight="fill" />
            Stwórz z AI
          </span>
        </button>
        <button
          type="button"
          onClick={onManual}
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-white border border-gray-200 text-[#0B3B4C] font-montserrat font-bold text-[14px] hover:border-brand-primary/30 hover:bg-brand-primary/[0.03] transition-all"
        >
          <PencilSimpleLine size={16} weight="duotone" className="text-brand-primary" />
          Ręcznie
        </button>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Faza: format ----------------------------- */

function FormatPhase({ onFormat }: { onFormat: (f: CourseFormat) => void }) {
  const OPTIONS: {
    v: CourseFormat;
    icon: React.ElementType;
    title: string;
    desc: string;
  }[] = [
    {
      v: "single",
      icon: PlayCircle,
      title: "Jeden film",
      desc: "Cały kurs to jedno nagranie — bez podziału na lekcje. Wgrasz wideo i uzupełnisz dane.",
    },
    {
      v: "sections",
      icon: Stack,
      title: "Podział na lekcje",
      desc: "Moduły i lekcje, każda z własnym wideo. Najpierw zbudujesz program, potem dane.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-7">
        <h2 className="font-jakarta font-bold text-[22px] text-[#0B3B4C]">
          Jak zbudowany jest kurs?
        </h2>
        <p className="font-montserrat text-[14px] text-gray-500 mt-2 max-w-md mx-auto">
          To decyduje o kolejnych krokach — jeden film czy pełny program z lekcji.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onFormat(opt.v)}
              className="group relative overflow-hidden text-left rounded-[24px] rounded-tr-none p-6 bg-white border border-gray-100 shadow-[0_14px_40px_-30px_rgba(3,63,99,0.4)] hover:-translate-y-0.5 hover:border-brand-primary/30 transition-all"
            >
              <span className="flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary mb-4 group-hover:scale-105 transition-transform">
                <Icon size={26} weight="duotone" />
              </span>
              <h3 className="font-jakarta font-bold text-[18px] text-[#0B3B4C] leading-tight">
                {opt.title}
              </h3>
              <p className="font-montserrat text-[13px] text-gray-500 leading-snug mt-1.5">
                {opt.desc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-primary mt-4 group-hover:gap-2.5 transition-all">
                Wybieram
                <CaretRight size={14} weight="bold" />
              </span>
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 font-montserrat text-[12px] text-gray-400 mt-5">
        <Check size={13} weight="bold" className="text-brand-primary" />
        Spokojnie — wybór możesz później zmienić, wracając do tego kroku.
      </p>
    </motion.div>
  );
}
