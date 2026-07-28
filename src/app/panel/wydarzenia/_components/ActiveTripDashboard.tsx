"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarBlank,
  MapPin,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { formatSingleDayOrNull } from "@/lib/trips/tripDates";

export default function ActiveTripDashboard({ booking }: { booking: any }) {
  const trip = booking.trip;

  // Formatowanie daty wydarzenia. Wydarzenie jednodniowe pokazujemy słownie
  // ("12 października 2026"), zamiast powtarzać tę samą datę po myślniku.
  const singleDay = formatSingleDayOrNull(trip.startDate, trip.endDate);
  const startDate =
    singleDay ??
    new Date(trip.startDate).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const endDate =
    !singleDay && trip.endDate
      ? new Date(trip.endDate).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

  // Bezpieczne dekodowanie lokalizacji z JSONa bazy
  let location = "Wkrótce";
  if (trip.location) {
    try {
      const parsed =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : trip.location;
      location = parsed.city || parsed.name || "Wkrótce";
    } catch {
      location = trip.location;
    }
  }

  return (
    <div
      className="group relative w-full rounded-3xl overflow-hidden shadow-[0_20px_60px_-30px_rgba(3,63,99,0.15)] border border-white/40 p-6 lg:p-8 min-h-[260px] md:min-h-[280px] flex flex-col justify-end bg-cover bg-center transition-all duration-300"
      style={{
        backgroundImage: `url(${trip.heroImage || "/images/camp-background.jpg"})`,
      }}
    >
      {/* Ekskluzywny, głęboki gradient odcinający napisy */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/95 via-brand-secondary/60 to-brand-secondary/10 z-0 transition-opacity duration-300 group-hover:opacity-90" />

      {/* Subtelny radialny gradient w rogu rozświetlający kartę */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
        {/* LEWA STRONA: Dane informacyjne o wydarzeniu */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-3.5">
            <Sparkle
              size={14}
              weight="fill"
              className="text-brand-yellow animate-pulse"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              {booking.status === "FULLY_PAID"
                ? "Opłacone wydarzenie"
                : "Zatwierdzona rezerwacja"}
            </span>
          </div>

          <h2 className="font-jakarta font-bold text-2xl lg:text-3xl text-white tracking-tight mb-3">
            {trip.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 text-[13.5px] font-medium font-montserrat">
            <div className="flex items-center gap-1.5">
              <CalendarBlank
                size={18}
                className="text-brand-yellow"
                weight="duotone"
              />
              <span>
                {startDate} {endDate && ` - ${endDate}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin
                size={18}
                className="text-brand-yellow"
                weight="duotone"
              />
              <span className="truncate max-w-[220px]">{location}</span>
            </div>
          </div>
        </div>

        {/* PRAWA STRONA: Nowy, subtelny przycisk */}
        <div className="shrink-0 w-full md:w-auto">
          <Link href={`/panel/wydarzenia/${booking.id}`} className="block w-full">
            <button className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-4.5 py-2.5 bg-transparent hover:bg-white/10 text-white font-semibold text-[13.5px] rounded-full transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm group/btn">
              {/* Żółty akcent: pulsujący punkt */}
              <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse shrink-0" />

              <span className="relative z-10 text-white/90">
                Przejdź do panelu
              </span>

              <ArrowRight
                size={16}
                weight="bold"
                className="text-white transition-transform duration-300 group-hover/btn:translate-x-0.5"
              />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
