"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { MapPin, CalendarBlank, Wallet } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

interface SingleCampHeroProps {
  title: string;
  subtitle?: string;
  tags?: string[];
  heroImage?: string;
  location?: string;
  dateRange?: string; // np. "12-15 Października 2024"
  price?: string | number; // np. 3500 lub "3500"
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// Funkcja wyciągająca czystą nazwę miasta z ew. JSON-a z bazy (tak jak w EditableHero)
function parseLocation(raw?: string): string {
  if (!raw) return "Brak lokalizacji";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed.city || parsed.name || raw;
  } catch {
    return raw;
  }
}

export default function SingleTripHero({
  title,
  subtitle,
  tags = [],
  heroImage,
  location,
  dateRange,
  price,
}: SingleCampHeroProps) {
  const displayLocation = parseLocation(location);
  const displayImage = heroImage || "/images/static/camp.png"; // Fallback na domyślne zdjęcie

  return (
    <section className="relative w-full pt-[140px] pb-[80px] overflow-hidden rounded-[32px] rounded-tr-none  rounded-tl-none shadow-sm mb-12 group">
      {/* === TŁO I GRADIENTY === */}
      <div className="absolute inset-0 z-0 bg-[#0B3B4C]/90">
        <img
          src={displayImage}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          alt={title}
        />
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
        {/* --- PASEK META DANYCH (Lokalizacja, Data, Cena) --- */}
        {(displayLocation !== "Brak lokalizacji" || dateRange || price) && (
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-wrap justify-center items-center gap-3 md:gap-5 mb-6 font-montserrat text-[12px] md:text-[14px] font-semibold text-white/90"
          >
            {/* LOKALIZACJA */}
            {displayLocation !== "Brak lokalizacji" && (
              <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                <MapPin
                  size={16}
                  weight="fill"
                  className="text-brand-primary"
                />
                <span>{displayLocation}</span>
              </div>
            )}

            {/* DATA */}
            {dateRange && (
              <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                <CalendarBlank
                  size={16}
                  weight="bold"
                  className="text-brand-primary"
                />
                <span>{dateRange}</span>
              </div>
            )}

            {/* CENA */}
            {price && (
              <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-brand-primary/50 backdrop-blur-md shadow-[0_0_15px_rgba(40,125,136,0.3)]">
                <Wallet
                  size={16}
                  weight="fill"
                  className="text-brand-primary"
                />
                <span>od {price} zł / os.</span>
              </div>
            )}
          </motion.div>
        )}

        {/* TYTUŁ */}
        <motion.h1
          variants={fadeUpVariants}
          className="font-jakarta font-bold text-[40px] md:text-[56px] leading-[1.05] mb-8 drop-shadow-md uppercase max-w-[800px]"
        >
          {title}
        </motion.h1>

        {/* PODTYTUŁ */}
        {subtitle && (
          <motion.div
            variants={fadeUpVariants}
            className="bg-black/25 backdrop-blur-md rounded-full px-6 py-2 mb-6 border border-white/20 min-w-[300px] max-w-2xl flex items-center"
          >
            <p className="bg-transparent text-white font-montserrat font-medium text-[14px] md:text-[15px] w-full text-center m-0 py-1">
              {subtitle}
            </p>
          </motion.div>
        )}

        {/* TAGI */}
        {tags.length > 0 && (
          <motion.div
            variants={fadeUpVariants}
            className="bg-black/25 backdrop-blur-md rounded-full px-4 py-2.5 mb-8 flex flex-wrap justify-center items-center gap-2 border border-white/20 transition-all hover:bg-black/40 min-h-[46px]"
          >
            {tags.map((tag, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors">
                  <span className="font-montserrat font-medium text-[12px] md:text-[13px]">
                    {tag}
                  </span>
                </div>
                {idx < tags.length - 1 && (
                  <span className="text-white/30 text-[10px]">●</span>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}

        {/* PRZYCISK (aktywny, w EditableHero był zablokowany pointer-events-none) */}
        <motion.div variants={fadeUpVariants}>
          <Button
            showArrow
            onClick={() => {
              // Tutaj np. scroll do formularza zapisu
              console.log("Scroll do sekcji zapisu");
            }}
          >
            Zapisz się teraz
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
