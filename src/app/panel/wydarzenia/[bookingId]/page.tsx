"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

import DashboardHero from "./_components/DashboardHero";
import DashboardPayments from "./_components/DashboardPayments";
import DashboardHealthCard from "./_components/DashboardHealthCard";
import DashboardAgendaPreview from "./_components/DashboardAgendaPreview";
import DashboardNews, {
  type PersonalNotificationItem,
  type SystemUpdateItem,
} from "./_components/DashboardNews";
import PaymentSuccessModal from "./_components/PaymentSuccessModal";
import DashboardRoommateCard, {
  type BookingPackage,
} from "./_components/DashboardRoommateCard";

interface DashboardData {
  booking: Record<string, unknown> & { id: string; name?: string | null };
  trip: Record<string, unknown>;
  healthFilled: boolean;
  fullSchedule: unknown;
  isSchedulePublished: boolean;
  systemUpdates: SystemUpdateItem[];
  personalNotifications: PersonalNotificationItem[];
  bookingPackage: BookingPackage | null;
}

export default function BookingDashboardPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/panel/wydarzenia/${bookingId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Nie udało się pobrać danych");

      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spinner
          size={32}
          weight="bold"
          className="animate-spin text-brand-primary"
        />
        <p className="text-sm font-semibold text-brand-secondary/60 animate-pulse">
          Pobieranie danych o Twoim wydarzeniu...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-brand-secondary font-bold text-lg">Oops!</p>
        <p className="text-gray-500 mt-2">{error || "Coś poszło nie tak."}</p>
      </div>
    );
  }

  const {
    booking,
    trip,
    healthFilled,
    fullSchedule,
    isSchedulePublished,
    systemUpdates,
    personalNotifications,
    bookingPackage,
  } = data;

  const firstName = (booking.name ?? "").split(" ")[0] || "Uczestniku";
  console.log("Updates", systemUpdates);
  console.log("Personal notification", personalNotifications);

  return (
    <div className="pb-4 flex flex-col gap-5 lg:gap-6">
      <DashboardHero booking={booking} trip={trip} firstName={firstName} />

      {bookingPackage && <DashboardRoommateCard pkg={bookingPackage} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <DashboardPayments booking={booking} trip={trip} />
        <DashboardHealthCard
          healthFilled={healthFilled}
          bookingId={bookingId}
        />
      </div>

      <DashboardAgendaPreview
        schedule={fullSchedule as never}
        isPublished={isSchedulePublished}
      />

      <DashboardNews
        updates={systemUpdates}
        personalNotifications={personalNotifications}
      />

      <PaymentSuccessModal
        bookingId={bookingId}
        onConfirmed={fetchDashboardData}
      />
    </div>
  );
}
