"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import {
  MapPin,
  CalendarBlank,
  CheckCircle,
  Clock,
  Ticket,
  SealWarning,
  Heart,
  Warning,
  CurrencyCircleDollar,
  ArrowRight,
  Sparkle,
  Sun,
  ForkKnife,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";

interface Booking {
  id: string;
  qrToken: string;
  status: string;
  isCheckedIn: boolean;
  name: string | null;
  email: string;
  depositPaidAt: string | null;
  remainderPaidAt: string | null;
}

interface Camp {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  heroImage: string | null;
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calcTimeLeft(new Date(targetDate)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(new Date(targetDate)));
    }, 1000);
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
  CONFIRMED: {
    label: "Potwierdzona",
    cls: "bg-white/25 text-white",
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

// MOCK — docelowo z ServiceOrder / CampEvent / HealthProfile
const mockState = {
  totalPrice: 2400,
  depositAmount: 600,
  remainderAmount: 1800,
  healthFilled: false,
  agendaPreview: [
    {
      time: "08:00",
      title: "Powitalne śniadanie",
      place: "Restauracja Tarasowa",
      icon: <ForkKnife size={16} weight="duotone" />,
    },
    {
      time: "10:30",
      title: "Otwarcie · Joga przy jeziorze",
      place: "Taras nad jeziorem",
      icon: <Sun size={16} weight="duotone" />,
    },
    {
      time: "13:00",
      title: "Lunch wegetariański",
      place: "Restauracja Tarasowa",
      icon: <ForkKnife size={16} weight="duotone" />,
    },
    {
      time: "16:00",
      title: "Warsztat oddechowy",
      place: "Sala Mazurska",
      icon: <Barbell size={16} weight="duotone" />,
    },
  ],
};

export default function DashboardClient({
  booking,
  camp,
}: {
  booking: Booking;
  camp: Camp;
}) {
  const timeLeft = useCountdown(camp.startDate);
  const campStarted = !timeLeft;
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["PENDING"];

  const firstName = (booking.name ?? "").split(" ")[0] || "Kochana";

  const depositPaid = !!booking.depositPaidAt;
  const remainderPaid = !!booking.remainderPaidAt;
  const paymentProgress = remainderPaid ? 100 : depositPaid ? 25 : 0;
  const paymentValue = remainderPaid
    ? mockState.totalPrice
    : depositPaid
      ? mockState.depositAmount
      : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
    });

  return (
    <div className="pt-6 pb-4 lg:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ========================== */}
      {/* HERO + COUNTDOWN (full) */}
      {/* ========================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="lg:col-span-12 relative rounded-[28px] overflow-hidden shadow-[0_24px_60px_-22px_rgba(3,63,99,0.5)]"
      >
        <div className="absolute inset-0">
          {camp.heroImage ? (
            <Image
              src={camp.heroImage}
              alt={camp.title}
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

        <div className="relative p-6 lg:p-10 text-white">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full ${statusCfg.cls} backdrop-blur-md`}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>

          <h1 className="font-jakarta text-[28px] lg:text-[40px] font-bold leading-tight mt-3">
            Witaj {firstName} ✨
          </h1>
          <p className="text-white/80 text-[14px] lg:text-[15px] mt-1 max-w-lg">
            Czeka na Ciebie {camp.title.toLowerCase()}. Wszystko jest gotowe —
            wystarczy odliczyć dni.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-white/85 text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} weight="duotone" /> {camp.location}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank size={14} weight="duotone" />
              {formatDate(camp.startDate)} – {formatDate(camp.endDate)}
            </span>
          </div>

          {/* Countdown */}
          {!campStarted ? (
            <div className="mt-6 lg:mt-8 inline-flex flex-wrap items-end gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70 w-full">
                Zostało do relaksu
              </p>
              <div className="grid grid-cols-4 gap-2 lg:gap-3">
                {[
                  { v: timeLeft!.days, l: "dni" },
                  { v: timeLeft!.hours, l: "godz" },
                  { v: timeLeft!.minutes, l: "min" },
                  { v: timeLeft!.seconds, l: "sek" },
                ].map((u, i) => (
                  <div
                    key={i}
                    className="min-w-[64px] lg:min-w-[80px] rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-3 py-2.5 lg:px-4 lg:py-3 text-center"
                  >
                    <p className="font-jakarta text-[26px] lg:text-[34px] font-bold tabular-nums leading-none">
                      {String(u.v).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/60 mt-1">
                      {u.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 text-white text-sm font-bold">
              <Sparkle size={16} weight="fill" /> Wyjazd trwa — miłego
              wypoczynku!
            </div>
          )}
        </div>
      </motion.section>

      {/* ========================== */}
      {/* QR TICKET — Apple Wallet style */}
      {/* ========================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="lg:col-span-5 relative"
      >
        <div className="absolute inset-0 rounded-[28px] bg-brand-primary/30 blur-2xl opacity-70" />
        <div className="relative rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_-15px_rgba(40,125,136,0.4)] overflow-hidden">
          {/* Top stripe */}
          <div className="bg-gradient-to-br from-brand-secondary to-brand-primary px-6 py-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={18} weight="fill" />
                <span className="font-jakarta text-[14px] font-bold uppercase tracking-wider">
                  Twój bilet
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur-md">
                #{booking.id.slice(0, 6).toUpperCase()}
              </span>
            </div>
            <p className="relative font-jakarta text-[20px] font-bold mt-3 leading-tight">
              {booking.name ?? firstName}
            </p>
            <p className="relative text-[12px] text-white/70 mt-0.5">
              {camp.title}
            </p>
          </div>

          {/* Perforated edge */}
          <div className="relative flex">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f5fbfc]" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f5fbfc]" />
            <div className="flex-1 border-t border-dashed border-brand-secondary/15 mt-6" />
          </div>

          <div className="p-6 pt-2">
            <div className="bg-white rounded-2xl p-5 flex justify-center shadow-[inset_0_0_0_1px_rgba(40,125,136,0.08)]">
              <QRCode
                value={booking.qrToken}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
                fgColor="#033f63"
              />
            </div>

            <p className="text-center text-[12px] text-brand-secondary/50 mt-3 font-medium">
              Pokaż kod przy odprawie na miejscu
            </p>

            {booking.isCheckedIn ? (
              <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-brand-primary/10 text-brand-primary text-[13px] font-bold">
                <CheckCircle size={16} weight="fill" />
                Zameldowano na miejscu
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-brand-yellow/30 text-brand-secondary text-[13px] font-bold">
                <Clock size={16} weight="fill" />
                Oczekuje na odprawę
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ========================== */}
      {/* RIGHT COLUMN — actions */}
      {/* ========================== */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        {/* PŁATNOŚCI */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <CurrencyCircleDollar size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                  Płatności
                </h3>
                <p className="text-[11px] text-brand-secondary/50">
                  {paymentValue.toLocaleString("pl-PL")} zł /{" "}
                  {mockState.totalPrice.toLocaleString("pl-PL")} zł
                </p>
              </div>
            </div>
            {remainderPaid ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary text-white shadow-[0_6px_14px_-4px_rgba(40,125,136,0.6)]">
                <CheckCircle size={11} weight="fill" />
                Opłacone w pełni
              </span>
            ) : depositPaid ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-yellow/40 text-brand-secondary">
                Pozostała dopłata
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-600">
                Brak wpłaty
              </span>
            )}
          </div>

          <div className="h-2 bg-brand-secondary/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${paymentProgress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <PaymentChip
              label="Zadatek"
              amount={mockState.depositAmount}
              paid={depositPaid}
            />
            <PaymentChip
              label="Reszta"
              amount={mockState.remainderAmount}
              paid={remainderPaid}
            />
          </div>

          {!remainderPaid && (
            <button className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-primary text-white text-[13px] font-bold hover:bg-brand-secondary transition shadow-[0_10px_24px_-8px_rgba(40,125,136,0.6)]">
              {depositPaid
                ? `Opłać resztę (${mockState.remainderAmount.toLocaleString("pl-PL")} zł)`
                : `Opłać zadatek (${mockState.depositAmount.toLocaleString("pl-PL")} zł)`}
              <ArrowRight size={16} weight="bold" />
            </button>
          )}
        </motion.section>

        {/* KARTA ZDROWIA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className={`relative rounded-[24px] backdrop-blur-xl p-5 lg:p-6 overflow-hidden ${
            mockState.healthFilled
              ? "bg-white/70 border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)]"
              : "bg-white/70 border border-rose-200/50 shadow-[0_0_0_1px_rgba(244,63,94,0.12),0_18px_45px_-15px_rgba(244,63,94,0.35)]"
          }`}
        >
          {!mockState.healthFilled && (
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-rose-400/25 blur-3xl animate-pulse" />
          )}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  mockState.healthFilled
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.6)]"
                }`}
              >
                <Heart size={20} weight="fill" />
              </div>
              <div>
                <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                  Karta Zdrowia
                </h3>
                <p className="text-[11px] text-brand-secondary/50">
                  Diety, alergie, przeciwwskazania
                </p>
              </div>
            </div>
            {mockState.healthFilled ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary">
                <CheckCircle size={11} weight="fill" />
                Wypełniono
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white">
                <Warning size={11} weight="fill" />
                Wymaga akcji
              </span>
            )}
          </div>

          {!mockState.healthFilled ? (
            <>
              <p className="text-[13px] text-brand-secondary/80 relative">
                Zanim ruszymy w drogę musimy poznać Twoją dietę, ewentualne
                alergie i przeciwwskazania. Zajmie to maks. 2 minuty.
              </p>
              <button className="relative mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[13px] font-bold transition shadow-[0_12px_30px_-8px_rgba(244,63,94,0.55)] animate-pulse">
                Uzupełnij dietę przed wyjazdem!
                <ArrowRight size={16} weight="bold" />
              </button>
            </>
          ) : (
            <div className="relative grid grid-cols-3 gap-2 text-[11px] text-brand-secondary/70">
              <div className="rounded-xl bg-white/60 border border-white/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                  Dieta
                </p>
                <p className="mt-1 font-semibold text-brand-secondary">
                  Wegetariańska
                </p>
              </div>
              <div className="rounded-xl bg-white/60 border border-white/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                  Alergie
                </p>
                <p className="mt-1 font-semibold text-brand-secondary">Brak</p>
              </div>
              <div className="rounded-xl bg-white/60 border border-white/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                  Urazy
                </p>
                <p className="mt-1 font-semibold text-brand-secondary">Brak</p>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      {/* ========================== */}
      {/* SNEAK PEEK — twój pierwszy dzień */}
      {/* ========================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="lg:col-span-12 relative rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6 overflow-hidden"
      >
        <div className="absolute -top-12 right-1/4 w-44 h-44 rounded-full bg-brand-yellow/30 blur-3xl" />

        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-yellow/40 text-brand-secondary flex items-center justify-center">
              <Sparkle size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                Twój najbliższy dzień
              </h3>
              <p className="text-[11px] text-brand-secondary/50">
                Sneak peek na 12 czerwca — dzień przyjazdu
              </p>
            </div>
          </div>
          <button className="text-[12px] font-bold text-brand-primary px-3 py-1.5 rounded-full hover:bg-brand-primary/10 transition">
            Pełny plan →
          </button>
        </div>

        <ol className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {mockState.agendaPreview.map((item, i) => (
            <li
              key={i}
              className="relative rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4 hover:bg-white transition"
            >
              <div className="absolute top-3 right-3 text-[10px] font-bold text-brand-secondary/30">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                {item.icon}
              </div>
              <p className="text-[11px] font-bold text-brand-primary uppercase tracking-wider mt-3">
                {item.time}
              </p>
              <p className="font-jakarta font-bold text-[13.5px] text-brand-secondary leading-tight mt-1">
                {item.title}
              </p>
              <p className="text-[11px] text-brand-secondary/50 mt-1">
                {item.place}
              </p>
            </li>
          ))}
        </ol>
      </motion.section>
    </div>
  );
}

function PaymentChip({
  label,
  amount,
  paid,
}: {
  label: string;
  amount: number;
  paid: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        paid
          ? "bg-brand-primary/5 border-brand-primary/20"
          : "bg-white/60 border-white/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
          {label}
        </span>
        {paid ? (
          <CheckCircle size={14} weight="fill" className="text-brand-primary" />
        ) : (
          <Clock size={14} weight="duotone" className="text-brand-secondary/40" />
        )}
      </div>
      <p className="font-jakarta font-bold text-[18px] text-brand-secondary mt-1">
        {amount.toLocaleString("pl-PL")} zł
      </p>
    </div>
  );
}
