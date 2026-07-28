"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { MapPin, CalendarBlank, Wallet } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

interface HeroBlockProps {
  title: string;
  subtitle?: string;
  heroImage?: string | null;
  tags?: string[];
  location?: string;
  dateRange?: string; // np. "12-15 Października 2024"
  price?: string; // np. "3500"
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function HeroBlock({
  title,
  subtitle,
  heroImage,
  tags = [],
  location,
  dateRange,
  price,
}: HeroBlockProps) {
  return (
    <section className="relative w-full pt-[140px] pb-[80px] overflow-hidden rounded-[32px] shadow-sm mb-12">
      {/* === TŁO I GRADIENTY === */}
      <div className="absolute inset-0 z-0 bg-[#0B3B4C]/90">
        {heroImage && (
          <img
            src={heroImage}
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
            alt={title || "Tło wydarzenia"}
          />
        )}
        <div className="absolute inset-0 bg-[#0B3B4C]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#287D88]/[0.8]" />
      </div>

      {/* === TREŚĆ === */}
      <motion.div
        className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center text-white"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* --- PASEK META DANYCH --- */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-wrap justify-center items-center gap-3 md:gap-5 mb-6 font-montserrat text-[12px] md:text-[14px] font-semibold text-white/90"
        >
          {/* LOKALIZACJA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <MapPin size={16} weight="fill" className="text-brand-primary" />
            <span>{location || "Brak lokalizacji"}</span>
          </div>

          {/* DATA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <CalendarBlank
              size={16}
              weight="bold"
              className="text-brand-primary"
            />
            <span>{dateRange || "Wkrótce"}</span>
          </div>

          {/* CENA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-brand-primary/50 backdrop-blur-md shadow-[0_0_15px_rgba(40,125,136,0.3)]">
            <Wallet size={16} weight="fill" className="text-brand-primary" />
            <span>{price ? `od ${price} zł / os.` : "Sprawdź cennik"}</span>
          </div>
        </motion.div>

        {/* TYTUŁ */}
        <motion.h1
          variants={fadeUpVariants}
          className="font-jakarta font-bold text-[40px] md:text-[56px] leading-[1.05] mb-8 drop-shadow-md uppercase max-w-[800px]"
        >
          {title || "TYTUŁ WYDARZENIA"}
        </motion.h1>

        {/* PODTYTUŁ (Zastąpiono input statycznym tekstem) */}
        {subtitle && (
          <motion.div
            variants={fadeUpVariants}
            className="bg-black/25 backdrop-blur-md rounded-full px-6 py-3 mb-6 border border-white/20 min-w-[300px] max-w-2xl w-fit flex justify-center items-center"
          >
            <p className="text-white font-montserrat font-medium text-[14px] md:text-[15px] text-center">
              {subtitle}
            </p>
          </motion.div>
        )}

        {/* TAGI */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-4 py-2.5 mb-8 flex flex-wrap justify-center items-center gap-2 border border-white/20 min-h-[46px]"
        >
          {tags.length === 0 ? (
            <span className="text-white/50 text-sm italic mx-2">
              Brak dodatkowych tagów
            </span>
          ) : (
            tags.map((tag: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/10"
              >
                <span className="font-montserrat font-medium text-[12px] md:text-[13px]">
                  {tag}
                </span>
              </div>
            ))
          )}
        </motion.div>

        {/* PRZYCISK (Odblokowany dla klientów) */}
        <motion.div variants={fadeUpVariants}>
          <Button showArrow>Zapisz się teraz</Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
