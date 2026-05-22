"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Envelope,
  MapPin,
  Heart,
  Warning,
  CheckCircle,
  CurrencyCircleDollar,
  Sparkle,
  Pill,
  ForkKnife,
  FirstAid,
  ShieldWarning,
  CalendarBlank,
  ChatCircle,
  QrCode,
  Pencil,
  Clock,
  X,
} from "@phosphor-icons/react/dist/ssr";

const participant = {
  id: "b_001",
  name: "Anna Kowalska",
  initials: "AK",
  email: "anna.kowalska@example.com",
  phone: "+48 602 145 880",
  city: "Warszawa",
  bookingStatus: "CONFIRMED",
  pack: "DUO",
  invitedBy: "Karolina Maj",
  qrToken: "QR-AK-99342",
  checkedIn: false,
  joinedAt: "12.04.2026",
  health: {
    severity: "high" as "high" | "mid" | "ok",
    dietType: "Wegetarianka",
    foodIntolerances: ["Orzechy ziemne", "Sezam"],
    foodNotes: "Bez ostrych przypraw, mleko sojowe zamiast krowiego.",
    chronicConditions: "Astma oskrzelowa (kontrolowana)",
    medications: "Ventolin (doraźnie), Symbicort 160/4.5 (rano i wieczorem)",
    injuries: "Operacja kolana lewego (2021), unikać głębokich przysiadów",
    allergies: "Orzechy ziemne — reakcja anafilaktyczna (EpiPen w bagażu)",
    emergencyName: "Tomasz Kowalski (mąż)",
    emergencyPhone: "+48 602 145 881",
  },
  payment: {
    total: 2400,
    deposit: 600,
    remainder: 1800,
    depositPaidAt: "14.04.2026",
    remainderPaidAt: null,
    method: "Przelew tradycyjny",
  },
  services: [
    {
      name: "Masaż Kobido",
      duration: 70,
      price: 220,
      slotAt: "13.06 · 14:00",
      status: "PAID",
    },
    {
      name: "Sesja Floatingu",
      duration: 60,
      price: 220,
      slotAt: "14.06 · 11:00",
      status: "PAID",
    },
  ],
};

const isHealthCritical = participant.health.severity === "high";

function fmtPLN(n: number) {
  return `${n.toLocaleString("pl-PL")} zł`;
}

