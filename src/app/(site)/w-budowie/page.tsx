import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "next-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "W budowie",
  robots: { index: false, follow: false },
};

export default async function UnderConstructionPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="relative flex flex-col min-h-screen overflow-hidden bg-gradient-to-b from-[#EBF9FA] via-white to-[#F5FBFC]">
      <Navbar session={session} />

      {/* Dekoracyjne bloby — morski + żółty, spójne z panelami */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-24 w-[480px] h-[480px] rounded-full bg-brand-primary/15 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[440px] h-[440px] rounded-full bg-brand-yellow/25 blur-[130px]" />
      </div>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-32 md:py-40 text-center">
        {/* Karta "kropla" z efektem glassmorphism */}
        <div className="relative w-full max-w-[560px] flex flex-col items-center overflow-hidden bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[40px] rounded-tr-none shadow-[0_24px_70px_-25px_rgba(3,63,99,0.3)] px-8 py-12 md:px-14 md:py-16">
          {/* Żółta poświata w rogu karty */}
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-44 h-44 bg-brand-yellow/40 blur-[60px] rounded-full" />

          {/* Ikona w morskim kafelku z żółtą poświatą */}
          <div className="relative w-24 h-24 rounded-3xl rounded-tr-none bg-brand-primary flex items-center justify-center mb-8 shadow-[0_12px_30px_-6px_rgba(40,125,136,0.55)] border border-brand-yellow/30">
            <Wrench
              size={44}
              weight="duotone"
              className="text-white animate-pulse"
            />
            <div className="pointer-events-none absolute -bottom-3 -right-3 w-12 h-12 bg-brand-yellow/50 blur-[10px] rounded-full" />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-brand-primary/10 border border-brand-primary/15 text-brand-primary text-[11px] md:text-[12px] font-semibold font-montserrat tracking-[0.12em] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary/60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
            </span>
            Wkrótce dostępne
          </span>

          {/* Nagłówek */}
          <h1 className="font-jakarta font-bold text-[34px] md:text-[52px] text-brand-secondary leading-[1.1] mb-4">
            Sekcja w <span className="text-brand-primary">budowie</span>
          </h1>

          {/* Opis */}
          <p className="font-montserrat text-brand-secondary/70 text-[15px] md:text-[17px] max-w-[420px] mb-10 leading-relaxed">
            Pracujemy nad tym, aby ta część platformy była równie dopracowana jak
            reszta. Zajrzyj tu ponownie za jakiś czas!
          </p>

          {/* Przycisk powrotu */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-semibold text-[15px] md:text-[16px] px-8 py-4 rounded-full shadow-[0_10px_30px_-8px_rgba(40,125,136,0.6)] border border-brand-yellow/30 hover:bg-[#1a5b63] transition-all active:scale-95"
          >
            <ArrowLeft
              size={18}
              weight="bold"
              className="transition-transform group-hover:-translate-x-1"
            />
            Wróć do strony głównej
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
