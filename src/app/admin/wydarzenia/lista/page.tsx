"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import { TripCard } from "../_components/TripCard/TripCard";
import { FeaturedTripZone } from "../_components/FeaturedTripZone";

import { Trip } from "@/generated/prisma";

// Wydarzenie z listy wzbogacone o liczbę zapisanych uczestniczek (z `_count`).
type TripListItem = Trip & { _count?: { bookings: number } };

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Wszystkie", value: "ALL" },
  { label: "Aktywne", value: "PUBLISHED" },
  { label: "Szkice", value: "DRAFT" },
  { label: "Archiwalne", value: "ARCHIVED" },
];

const isFilterStatus = (v: string | null): v is FilterStatus =>
  v === "ALL" || v === "PUBLISHED" || v === "DRAFT" || v === "ARCHIVED";

export default function AdminCampyList() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    isFilterStatus(urlStatus) ? urlStatus : "ALL",
  );

  // Stan i ref do mobilnego menu filtrów
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await fetch(
          `/api/admin/wydarzenia?t=${new Date().getTime()}`,
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

  const handleUpdateLocalStatus = (id: string, newStatus: string) => {
    setTrips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  // Usunięcie wydarzenia z listy po skutecznym DELETE w karcie.
  const handleDeleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleFeatureCamp = async (tripId: string | null) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) => ({
        ...trip,
        isFeatured: trip.id === tripId,
      })),
    );

    try {
      const response = await fetch("/api/admin/wydarzenia/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId }),
      });

      if (!response.ok) throw new Error("Błąd podczas zapisywania");

      if (tripId) {
        toast.success("Zmieniono wyróżnione wydarzenie na stronie głównej!");
      } else {
        toast.success("Usunięto wydarzenie ze strony głównej");
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

  // Wspólny nagłówek sekcji (akcent w stylu panelu pojedynczego wydarzenia)
  const SectionHeading = ({
    title,
    count,
  }: {
    title: string;
    count?: number;
  }) => (
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-brand-primary to-brand-yellow" />
      <h2 className="font-jakarta text-lg font-bold text-brand-secondary">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 text-brand-secondary/40 font-semibold text-sm">
            ({count})
          </span>
        )}
      </h2>
    </div>
  );

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
        className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8"
      >
        {/* ========================================================= */}
        {/* HERO HEADER (gradient brandowy, glassmorphism)            */}
        {/* ========================================================= */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
          {/* Tło: brandowy gradient + poświaty */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
                <Campfire
                  size={14}
                  weight="fill"
                  className="text-brand-yellow"
                />
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  Centrum wydarzeń
                </span>
              </div>
              <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
                Zarządzaj Wydarzenieami
              </h1>
              <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
                Przeglądaj wszystkie wydarzenia w jednym miejscu. Wybierz
                konkretne wydarzenie, aby zarządzać uczestnikami, harmonogramem
                i finansami.
              </p>
            </div>

            {/* Przycisk dodawania (biały, premium) */}
            <Link
              href="/admin/wydarzenia/dodaj/dane-podstawowe"
              className="group relative inline-flex items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-white text-brand-secondary font-bold text-[13.5px] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shrink-0 border border-white/40"
            >
              <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                <Plus size={18} weight="bold" className="text-brand-primary" />
                Dodaj nowe
              </span>
            </Link>
          </div>
        </header>

        {/* ========================================================= */}
        {/* WYRÓŻNIONE WYDARZENIE */}
        {/* ========================================================= */}
        {!isLoading && (
          <section className="flex flex-col gap-4">
            <SectionHeading title="Wyróżniony na stronie głównej" />
            <FeaturedTripZone
              featuredTrip={featuredTrip}
              onUpdateFeatured={handleFeatureCamp}
              onDelete={handleDeleteTrip}
            />
          </section>
        )}

        {/* ========================================================= */}
        {/* LISTA WYDARZEŃ + FILTRY */}
        {/* ========================================================= */}
        <section className="flex flex-col gap-5">
          {/* Nagłówek sekcji + filtry desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeading
              title="Wszystkie wydarzenia"
              count={filteredListTrips.length}
            />

            <div className="hidden sm:flex items-center gap-2 overflow-x-auto custom-scrollbar">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={cn(
                    "relative overflow-hidden px-4 py-2 rounded-full text-[12.5px] font-bold transition-all duration-300 whitespace-nowrap cursor-pointer",
                    filterStatus === filter.value
                      ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                      : "bg-white/60 backdrop-blur-sm border border-white/60 text-brand-secondary/60 hover:bg-white/90 hover:text-brand-secondary shadow-sm",
                  )}
                >
                  {filterStatus === filter.value && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-yellow/40 rounded-full blur-md pointer-events-none" />
                  )}
                  <span className="relative z-10">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtry mobile (dropdown) */}
          <div className="sm:hidden relative z-40" ref={filterMenuRef}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="w-full flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/60 rounded-[16px] px-5 py-3.5 shadow-sm hover:bg-white/80 transition-all"
            >
              <div className="flex items-center gap-2.5 text-brand-secondary font-bold text-[13.5px]">
                <Faders
                  size={18}
                  weight="bold"
                  className="text-brand-primary"
                />
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

          {/* Karty wydarzeń */}
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
              <div className="bg-white/40 backdrop-blur-xl rounded-[28px] rounded-tr-none border border-white/60 shadow-sm flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Campfire
                    size={32}
                    weight="duotone"
                    className="text-brand-primary/50"
                  />
                </div>
                <h3 className="font-jakarta font-bold text-xl text-brand-secondary mb-2">
                  Brak wydarzeń
                </h3>
                <p className="font-montserrat text-[14px] font-medium text-brand-secondary/50 max-w-sm leading-relaxed">
                  Nie znaleziono wydarzeń pasujących do wybranego filtra. Dodaj
                  nowe wydarzenie lub zmień kryteria.
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
                    onDelete={handleDeleteTrip}
                    activeBookings={trip._count?.bookings ?? 0}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
