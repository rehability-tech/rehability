"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Plus,
  CircleNotch,
  Faders,
  CaretDown,
  Campfire,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { TripCard } from "./_components/TripCard/TripCard";
import { FeaturedTripZone } from "./_components/FeaturedTripZone";
import { StatCards } from "./_components/StatCards";
import { Trip } from "@/generated/prisma";

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Wszystkie", value: "ALL" },
  { label: "Aktywne", value: "PUBLISHED" },
  { label: "Szkice", value: "DRAFT" },
  { label: "Archiwalne", value: "ARCHIVED" },
];

export default function AdminCampyList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  // Stan i ref do mobilnego menu filtrów
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await fetch(
          `/api/admin/wyjazdy?t=${new Date().getTime()}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Błąd pobierania");
        const data = await response.json();
        setTrips(data);
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
    const activeTripsCount = trips.filter(
      (c) => c.status === "PUBLISHED",
    ).length;
    const totalCapacity = trips.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const totalViews = trips.reduce((acc, c) => acc + (c.views || 0), 0);

    const soldSeats = 0; // Docelowo: połączone z rezerwacjami
    const revenuePln = 0; // Docelowo: połączone z rezerwacjami

    return {
      activeTripsCount,
      totalCapacity,
      totalViews,
      soldSeats,
      revenuePln,
    };
  }, [trips]);

  const handleUpdateLocalStatus = (id: string, newStatus: string) => {
    setTrips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  const handleFeatureCamp = async (tripId: string | null) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) => ({
        ...trip,
        isFeatured: trip.id === tripId,
      })),
    );

    try {
      const response = await fetch("/api/admin/wyjazdy/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId }),
      });

      if (!response.ok) throw new Error("Błąd podczas zapisywania");

      if (tripId) {
        toast.success("Zmieniono wyróżniony wyjazd na stronie głównej!");
      } else {
        toast.success("Usunięto wyjazd ze strony głównej");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas aktualizacji. Odśwież stronę.");
      setTrips((prevTrips) =>
        prevTrips.map((trip) => ({ ...trip, isFeatured: false })),
      );
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("tripId", id);
  };

  const featuredTrip = trips.find((c) => c.isFeatured);
  const filteredListTrips = trips.filter((c) => {
    if (c.isFeatured) return false;
    if (filterStatus === "ALL") return true;
    return c.status === filterStatus;
  });

  return (
    <div className="relative min-h-screen">
      {/* --- BRANDOWE ROZMYTE AKCENTY W TLE --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-gray-100/80 pb-6">
          <div>
            <h1 className="text-[28px] md:text-[34px] font-jakarta font-bold text-brand-secondary leading-tight">
              Zarządzaj Wyjazdami
            </h1>
            <p className="font-montserrat text-brand-secondary/50 font-medium text-[14px] mt-1.5 max-w-xl leading-relaxed">
              Przeglądaj wszystkie campy w jednym miejscu. Wybierz konkretny
              wyjazd, aby zarządzać uczestnikami, harmonogramem i finansami.
            </p>
          </div>

          {/* Luksusowy przycisk dodawania */}
          <Link
            href="/admin/wyjazdy/dodaj/dane-podstawowe"
            className="group relative inline-flex items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-gradient-to-br from-brand-primary from-[50%] to-brand-yellow text-white font-bold text-[13.5px] shadow-[0_6px_20px_-4px_rgba(40,125,136,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(40,125,136,0.5)] transition-all duration-300 overflow-hidden shrink-0"
          >
            <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={18} weight="bold" />
              Dodaj nowy Trip
            </span>
          </Link>
        </header>

        {!isLoading && (
          <div className="mb-8">
            <StatCards
              totalViews={stats.totalViews}
              soldSeats={stats.soldSeats}
              totalSeats={stats.totalCapacity}
              revenuePln={stats.revenuePln}
              activeCount={stats.activeTripsCount}
            />
          </div>
        )}

        {!isLoading && (
          <div className="mb-8">
            <FeaturedTripZone
              featuredTrip={featuredTrip}
              onUpdateFeatured={handleFeatureCamp}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* SEKCJA FILTRÓW: WIDOK DESKTOP */}
        {/* ========================================================= */}
        <div className="hidden sm:flex items-center gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={cn(
                "relative overflow-hidden px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 whitespace-nowrap cursor-pointer",
                filterStatus === filter.value
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] border border-brand-primary/20"
                  : "bg-white/60 backdrop-blur-sm border border-white/60 text-brand-secondary/60 hover:bg-white/90 hover:text-brand-secondary shadow-sm",
              )}
            >
              {filterStatus === filter.value && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
              )}
              <span className="relative z-10">{filter.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* SEKCJA FILTRÓW: WIDOK MOBILE (DROPDOWN) */}
        {/* ========================================================= */}
        <div className="sm:hidden relative mb-6 z-40" ref={filterMenuRef}>
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="w-full flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/60 rounded-[16px] px-5 py-3.5 shadow-sm hover:bg-white/80 transition-all"
          >
            <div className="flex items-center gap-2.5 text-brand-secondary font-bold text-[13.5px]">
              <Faders size={18} weight="bold" className="text-brand-primary" />
              <span>
                Widok: {FILTERS.find((f) => f.value === filterStatus)?.label}
              </span>
            </div>
            <CaretDown
              size={16}
              weight="bold"
              className={cn(
                "text-brand-secondary/50 transition-transform duration-300",
                isFilterMenuOpen && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_15px_40px_-10px_rgba(3,63,99,0.15)] rounded-[20px] p-2 flex flex-col gap-1 z-50"
              >
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setFilterStatus(filter.value);
                      setIsFilterMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 rounded-[14px] text-[13.5px] font-bold transition-all text-left",
                      filterStatus === filter.value
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-brand-secondary/60 hover:bg-white/80 hover:text-brand-secondary",
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
        <div className="flex flex-col gap-4 sm:gap-6 relative min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm rounded-[28px] border border-white/40">
              <CircleNotch
                size={36}
                weight="bold"
                className="text-brand-primary animate-spin mb-3"
              />
              <p className="text-[12px] font-bold uppercase tracking-widest text-brand-primary/60">
                Wczytywanie bazy...
              </p>
            </div>
          )}

          {!isLoading && filteredListTrips.length === 0 && (
            <div className="bg-white/40 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-sm flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Campfire
                  size={32}
                  weight="duotone"
                  className="text-brand-primary/50"
                />
              </div>
              <h3 className="font-jakarta font-bold text-xl text-brand-secondary mb-2">
                Brak wyjazdów
              </h3>
              <p className="font-montserrat text-[14px] font-medium text-brand-secondary/50 max-w-sm leading-relaxed">
                Nie znaleziono wyjazdów pasujących do wybranego filtra. Dodaj
                nowy wyjazd lub zmień kryteria.
              </p>
            </div>
          )}

          {!isLoading && (
            <AnimatePresence>
              {filteredListTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDragStart={handleDragStart}
                  onChangeStatus={handleUpdateLocalStatus}
                  onFeature={() => handleFeatureCamp(trip.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
