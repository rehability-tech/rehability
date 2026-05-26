"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

import DashboardHero from "./_components/DashboardHero";
import DashboardPayments from "./_components/DashboardPayments";
import DashboardHealthCard from "./_components/DashboardHealthCard";
import DashboardAgendaPreview from "./_components/DashboardAgendaPreview";
import DashboardNews from "./_components/DashboardNews";

export default function BookingDashboardPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    async function fetchDashboardData() {
      try {
        const res = await fetch(`/api/panel/wyjazdy/${bookingId}`);
        if (!res.ok) throw new Error("Nie udało się pobrać danych");

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [bookingId]);
  console.log(data);

  // EKRAN ŁADOWANIA CAŁEGO PANELU
  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spinner
          size={32}
          weight="bold"
          className="animate-spin text-brand-primary"
        />
        <p className="text-sm font-semibold text-brand-secondary/60 animate-pulse">
          Pobieranie danych o Twoim wyjeździe...
        </p>
      </div>
    );
  }

  // EKRAN BŁĘDU (np. brak autoryzacji lub rezerwacji)
  if (error || !data) {
    return (
      <div className="w-full p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-brand-secondary font-bold text-lg">Oops!</p>
        <p className="text-gray-500 mt-2">{error || "Coś poszło nie tak."}</p>
      </div>
    );
  }

  // DESTRUKTURYZACJA DANYCH Z API
  const { booking, trip, healthFilled, agendaPreview } = data;
  const firstName = (booking.name ?? "").split(" ")[0] || "Uczestniku";

  // WŁAŚCIWY RENDER PANELU
  return (
    <div className="pb-4 flex flex-col gap-5 lg:gap-6 animate-in fade-in duration-500">
      <DashboardHero booking={booking} trip={trip} firstName={firstName} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <DashboardPayments booking={booking} trip={trip} />
        <DashboardHealthCard healthFilled={healthFilled} />
      </div>

      <DashboardAgendaPreview agendaPreview={agendaPreview} />

      <DashboardNews />
    </div>
  );
}
