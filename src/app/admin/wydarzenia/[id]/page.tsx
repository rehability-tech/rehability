"use client";

import React, { useEffect, useState } from "react";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { TripHeroCard } from "./_components/TripHeroCard";
import { useParams } from "next/navigation";
import { TripParticipantsList } from "./_components/TripParticipantsList";
import {
  TripRecentActivity,
  TripSchedule,
  type ScheduleItem,
} from "./_components/TripActivityAndSchedule";

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

// Buduje harmonogram pulpitu: wydarzenia wydarzenia + rezerwacje usług uczestniczek
function buildSchedule(trip: any): ScheduleItem[] {
  const items: ScheduleItem[] = [];

  for (const ev of trip.events || []) {
    if (!ev.startTime) continue;
    items.push({
      id: ev.id,
      title: ev.title,
      startTime: ev.startTime,
      endTime: ev.endTime ?? null,
      icon: ev.icon ?? null,
      place: null,
      itemType: "EVENT",
    });
  }

  for (const b of trip.bookings || []) {
    const who = b.name || b.user?.name || b.email || "Uczestniczka";
    for (const o of b.serviceOrders || []) {
      if (o.status === "CANCELLED" || !o.startTime) continue;
      items.push({
        id: o.id,
        title: o.service?.name || "Usługa SPA",
        startTime: o.startTime,
        endTime: o.endTime ?? null,
        icon: "Sparkle",
        who,
        itemType: "RESERVATION",
      });
    }
  }

  return items.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
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

export default function TripDashboardPage() {
  const { id } = useParams();

  const [trip, setCamp] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const response = await fetch(
          `/api/admin/wydarzenia/${id}?t=${Date.now()}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error("Błąd pobierania wydarzenia");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-xs font-montserrat text-brand-secondary/50 font-semibold uppercase tracking-wider">
          Wczytywanie pulpitu wydarzenia...
        </p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <WarningCircle
          size={48}
          weight="duotone"
          className="text-rose-500 mb-3"
        />
        <h2 className="text-2xl font-jakarta font-bold text-brand-secondary mb-2">
          Wydarzenie nie istnieje
        </h2>
        <p className="font-montserrat text-sm text-brand-secondary/60">
          Prawdopodobnie został usunięty z bazy danych.
        </p>
      </div>
    );
  }

  const actualCheckedIn = trip.bookings?.length || 0;

  const heroCardData = {
    id: trip.id,
    title: trip.title,
    location: formatLocation(trip.location),
    dateRange: formatDateRange(trip.startDate, trip.endDate),
    checkedIn: actualCheckedIn,
    totalCapacity: trip.capacity,
    price: trip.price || 0,
    status: trip.status,
    heroImage: trip.heroImage,
    views: trip.views || 0,
  };

  return (
    <div className="relative font-montserrat min-h-screen bg-gray-50/30">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100/80 pb-5">
          <div>
            <h1 className="font-jakarta text-2xl sm:text-3xl font-bold text-brand-secondary">
              Panel zarządzania wydarzeniem
            </h1>
            <p className="text-[13px] text-brand-secondary/50 font-medium mt-1">
              Monitoruj stan zapisów, harmonogram oraz finanse wydarzenia na żywo.
            </p>
          </div>
        </header>

        <TripHeroCard trip={heroCardData} />

        {/* Rząd 1: Lista rezerwacji + Ostatnie logi (równa wysokość na desktop) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch mt-2">
          <div className="xl:col-span-8 flex">
            <TripParticipantsList
              initialParticipants={trip.bookings || []}
              tripId={trip.id}
            />
          </div>
          <div className="xl:col-span-4 flex">
            <TripRecentActivity tripId={trip.id as string} />
          </div>
        </div>

        {/* Rząd 2: Harmonogram na pełną szerokość (wydarzenia + rezerwacje uczestniczek) */}
        <TripSchedule schedule={buildSchedule(trip)} />
      </main>
    </div>
  );
}
