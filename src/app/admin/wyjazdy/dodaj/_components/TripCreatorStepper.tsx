"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ListNumbers,
  Image as ImageIcon,
  Article,
  MagnifyingGlass,
  Envelope,
} from "@phosphor-icons/react/dist/ssr";

const BASE_STEPS = [
  {
    id: 1,
    name: "Dane podstawowe",
    path: "/admin/wyjazdy/dodaj/dane-podstawowe",
    pathKey: "dane-podstawowe",
    icon: ListNumbers,
    requiresId: false,
    conditional: false,
  },
  {
    id: 2,
    name: "Edytor treści",
    path: "/admin/wyjazdy/dodaj/edytor-tresci",
    pathKey: "edytor-tresci",
    icon: ImageIcon,
    requiresId: true,
    conditional: false,
  },
  {
    id: 3,
    name: "E-mail",
    path: "/admin/wyjazdy/dodaj/zaproszenia",
    pathKey: "zaproszenia",
    icon: Envelope,
    requiresId: true,
    conditional: true, // widoczny tylko gdy allowBringFriend === true
  },
  {
    id: 4,
    name: "SEO",
    path: "/admin/wyjazdy/dodaj/seo",
    pathKey: "seo",
    icon: MagnifyingGlass,
    requiresId: true,
    conditional: false,
  },
  {
    id: 5,
    name: "Podsumowanie",
    path: "/admin/wyjazdy/dodaj/podsumowanie",
    pathKey: "podsumowanie",
    icon: Article,
    requiresId: true,
    conditional: false,
  },
];

function StepperContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get("id");

  const [allowBringFriend, setAllowBringFriend] = useState(false);
  const [lastStage, setLastStage] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setAllowBringFriend(false);
      setLastStage(null);
      return;
    }
    fetch(`/api/admin/wyjazdy/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        setAllowBringFriend(!!data.allowBringFriend);
        setLastStage(data.lastStage ?? null);
      })
      .catch(() => { setAllowBringFriend(false); setLastStage(null); });
  }, [tripId]);

  // Filtrujemy kroki: krok "E-mail" widoczny tylko gdy allowBringFriend
  const steps = BASE_STEPS.filter(
    (s) => !s.conditional || allowBringFriend,
  );

  // Aktywny krok na podstawie pathname
  const currentStepIndex = steps.findIndex((s) =>
    pathname.includes(`/${s.pathKey}`),
  );
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  // Najwyższy osiągnięty krok — na podstawie lastStage (trwałe, nie gubi się przy cofaniu)
  const lastStageIndex = lastStage
    ? steps.findIndex((s) => s.pathKey === lastStage)
    : -1;
  const maxReachedIndex = Math.max(activeIndex, lastStageIndex);

  const handleStepClick = (
    stepIndex: number,
    stepPath: string,
    requiresId: boolean,
  ) => {
    if (requiresId && !tripId) return;
    const targetUrl = tripId ? `${stepPath}?id=${tripId}` : stepPath;
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
            width: `${(activeIndex / (steps.length - 1)) * 100}%`,
          }}
        ></div>

        {/* Kółka poszczególnych kroków */}
        {steps.map((step, index) => {
          const isCompleted = index < maxReachedIndex;
          const isCurrent = index === activeIndex;
          const isLocked = step.requiresId && !tripId;
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
                    ? "bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed opacity-60"
                    : isCompleted
                      ? "bg-brand-primary border-brand-primary text-white hover:scale-105 cursor-pointer"
                      : isCurrent
                        ? "bg-white border-brand-primary text-brand-primary scale-110 cursor-default"
                        : "bg-white border-gray-200 text-gray-300 hover:border-brand-primary/40 hover:text-brand-primary/50 cursor-pointer"
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

              {/* Tytuły kroków — tylko desktop */}
              <span
                className={`hidden sm:block font-montserrat text-xs md:text-sm font-semibold absolute top-[56px] whitespace-nowrap transition-colors duration-300 ${
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

      {/* Desktop: miejsce w DOM na absolutne etykiety */}
      <div className="hidden sm:block h-10"></div>

      {/* Mobile: etykieta tylko aktywnego kroku */}
      <div className="sm:hidden mt-5 text-center">
        <span className="font-montserrat text-[11px] font-bold uppercase tracking-wider text-brand-primary/60">
          Krok {activeIndex + 1} z {steps.length}
        </span>
        <p className="font-jakarta text-[15px] font-bold text-brand-secondary mt-0.5">
          {steps[activeIndex]?.name}
        </p>
      </div>
    </div>
  );
}

export default function TripCreatorStepper() {
  return (
    <Suspense fallback={<div className="w-full h-24" />}>
      <StepperContent />
    </Suspense>
  );
}
