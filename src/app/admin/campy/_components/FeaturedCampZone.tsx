"use client";

import React, { useState, useEffect } from "react";
import { Star, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CampCard } from "../dodaj/edytor-tresci/_components/CampCard";
import { Camp } from "@/generated/prisma";

interface FeaturedCampZoneProps {
  featuredCamp: Camp | undefined;
  onUpdateFeaturedLocally: (campId: string | null) => void;
}

export function FeaturedCampZone({
  featuredCamp,
  onUpdateFeaturedLocally,
}: FeaturedCampZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- AUTOMATYCZNE USUWANIE PRZY UTRACIE STATUSU ---
  useEffect(() => {
    // Jeśli karta jest w Featured Zone, ale z jakiegoś powodu straciła status PUBLISHED
    // (np. wymuszony DRAFT z backendu po edycji), automatycznie zdejmujemy wyróżnienie.
    if (featuredCamp && featuredCamp.status !== "PUBLISHED" && !isProcessing) {
      updateFeaturedCampInDB(null);
      toast.info(
        "Wyróżniony wyjazd został usunięty ze strony głównej, ponieważ nie ma statusu 'Opublikowany'.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredCamp?.status]);

  // --- LOGIKA ZAPISU DO BAZY ---
  const updateFeaturedCampInDB = async (campId: string | null) => {
    setIsProcessing(true);

    if (campId !== null) {
      onUpdateFeaturedLocally(campId);
    }

    try {
      const response = await fetch("/api/admin/campy/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campId }),
      });

      if (!response.ok) throw new Error("Błąd podczas zapisywania");

      if (campId === null) {
        onUpdateFeaturedLocally(null);
      }

      if (campId) {
        toast.success("Zmieniono wyróżniony wyjazd na stronie głównej!");
      } else {
        toast.success("Usunięto wyjazd ze strony głównej");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas aktualizacji. Odśwież stronę.");
      if (campId !== null) {
        onUpdateFeaturedLocally(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLERY DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const droppedCampId = e.dataTransfer.getData("campId");
    if (!droppedCampId) return;

    updateFeaturedCampInDB(droppedCampId);
  };

  const handleUnfeature = (campId: string) => {
    if (isProcessing) return;
    updateFeaturedCampInDB(null);
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
          isProcessing &&
            "blur-[2px] opacity-70 animate-pulse pointer-events-none",
        )}
      >
        {featuredCamp ? (
          <CampCard
            camp={featuredCamp}
            isFeaturedZone
            onUnfeature={handleUnfeature}
            onChangeStatus={(id, newStatus) => {
              // Jeśli user ręcznie zmieni status na samej karcie w strefie wyróżnionej,
              // natychmiast wyrzucamy ją ze strefy (ponieważ tylko PUBLISHED może tu być)
              if (newStatus !== "PUBLISHED") {
                handleUnfeature(id);
              }
            }}
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
