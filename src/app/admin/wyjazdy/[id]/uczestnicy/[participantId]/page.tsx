"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { ProfileHeader } from "./_components/ProfileHeader";
import { FinanceCard } from "./_components/FinanceCard";
import { HealthCard } from "./_components/HealthCard";
import { SpaOrdersCard } from "./_components/SpaOrdersCard";
import { ActivityLogCard } from "./_components/ActivityLogCard";
import { EmergencyContactCard } from "./_components/EmergencyContactCard";
// Importujemy podzielone karty z tego samego pliku
import { EmailCard, PhoneCard } from "./_components/ContactCardInfo";
import type { ParticipantData } from "@/types/participant";

export default function ParticipantDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const participantId = params.participantId as string;

  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId || !participantId) return;

    const abortController = new AbortController();

    const fetchParticipant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/admin/wyjazdy/${tripId}/uczestnicy/${participantId}`,
          {
            signal: abortController.signal,
          },
        );

        if (res.status === 404)
          throw new Error("Nie znaleziono takiego uczestnika.");
        if (!res.ok) throw new Error("Nie udało się pobrać danych uczestnika.");

        const data = await res.json();
        setParticipant(data.participant);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Wystąpił nieoczekiwany błąd.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipant();

    return () => {
      abortController.abort();
    };
  }, [tripId, participantId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-primary">
        <CircleNotch
          size={48}
          weight="bold"
          className="animate-spin mb-4 opacity-80"
        />
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">
          Wczytywanie profilu...
        </p>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center w-full">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <WarningCircle size={32} weight="duotone" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Wystąpił błąd
          </h2>
          <p className="font-medium text-slate-500 mb-6">
            {error || "Brak danych uczestnika."}
          </p>
          <Link
            href={`/admin/wyjazdy/${tripId}/uczestnicy`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors w-full sm:w-auto"
          >
            <ArrowLeft size={16} weight="bold" /> Wróć do listy
          </Link>
        </div>
      </div>
    );
  }

  const healthProfile = participant.user?.healthProfile ?? null;
  const email = participant?.email || participant?.user?.email || null;
  const phone = participant?.phone || null;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 min-h-screen">
      <Link
        href={`/admin/wyjazdy/${tripId}/uczestnicy`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-primary transition-colors w-fit px-2"
      >
        <ArrowLeft size={16} weight="bold" />
        Wróć do bazy uczestników
      </Link>

      <div className="flex flex-col gap-6 xl:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch">
          {/* LEWA KOLUMNA: 4 Karty */}
          <div className="flex flex-col gap-4 sm:gap-6 xl:gap-8">
            <ProfileHeader participant={participant} />

            <EmailCard email={email} />
            <PhoneCard phone={phone} />

            <EmergencyContactCard health={healthProfile} />
          </div>

          {/* PRAWA KOLUMNA */}
          <div className="h-full">
            <HealthCard health={healthProfile} />
          </div>
        </div>

        {/* DOLNY RZĄD: Finanse (pełna szerokość) + pod spodem usługi SPA */}
        <FinanceCard participant={participant} />
        <SpaOrdersCard orders={participant.serviceOrders || []} />

        {/* Historia aktywności (akcje uczestniczki: rezerwacja, płatności, usługi, karta zdrowia) */}
        <ActivityLogCard participant={participant} />
      </div>
    </div>
  );
}
