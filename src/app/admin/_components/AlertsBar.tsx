"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  CheckCircle,
  Clock,
  VideoCamera,
  CurrencyCircleDollar,
  HeartStraight,
  ArrowRight,
  SealWarning,
  Flask,
} from "@phosphor-icons/react/dist/ssr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AlertsData {
  pendingBookings: number;
  coursesWithoutVideo: number;
  unpaidRemainders: number;
  missingHealthProfiles: number;
}

const MOCK_ALERTS: AlertsData = {
  pendingBookings: 3,
  coursesWithoutVideo: 1,
  unpaidRemainders: 2,
  missingHealthProfiles: 1,
};

const ALERT_CONFIG = [
  {
    key: "pendingBookings" as const,
    icon: Clock,
    label: (n: number) =>
      `${n} rezerwacj${n === 1 ? "a" : n < 5 ? "e" : "i"} bez płatności`,
    iconBg: "bg-amber-100 text-amber-600",
    rowBg: "hover:bg-amber-50/70",
    href: "/admin/wyjazdy",
  },
  {
    key: "coursesWithoutVideo" as const,
    icon: VideoCamera,
    label: (n: number) =>
      `${n} kurs${n === 1 ? "" : n < 5 ? "y" : "ów"} bez wideo`,
    iconBg: "bg-violet-100 text-violet-600",
    rowBg: "hover:bg-violet-50/70",
    href: "/admin/kursy",
  },
  {
    key: "unpaidRemainders" as const,
    icon: CurrencyCircleDollar,
    label: (n: number) =>
      `${n} nieopłacon${n === 1 ? "a reszta" : "e reszty"} · wyjazd < 30 dni`,
    iconBg: "bg-rose-100 text-rose-600",
    rowBg: "hover:bg-rose-50/70",
    href: "/admin/wyjazdy",
  },
  {
    key: "missingHealthProfiles" as const,
    icon: HeartStraight,
    label: (n: number) =>
      `${n} brakując${n === 1 ? "a karta" : "e karty"} zdrowia · < 7 dni`,
    iconBg: "bg-red-100 text-red-600",
    rowBg: "hover:bg-red-50/70",
    href: "/admin/wyjazdy",
  },
];

export default function AlertsBar() {
  const [mock, setMock] = useState(false);

  const { data: realData, isLoading } = useSWR<AlertsData>(
    "/api/admin/alerts",
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 120_000 },
  );

  const data = mock ? MOCK_ALERTS : realData;

  const active = data ? ALERT_CONFIG.filter((c) => (data[c.key] ?? 0) > 0) : [];
  const allClear = !!data && active.length === 0;
  const totalCount = active.reduce((a, c) => a + (data?.[c.key] ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-5"
    >
      {/* Nagłówek */}
      <div className="flex items-center gap-2 mb-4">
        <SealWarning size={18} weight="duotone" className="text-amber-500" />
        <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
          Do sprawdzenia
        </h3>
        {!allClear && active.length > 0 && (
          <span className="text-[11px] font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">
            {totalCount}
          </span>
        )}
        <button
          onClick={() => setMock((v) => !v)}
          className={`ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
            mock
              ? "bg-violet-100 border-violet-300 text-violet-700"
              : "bg-white/60 border-white/70 text-brand-secondary/35 hover:text-brand-secondary/60"
          }`}
          title="Pokaż/ukryj mockowe alerty"
        >
          <Flask size={10} weight="duotone" />
          Mock
        </button>
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-2xl bg-white/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* All clear */}
      <AnimatePresence>
        {allClear && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6 text-brand-secondary/50"
          >
            <CheckCircle
              size={34}
              weight="duotone"
              className="text-emerald-500"
            />
            <p className="font-montserrat text-[13px] font-semibold text-emerald-600">
              Wszystko w porządku
            </p>
            <p className="font-montserrat text-[12px] text-brand-secondary/40">
              Nic nie wymaga teraz uwagi.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista alertów */}
      {!isLoading && active.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {active.map((alert, i) => {
              const count = data![alert.key];
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={alert.href}
                    className={`group flex items-center gap-3 p-2.5 rounded-2xl transition-colors ${alert.rowBg}`}
                  >
                    <span
                      className={`shrink-0 size-9 rounded-xl rounded-tr-none flex items-center justify-center ${alert.iconBg}`}
                    >
                      <Icon size={18} weight="duotone" />
                    </span>
                    <p className="flex-1 font-montserrat text-[12.5px] font-medium text-brand-secondary/75 leading-snug">
                      {alert.label(count)}
                    </p>
                    <ArrowRight
                      size={14}
                      weight="bold"
                      className="shrink-0 text-brand-secondary/25 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
