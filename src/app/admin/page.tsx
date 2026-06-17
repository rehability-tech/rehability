"use client";

import React from "react";
import AlertsBar from "./_components/AlertsBar";
import QuickActionsShowcase from "./_components/QuickActionsShowcase";
import UpcomingPanel from "./_components/UpcomingPanel";
import StatsGrid from "./_components/StatsGrid";
import FinancialChart from "./_components/FinancialChart";
import RecentActivity from "./_components/RecentActivity";
import BlogWeeklySchedule from "./_components/BlogWeeklySchedule";

export default function AdminHubPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] font-montserrat">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 pt-8 lg:pt-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5 items-start">

          {/* ── Strefa 1: Alerty ── */}
          <div className="xl:col-span-12">
            <AlertsBar />
          </div>

          {/* ── Strefa 2: Szybkie akcje + Nadchodzący wyjazd ── */}
          <div className="xl:col-span-5 flex flex-col">
            <QuickActionsShowcase />
          </div>
          <div className="xl:col-span-7 flex flex-col">
            <UpcomingPanel />
          </div>

          {/* ── Strefa 3: KPI stats ── */}
          <div className="xl:col-span-12">
            <StatsGrid />
          </div>

          {/* ── Strefa 4: Wykres finansowy ── */}
          <div className="xl:col-span-8 w-full rounded-3xl bg-white border border-gray-100 shadow-[0_10px_30px_-10px_rgba(3,63,99,0.05)] p-6 md:p-8">
            <FinancialChart />
          </div>

          {/* ── Strefa 4–5: Live feed (rozpina się na 2 rzędy) ── */}
          <div className="xl:col-span-4 xl:row-span-2 xl:self-stretch h-[540px] xl:h-full flex flex-col">
            <RecentActivity />
          </div>

          {/* ── Strefa 5: Harmonogram bloga ── */}
          <div className="xl:col-span-8">
            <BlogWeeklySchedule />
          </div>

        </div>
      </div>
    </div>
  );
}
