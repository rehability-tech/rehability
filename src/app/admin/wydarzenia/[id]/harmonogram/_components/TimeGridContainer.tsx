"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import TimeGrid, { type TripServiceOption } from "./TimeGrid";
import type { SerializedEvent } from "./timegrid/types";

// 1. ZAKTUALIZOWANY INTERFEJS (Dodane isSchedulePublished wewnątrz trip)
interface HarmonogramData {
  trip: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isSchedulePublished: boolean; // <--- DODANE
  };
  services: TripServiceOption[];
  events: SerializedEvent[];
}

export default function TimeGridContainer({ tripId }: { tripId: string }) {
  const [data, setData] = useState<HarmonogramData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/wydarzenia/${tripId}/harmonogram`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Nie udało się załadować harmonogramu.");
      }
      const json = (await res.json()) as HarmonogramData;
      if (!cancelledRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (!cancelledRef.current)
        setError(e instanceof Error ? e.message : "Błąd ładowania.");
    }
  }, [tripId]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchData();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-rose-50/50 border border-rose-100 rounded-3xl text-center mt-6">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
          <WarningCircle size={28} weight="duotone" className="text-rose-500" />
        </div>
        <p className="text-[13px] font-bold text-rose-600 px-4">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/40 border border-gray-100 rounded-3xl text-center mt-6">
        <CircleNotch
          size={32}
          weight="bold"
          className="text-brand-primary animate-spin mb-3"
        />
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary/60">
          Ładuję harmonogram…
        </p>
      </div>
    );
  }

  return (
    <TimeGrid
      tripId={data.trip.id}
      startDate={data.trip.startDate}
      endDate={data.trip.endDate}
      initialEvents={data.events}
      services={data.services}
      // 2. PRZEKAZUJEMY PROP DO NASZEGO KALENDARZA
      isSchedulePublished={data.trip.isSchedulePublished}
    />
  );
}
