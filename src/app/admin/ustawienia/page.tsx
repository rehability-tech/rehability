import React from "react";
import type { Metadata } from "next";
import { Gear } from "@phosphor-icons/react/dist/ssr";
import NotificationsCard from "./_components/NotificationsCard";
import PwaInstallCard from "./_components/PwaInstallCard";

export const metadata: Metadata = {
  title: "Ustawienia | Panel Admin",
};

export default function AdminUstawieniaPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-brand-primary/[0.06] to-transparent z-0 pointer-events-none" />
      <div className="absolute top-[-50px] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-yellow/[0.08] blur-[100px] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8 lg:pt-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30">
              <Gear size={22} weight="fill" />
            </div>
            <div>
              <h1 className="font-jakarta font-bold text-[22px] sm:text-[28px] text-brand-secondary leading-tight">
                Ustawienia
              </h1>
              <p className="font-montserrat text-[12px] sm:text-[13px] text-brand-secondary/60 mt-0.5">
                Zarządzaj powiadomieniami i instalacją aplikacji.
              </p>
            </div>
          </div>
        </header>

        {/* Karty — 1 kolumna na mobile, 2 kolumny na desktop */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <NotificationsCard />
          <PwaInstallCard />
        </section>
      </div>
    </div>
  );
}
