"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
    path: "/admin/campy/dodaj",
    icon: ListNumbers,
  },
  {
    id: 2,
    name: "Edytor treści",
    path: "/admin/campy/dodaj/nakladki",
    icon: ImageIcon,
  },
  {
    id: 3,
    name: "Podsumowanie",
    path: "/admin/campy/dodaj/tresci",
    icon: Article,
  },
];

export default function CampCreatorStepper() {
  const pathname = usePathname();

  // Sprawdzamy na którym kroku jesteśmy
  let currentStepIndex = 0;
  if (pathname.includes("/tresci")) {
    currentStepIndex = 2;
  } else if (pathname.includes("/nakladki")) {
    currentStepIndex = 1;
  }

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
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? "bg-brand-primary border-brand-primary text-white"
                    : isCurrent
                      ? "bg-white border-brand-primary text-brand-primary scale-110"
                      : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {isCompleted ? (
                  <Check size={22} weight="bold" />
                ) : (
                  <Icon size={22} weight={isCurrent ? "fill" : "regular"} />
                )}
              </div>

              {/* Tytuły kroków - używają absolute żeby nie rozpychać flexa, ale dodajemy pusty div niżej żeby zrobić na nie miejsce */}
              <span
                className={`font-montserrat text-xs md:text-sm font-semibold absolute top-[56px] whitespace-nowrap transition-colors duration-300 ${
                  isCurrent
                    ? "text-brand-primary"
                    : isCompleted
                      ? "text-[#0B3B4C]"
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
