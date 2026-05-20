"use client";

import React, { useEffect, useState } from "react";
import { Plus, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { CampCard } from "./dodaj/edytor-tresci/_components/CampCard";
import { FeaturedCampZone } from "./_components/FeaturedCampZone";
import { Camp } from "@/generated/prisma";

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

export default function AdminCampyList() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        // Zamiast: const response = await fetch("/api/admin/campy");
        const response = await fetch(
          `/api/admin/campy?t=${new Date().getTime()}`,
          {
            cache: "no-store", // Wyłączamy cache Next.js dla tego konkretnego zapytania
          },
        );
        if (!response.ok) throw new Error("Błąd pobierania");
        const data = await response.json();
        console.log("Data from campy response", data);

        setCamps(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCamps();
  }, []);

  // Prosty updater lokalny wywoływany przez kartę, żeby zniknęła z danej zakładki po edycji
  const handleUpdateLocalStatus = (id: string, newStatus: string) => {
    setCamps((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  const handleUpdateFeaturedLocally = (campId: string | null) => {
    setCamps((prevCamps) =>
      prevCamps.map((camp) => ({
        ...camp,
        isFeatured: camp.id === campId,
      })),
    );
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("campId", id);
  };

  const featuredCamp = camps.find((c) => c.isFeatured);
  const filteredListCamps = camps.filter((c) => {
    if (c.isFeatured) return false;
    if (filterStatus === "ALL") return true;
    return c.status === filterStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
            Zarządzaj Campami
          </h1>
          <p className="font-montserrat text-paragraph text-gray-500 text-[15px] mt-1">
            Lista wyjazdów. Wybierz camp, aby zarządzać uczestnikami i wpłatami.
          </p>
        </div>

        <Button
          href="/admin/campy/dodaj/dane-podstawowe"
          rightIcon={<Plus size={18} weight="bold" />}
        >
          Dodaj nowy Camp
        </Button>
      </header>

      {!isLoading && (
        <FeaturedCampZone
          featuredCamp={featuredCamp}
          onUpdateFeaturedLocally={handleUpdateFeaturedLocally}
        />
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { label: "Wszystkie", value: "ALL" },
          { label: "Aktywne", value: "PUBLISHED" },
          { label: "Szkice", value: "DRAFT" },
          { label: "Archiwalne", value: "ARCHIVED" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value as FilterStatus)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer",
              filterStatus === filter.value
                ? "bg-[#0B3B4C] text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-[#0B3B4C]",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px]">
            <CircleNotch
              size={32}
              weight="bold"
              className="text-brand-primary animate-spin mb-4"
            />
            <p className="text-sm font-montserrat text-gray-500 font-medium">
              Wczytywanie campów...
            </p>
          </div>
        )}

        {!isLoading && filteredListCamps.length === 0 && (
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 px-4 text-center">
            <h3 className="font-jakarta font-bold text-lg text-[#0B3B4C] mb-2">
              Brak wyjazdów
            </h3>
            <p className="font-montserrat text-sm text-gray-500 max-w-sm">
              Nie znaleziono campów dla wybranego filtru.
            </p>
          </div>
        )}

        {!isLoading && (
          <AnimatePresence>
            {filteredListCamps.map((camp) => (
              <CampCard
                key={camp.id}
                camp={camp}
                onDragStart={handleDragStart}
                onChangeStatus={handleUpdateLocalStatus} // Przekazujemy CZYSTY lokalny updater
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
