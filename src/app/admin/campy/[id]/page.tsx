"use client";

import React, { useEffect, useState, use } from "react";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

import { CampHeroCard } from "./_components/CampHeroCard";
import { Camp } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { CampParticipantsList } from "./_components/CampParticipantsList";
import { CampActivityAndSchedule } from "./_components/CampActivityAndSchedule";

function formatDateRange(start: Date | string, end: Date | string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    return `${format(startDate, "d")} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  } else if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMMM", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  }
  return `${format(startDate, "d MMMM yyyy", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
}

function formatLocation(location: unknown): string {
  if (!location) return "Brak lokalizacji";
  if (typeof location !== "string") {
    const obj = location as { city?: string; name?: string };
    return obj.city || obj.name || "Brak lokalizacji";
  }
  try {
    const parsed = JSON.parse(location);
    return parsed.city || parsed.name || "Brak lokalizacji";
  } catch {
    return location || "Brak lokalizacji";
  }
}

export default function CampDashboardPage() {
  const { id } = useParams();

  const [camp, setCamp] = useState<Camp | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const response = await fetch(`/api/admin/campy/${id}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Błąd pobierania wyjazdu");
        const data = await response.json();
        setCamp(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCamp();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-sm font-montserrat text-gray-500 font-medium">
          Wczytywanie pulpitu wyjazdu...
        </p>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-jakarta font-bold text-[#0B3B4C] mb-2">
          Wyjazd nie istnieje
        </h2>
        <p className="font-montserrat text-gray-500">
          Prawdopodobnie został usunięty z bazy.
        </p>
      </div>
    );
  }

  const heroCardData = {
    id: camp.id,
    title: camp.title,
    location: formatLocation(camp.location),
    dateRange: formatDateRange(camp.startDate, camp.endDate),
    checkedIn: 0,
    totalCapacity: camp.capacity,
    status: camp.status,
    heroImage: camp.heroImage,
    views: camp.views, // <--- PRZEKAZUJEMY ZDJĘCIE
  };

  return (
    <div className="relative font-montserrat min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),_radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-brand-yellow/10">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <header className="flex items-center justify-between mb-2">
          <h1 className="font-jakarta text-[24px] font-bold text-[#0B3B4C]">
            Panel zarządzania wyjazdem
          </h1>
        </header>

        {/* 1. KARTA GŁÓWNA (HERO) */}
        <CampHeroCard camp={heroCardData} />

        {/* Miejsce na kolejne sekcje */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-4">
          <div className="xl:col-span-8">
            <CampParticipantsList />
          </div>
          <div className="mt-2">
            <CampActivityAndSchedule />
          </div>
        </div>
      </main>
    </div>
  );
}
