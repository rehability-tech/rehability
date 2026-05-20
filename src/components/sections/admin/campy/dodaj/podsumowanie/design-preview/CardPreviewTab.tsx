"use client";

import React from "react";
import Image from "next/image";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

// ==========================================
// FUNKCJE POMOCNICZE
// ==========================================
const formatDateRange = (start: any, end: any) => {
  if (!start) return "Wkrótce";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };

  if (!endDate) {
    return startDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      ...monthOptions,
      year: "numeric",
    });
  }
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}–${endDate.getDate()}.${(
      startDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${startDate.getFullYear()}`;
  }
  return `${startDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} - ${endDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

// Dodano viewMode do propsów, aby komponent wiedział, co ma renderować
interface CardPreviewTabProps {
  camp: any;
  viewMode?: "desktop" | "mobile";
}

// ==========================================
// KOMPONENT PODGLĄDU KARTY
// ==========================================
export default function CardPreviewTab({
  camp,
  viewMode = "desktop",
}: CardPreviewTabProps) {
  const isMobile = viewMode === "mobile";

  // Bezpieczne dekodowanie lokalizacji
  let displayLocation = "Wkrótce";
  if (camp?.location) {
    try {
      const parsed =
        typeof camp.location === "string"
          ? JSON.parse(camp.location)
          : camp.location;
      displayLocation = parsed.city || parsed.name || "Wkrótce";
    } catch (e) {
      displayLocation = camp.location;
    }
  }

  return (
    <div className="w-full flex flex-col p-6 px-0 items-center justify-center min-h-[400px] overflow-hidden">
      {isMobile ? (
        // ==========================================================
        // 1. WARIANT MOBILE (Układ pionowy "kanapka", nachodzący na siebie)
        // Odzwierciedla w 100% układ max-[1090px] z Twojej karty
        // ==========================================================
        <div className="w-full max-w-[380px] pointer-events-none">
          <div className="flex flex-col w-full group items-stretch gap-0">
            {/* ZDJĘCIE KARTY (zmniejszone do 90% i wycentrowane) */}
            <div className="relative w-[90%] h-[240px] rounded-[24px] overflow-hidden shrink-0 shadow-sm self-center bg-gray-100 z-10">
              <Image
                src={camp?.heroImage || "/images/static/camp.png"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                alt={camp?.title || "Zdjęcie wyjazdu"}
              />
            </div>

            {/* BLOK Z KONTENTEM (-mt-12 wpycha tekst pod zdjęcie, pt-18 robi miejsce) */}
            <div className="flex flex-col flex-1 p-6 bg-white border border-[#287D88]/20 rounded-[26px] shadow-sm gap-6 hover:shadow-md transition-shadow -mt-12 pt-[72px] relative z-0">
              <div className="flex flex-col items-center text-center gap-4 flex-1">
                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1 rounded-full">
                  <CalendarBlank size={16} />
                  <span>{formatDateRange(camp?.startDate, camp?.endDate)}</span>
                </div>

                <div>
                  <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] mb-3">
                    {camp?.title || "Nazwa wyjazdu"}
                  </h3>
                  <p className="font-montserrat text-[14px] text-gray-500 leading-[160%] w-full line-clamp-3">
                    {camp?.subtitle ||
                      "Dołącz do tego wyjątkowego wydarzenia i przeżyj wspaniały czas pod okiem naszych specjalistów."}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1.5 rounded-full mt-auto">
                  <MapPin size={16} />
                  <span>{displayLocation}</span>
                </div>
              </div>

              {/* Sekcja z ceną i przyciskiem ułożona pod sobą jak na mobilce */}
              <div className="flex flex-col items-center gap-4 py-2 mt-2 border-t border-gray-100/50 pt-4">
                <span className="font-jakarta font-bold text-[24px] text-[#0B3B4C] block text-center">
                  {camp?.price ? `od ${camp.price} zł` : "Sprawdź cennik"}
                </span>
                <Button showArrow className="w-full">
                  Poznaj szczegóły
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ==========================================================
        // 2. WARIANT DESKTOP (Układ poziomy z przeskalowaniem na małe okno)
        // Odzwierciedla w 100% układ min-[1090px] z Twojej karty
        // ==========================================================
        <div className="w-[120%] pointer-events-none transform scale-[0.75] xl:scale-[0.85] origin-center transition-transform duration-300">
          <div className="flex flex-row items-stretch gap-3 w-full group mx-auto">
            {/* ZDJĘCIE KARTY */}
            <div className="relative w-[320px] h-[260px] rounded-[24px] overflow-hidden shrink-0 shadow-sm bg-gray-100 z-10">
              <Image
                src={camp?.heroImage || "/images/static/camp.png"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                alt={camp?.title || "Zdjęcie wyjazdu"}
              />
            </div>

            {/* BLOK Z KONTENTEM */}
            <div className="flex flex-row justify-between flex-1 p-8 bg-white border border-[#287D88]/20 rounded-[26px] shadow-sm gap-8 hover:shadow-md transition-shadow z-0">
              <div className="flex flex-col items-start gap-4 flex-1">
                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1 rounded-full">
                  <CalendarBlank size={16} />
                  <span>{formatDateRange(camp?.startDate, camp?.endDate)}</span>
                </div>

                <div>
                  <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] mb-3">
                    {camp?.title || "Nazwa wyjazdu"}
                  </h3>
                  <p className="font-montserrat text-[14px] text-gray-500 max-w-[95%] leading-[160%] line-clamp-3">
                    {camp?.subtitle ||
                      "Dołącz do tego wyjątkowego wydarzenia i przeżyj wspaniały czas pod okiem naszych specjalistów."}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1.5 rounded-full mt-auto">
                  <MapPin size={16} />
                  <span>{displayLocation}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end shrink-0 py-2">
                <span className="font-jakarta font-bold text-[24px] text-[#0B3B4C] block text-right">
                  {camp?.price ? `od ${camp.price} zł` : "Sprawdź cennik"}
                </span>
                <Button showArrow className="w-full">
                  Poznaj szczegóły
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
