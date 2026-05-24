"use client";

import React from "react";
import RecentActivity from "./_components/RecentActivity";
import FinancialChart from "./_components/FinancialChart";
import BlogWeeklySchedule from "./_components/BlogWeeklySchedule";

export default function AdminHubPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] font-montserrat overflow-hidden ">
      {/* Tła dekoracyjne */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-brand-primary/[0.06] to-transparent z-0 pointer-events-none" />
      <div className="absolute top-[-50px] left-[10%] w-[400px] h-[400px] rounded-full bg-brand-primary/[0.05] blur-[100px] z-0 pointer-events-none" />
      <div className="absolute top-[-50px] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-yellow/[0.08] blur-[100px] z-0 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 pt-8 lg:pt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEWA STRONA (Szersza) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6 lg:gap-8">
            {/* WIDŻET FINANSOWY */}
            <div className="w-full rounded-3xl bg-white border border-gray-100 shadow-[0_10px_30px_-10px_rgba(3,63,99,0.05)] p-6 md:p-8 flex flex-col">
              <FinancialChart />
            </div>

            {/* HARMONOGRAM BLOGA */}
            <BlogWeeklySchedule />
          </div>

          {/* PRAWA STRONA (Węższa) - Live Feed */}
          <div className="lg:col-span-4 xl:col-span-4 h-[500px] lg:h-auto">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
