"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarBlank, MapPin, Flask, CalendarX } from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { formatSingleDayOrNull } from "@/lib/trips/tripDates";
import { isTripPast } from "@/lib/trips/bookingWindow";

// Funkcja pomocnicza do dat
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

interface TripCardProps {
  trip: any;
  variants?: Variants;
}

export default function TripCard({ trip, variants }: TripCardProps) {
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

  // Wymuszenie usunięcia tagów HTML z opisu
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "");
  };

  // Listingi odsiewają minione wydarzenia po dacie, ale karta może trafić tu
  // z zacache'owanej listy albo z podglądu — wtedy stan „po terminie" musi być
  // widoczny, a nie udawać nadchodzący termin.
  const past = trip.endDate ? isTripPast({ endDate: trip.endDate }) : false;

  return (
    <motion.div
      variants={variants}
      className="flex flex-col min-[1090px]:flex-row max-[1090px]:max-w-[750px] items-stretch gap-3 w-full group max-[1090px]:gap-0 mx-auto"
    >
      {/* ZDJĘCIE KARTY (Z NAKŁADKAMI) */}
      <div className="relative z-20 w-full min-[1090px]:w-[320px] h-[260px] min-[1090px]:h-auto rounded-[24px] overflow-hidden shrink-0 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] max-[1090px]:w-[92%] max-[1090px]:self-center bg-gray-100">
        <Image
          src={trip.heroImage || "/images/static/camp.png"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          alt={trip.title || "Zdjęcie wydarzenia"}
        />

        {/* NAKŁADKA 1: Data (Lewy Górny Róg) */}
        <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-montserrat text-[12px] font-semibold bg-white/90 backdrop-blur-md text-[#0B3B4C] w-fit px-3 py-1.5 rounded-full shadow-sm">
            <CalendarBlank size={16} className="text-[#287D88]" weight="bold" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          {/* Termin minął — wydarzenie zostaje na liście tylko informacyjnie */}
          {past && (
            <div className="flex items-center gap-1.5 font-montserrat text-[11px] font-bold uppercase tracking-wide bg-[#0B3B4C]/85 backdrop-blur-md text-white w-fit px-2.5 py-1.5 rounded-full shadow-sm">
              <CalendarX size={14} weight="bold" />
              Zakończone
            </div>
          )}
          {/* Wydarzenie z piaskownicy — widzą je tylko admin i testerzy */}
          {trip.sandbox && (
            <div className="flex items-center gap-1.5 font-montserrat text-[11px] font-bold uppercase tracking-wide bg-brand-yellow text-[#0B3B4C] w-fit px-2.5 py-1.5 rounded-full shadow-sm">
              <Flask size={14} weight="fill" />
              Sandbox
            </div>
          )}
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
          <div className="max-[530px]:text-center h-full flex flex-col">
            <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] mb-3 group-hover:text-[#287D88] transition-colors">
              {trip.title}
            </h3>
            <p className="font-montserrat text-[14px] text-gray-500 max-w-[95%] leading-[160%] max-[768px]:w-full line-clamp-4">
              {stripHtml(trip.description) ||
                "Dołącz do tego wyjątkowego wydarzenia i przeżyj wspaniały czas pod okiem naszych specjalistów."}
            </p>
          </div>
        </div>

        {/* PRAWY KONTENER */}
        <div className="flex flex-col justify-between items-end md:items-end max-[768px]:items-start shrink-0 max-[768px]:gap-6 py-2 max-[768px]:flex-row max-[530px]:flex-col max-[530px]:items-center">
          <div className="flex flex-col items-end max-[768px]:items-start max-[530px]:items-center">
            <span className="font-montserrat text-[12px] uppercase tracking-wider text-gray-400 font-bold mb-1">
              Cena pobytu
            </span>
            <span className="font-jakarta font-bold text-[24px] text-[#0B3B4C] block text-right max-[768px]:text-left max-[530px]:text-center">
              {trip.price ? `od ${trip.price} zł` : "Sprawdź cennik"}
            </span>
          </div>

          <Link
            href={`/wydarzenia/${trip.id}`}
            className="w-full mt-auto max-[530px]:flex max-[530px]:justify-center"
          >
            <Button
              showArrow
              className="w-full max-[530px]:w-auto max-[530px]:px-8"
            >
              Poznaj szczegóły
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
