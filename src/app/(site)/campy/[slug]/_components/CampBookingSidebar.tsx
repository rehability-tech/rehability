"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarBlank,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkle,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { useBooking } from "./BookingContext";

interface Props {
  price: number | null;
  deposit: number | null;
  capacity: number;
  bookingsCount: number;
  location: string;
  dateRange: string;
  /**
   * When the content blocks already include a <BookingOptionsCard /> the
   * sidebar becomes a sticky secondary CTA — we drop the duo toggle to
   * avoid having two competing pickers on the page.
   */
  hasInContentOptions?: boolean;
}

export default function CampBookingSidebar({
  price,
  deposit,
  capacity,
  bookingsCount,
  location,
  dateRange,
  hasInContentOptions = false,
}: Props) {
  const { mode, setMode, openSheet, allowDuo } = useBooking();
  const freeSeats = Math.max(capacity - bookingsCount, 0);
  const lastSeats = freeSeats > 0 && freeSeats <= 3;
  const showModeSwitcher = allowDuo && !hasInContentOptions;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:sticky lg:top-24 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.3)] overflow-hidden"
    >
      <div className="relative bg-gradient-to-br from-brand-secondary to-brand-primary p-6 text-white overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-brand-yellow/20 blur-2xl"
        />

        <p className="relative text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
          Cena od osoby
        </p>
        <p className="relative font-jakarta text-[36px] font-bold leading-none mt-2">
          {price ? `${price.toLocaleString("pl-PL")} zł` : "Wkrótce"}
        </p>
        {deposit && (
          <p className="relative text-[12px] text-white/70 mt-2">
            Zadatek:{" "}
            <span className="font-bold text-white">
              {deposit.toLocaleString("pl-PL")} zł
            </span>
          </p>
        )}
        {lastSeats && (
          <div className="relative inline-flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-full bg-brand-yellow text-brand-secondary text-[10px] font-bold uppercase tracking-wider">
            <Sparkle size={11} weight="fill" />
            Ostatnie {freeSeats} miejsc!
          </div>
        )}
      </div>

      <div className="p-6 space-y-3">
        <SidebarRow
          icon={<CalendarBlank size={18} weight="duotone" />}
          label="Termin"
          value={dateRange}
        />
        <SidebarRow
          icon={<MapPin size={18} weight="duotone" />}
          label="Lokalizacja"
          value={location}
        />
        <SidebarRow
          icon={<Users size={18} weight="duotone" />}
          label="Wolne miejsca"
          value={`${freeSeats} / ${capacity}`}
          highlight={freeSeats === 0}
        />
      </div>

      {showModeSwitcher && (
        <div className="px-6 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/60 border border-white/40">
            <button
              type="button"
              onClick={() => setMode("solo")}
              className={`text-[12px] font-bold py-2 rounded-xl transition ${
                mode === "solo"
                  ? "bg-brand-primary text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)]"
                  : "text-brand-secondary/60"
              }`}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => setMode("duo")}
              className={`text-[12px] font-bold py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5 ${
                mode === "duo"
                  ? "bg-brand-primary text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)]"
                  : "text-brand-secondary/60"
              }`}
            >
              <Heart size={13} weight="fill" />
              Z przyjaciółką
            </button>
          </div>
        </div>
      )}

      <div className="p-6 pt-2 space-y-3">
        <button
          type="button"
          onClick={() => openSheet(mode)}
          disabled={freeSeats === 0}
          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-[14px] font-bold transition ${
            freeSeats === 0
              ? "bg-brand-secondary/20 text-brand-secondary/40 cursor-not-allowed"
              : "bg-brand-primary text-white hover:bg-brand-secondary shadow-[0_12px_30px_-10px_rgba(40,125,136,0.6)]"
          }`}
        >
          {freeSeats === 0
            ? "Brak wolnych miejsc"
            : hasInContentOptions
              ? "Zarezerwuj miejsce"
              : mode === "duo"
                ? "Zarezerwuj z przyjaciółką"
                : "Zarezerwuj miejsce"}
        </button>

        <div className="flex items-center gap-2 text-[11px] text-brand-secondary/55">
          <ShieldCheck
            size={14}
            weight="duotone"
            className="text-brand-primary"
          />
          <span>Bezpieczne płatności · Stripe · BLIK · P24</span>
        </div>
      </div>
    </motion.aside>
  );
}

function SidebarRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/50 border border-white/40">
      <div className="flex items-center gap-2.5 text-brand-secondary/60">
        <span className="text-brand-primary">{icon}</span>
        <span className="text-[12px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`text-[13px] font-bold ${
          highlight ? "text-rose-500" : "text-brand-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
