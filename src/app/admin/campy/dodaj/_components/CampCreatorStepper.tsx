"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ListNumbers,
  Image as ImageIcon,
  Article,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    id: 1,
    name: "Dane podstawowe",
    path: "/admin/campy/dodaj/dane-podstawowe",
    icon: ListNumbers,
    requiresId: false, // Można tu wejść zawsze
  },
  {
    id: 2,
    name: "Edytor treści",
    path: "/admin/campy/dodaj/edytor-tresci",
    icon: ImageIcon,
    requiresId: true, // Wymaga ID do edycji
  },
  {
    id: 3,
    name: "Podsumowanie",
    path: "/admin/campy/dodaj/podsumowanie",
    icon: Article,
    requiresId: true, // Wymaga ID do edycji
  },
];

function StepperContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campId = searchParams.get("id");

  // Sprawdzamy na którym kroku jesteśmy (Domyślnie 0 - Dane podstawowe)
  let currentStepIndex = 0;
  if (pathname.includes("/edytor-tresci")) {
    currentStepIndex = 1;
  } else if (pathname.includes("/podsumowanie")) {
    currentStepIndex = 2;
  }

  const handleStepClick = (
    stepIndex: number,
    stepPath: string,
    requiresId: boolean,
  ) => {
    // 1. Zabezpieczenie: Jeśli krok wymaga ID, a my go nie mamy (ktoś nie zapisał kroku 1)
    if (requiresId && !campId) return;

    // 2. Budowanie docelowego URL
    const targetUrl = campId ? `${stepPath}?id=${campId}` : stepPath;

    // 3. Nawigacja
    router.push(targetUrl);
  };

  return (
    <div className="w-full mb-8 pt-4">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
        {/* Szara linia tła */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-gray-100 rounded-full z-0"></div>

        {/* Aktywna linia postępu */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-brand-primary rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
          }}
        ></div>

        {/* Kółka poszczególnych kroków */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          // Zablokowany, gdy nie mamy zapisanego Campa (brak ID), a krok tego wymaga
          const isLocked = step.requiresId && !campId;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <button
                onClick={() =>
                  handleStepClick(index, step.path, step.requiresId)
                }
                disabled={isLocked || isCurrent}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm ${
                  isLocked
                    ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed opacity-60" // Wygląd zablokowanego
                    : isCompleted
                      ? "bg-brand-primary border-brand-primary text-white hover:scale-105 cursor-pointer"
                      : isCurrent
                        ? "bg-white border-brand-primary text-brand-primary scale-110 cursor-default"
                        : "bg-white border-gray-200 text-gray-300 hover:border-brand-primary/40 hover:text-brand-primary/50 cursor-pointer" // Wygląd dostępnego do kliknięcia w przyszłości
                }`}
                title={
                  isLocked
                    ? "Najpierw zapisz dane podstawowe"
                    : `Przejdź do: ${step.name}`
                }
              >
                {isCompleted ? (
                  <Check size={22} weight="bold" />
                ) : (
                  <Icon size={22} weight={isCurrent ? "fill" : "regular"} />
                )}
              </button>

              {/* Tytuły kroków */}
              <span
                className={`font-montserrat text-xs md:text-sm font-semibold absolute top-[56px] whitespace-nowrap transition-colors duration-300 ${
                  isCurrent
                    ? "text-brand-primary"
                    : isCompleted
                      ? "text-[#0B3B4C]"
                      : isLocked
                        ? "text-gray-300"
                        : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pusty div robiący fizyczne miejsce w DOM na teksty pod kółkami */}
      <div className="h-10"></div>
    </div>
  );
}

// Główny eksport z wymaganym Suspense
export default function CampCreatorStepper() {
  return (
    <Suspense fallback={<div className="w-full h-24" />}>
      <StepperContent />
    </Suspense>
  );
}
