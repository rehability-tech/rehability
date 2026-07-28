"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarBlank,
  MapPin,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { formatSingleDayOrNull } from "@/lib/trips/tripDates";

// Funkcja pomocnicza do formatowania dat
const formatDateRange = (start: any, end: any) => {
  if (!start) return "Wkrótce";
  const singleDay = formatSingleDayOrNull(start, end);
  if (singleDay) return singleDay;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };

  if (!endDate) {
    return startDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      ...monthOptions,
      year: "numeric",
    });
  }
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}–${endDate.getDate()}.${(
      startDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${startDate.getFullYear()}`;
  }
  return `${startDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  })} - ${endDate.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

export default function BookedTripCard({ booking }: { booking: any }) {
  const trip = booking.trip;

  // Bezpieczne dekodowanie lokalizacji
  let displayLocation = "Wkrótce";
  if (trip.location) {
    try {
      const parsed =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : trip.location;
      displayLocation = parsed.city || parsed.name || "Wkrótce";
    } catch (e) {
      displayLocation = trip.location;
    }
  }

  return (
    <div className="flex flex-col min-[1090px]:flex-row max-[1090px]:max-w-[750px] items-stretch gap-3 w-full group max-[1090px]:gap-0 mx-auto">
      {/* ZDJĘCIE KARTY (Z NAKŁADKAMI) */}
      <div className="relative z-20 w-full min-[1090px]:w-[320px] h-[260px] min-[1090px]:h-auto rounded-[24px] overflow-hidden shrink-0 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] max-[1090px]:w-[92%] max-[1090px]:self-center bg-gray-100">
        <Image
          src={trip.heroImage || "/images/camp-background.jpg"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          alt={trip.title || "Zdjęcie wydarzenia"}
        />

        {/* NAKŁADKA 1: Data (Lewy Górny Róg) */}
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-1.5 font-montserrat text-[12px] font-semibold bg-white/90 backdrop-blur-md text-[#0B3B4C] w-fit px-3 py-1.5 rounded-full shadow-sm">
            <CalendarBlank size={16} className="text-[#287D88]" weight="bold" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
        </div>

        {/* NAKŁADKA 2: Lokalizacja (Prawy Dolny Róg) */}
        <div className="absolute bottom-4 right-4 z-30">
          <div className="flex items-center gap-1.5 font-montserrat text-[12px] font-semibold bg-[#287D88]/90 backdrop-blur-md text-white w-fit px-3 py-1.5 rounded-full shadow-sm">
            <MapPin size={16} weight="bold" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {displayLocation}
            </span>
          </div>
        </div>
      </div>

      {/* BLOK Z KONTENTEM */}
      <div className="flex flex-col md:flex-row justify-between flex-1 p-6 md:p-8 bg-white border border-[#287D88]/20 rounded-[26px] shadow-sm gap-6 md:gap-8 hover:shadow-md transition-shadow max-[1090px]:-mt-12 min-[1090px]:gap-0 max-[1090px]:pt-[72px] relative z-10">
        {/* LEWY KONTENER */}
        <div className="flex flex-col items-start gap-4 flex-1 max-[530px]:items-center">
          <div className="max-[530px]:text-center h-full flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 mb-3 w-max max-[530px]:mx-auto">
              <CheckCircle size={14} weight="fill" className="text-green-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-700">
                Twoja rezerwacja
              </span>
            </div>
            <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] mb-2 group-hover:text-[#287D88] transition-colors">
              {trip.title}
            </h3>
            <p className="font-montserrat text-[14px] text-gray-500 max-w-[95%] leading-[160%] max-[768px]:w-full line-clamp-2">
              Zarządzaj swoim pobytem, sprawdź plan wydarzenia i zarezerwuj
              relaksujące zabiegi SPA.
            </p>
          </div>
        </div>

        {/* PRAWY KONTENER - Przycisk */}
        <div className="flex flex-col justify-end items-end md:items-end max-[768px]:items-start shrink-0 py-2 w-full min-[768px]:w-auto max-[530px]:items-center mt-auto md:mt-0">
          <Link
            href={`/panel/wydarzenia/${booking.id}`}
            className="w-full max-[530px]:flex max-[530px]:justify-center"
          >
            <button className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition shadow-sm w-full max-[530px]:w-auto overflow-hidden">
              <span className="relative z-10">Przejdź do panelu</span>
              <ArrowRight
                size={18}
                weight="bold"
                className="relative z-10 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
