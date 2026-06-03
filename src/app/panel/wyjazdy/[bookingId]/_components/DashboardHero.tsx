"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CalendarBlank,
  CheckCircle,
  Clock,
  SealWarning,
  Sparkle,
  QrCode,
  X,
  Ticket,
} from "@phosphor-icons/react/dist/ssr";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calcTimeLeft(new Date(targetDate)),
  );
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft(calcTimeLeft(new Date(targetDate))),
      1000,
    );
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

function calcTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  DEPOSIT_PAID: {
    label: "Zadatek opłacony",
    cls: "bg-white/25 text-white",
    icon: <CheckCircle size={12} weight="fill" />,
  },
  FULLY_PAID: {
    label: "Opłacona w całości",
    cls: "bg-emerald-500/30 text-white",
    icon: <CheckCircle size={12} weight="fill" />,
  },
  PENDING: {
    label: "Oczekuje na potwierdzenie",
    cls: "bg-brand-yellow/40 text-brand-secondary",
    icon: <Clock size={12} weight="fill" />,
  },
  CANCELLED: {
    label: "Anulowana",
    cls: "bg-rose-500/20 text-rose-100",
    icon: <SealWarning size={12} weight="fill" />,
  },
};

export default function DashboardHero({ booking, trip, firstName }: any) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeLeft = useCountdown(trip.startDate);
  const campStarted = !timeLeft;
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["PENDING"];
  // Bilet (QR odprawy) jest aktywny dopiero po opłaceniu CAŁOŚCI za wyjazd.
  // Sam zadatek (DEPOSIT_PAID) nie wystarcza — kod QR pozostaje zablokowany.
  const isTicketActive = booking.status === "FULLY_PAID";

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
    });

  // Bezpieczne dekodowanie lokalizacji (wyciągamy tylko miasto lub sam tekst)
  let displayLocation = "Lokalizacja wkrótce";
  if (trip.location) {
    try {
      const parsed =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : trip.location;
      displayLocation = parsed.city || parsed.name || trip.location;
    } catch {
      displayLocation = trip.location;
    }
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="lg:col-span-12 relative rounded-[28px] overflow-hidden shadow-[0_24px_60px_-22px_rgba(3,63,99,0.5)]"
      >
        {/* TŁO */}
        <div className="absolute inset-0">
          {trip.heroImage ? (
            <Image
              src={trip.heroImage}
              alt={trip.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 100vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/90 via-brand-secondary/70 to-brand-primary/60" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        <div className="relative p-6 lg:p-10 text-white min-h-[340px] flex flex-col justify-between">
          {/* HEADER (TAG + PRZYCISK BILETU) */}
          <div className="flex items-start justify-between w-full">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-full ${statusCfg.cls} backdrop-blur-md`}
            >
              {statusCfg.icon} {statusCfg.label}
            </span>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="group relative flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all shadow-sm"
            >
              <QrCode
                size={20}
                weight="duotone"
                className={`group-hover:scale-110 transition-transform ${
                  isTicketActive ? "text-brand-yellow" : "text-white/50"
                }`}
              />
              <span className="text-xs font-bold tracking-wide hidden sm:block">
                Twój bilet
              </span>
              {!isTicketActive && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-brand-yellow text-brand-secondary text-[9px] font-bold shadow-sm">
                  !
                </span>
              )}
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="mt-8">
            <h1 className="font-jakarta text-[32px] lg:text-[44px] font-bold leading-tight">
              Witaj {firstName} ✨
            </h1>
            <p className="text-white/80 text-[14px] lg:text-[15px] mt-2 max-w-lg leading-relaxed">
              Czeka na Ciebie {trip.title}. Wszystko jest gotowe — wystarczy
              odliczyć dni.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-6 text-white/90 text-[13px] font-medium">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                <MapPin
                  size={16}
                  weight="duotone"
                  className="text-brand-yellow"
                />
                {displayLocation}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                <CalendarBlank
                  size={16}
                  weight="duotone"
                  className="text-brand-yellow"
                />
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </div>
            </div>

            {/* COUNTDOWN */}
            {!campStarted ? (
              <div className="mt-8 lg:mt-10">
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-yellow/90 mb-3 pl-1">
                  Zostało do relaksu
                </p>
                <div className="flex items-center gap-2 lg:gap-3">
                  {[
                    { v: timeLeft!.days, l: "dni" },
                    { v: timeLeft!.hours, l: "godz" },
                    { v: timeLeft!.minutes, l: "min" },
                    { v: timeLeft!.seconds, l: "sek" },
                  ].map((u, i) => (
                    <div
                      key={i}
                      className="w-[72px] lg:w-[88px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 lg:p-4 flex flex-col items-center justify-center"
                    >
                      <p className="font-jakarta text-[28px] lg:text-[36px] font-bold tabular-nums leading-none">
                        {String(u.v).padStart(2, "0")}
                      </p>
                      <p className="text-[9px] lg:text-[10px] uppercase tracking-wider text-white/60 mt-1">
                        {u.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 text-white text-sm font-bold shadow-lg">
                <Sparkle
                  size={18}
                  weight="fill"
                  className="text-brand-yellow"
                />
                Wyjazd właśnie trwa — miłego wypoczynku!
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* MODAL Z BILETEM QR */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isQrModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsQrModalOpen(false)}
                  className="absolute inset-0 bg-brand-secondary/80 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm rounded-[32px] bg-white shadow-2xl overflow-hidden"
                >
                  {/* Header biletu */}
                  <div className="bg-brand-primary p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-brand-yellow mb-2">
                          <Ticket size={18} weight="fill" />
                          <span className="font-jakarta text-xs font-bold uppercase tracking-widest">
                            Twój bilet
                          </span>
                        </div>
                        <h3 className="font-jakarta font-bold text-2xl leading-tight">
                          {booking.name ?? firstName}
                        </h3>
                        <p className="text-sm text-white/80 mt-0.5">
                          {trip.title}
                        </p>
                      </div>

                      <button
                        onClick={() => setIsQrModalOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* Perforacja */}
                  <div className="relative flex bg-white h-6 items-center">
                    <div className="absolute -left-3 w-6 h-6 rounded-full bg-brand-secondary/80" />
                    <div className="absolute -right-3 w-6 h-6 rounded-full bg-brand-secondary/80" />
                    <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-4" />
                  </div>

                  {/* Sekcja QR — aktywna dopiero po opłaceniu całości */}
                  {isTicketActive ? (
                    <div className="p-8 flex flex-col items-center bg-white">
                      <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
                        <QRCode
                          value={booking.qrToken}
                          size={200}
                          style={{
                            height: "auto",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                          viewBox="0 0 256 256"
                          fgColor="#033f63"
                        />
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-6 max-w-[200px] leading-relaxed">
                        Pokaż ten kod obsłudze przy odprawie na miejscu.
                      </p>

                      <div className="mt-4 px-4 py-1.5 bg-gray-100 rounded-full">
                        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                          ID: {booking.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center bg-white text-center">
                      {/* Zablokowany podgląd kodu */}
                      <div className="relative">
                        <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 blur-[6px] opacity-40 pointer-events-none select-none">
                          <QRCode
                            value="locked"
                            size={200}
                            style={{
                              height: "auto",
                              maxWidth: "100%",
                              width: "100%",
                            }}
                            viewBox="0 0 256 256"
                            fgColor="#033f63"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-brand-secondary flex items-center justify-center shadow-lg">
                            <SealWarning
                              size={28}
                              weight="fill"
                              className="text-brand-yellow"
                            />
                          </div>
                        </div>
                      </div>

                      <h4 className="font-jakarta font-bold text-lg text-brand-secondary mt-6">
                        Bilet jeszcze nieaktywny
                      </h4>
                      <p className="text-sm text-gray-500 mt-2 max-w-[240px] leading-relaxed">
                        Kod QR do odprawy aktywuje się automatycznie po opłaceniu{" "}
                        <span className="font-semibold text-brand-secondary">
                          całości kwoty
                        </span>{" "}
                        za wyjazd.
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
