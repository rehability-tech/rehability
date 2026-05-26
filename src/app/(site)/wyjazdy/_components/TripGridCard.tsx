"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarBlank,
  MapPin,
  ArrowRight,
  Users,
  Eye,
} from "@phosphor-icons/react/dist/ssr";

export interface TripGridCardData {
  id: string;
  title: string;
  subtitle: string | null;
  tags: string[];
  heroImage: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  price: number | null;
  capacity: number;
  bookingsCount: number;
  views: number;
}

function decodeLocation(raw: string | null): string {
  if (!raw) return "Wkrótce";
  try {
    const parsed = JSON.parse(raw) as { city?: string; name?: string };
    return parsed.city || parsed.name || raw;
  } catch {
    return raw;
  }
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("pl-PL", {
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${s.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – ${e.toLocaleDateString(
    "pl-PL",
    { day: "numeric", month: "short", year: "numeric" },
  )}`;
}

interface Props {
  trip: TripGridCardData;
  index?: number;
}

export default function TripGridCard({ trip, index = 0 }: Props) {
  const location = decodeLocation(trip.location);
  const freeSeats = Math.max(trip.capacity - trip.bookingsCount, 0);
  const occupancy =
    trip.capacity > 0
      ? Math.min((trip.bookingsCount / trip.capacity) * 100, 100)
      : 0;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay: (index % 6) * 0.06,
        ease: [0.22, 0.61, 0.36, 1] as const,
      }}
      whileHover={{ y: -6 }}
      className="group h-full"
    >
      <Link
        href={`/wyjazdy/${trip.id}`}
        className="relative flex flex-col h-full rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] hover:shadow-[0_28px_70px_-20px_rgba(3,63,99,0.4)] transition-shadow duration-300 overflow-hidden"
      >
        <div className="relative h-[240px] overflow-hidden">
          <Image
            src={trip.heroImage || "/images/static/camp.png"}
            alt={trip.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 via-brand-secondary/10 to-transparent" />

          {trip.tags && trip.tags.length > 0 && (
            <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-1.5">
              {trip.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-brand-secondary border border-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full">
              <MapPin size={12} weight="fill" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full">
              <Eye size={12} weight="fill" />
              {trip.views.toLocaleString("pl-PL")}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-6 gap-4">
          <div className="flex items-center gap-2 text-[12px] text-brand-secondary/60">
            <CalendarBlank size={14} weight="duotone" />
            <span className="font-medium">{dateRange}</span>
          </div>

          <div>
            <h3 className="font-jakarta text-[22px] font-bold text-brand-secondary leading-tight">
              {trip.title}
            </h3>
            {trip.subtitle && (
              <p className="text-[13px] text-brand-secondary/60 mt-1.5 leading-relaxed line-clamp-2">
                {trip.subtitle}
              </p>
            )}
          </div>

          <div className="mt-auto rounded-2xl bg-white/50 border border-white/40 p-3">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-brand-secondary/60 font-medium">
                <Users size={13} weight="duotone" />
                Wolne miejsca
              </span>
              <span className="font-bold text-brand-secondary">
                {freeSeats} / {trip.capacity}
              </span>
            </div>
            <div className="h-1.5 bg-brand-secondary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all"
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-brand-secondary/5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-brand-secondary/40 font-bold">
                Cena od
              </p>
              <p className="font-jakarta text-[22px] font-bold text-brand-secondary leading-none mt-1">
                {trip.price
                  ? `${trip.price.toLocaleString("pl-PL")} zł`
                  : "—"}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-primary group-hover:gap-3 transition-all">
              Poznaj szczegóły
              <ArrowRight size={16} weight="bold" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
