"use client";

import React, { useState } from "react";
import { Star, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CampCard, CampData } from "../dodaj/edytor-tresci/_components/CampCard";

interface FeaturedCampZoneProps {
  featuredCamp: CampData | undefined;
  onUpdateFeaturedLocally: (campId: string | null) => void;
}

export function FeaturedCampZone({
  featuredCamp,
  onUpdateFeaturedLocally,
}: FeaturedCampZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // NOWY STAN: Kontroluje wizualne ładowanie (rozmycie/pulsowanie)
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOGIKA ZAPISU DO BAZY ---
  const updateFeaturedCampInDB = async (campId: string | null) => {
    // 1. Zaczynamy ładowanie (włącza się blur)
    setIsProcessing(true);

    // 2. Jeśli DODAJEMY nową kartę (przeciągnięcie), aktualizujemy UI natychmiast.
    // Jeśli USUWAMY (kliknięcie 'X', czyli campId to null), NIE robimy nic, żeby stara karta została na ekranie z blurem.
    if (campId !== null) {
      onUpdateFeaturedLocally(campId);
    }

    try {
      // 3. Wywołanie API do bazy w tle
      const response = await fetch("/api/admin/campy/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campId }),
      });

      if (!response.ok) throw new Error("Błąd podczas zapisywania");

      // 4. Jeśli operacją było USUNIĘCIE, to DOPIERO TERAZ zdejmujemy kartę z widoku
      if (campId === null) {
        onUpdateFeaturedLocally(null);
      }

      if (campId)
        toast.success("Zmieniono wyróżniony wyjazd na stronie głównej!");
      else toast.success("Usunięto wyjazd ze strony głównej");
    } catch (error) {
      toast.error("Wystąpił błąd podczas aktualizacji. Odśwież stronę.");
      // Cofamy optymistyczną zmianę tylko jeśli próbowaliśmy coś dodać
      if (campId !== null) {
        onUpdateFeaturedLocally(null);
      }
    } finally {
      // 5. Wyłączamy efekt ładowania - karta (lub pusty placeholder) staje się ostra
      setIsProcessing(false);
    }
  };

  // --- HANDLERY DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Wymagane, aby upuścić element
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return; // Zabezpieczenie przed dropowaniem podczas ładowania

    // Odbieramy ID z przeciąganego elementu
    const droppedCampId = e.dataTransfer.getData("campId");
    if (!droppedCampId) return;

    updateFeaturedCampInDB(droppedCampId);
  };

  const handleUnfeature = (campId: string) => {
    if (isProcessing) return;
    updateFeaturedCampInDB(null); // Null resetuje wyróżnienie - uruchomi logikę usuwania
  };

  return (
    <div className="mb-8 animate-in fade-in duration-500">
      <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Star size={16} weight="fill" className="text-amber-400" /> Wyróżniony
        na stronie głównej
      </h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-[24px] border-2 transition-all duration-300 min-h-[140px] flex flex-col justify-center",
          isDragOver
            ? "border-brand-primary bg-brand-primary/5 scale-[1.01]"
            : featuredCamp
              ? "border-transparent"
              : "border-dashed border-gray-200 bg-gray-50/50",
          // --- EFEKT ŁADOWANIA ---
          // Jeśli ładujemy -> nakładamy blur, pulsowanie i wyłączamy klikanie
          isProcessing &&
            "blur-[2px] opacity-70 animate-pulse pointer-events-none",
        )}
      >
        {featuredCamp ? (
          <CampCard
            camp={featuredCamp}
            isFeaturedZone
            onUnfeature={handleUnfeature}
          />
        ) : (
          <div className="text-center p-8 pointer-events-none">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-300">
              <DotsSixVertical size={24} weight="bold" />
            </div>
            <p className="text-gray-500 font-montserrat text-sm font-medium">
              Przeciągnij tutaj wyjazd z listy poniżej,{" "}
              <br className="hidden sm:block" /> aby wyróżnić go na stronie
              głównej.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
