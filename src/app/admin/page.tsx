"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SquaresFour,
  Suitcase,
  MonitorPlay,
} from "@phosphor-icons/react/dist/ssr";
import AlertsBar from "./_components/AlertsBar";
import QuickActionsShowcase from "./_components/QuickActionsShowcase";
import UpcomingPanel from "./_components/UpcomingPanel";
import StatsGrid from "./_components/StatsGrid";
import FinancialChart from "./_components/FinancialChart";
import RecentActivity from "./_components/RecentActivity";
import BlogWeeklySchedule from "./_components/BlogWeeklySchedule";
import FeatureDisabledToast from "./_components/FeatureDisabledToast";

// Wspólny styl "kropli" zgodny z resztą paneli admina.
const CARD =
  "rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)]";

export default function AdminHubPage() {
  return (
    <div className="relative min-h-screen font-montserrat">
      {/* Toast po odbiciu z wyłączonej sekcji (?niedostepne=…). Suspense jest
          wymagany — komponent czyta useSearchParams. */}
      <React.Suspense fallback={null}>
        <FeatureDisabledToast />
      </React.Suspense>

      {/* --- BRANDOWE ROZMYTE AKCENTY W TLE --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8"
      >
        {/* HERO */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
                <SquaresFour size={14} weight="fill" className="text-brand-yellow" />
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  Pulpit główny
                </span>
              </div>
              <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
                Panel administracyjny
              </h1>
              <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
                Przegląd platformy VOD i wydarzeń — najważniejsze liczby, alerty
                i nadchodzące wydarzenia w jednym miejscu.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/admin/wydarzenia"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 h-12 rounded-[16px] bg-white/15 backdrop-blur-md text-white font-bold text-[13.5px] border border-white/25 hover:bg-white/25 transition-all duration-300 shrink-0"
              >
                <Suitcase size={18} weight="bold" />
                Wydarzenia
              </Link>
              <Link
                href="/admin/kursy"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-white text-brand-secondary font-bold text-[13.5px] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shrink-0 border border-white/40"
              >
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2">
                  <MonitorPlay size={18} weight="bold" className="text-brand-primary" />
                  Platforma VOD
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Do sprawdzenia (lewa kolumna) + Logi systemowe (prawa) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          <div className="xl:col-span-5 flex flex-col">
            <AlertsBar />
          </div>
          <div className="xl:col-span-7 flex flex-col">
            <RecentActivity />
          </div>
        </div>

        {/* Szybkie akcje + Nadchodzące wydarzenie */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          <div className="xl:col-span-5 flex flex-col">
            <QuickActionsShowcase />
          </div>
          <div className="xl:col-span-7 flex flex-col">
            <UpcomingPanel />
          </div>
        </div>

        {/* KPI statystyki */}
        <StatsGrid />

        {/* Wykres finansowy (pełna szerokość) */}
        <div className={`w-full ${CARD} p-6 md:p-8`}>
          <FinancialChart />
        </div>

        {/* Harmonogram bloga (pełna szerokość) */}
        <BlogWeeklySchedule />
      </motion.div>
    </div>
  );
}
