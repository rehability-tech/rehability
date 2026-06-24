"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import useSWR from "swr";
import {
  CalendarBlank,
  MapPin,
  Users,
  HeartStraight,
  ArrowRight,
  CalendarX,
  CheckCircle,
  Wallet,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FALLBACK_IMG = "/images/campy/campy_hero.jpg";

/** Lokalizacja bywa stringiem albo obiektem JSON {name, city} (lub jego stringiem). */
function formatLocation(loc: unknown): string {
  if (!loc) return "";
  if (typeof loc === "string") {
    const s = loc.trim();
    if (s.startsWith("{")) {
      try {
        return formatLocation(JSON.parse(s));
      } catch {
        return s;
      }
    }
    return s;
  }
  if (typeof loc === "object") {
    const o = loc as { name?: string | null; city?: string | null };
    return [o.name, o.city].filter(Boolean).join(", ");
  }
  return String(loc);
}

type TripLocation =
  | string
  | { name?: string | null; city?: string | null }
  | null;

interface TripData {
  id: string;
  title: string;
  location: TripLocation;
  startDate: string;
  endDate: string;
  heroImage: string | null;
  capacity: number;
  bookedCount: number;
  fullyPaidCount: number;
  daysUntil: number;
  missingHealthProfiles: number;
}

function TripCard({ trip }: { trip: TripData }) {
  const fillPct = Math.min(
    100,
    Math.round((trip.bookedCount / trip.capacity) * 100),
  );
  const freePlaces = trip.capacity - trip.bookedCount;
  const depositOnly = trip.bookedCount - trip.fullyPaidCount;
  const dateLabel = format(new Date(trip.startDate), "d MMMM yyyy", {
    locale: pl,
  });
  const img = trip.heroImage || FALLBACK_IMG;
  const locationLabel = formatLocation(trip.location);

  return (
    <div className="relative flex flex-col h-full min-h-[340px]">
      {/* Tło foto */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${img})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#033f63]/95 via-[#033f63]/55 to-transparent" />
      </div>

      {/* Odliczanie wielkie w rogu */}
      <div className="relative flex items-start justify-end p-5">
        <div className="text-right">
          <span className="font-jakarta font-black text-white text-[46px] leading-none drop-shadow-md tabular-nums">
            {trip.daysUntil > 0 ? trip.daysUntil : 0}
          </span>
          <p className="font-montserrat text-[10px] font-bold uppercase tracking-wider text-white/70 -mt-1">
            {trip.daysUntil > 0 ? "dni do startu" : "wyjazd w toku"}
          </p>
        </div>
      </div>

      <div className="relative mt-auto p-5 flex flex-col gap-3.5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-yellow/90 font-montserrat text-[9px] font-extrabold uppercase tracking-wide text-[#033f63] mb-2">
            <Sparkle size={9} weight="fill" />
            Najbliższy wyjazd
          </span>
          <p className="font-jakarta font-extrabold text-white text-[20px] leading-tight drop-shadow-sm">
            {trip.title}
          </p>
          <p className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 font-montserrat text-white/75 text-[12px] mt-1">
            {locationLabel && (
              <>
                <MapPin size={11} className="shrink-0" />
                <span>{locationLabel}</span>
                <span className="opacity-50">·</span>
              </>
            )}
            <CalendarBlank size={11} className="shrink-0" />
            <span>{dateLabel}</span>
          </p>
        </div>

        {/* Szklane chipy */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 font-montserrat text-[11px] font-bold text-white">
            <Users size={12} />
            {trip.bookedCount}/{trip.capacity}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/20 backdrop-blur-xl border border-emerald-300/30 font-montserrat text-[11px] font-bold text-emerald-100">
            <CheckCircle size={12} weight="fill" />
            {trip.fullyPaidCount} opłac.
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-xl border border-amber-300/30 font-montserrat text-[11px] font-bold text-amber-100">
            <Wallet size={12} weight="fill" />
            {depositOnly} zadatek
          </span>
          {trip.missingHealthProfiles > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/80 backdrop-blur-xl font-montserrat text-[11px] font-bold text-white">
              <HeartStraight size={12} weight="fill" />
              {trip.missingHealthProfiles}
            </span>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 font-montserrat text-[10px] font-bold text-white/80">
            <span>Obłożenie {fillPct}%</span>
            <span className={freePlaces <= 2 ? "text-brand-yellow" : "text-white/60"}>
              {freePlaces > 0 ? `${freePlaces} wolnych` : "Komplet"}
            </span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-emerald-300"
            />
          </div>
        </div>

        <Link
          href={`/admin/wyjazdy/${trip.id}`}
          className="inline-flex w-fit items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-secondary hover:bg-brand-yellow shadow-[0_6px_18px_-8px_rgba(0,0,0,0.35)] transition-colors group"
        >
          <span className="font-montserrat text-[12px] font-bold">Przejdź do wyjazdu</span>
          <ArrowRight
            size={13}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}

export default function UpcomingPanel() {
  const { data, isLoading } = useSWR<{ trip: TripData | null }>(
    "/api/admin/upcoming",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 px-1">
        <span className="font-montserrat text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
          Nadchodzący wyjazd
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] overflow-hidden"
      >
        {/* Skeleton */}
        {isLoading && (
          <div className="animate-pulse p-5 flex flex-col gap-4">
            <div className="h-24 w-full bg-gray-100 rounded-2xl" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded-full" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 bg-gray-50 rounded-2xl" />
              <div className="h-14 bg-gray-50 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Brak wyjazdów */}
        {!isLoading && !data?.trip && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-brand-secondary/30 gap-3 p-8">
            <CalendarX size={36} weight="duotone" className="opacity-50" />
            <p className="font-jakarta font-bold text-[14px]">
              Brak nadchodzących wyjazdów
            </p>
            <Link
              href="/admin/wyjazdy/dodaj"
              className="flex items-center gap-1 text-[12px] font-montserrat font-semibold text-brand-primary hover:underline"
            >
              Dodaj pierwszy wyjazd
              <ArrowRight size={11} />
            </Link>
          </div>
        )}

        {/* Karta wyjazdu */}
        {!isLoading && data?.trip && <TripCard trip={data.trip} />}
      </motion.div>
    </div>
  );
}
