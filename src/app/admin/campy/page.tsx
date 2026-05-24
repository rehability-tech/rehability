"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Plus,
  CircleNotch,
  Faders,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { CampCard } from "./_components/CampCard/CampCard";
import { FeaturedCampZone } from "./_components/FeaturedCampZone";
import { StatCards } from "./_components/StatCards";
import { Camp } from "@/generated/prisma";

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Wszystkie", value: "ALL" },
  { label: "Aktywne", value: "PUBLISHED" },
  { label: "Szkice", value: "DRAFT" },
  { label: "Archiwalne", value: "ARCHIVED" },
];

export default function AdminCampyList() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  // Stan i ref do mobilnego menu filtrów
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await fetch(
          `/api/admin/campy?t=${new Date().getTime()}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Błąd pobierania");
        const data = await response.json();
        setCamps(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCamps();
  }, []);

  // Zamknięcie mobilnego dropdownu po kliknięciu na zewnątrz
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    const activeCampsCount = camps.filter(
      (c) => c.status === "PUBLISHED",
    ).length;
    const totalCapacity = camps.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const totalViews = camps.reduce((acc, c) => acc + (c.views || 0), 0);

    const soldSeats = 0;
    const revenuePln = 0;

    return {
      activeCampsCount,
      totalCapacity,
      totalViews,
      soldSeats,
      revenuePln,
    };
  }, [camps]);

  const handleUpdateLocalStatus = (id: string, newStatus: string) => {
    setCamps((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  const handleFeatureCamp = async (campId: string | null) => {
    setCamps((prevCamps) =>
      prevCamps.map((camp) => ({
        ...camp,
        isFeatured: camp.id === campId,
      })),
    );

    try {
      const response = await fetch("/api/admin/campy/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campId }),
      });

      if (!response.ok) throw new Error("Błąd podczas zapisywania");

      if (campId) {
        toast.success("Zmieniono wyróżniony wyjazd na stronie głównej!");
      } else {
        toast.success("Usunięto wyjazd ze strony głównej");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas aktualizacji. Odśwież stronę.");
      setCamps((prevCamps) =>
        prevCamps.map((camp) => ({ ...camp, isFeatured: false })),
      );
    }
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
      className="max-w-6xl mx-auto p-4 sm:p-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
            Zarządzaj Campami
          </h1>
          <p className="font-montserrat text-gray-500 text-[15px] mt-1">
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
        <StatCards
          totalViews={stats.totalViews}
          soldSeats={stats.soldSeats}
          totalSeats={stats.totalCapacity}
          revenuePln={stats.revenuePln}
          activeCount={stats.activeCampsCount}
        />
      )}

      {!isLoading && (
        <FeaturedCampZone
          featuredCamp={featuredCamp}
          onUpdateFeatured={handleFeatureCamp}
        />
      )}

      {/* ========================================================= */}
      {/* SEKCJA FILTRÓW: WIDOK DESKTOP */}
      {/* ========================================================= */}
      <div className="hidden sm:flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
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

      {/* ========================================================= */}
      {/* SEKCJA FILTRÓW: WIDOK MOBILE (DROPDOWN) */}
      {/* ========================================================= */}
      <div className="sm:hidden relative mb-5 z-200" ref={filterMenuRef}>
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-[12px] px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-[#0B3B4C] font-semibold text-[13px]">
            <Faders size={18} weight="bold" />
            <span>
              Widok: {FILTERS.find((f) => f.value === filterStatus)?.label}
            </span>
          </div>
          <CaretDown
            size={16}
            weight="bold"
            className={cn(
              "text-gray-400 transition-transform duration-200",
              isFilterMenuOpen && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {isFilterMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.12)] rounded-[12px] p-2 flex flex-col gap-1"
            >
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setFilterStatus(filter.value);
                    setIsFilterMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full px-3 py-2.5 rounded-[8px] text-[13px] font-semibold transition-colors text-left",
                    filterStatus === filter.value
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* LISTA KART WYJAZDÓW */}
      {/* ========================================================= */}
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
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 px-4 text-center">
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
                onChangeStatus={handleUpdateLocalStatus}
                onFeature={() => handleFeatureCamp(camp.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
