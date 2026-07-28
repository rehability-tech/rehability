import type { Metadata } from "next";
import Link from "next/link";
import { House, MagnifyingGlass, Compass } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "404 — Nie znaleziono strony",
  description: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 font-montserrat overflow-hidden">
      {/* Dekoracyjne tła — spójne z panelem */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-60" />
        <div className="absolute -top-40 -left-24 w-[460px] h-[460px] rounded-full bg-brand-primary/20 blur-[130px]" />
        <div className="absolute bottom-[-10%] -right-28 w-[420px] h-[420px] rounded-full bg-brand-yellow/25 blur-[130px]" />
      </div>

      {/* Karta */}
      <div className="relative w-full max-w-lg rounded-3xl rounded-tr-none bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] overflow-hidden">
        {/* Żółta poświata wewnątrz karty */}
        <div className="pointer-events-none absolute -bottom-8 -right-8 w-40 h-40 bg-brand-yellow/40 rounded-full blur-2xl" />

        <div className="relative p-8 sm:p-10 flex flex-col items-center text-center">
          {/* Ikona */}
          <div className="relative w-16 h-16 rounded-2xl rounded-tr-none bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-[0_10px_30px_-8px_rgba(40,125,136,0.55)] mb-6">
            <Compass size={30} weight="fill" />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-yellow shadow-[0_0_14px_rgba(242,217,103,0.7)]" />
          </div>

          {/* 404 */}
          <p className="font-jakarta font-extrabold text-[64px] leading-none text-brand-secondary tracking-tight">
            404
          </p>

          <h1 className="font-jakarta font-bold text-[22px] sm:text-[24px] text-brand-secondary mt-3 leading-tight">
            Ups! Tej strony tu nie ma
          </h1>
          <p className="font-montserrat text-[14px] text-brand-secondary/70 mt-3 leading-relaxed max-w-sm">
            Strona, której szukasz, nie istnieje lub została przeniesiona. Sprawdź
            adres albo wróć na stronę główną.
          </p>

          {/* Akcje */}
          <div className="mt-8 w-full flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="group relative flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand-primary text-white font-bold text-[14px] border border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] hover:shadow-[0_8px_24px_0px_rgba(242,217,103,0.5)] transition"
            >
              <House size={18} weight="fill" />
              Strona główna
            </Link>
            <Link
              href="/wydarzenia"
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/60 hover:bg-white/90 text-brand-secondary font-semibold text-[14px] border border-white/60 transition"
            >
              <MagnifyingGlass size={18} weight="bold" />
              Zobacz wydarzenia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
