"use client";

import React, { useState, useEffect } from "react";
import { Star, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TripCard } from "./TripCard/TripCard";
import { Trip } from "@/generated/prisma";

interface FeaturedCampZoneProps {
  featuredTrip: Trip | undefined;
  onUpdateFeatured: (tripId: string | null) => void;
}

export function FeaturedTripZone({
  featuredTrip,
  onUpdateFeatured,
}: FeaturedCampZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // AUTOMATYCZNE USUWANIE PRZY UTRACIE STATUSU
  useEffect(() => {
    if (featuredTrip && featuredTrip.status !== "PUBLISHED") {
      onUpdateFeatured(null);
      toast.info(
        "Wyróżniony wyjazd został usunięty ze strony głównej, ponieważ nie ma statusu 'Opublikowany'.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTrip?.status]);

  // HANDLERY DRAG & DROP
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedCampId = e.dataTransfer.getData("tripId");
    if (!droppedCampId) return;

    onUpdateFeatured(droppedCampId);
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
            : featuredTrip
              ? "border-transparent"
              : "border-dashed border-gray-200 bg-gray-50/50",
        )}
      >
        {featuredTrip ? (
          <TripCard
            trip={featuredTrip}
            isFeaturedZone
            onUnfeature={() => onUpdateFeatured(null)}
            onChangeStatus={(id, newStatus) => {
              if (newStatus !== "PUBLISHED") {
                onUpdateFeatured(null);
              }
            }}
          />
        ) : (
          <div className="text-center p-8 pointer-events-none">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-300">
              <DotsSixVertical size={24} weight="bold" />
            </div>
            <p className="text-gray-500 font-montserrat text-sm font-medium">
              Przeciągnij tutaj wyjazd z listy poniżej, lub użyj ikony gwiazdki{" "}
              <Star size={14} weight="bold" className="inline text-gray-400" />{" "}
              na karcie,
              <br className="hidden sm:block" /> aby wyróżnić go na stronie
              głównej.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
