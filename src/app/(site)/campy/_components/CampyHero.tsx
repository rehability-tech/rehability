"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export function CampyHero() {
  return (
    <section className="relative w-full pt-[200px] max-[1024px]:pt-[160px] pb-[180px] max-[1024px]:pb-[120px] overflow-hidden rounded-b-[64px] max-[768px]:rounded-b-[40px] shadow-sm">
      {/* TŁO I OVERLAY */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/campy/campy_hero.jpg" // Zmień na docelowe zdjęcie z nagłówka
          fill
          className="object-cover object-top"
          alt="Campy Rehability"
          priority
        />
        {/* Ciemny overlay dla czytelności tekstu */}
        <div className="absolute inset-0 bg-[#0B3B4C]/50" />
      </div>

      {/* ZAWARTOŚĆ */}
      <motion.div
        className="relative z-20 container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center text-center text-white"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-jakarta font-bold text-[56px] max-[1024px]:text-[48px] max-[768px]:text-[40px] mb-2 drop-shadow-md">
          Campy
        </h1>
        <p className="font-montserrat font-medium text-[16px] max-[1024px]:text-[16px] max-w-[800px] leading-[160%] text-white/90">
          Precyzyjna diagnostyka, nowoczesna terapia manualna i holistyczna
          praca z ciałem. Zaufaj naszym ekspertom i odzyskaj pełną sprawność w
          komfortowej przestrzeni.
        </p>
      </motion.div>
    </section>
  );
}
