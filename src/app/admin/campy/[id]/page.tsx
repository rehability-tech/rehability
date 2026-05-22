"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Warning,
  Users,
  CurrencyCircleDollar,
  HeartStraight,
  Sparkle,
  CaretRight,
  CheckCircle,
  XCircle,
  Envelope,
  CalendarBlank,
  MapPin,
  TrendUp,
  Bell,
  Wallet,
  MagnifyingGlass,
  ArrowUpRight,
  Clock,
  ChartLineUp,
  DotsThreeOutline,
  Gear,
  ForkKnife,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";

const adminUser = {
  name: "Piotr Siemaszko",
  greetingName: "Piotr",
  initials: "PS",
  role: "Administrator",
};

const camp = {
  title: "Camp Mazury — Czerwiec 2026",
  location: "Hotel Mikołajki, Mazury",
  dateRange: "12–16 czerwca 2026",
  checkedIn: 7,
  total: 10,
};

const mobileQuickSummary = [
  {
    label: "Na miejscu",
    value: "7 / 10",
    sub: "Check-in",
    icon: <Users size={20} weight="duotone" />,
    accent: "bg-brand-primary/10 text-brand-primary",
    progress: 70,
  },
  {
    label: "Alerty",
    value: "3",
    sub: "Wymagają akcji",
    icon: <Warning size={20} weight="duotone" />,
    accent: "bg-brand-yellow/30 text-brand-secondary",
    progress: 60,
  },
];

const mobileAlerts = [
  {
    title: "Alergia: orzechy",
    desc: "Karolina M. · kuchnia przed 10:00",
    icon: <Warning size={20} weight="duotone" />,
  },
  {
    title: "Brak dopłaty",
    desc: "Anna K., Patrycja N. · dziś 18:00",
    icon: <CurrencyCircleDollar size={20} weight="duotone" />,
  },
  {
    title: "Karta zdrowia",
    desc: "Marta W. — niewypełniona",
    icon: <HeartStraight size={20} weight="duotone" />,
  },
];

const mobileAgenda = [
  {
    time: "Teraz",
    title: "Poranna Joga w plenerze",
    place: "Taras nad jeziorem",
    icon: <Barbell size={18} weight="duotone" />,
    active: true,
  },
  {
    time: "10:00",
    title: "Śniadanie wegetariańskie",
    place: "Restauracja główna",
    icon: <ForkKnife size={18} weight="duotone" />,
    active: false,
  },
  {
    time: "12:30",
    title: "Warsztat oddechowy",
    place: "Sala konferencyjna",
    icon: <Sparkle size={18} weight="duotone" />,
    active: false,
  },
];

const kpis = [
  {
    title: "Miejsca",
    value: "8 / 10",
    delta: "+2 w tygodniu",
    deltaPositive: true,
    icon: <Users size={20} weight="duotone" />,
    spark: [40, 55, 50, 65, 70, 78, 80],
  },
  {
    title: "Finanse",
    value: "18 400 zł",
    delta: "2 niedopłaty",
    deltaPositive: false,
    icon: <CurrencyCircleDollar size={20} weight="duotone" />,
    spark: [30, 45, 60, 55, 70, 75, 78],
  },
  {
    title: "Karty zdrowia",
    value: "6 / 8",
    delta: "2 do uzupełnienia",
    deltaPositive: false,
    icon: <HeartStraight size={20} weight="duotone" />,
    spark: [50, 50, 60, 60, 65, 72, 75],
  },
  {
    title: "Usługi dodatkowe",
    value: "2 340 zł",
    delta: "+11 slotów",
    deltaPositive: true,
    icon: <Sparkle size={20} weight="duotone" />,
    spark: [20, 25, 35, 40, 50, 55, 62],
  },
];

