"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleNotch,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { EMPTY_HEALTH, type HealthData } from "./health-types";
import HealthSummary from "./HealthSummary";
import WelcomeStep from "./WelcomeStep";
import DietStep from "./DietStep";
import ConditionsStep from "./ConditionsStep";
import EmergencyStep from "./EmergencyStep";

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 30 : -30,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 30 : -30,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] as const },
  }),
};

export default function HealthForm({
  initial,
}: {
  initial: HealthData | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/");
  // URL: /panel/wyjazdy/[bookingId]/karta-zdrowia → segments[3] to bookingId
  const bookingId = segments[3];

  const [data, setData] = useState<HealthData>(initial ?? EMPTY_HEALTH);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isFilledInitially = !!initial?.emergencyPhone;
  const [mode, setMode] = useState<"summary" | "wizard">(
    isFilledInitially ? "summary" : "wizard",
  );
  const [step, setStep] = useState(isFilledInitially ? 0 : -1);
  const [direction, setDirection] = useState(1);

  const topRef = useRef<HTMLDivElement>(null);
  const progress = step >= 0 ? ((step + 1) / TOTAL_STEPS) * 100 : 0;

  useEffect(() => {
    if (step >= 0 && mode === "wizard") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step, mode]);

  const setField = <K extends keyof HealthData>(
    key: K,
    value: HealthData[K],
  ) => {
    setSaved(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfileData = async (isFinal = false) => {
    const res = await fetch("/api/panel/health-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, bookingId, isFinal }),
    });
    if (!res.ok) throw new Error("Błąd zapisu");
  };

  const startSurvey = () => {
    setDirection(1);
    setStep(0);
  };

  const startEdit = () => {
    setMode("wizard");
    setDirection(1);
    setStep(0);
  };

  const handleNextStep = async () => {
    if (step < TOTAL_STEPS - 1) {
      setSaving(true);
      try {
        await saveProfileData();
        setDirection(1);
        setStep((p) => p + 1);
      } catch {
        toast.error("Wystąpił problem przy zapisie postępu.");
      } finally {
        setSaving(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((p) => p - 1);
    } else if (step === 0) {
      if (isFilledInitially) {
        router.back();
      } else {
        setDirection(-1);
        setStep(-1);
      }
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfileData(true);
      setSaved(true);
      toast.success("Karta zdrowia zaktualizowana!");
      router.push(`/panel/wyjazdy/${bookingId}`);
    } catch {
      toast.error("Nie udało się zapisać danych.");
      setSaving(false);
    }
  };

  if (mode === "summary") {
    return <HealthSummary data={data} onEdit={startEdit} />;
  }

  return (
    <div className="flex flex-col w-full min-h-[60vh]">
      <div ref={topRef} className="-mt-6 pt-6" />

      {/* PASEK POSTĘPU */}
      <AnimatePresence>
        {step >= 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 shrink-0"
          >
            <div className="flex justify-between items-center mb-2 mt-2">
              <span className="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                Krok {step + 1} z {TOTAL_STEPS}
              </span>
              <span className="text-[11px] font-bold text-brand-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-yellow rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleFinalSubmit}
        className="flex-1 flex flex-col relative"
      >
        <div className="relative flex-1 flex flex-col overflow-x-hidden px-1">
          <AnimatePresence mode="wait" custom={direction}>
            {step === -1 && (
              <motion.div
                key="step-welcome"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <WelcomeStep />
              </motion.div>
            )}

            {step === 0 && (
              <motion.div
                key="step-diet"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <DietStep data={data} setField={setField} />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-conditions"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <ConditionsStep data={data} setField={setField} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-emergency"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <EmergencyStep data={data} setField={setField} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PRZYCISKI NAWIGACYJNE WIZARDA */}
        <div className="mt-8 pt-4 flex items-center justify-between gap-3 border-t border-gray-100/60 shrink-0">
          {step === -1 ? (
            <button
              type="button"
              onClick={startSurvey}
              className="group relative overflow-hidden w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold h-12 rounded-[16px] shadow-[0_6px_16px_-4px_rgba(40,125,136,0.4)] hover:bg-[#1f646d] transition-all duration-300"
            >
              <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10 flex items-center gap-1.5 text-[13.5px]">
                Rozpocznij Ankietę
                <ArrowRight size={16} weight="bold" />
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={prevStep}
                disabled={saving}
                className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-white border border-gray-100 shadow-sm text-brand-secondary hover:bg-gray-50 hover:border-gray-200 transition-all shrink-0 disabled:opacity-50"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={saving}
                  className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white font-bold h-12 rounded-[16px] shadow-[0_6px_16px_-4px_rgba(40,125,136,0.4)] hover:bg-[#1f646d] transition-colors disabled:opacity-70"
                >
                  <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
                  <span className="relative z-10 flex items-center gap-1.5 text-[13.5px]">
                    {saving ? (
                      <>
                        <CircleNotch size={18} className="animate-spin" />
                        Zapisuję...
                      </>
                    ) : (
                      <>
                        Następny krok
                        <ArrowRight size={16} weight="bold" />
                      </>
                    )}
                  </span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="group relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white font-bold h-12 rounded-[16px] shadow-[0_6px_16px_-4px_rgba(40,125,136,0.4)] hover:bg-[#1f646d] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                  <span className="relative z-10 flex items-center gap-1.5 text-[13.5px]">
                    {saving ? (
                      <CircleNotch size={18} className="animate-spin" />
                    ) : saved ? (
                      <CheckCircle size={18} weight="fill" />
                    ) : (
                      <ShieldCheck size={18} weight="bold" />
                    )}
                    <span>
                      {saving
                        ? "Zapisuję..."
                        : saved
                          ? "Gotowe!"
                          : "Zapisz Kartę"}
                    </span>
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
