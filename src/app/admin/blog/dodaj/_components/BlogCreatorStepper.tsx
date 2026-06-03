"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ListNumbers, TextT, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

const steps = [
  { id: 1, name: "Dane podstawowe", path: "/admin/blog/dodaj/dane-podstawowe", icon: ListNumbers, requiresId: false },
  { id: 2, name: "Edytor treści",   path: "/admin/blog/dodaj/edytor-tresci",   icon: TextT,        requiresId: true },
  { id: 3, name: "SEO",             path: "/admin/blog/dodaj/seo",              icon: MagnifyingGlass, requiresId: true },
];

function StepperContent() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const postId       = searchParams.get("id");

  let currentStepIndex = 0;
  if (pathname.includes("/edytor-tresci")) currentStepIndex = 1;
  else if (pathname.includes("/seo"))       currentStepIndex = 2;

  const handleStepClick = (stepPath: string, requiresId: boolean) => {
    if (requiresId && !postId) return;
    router.push(postId ? `${stepPath}?id=${postId}` : stepPath);
  };

  return (
    <div className="w-full mb-8 pt-4">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-gray-100 rounded-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-brand-primary rounded-full z-0 transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent   = index === currentStepIndex;
          const isLocked    = step.requiresId && !postId;
          const Icon        = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <button
                onClick={() => handleStepClick(step.path, step.requiresId)}
                disabled={isLocked || isCurrent}
                title={isLocked ? "Najpierw zapisz dane podstawowe" : `Przejdź do: ${step.name}`}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm ${
                  isLocked
                    ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed opacity-60"
                    : isCompleted
                      ? "bg-brand-primary border-brand-primary text-white hover:scale-105 cursor-pointer"
                      : isCurrent
                        ? "bg-white border-brand-primary text-brand-primary scale-110 cursor-default"
                        : "bg-white border-gray-200 text-gray-300 hover:border-brand-primary/40 cursor-pointer"
                }`}
              >
                {isCompleted ? <Check size={22} weight="bold" /> : <Icon size={22} weight={isCurrent ? "fill" : "regular"} />}
              </button>

              {/* Etykieta pod kółkiem — tylko na desktopie (na mobile nachodziłyby) */}
              <span
                className={`hidden sm:block font-montserrat text-xs md:text-sm font-semibold absolute top-[56px] whitespace-nowrap transition-colors duration-300 ${
                  isCurrent ? "text-brand-primary" : isCompleted ? "text-[#0B3B4C]" : isLocked ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop: miejsce w DOM na absolutne etykiety */}
      <div className="hidden sm:block h-10" />

      {/* Mobile: etykieta tylko aktywnego kroku (zero nachodzenia) */}
      <div className="sm:hidden mt-5 text-center">
        <span className="font-montserrat text-[11px] font-bold uppercase tracking-wider text-brand-primary/60">
          Krok {currentStepIndex + 1} z {steps.length}
        </span>
        <p className="font-jakarta text-[15px] font-bold text-brand-secondary mt-0.5">
          {steps[currentStepIndex].name}
        </p>
      </div>
    </div>
  );
}

export default function BlogCreatorStepper() {
  return (
    <Suspense fallback={<div className="w-full h-24" />}>
      <StepperContent />
    </Suspense>
  );
}