const pendingActions = [
  {
    name: "Anna Kowalska",
    initials: "AK",
    issue: "Brak wpłaty zadatku",
    amount: "−600 zł",
    deadline: "Dziś 18:00",
    severity: "high",
  },
  {
    name: "Marta Wiśniewska",
    initials: "MW",
    issue: "Niewypełniona Karta Zdrowia",
    amount: "—",
    deadline: "Do 10.06",
    severity: "mid",
  },
  {
    name: "Joanna Lis",
    initials: "JL",
    issue: "Brak ankiety wstępnej",
    amount: "—",
    deadline: "Do 08.06",
    severity: "mid",
  },
  {
    name: "Karolina Maj",
    initials: "KM",
    issue: "Wygasające zaproszenie ‘Przyjaciółka’",
    amount: "—",
    deadline: "Za 2 dni",
    severity: "low",
  },
  {
    name: "Patrycja Nowak",
    initials: "PN",
    issue: "Brak dopłaty końcowej",
    amount: "−1 800 zł",
    deadline: "Dziś 18:00",
    severity: "high",
  },
];

const activityContacts = [
  {
    name: "Anna Kowalska",
    initials: "AK",
    text: "Masaż Kobido",
    meta: "220 zł",
    time: "2 min",
  },
  {
    name: "Marta Wiśniewska",
    initials: "MW",
    text: "Potwierdzona rezerwacja",
    meta: "Zadatek 600 zł",
    time: "18 min",
  },
  {
    name: "Joanna Lis",
    initials: "JL",
    text: "Wypełniona Karta Zdrowia",
    meta: "Wegetarianka",
    time: "1 godz.",
  },
  {
    name: "Karolina Maj",
    initials: "KM",
    text: "Zaproszenie ‘Przyjaciółka’",
    meta: "Wysłane",
    time: "3 godz.",
  },
];

const upcomingEvent = {
  title: "Masaż Anny K.",
  time: "Za 15 minut",
  detail: "Kobido · gabinet 2",
};

function severityChip(sev: string) {
  if (sev === "high")
    return {
      label: "Pilne",
      cls: "bg-brand-yellow/40 text-brand-secondary",
      dot: "bg-brand-secondary",
    };
  if (sev === "mid")
    return {
      label: "Ważne",
      cls: "bg-brand-primary/15 text-brand-primary",
      dot: "bg-brand-primary",
    };
  return {
    label: "Niski",
    cls: "bg-brand-secondary/10 text-brand-secondary",
    dot: "bg-brand-secondary/50",
  };
}