export default function UczestniczkaProfilePage() {
  const paidPct = Math.round(
    (participant.payment.deposit / participant.payment.total) * 100,
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)] font-montserrat">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_60%)]" />
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-brand-primary/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[460px] h-[460px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>

      <div className="p-4 md:p-8 xl:p-10 space-y-6">
        {/* BACK */}
        <Link
          href="/admin/campy/123/uczestniczki"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-brand-secondary/60 hover:text-brand-secondary"
        >
          <ArrowLeft size={14} weight="bold" />
          Wszystkie uczestniczki
        </Link>

        {/* HEADER */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] p-5 md:p-7 overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-brand-primary/15 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-[4px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary blur-md opacity-60" />
              <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary" />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center font-bold text-[26px] md:text-[28px] text-brand-secondary">
                {participant.initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary">
                  <CheckCircle size={11} weight="bold" />
                  {participant.bookingStatus === "CONFIRMED"
                    ? "Potwierdzona"
                    : participant.bookingStatus}
                </span>
                {participant.pack === "DUO" && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary">
                    DUO · z {participant.invitedBy}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-yellow/40 text-brand-secondary">
                  <QrCode size={11} weight="bold" />
                  {participant.qrToken}
                </span>
              </div>
              <h1 className="font-jakarta text-[24px] md:text-[30px] font-bold text-brand-secondary leading-tight mt-2">
                {participant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-brand-secondary/60 mt-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Envelope size={13} weight="duotone" />
                  {participant.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} weight="duotone" />
                  {participant.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} weight="duotone" />
                  {participant.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarBlank size={13} weight="duotone" />
                  Dołączyła {participant.joinedAt}
                </span>
              </div>
            </div>

            <div className="flex md:flex-col gap-2 md:gap-2 shrink-0">
              <a
                href={`tel:${participant.phone}`}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold hover:bg-brand-secondary transition shadow-[0_8px_22px_-8px_rgba(40,125,136,0.5)]"
              >
                <Phone size={16} weight="bold" />
                Zadzwoń
              </a>
              <a
                href={`mailto:${participant.email}`}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 border border-white/40 text-brand-secondary text-[13px] font-semibold hover:bg-white transition"
              >
                <ChatCircle size={16} weight="duotone" />
                Wyślij wiadomość
              </a>
            </div>
          </div>
        </motion.section>

        {/* GRID: HEALTH + PAYMENT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* HEALTH CARD — KRYTYCZNE */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className={`relative xl:col-span-2 rounded-3xl backdrop-blur-xl p-5 md:p-6 overflow-hidden ${
              isHealthCritical
                ? "bg-white/80 border border-rose-200/60 shadow-[0_0_0_1px_rgba(244,63,94,0.15),0_20px_50px_-15px_rgba(244,63,94,0.4)]"
                : "bg-white/70 border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)]"
            }`}
          >
            {isHealthCritical && (
              <>
                <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-rose-400/25 blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-rose-400/20 blur-3xl" />
              </>
            )}
            <div className="relative flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    isHealthCritical
                      ? "bg-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.6)]"
                      : "bg-brand-primary/10 text-brand-primary"
                  }`}
                >
                  <Heart size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-brand-secondary text-[17px]">
                    Karta Zdrowia
                  </h3>
                  <p className="text-[12px] text-brand-secondary/50">
                    Dane medyczne · poufne
                  </p>
                </div>
              </div>
              {isHealthCritical ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-[0_6px_18px_-4px_rgba(244,63,94,0.6)]">
                  <ShieldWarning size={11} weight="bold" />
                  Krytyczne!
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
                  OK
                </span>
              )}
            </div>

            {/* ALERGIE — najważniejsze */}
            <div
              className={`relative rounded-2xl p-4 mb-4 ${
                isHealthCritical
                  ? "bg-rose-500/10 border border-rose-200"
                  : "bg-brand-yellow/20 border border-brand-yellow/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Warning
                  size={16}
                  weight="fill"
                  className={
                    isHealthCritical ? "text-rose-500" : "text-brand-secondary"
                  }
                />
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isHealthCritical ? "text-rose-600" : "text-brand-secondary"
                  }`}
                >
                  Alergie
                </p>
              </div>
              <p
                className={`text-[14px] font-semibold ${
                  isHealthCritical ? "text-rose-700" : "text-brand-secondary"
                }`}
              >
                {participant.health.allergies}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  label: "Dieta",
                  value: participant.health.dietType,
                  notes: participant.health.foodNotes,
                  icon: <ForkKnife size={16} weight="duotone" />,
                },
                {
                  label: "Nietolerancje pokarmowe",
                  value: participant.health.foodIntolerances.join(", "),
                  icon: <X size={16} weight="duotone" />,
                },
                {
                  label: "Choroby przewlekłe",
                  value: participant.health.chronicConditions,
                  icon: <FirstAid size={16} weight="duotone" />,
                },
                {
                  label: "Leki",
                  value: participant.health.medications,
                  icon: <Pill size={16} weight="duotone" />,
                },
                {
                  label: "Urazy / przeciwwskazania",
                  value: participant.health.injuries,
                  icon: <ShieldWarning size={16} weight="duotone" />,
                  wide: true,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 p-4 ${
                    row.wide ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-brand-secondary/60">
                    {row.icon}
                    <p className="text-[10.5px] font-bold uppercase tracking-wider">
                      {row.label}
                    </p>
                  </div>
                  <p className="text-[13px] text-brand-secondary mt-1 leading-snug">
                    {row.value}
                  </p>
                  {row.notes && (
                    <p className="text-[12px] text-brand-secondary/50 mt-1 italic">
                      {row.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-brand-secondary text-white p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Osoba do kontaktu w nagłych wypadkach
                </p>
                <p className="font-semibold text-[14px] mt-1">
                  {participant.health.emergencyName}
                </p>
                <p className="text-[12px] text-white/70 mt-0.5">
                  {participant.health.emergencyPhone}
                </p>
              </div>
              <a
                href={`tel:${participant.health.emergencyPhone}`}
                className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <Phone size={18} weight="bold" />
              </a>
            </div>
          </motion.section>

          {/* PAYMENT */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] p-5 md:p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <CurrencyCircleDollar size={20} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-brand-secondary text-[17px]">
                    Płatności
                  </h3>
                  <p className="text-[12px] text-brand-secondary/50">
                    {participant.payment.method}
                  </p>
                </div>
              </div>
              <button className="w-9 h-9 rounded-xl bg-white/70 text-brand-secondary hover:bg-white transition flex items-center justify-center">
                <Pencil size={15} weight="duotone" />
              </button>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-brand-secondary/50 font-bold">
                    Zapłacone
                  </p>
                  <p className="font-jakarta text-[28px] font-bold text-brand-secondary leading-none mt-1">
                    {fmtPLN(participant.payment.deposit)}
                  </p>
                </div>
                <p className="text-[13px] text-brand-secondary/50">
                  z {fmtPLN(participant.payment.total)}
                </p>
              </div>

              <div className="mt-3 h-2 bg-brand-secondary/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paidPct}%` }}
                  transition={{ duration: 0.7 }}
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
                />
              </div>
              <p className="text-[11px] text-brand-secondary/50 mt-1.5">
                {paidPct}% kosztu pokryte
              </p>
            </div>

            <ul className="mt-5 space-y-3">
              <li className="flex items-center justify-between p-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/15">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center">
                    <CheckCircle size={15} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-brand-secondary">
                      Zadatek
                    </p>
                    <p className="text-[11px] text-brand-secondary/50">
                      Opłacono {participant.payment.depositPaidAt}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[13px] text-brand-secondary">
                  {fmtPLN(participant.payment.deposit)}
                </span>
              </li>

              <li className="flex items-center justify-between p-3 rounded-2xl bg-brand-yellow/20 border border-brand-yellow/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-secondary flex items-center justify-center">
                    <Clock size={15} weight="bold" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-brand-secondary">
                      Reszta do dopłaty
                    </p>
                    <p className="text-[11px] text-brand-secondary/60">
                      Termin: 30.05.2026
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[13px] text-brand-secondary">
                  {fmtPLN(participant.payment.remainder)}
                </span>
              </li>
            </ul>

            <button className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold hover:bg-brand-secondary transition shadow-[0_8px_22px_-8px_rgba(40,125,136,0.5)]">
              Wyślij przypomnienie o dopłacie
            </button>
          </motion.section>
        </div>

        {/* SERVICES */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-yellow/40 text-brand-secondary flex items-center justify-center">
                <Sparkle size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="font-jakarta font-bold text-brand-secondary text-[17px]">
                  Usługi dodatkowe
                </h3>
                <p className="text-[12px] text-brand-secondary/50">
                  {participant.services.length} wykupionych ·{" "}
                  {fmtPLN(
                    participant.services.reduce((s, x) => s + x.price, 0),
                  )}
                </p>
              </div>
            </div>
            <button className="text-[12px] font-bold text-brand-primary px-3 py-1.5 rounded-full hover:bg-brand-primary/10 transition">
              Dodaj usługę →
            </button>
          </div>

          {participant.services.length === 0 ? (
            <div className="rounded-2xl bg-white/60 border border-white/40 p-8 text-center">
              <p className="text-[13px] text-brand-secondary/50">
                Brak wykupionych usług dodatkowych.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {participant.services.map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 p-4 overflow-hidden"
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-yellow/30 blur-2xl" />
                  <div className="relative flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-jakarta font-bold text-[15px] text-brand-secondary truncate">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-brand-secondary/60 mt-1">
                        <Clock size={12} weight="duotone" />
                        <span>{s.duration} min</span>
                        <span className="text-brand-secondary/30">·</span>
                        <CalendarBlank size={12} weight="duotone" />
                        <span>{s.slotAt}</span>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                      <CheckCircle size={10} weight="bold" />
                      Opłacone
                    </span>
                  </div>
                  <div className="relative mt-4 pt-3 border-t border-white/40 flex items-center justify-between">
                    <span className="text-[11px] text-brand-secondary/50 font-semibold uppercase tracking-wider">
                      Cena
                    </span>
                    <span className="font-jakarta font-bold text-[18px] text-brand-secondary">
                      {fmtPLN(s.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
