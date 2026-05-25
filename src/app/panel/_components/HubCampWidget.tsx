"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Tent,
  ArrowRight,
  Sparkle,
  Heart,
  CalendarBlank,
  MapPin,
  CheckCircle,
  CreditCard,
  WarningCircle,
  ClockCounterClockwise,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";

const DEFAULT_CAMP_IMAGE = "/images/camp-background.jpg";

export default function HubCampWidget() {
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    async function fetchActiveBooking() {
      try {
        const res = await fetch("/api/panel/campy/active");
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch (error) {
        console.error("Błąd pobierania danych o campie:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActiveBooking();

    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return "Brak daty";
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    const startDate = new Date(start).toLocaleDateString("pl-PL", options);
    const endDate = end
      ? new Date(end).toLocaleDateString("pl-PL", options)
      : "";
    return `${startDate} - ${endDate}`;
  };

  const formatLocation = (locStr?: string) => {
    if (!locStr) return "Lokalizacja wkrótce";
    try {
      const parsed = JSON.parse(locStr);
      return `${parsed.name || ""}, ${parsed.city || ""}`
        .replace(/^, |, $/g, "")
        .trim();
    } catch {
      return locStr;
    }
  };

  // 1. STAN ŁADOWANIA
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="w-28 h-8 rounded-full bg-gray-200/50" />
          <div className="w-20 h-20 rounded-2xl rounded-tr-none bg-gray-200/50" />
        </div>
        <div className="flex-1 mt-4 space-y-3">
          <div className="w-3/4 h-8 bg-gray-200/50 rounded-lg" />
          <div className="w-1/2 h-8 bg-gray-200/50 rounded-lg" />
        </div>
      </div>
    );
  }

  // 2. STAN PUSTY (Brak rezerwacji)
  if (!booking) {
    return (
      <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col">
        {/* Dekoracyjne, delikatne blury w tle */}
        <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-sky-500/10 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-brand-primary/5 blur-[80px]" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          {/* Poprawiony błąd z bg-brand-primary-500/10 na prawidłowe kolory */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 h-max">
            <Sparkle size={14} weight="fill" className="text-brand-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
              Strefa Campów
            </span>
          </div>

          <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.1)] flex items-center justify-center shrink-0">
            <Tent size={40} weight="duotone" className="text-brand-primary" />
            <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center shadow-[0_4px_15px_0px_rgba(242,217,103,0.55)]">
              <Heart size={14} weight="fill" className="text-white" />
            </span>
          </div>
        </div>

        <div className="flex-1 relative z-10">
          <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-brand-secondary leading-tight mb-3">
            Nie masz jeszcze
            <br />
            zarezerwowanego campu
          </h3>
          <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-sm">
            Po opłaceniu zadatku Twój panel uczestniczki pojawi się tutaj —
            zobaczysz odliczanie do wyjazdu, harmonogram i zarezerwujesz zabiegi
            SPA.
          </p>
        </div>

        <div className="mt-8 relative z-10">
          <Link
            href="/campy"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-semibold text-[14px] shadow-[0_4px_15px_0px_rgba(40,125,136,0.35)] hover:shadow-[0_6px_20px_0px_rgba(40,125,136,0.5)] transition overflow-hidden"
          >
            <span className="relative z-10">Zobacz dostępne campy</span>
            <ArrowRight
              size={16}
              weight="bold"
              className="relative z-10 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>
    );
  }

  const bgImage = booking.camp?.heroImage || DEFAULT_CAMP_IMAGE;

  // 3. STAN PENDING (Oczekujący)
  if (booking.status === "PENDING") {
    const updatedAtTime = new Date(booking.updatedAt).getTime();
    const minutesSinceUpdate = (now - updatedAtTime) / (1000 * 60);
    const isProcessing = minutesSinceUpdate < 15;

    // A. PŁATNOŚĆ W TOKU
    if (isProcessing) {
      return (
        <div
          className="relative overflow-hidden rounded-3xl rounded-tr-none border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-brand-secondary/90 z-0" />
          <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay z-0" />

          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none z-0" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            {/* POPRAWIONY TAG: Jasny, błękitny tekst na ciemnym tle */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/20 border border-sky-500/30 h-max shadow-sm">
              <CircleNotch
                size={14}
                weight="bold"
                className="text-sky-400 animate-spin"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-400">
                Oczekujemy na bank
              </span>
            </div>

            <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.2)] flex items-center justify-center shrink-0">
              <Tent
                size={40}
                weight="duotone"
                className="text-brand-secondary/40"
              />
              <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(14,165,233,0.4)]">
                <ClockCounterClockwise
                  size={16}
                  weight="bold"
                  className="text-white animate-spin-slow"
                />
              </span>
            </div>
          </div>

          <div className="flex-1 relative z-10">
            <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-white leading-tight mb-3">
              Przetwarzanie płatności
            </h3>
            <p className="text-white/80 text-[13.5px] leading-relaxed max-w-sm">
              Oczekujemy na potwierdzenie przelewu z Twojego banku za wyjazd na{" "}
              <strong>{booking.camp?.title}</strong>. Księgowanie zajmuje
              zazwyczaj od kilku sekund do kilku minut.
            </p>
          </div>
        </div>
      );
    }

    // B. PŁATNOŚĆ PORZUCONA LUB ODRZUCONA
    return (
      <div
        className="relative overflow-hidden rounded-3xl rounded-tr-none border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-brand-secondary/95 z-0" />
        <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay z-0" />

        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none z-0" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 h-max shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
              Wymagane działanie
            </span>
          </div>
          <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.2)] flex items-center justify-center shrink-0">
            <Tent
              size={40}
              weight="duotone"
              className="text-brand-secondary/40"
            />
            <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(245,158,11,0.4)]">
              <WarningCircle size={16} weight="fill" className="text-white" />
            </span>
          </div>
        </div>

        <div className="flex-1 relative z-10">
          <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-white leading-tight mb-3">
            Dokończ rezerwację
          </h3>
          <p className="text-white/80 text-[13.5px] leading-relaxed max-w-sm">
            Płatność za wyjazd <strong>{booking.camp?.title}</strong> nie
            powiodła się. Opłać zadatek, aby zabezpieczyć swoje miejsce.
          </p>
        </div>

        <div className="mt-8 relative z-10">
          <Link
            href={`/rezerwacja/${booking.id}/podsumowanie`}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white font-semibold text-[14px] shadow-[0_4px_15px_0px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_0px_rgba(245,158,11,0.5)] hover:bg-amber-400 transition overflow-hidden"
          >
            <CreditCard size={18} weight="fill" />
            <span className="relative z-10">Opłać zadatek teraz</span>
          </Link>
        </div>
      </div>
    );
  }

  // 4. WIDOK AKTYWNY (Opłacony)
  return (
    <div
      className="relative overflow-hidden rounded-3xl rounded-tr-none border border-white/40 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-6 lg:p-8 h-full min-h-[340px] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-brand-secondary/80 z-0" />

      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none z-0" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary border border-brand-primary/20 h-max shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Twój najbliższy wyjazd
          </span>
        </div>
        <div className="relative w-20 h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-[0_15px_35px_-10px_rgba(3,63,99,0.2)] flex items-center justify-center shrink-0">
          <Tent size={40} weight="duotone" className="text-brand-primary" />
          <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(34,197,94,0.4)]">
            <CheckCircle size={14} weight="fill" className="text-white" />
          </span>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="font-jakarta font-bold text-[22px] lg:text-2xl text-white leading-tight mb-4">
          {booking.camp?.title || "Rehability Camp"}
        </h3>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 text-white/80 text-[13.5px]">
            <CalendarBlank
              size={18}
              weight="duotone"
              className="text-brand-yellow"
            />
            <span className="font-medium">
              {formatDateRange(booking.camp?.startDate, booking.camp?.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-white/80 text-[13.5px]">
            <MapPin size={18} weight="duotone" className="text-brand-yellow" />
            <span className="font-medium">
              {formatLocation(booking.camp?.location)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <Link
          href={`/panel/campy`}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-semibold text-[14px] shadow-[0_4px_15px_0px_rgba(40,125,136,0.35)] hover:shadow-[0_6px_20px_0px_rgba(40,125,136,0.5)] transition overflow-hidden"
        >
          <span className="relative z-10">Przejdź do panelu wyjazdu</span>
          <ArrowRight
            size={16}
            weight="bold"
            className="relative z-10 group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}