function Sparkline({
  data,
  positive = true,
}: {
  data: number[];
  positive?: boolean;
}) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const stroke = positive ? "var(--color-primary)" : "var(--color-secondary)";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-${positive ? "p" : "n"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${positive ? "p" : "n"})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CampDashboardPage() {
  return (
    <div className="relative font-montserrat min-h-screen">
      {/* AMBIENT BACKGROUND (zdefiniowane kolory) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_60%)]" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-48 -right-32 w-[460px] h-[460px] rounded-full bg-brand-yellow/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-brand-secondary/10 blur-[120px]" />
      </div>

      {/* ============================ */}
      {/*  MOBILE — Topbar + Quick Summary + Alerty + Agenda */}
      {/* ============================ */}
      <section className="block md:hidden px-4 pt-5 pb-28">
        {/* MOBILE TOPBAR */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center font-bold text-sm shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)]">
              {adminUser.initials}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-secondary/60 font-semibold uppercase tracking-wider">
                Cześć
              </span>
              <span className="font-jakarta text-[15px] font-bold text-brand-secondary leading-tight">
                {adminUser.greetingName} 👋
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-10 h-10 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_-6px_rgba(3,63,99,0.12)] border border-white/40 flex items-center justify-center text-brand-secondary">
              <Wallet size={18} weight="duotone" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-yellow shadow-[0_0_6px_rgba(242,217,103,0.9)]" />
            </button>
            <button className="relative w-10 h-10 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_-6px_rgba(3,63,99,0.12)] border border-white/40 flex items-center justify-center text-brand-secondary">
              <Bell size={18} weight="duotone" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(40,125,136,0.9)]" />
            </button>
          </div>
        </header>

        {/* CAMP CONTEXT CARD */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-gradient-to-br from-brand-secondary to-brand-primary text-white p-5 shadow-[0_20px_50px_-12px_rgba(3,63,99,0.45)] relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 -bottom-16 w-44 h-44 rounded-full bg-brand-yellow/20 blur-2xl" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/70 font-bold relative">
            Aktywny wyjazd
          </p>
          <h1 className="font-jakarta text-[22px] font-bold leading-tight mt-1 relative">
            {camp.title}
          </h1>
          <div className="flex items-center gap-1.5 text-[12px] text-white/80 mt-2 relative">
            <MapPin size={13} weight="duotone" />
            <span>{camp.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-white/80 mt-1 relative">
            <CalendarBlank size={13} weight="duotone" />
            <span>{camp.dateRange}</span>
          </div>
        </motion.div>

        {/* QUICK SUMMARY GRID */}
        <h2 className="mt-6 mb-3 font-jakarta text-[13px] font-bold text-brand-secondary uppercase tracking-wider">
          Quick Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {mobileQuickSummary.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 p-4 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.15)]"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${q.accent}`}
              >
                {q.icon}
              </div>
              <p className="text-[11px] text-brand-secondary/60 font-semibold mt-3 uppercase tracking-wider">
                {q.label}
              </p>
              <p className="font-jakarta text-[22px] font-bold text-brand-secondary leading-none mt-1">
                {q.value}
              </p>
              <p className="text-[11px] text-brand-secondary/50 mt-1">{q.sub}</p>
              <div className="mt-3 h-1 bg-brand-secondary/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${q.progress}%` }}
                  transition={{ duration: 0.7 }}
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* KRYTYCZNE ALERTY */}
        <div className="mt-6 flex items-center justify-between mb-3">
          <h2 className="font-jakarta text-[13px] font-bold text-brand-secondary uppercase tracking-wider">
            Krytyczne Alerty
          </h2>
          <span className="text-[11px] text-brand-secondary/50 font-semibold">
            {mobileAlerts.length} aktywne
          </span>
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.15)] divide-y divide-brand-secondary/5">
          {mobileAlerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow/30 text-brand-secondary flex items-center justify-center shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13.5px] text-brand-secondary truncate">
                  {a.title}
                </p>
                <p className="text-[12px] text-brand-secondary/60 truncate">
                  {a.desc}
                </p>
              </div>
              <CaretRight
                size={16}
                className="text-brand-secondary/30 shrink-0"
              />
            </div>
          ))}
        </div>

        {/* AGENDA */}
        <div className="mt-6 flex items-center justify-between mb-3">
          <h2 className="font-jakarta text-[13px] font-bold text-brand-secondary uppercase tracking-wider">
            Najbliższe punkty
          </h2>
          <button className="text-[11px] text-brand-primary font-bold">
            Cały plan →
          </button>
        </div>
        <div className="space-y-2.5">
          {mobileAgenda.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`rounded-2xl backdrop-blur-xl border p-4 flex items-center gap-3 ${
                it.active
                  ? "bg-brand-primary text-white border-white/20 shadow-[0_12px_30px_-10px_rgba(40,125,136,0.5)]"
                  : "bg-white/70 border-white/40 shadow-[0_8px_24px_-12px_rgba(3,63,99,0.12)]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  it.active
                    ? "bg-white/15 text-white"
                    : "bg-brand-primary/10 text-brand-primary"
                }`}
              >
                {it.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      it.active
                        ? "bg-white/20 text-white"
                        : "bg-brand-secondary/10 text-brand-secondary"
                    }`}
                  >
                    {it.time}
                  </span>
                  <p
                    className={`text-[11px] truncate ${
                      it.active ? "text-white/80" : "text-brand-secondary/50"
                    }`}
                  >
                    {it.place}
                  </p>
                </div>
                <p
                  className={`font-semibold text-[14px] truncate mt-0.5 ${
                    it.active ? "text-white" : "text-brand-secondary"
                  }`}
                >
                  {it.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ */}
      {/*  DESKTOP — Topbar + Pending + KPI + Activity */}
      {/* ============================ */}
      <section className="hidden md:grid grid-cols-12 gap-6 p-8 xl:p-10">
        {/* DESKTOP TOPBAR */}
        <header className="col-span-12 flex items-center justify-between rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center font-bold shadow-[0_10px_24px_-8px_rgba(40,125,136,0.5)]">
              {adminUser.initials}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-brand-secondary/50 font-bold">
                Witaj z powrotem
              </p>
              <h2 className="font-jakarta text-[20px] font-bold text-brand-secondary leading-tight">
                {adminUser.greetingName}
              </h2>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden lg:flex">
            <div className="w-full relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40"
              />
              <input
                type="text"
                placeholder="Szukaj uczestniczki, usługi, transakcji…"
                className="w-full bg-white/50 border border-white/40 rounded-2xl pl-11 pr-4 py-2.5 text-[13px] text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-brand-secondary hover:bg-white transition">
              <Wallet size={20} weight="duotone" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-yellow shadow-[0_0_6px_rgba(242,217,103,0.9)]" />
            </button>
            <button className="relative w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-brand-secondary hover:bg-white transition">
              <Bell size={20} weight="duotone" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(40,125,136,0.9)]" />
            </button>
            <button className="w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-brand-secondary hover:bg-white transition">
              <Gear size={20} weight="duotone" />
            </button>
            <div className="h-8 w-px bg-brand-secondary/10 mx-2" />
            <button className="flex items-center gap-2 pr-3 pl-1.5 py-1.5 rounded-2xl hover:bg-white transition">
              <div className="w-9 h-9 rounded-xl bg-brand-secondary text-white flex items-center justify-center font-bold text-xs">
                {adminUser.initials}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[12px] font-bold text-brand-secondary leading-none">
                  {adminUser.name}
                </span>
                <span className="text-[11px] text-brand-secondary/50 mt-0.5">
                  {adminUser.role}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* CAMP HERO */}
        <div className="col-span-12 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_-6px_rgba(3,63,99,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(40,125,136,0.7)] animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">
                Aktywny wyjazd · LIVE
              </span>
            </div>
            <h1 className="font-jakarta text-[30px] font-bold text-brand-secondary leading-tight mt-3">
              {camp.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-brand-secondary/60 mt-1.5">
              <MapPin size={15} weight="duotone" />
              <span>{camp.location}</span>
              <span className="text-brand-secondary/20">·</span>
              <CalendarBlank size={15} weight="duotone" />
              <span>{camp.dateRange}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-brand-secondary/50 font-bold">
              Check-in
            </span>
            <div className="text-right">
              <p className="font-jakarta text-[22px] font-bold text-brand-secondary leading-none">
                {camp.checkedIn}{" "}
                <span className="text-brand-secondary/30 text-base">
                  / {camp.total}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* MIDDLE — OCZEKUJĄCE AKCJE (8 cols) + UPCOMING + ACTIVITY (4 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="col-span-12 xl:col-span-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h3 className="font-jakarta text-[17px] font-bold text-brand-secondary">
                Oczekujące akcje
              </h3>
              <p className="text-[12px] text-brand-secondary/50 mt-0.5">
                {pendingActions.length} zadań wymaga twojej uwagi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[12px] font-semibold text-brand-secondary/60 px-3 py-1.5 rounded-full hover:bg-white transition">
                Filtruj
              </button>
              <button className="text-[12px] font-semibold text-white bg-brand-primary px-4 py-1.5 rounded-full hover:bg-brand-secondary transition shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]">
                Zobacz wszystkie
              </button>
            </div>
          </div>

          <div className="px-6 pb-2">
            <div className="grid grid-cols-[1.7fr_2fr_1fr_1fr_40px] gap-4 px-2 pb-3 text-[10px] uppercase tracking-wider font-bold text-brand-secondary/40">
              <span>Uczestniczka</span>
              <span>Problem</span>
              <span>Kwota</span>
              <span>Termin</span>
              <span />
            </div>
          </div>

          <ul>
            {pendingActions.map((p, i) => {
              const chip = severityChip(p.severity);
              return (
                <li
                  key={i}
                  className="grid grid-cols-[1.7fr_2fr_1fr_1fr_40px] gap-4 items-center px-8 py-3.5 hover:bg-white/60 transition cursor-pointer border-t border-white/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-secondary flex items-center justify-center font-bold text-[12px] shrink-0">
                      {p.initials}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${chip.dot}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] text-brand-secondary truncate">
                        {p.name}
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${chip.cls}`}
                      >
                        {chip.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px] text-brand-secondary/80 truncate">
                    {p.issue}
                  </p>
                  <p
                    className={`text-[13px] font-bold ${
                      p.amount.startsWith("−")
                        ? "text-brand-secondary"
                        : "text-brand-secondary/40"
                    }`}
                  >
                    {p.amount}
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px] text-brand-secondary/60">
                    <Clock size={13} weight="duotone" />
                    {p.deadline}
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white/60 hover:bg-brand-primary hover:text-white text-brand-primary flex items-center justify-center transition shadow-[0_4px_12px_-4px_rgba(3,63,99,0.15)]">
                    <ArrowUpRight size={14} weight="bold" />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>

        {/* RIGHT COLUMN: UPCOMING EVENT + ACTIVITY (CONTACTS STYLE) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Upcoming event highlight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative rounded-3xl bg-gradient-to-br from-brand-yellow/70 via-brand-yellow/40 to-white/60 backdrop-blur-xl border border-white/40 p-5 shadow-[0_8px_30px_-12px_rgba(242,217,103,0.5)] overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-brand-yellow/40 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/60 font-bold">
                  Najbliższe wydarzenie
                </p>
                <h3 className="font-jakarta text-[18px] font-bold text-brand-secondary mt-1">
                  {upcomingEvent.title}
                </h3>
                <p className="text-[12.5px] text-brand-secondary/70 mt-1">
                  {upcomingEvent.detail}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-brand-secondary text-white text-[11px] font-bold">
                  <Clock size={12} weight="bold" />
                  {upcomingEvent.time}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center text-brand-secondary shadow-[0_8px_20px_-8px_rgba(3,63,99,0.2)]">
                <Sparkle size={22} weight="duotone" />
              </div>
            </div>
          </motion.div>

          {/* Activity (Contacts-style) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] overflow-hidden flex-1"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-jakarta text-[15px] font-bold text-brand-secondary">
                Ostatnia aktywność
              </h3>
              <button className="text-brand-secondary/40 hover:text-brand-secondary">
                <DotsThreeOutline size={18} weight="duotone" />
              </button>
            </div>
            <ul className="px-3 pb-3 space-y-1">
              {activityContacts.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/80 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 text-brand-secondary flex items-center justify-center font-bold text-[12px] shrink-0">
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-brand-secondary truncate">
                      {c.name}
                    </p>
                    <p className="text-[12px] text-brand-secondary/60 truncate">
                      {c.text}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[12px] font-bold text-brand-primary">
                      {c.meta}
                    </span>
                    <span className="text-[10px] text-brand-secondary/40 mt-0.5">
                      {c.time}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* BOTTOM — KPI CARDS Z WYKRESAMI */}
        {kpis.map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
            className="col-span-12 sm:col-span-6 xl:col-span-3 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                {k.icon}
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
                  k.deltaPositive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-brand-yellow/30 text-brand-secondary"
                }`}
              >
                {k.deltaPositive ? (
                  <TrendUp size={12} weight="bold" />
                ) : (
                  <Warning size={12} weight="bold" />
                )}
                {k.delta}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider text-brand-secondary/50 font-bold mt-4">
              {k.title}
            </p>
            <div className="flex items-end justify-between mt-1">
              <p className="font-jakarta text-[26px] font-bold text-brand-secondary leading-none">
                {k.value}
              </p>
              <Sparkline data={k.spark} positive={k.deltaPositive} />
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
