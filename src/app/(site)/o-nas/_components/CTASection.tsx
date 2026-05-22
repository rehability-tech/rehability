"use client";

import React from "react";
import { Button } from "@/components/ui/Button"; // Upewnij się, że masz poprawną ścieżkę
import { motion, Variants } from "framer-motion";

// === DEFINICJE ANIMACJI ===
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const CTASection = () => {
  return (
    <section className="w-full overflow-hidden">
      <motion.div
        className="container max-w-[1100px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* === NAGŁÓWEK === */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col items-center text-center mb-16 max-[768px]:mb-12"
        >
          <h2 className="typography-heading-sec text-brand-secondary leading-[1.2] mb-4">
            Zacznijmy <span className="text-brand-primary">działać</span>
          </h2>
          <p className="typography-paragraph text-brand-secondary/80 text-[18px]">
            Odzyskaj pełną swobodę ruchu. Od czego chcesz zacząć?
          </p>
        </motion.div>

        {/* === DWIE KOLUMNY Z AKCJAMI === */}
        <div className="grid grid-cols-2 max-[768px]:grid-cols-1 gap-16 max-[768px]:gap-12">
          {/* LEWA KOLUMNA: Wizyta w gabinecie */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-col items-center text-center"
          >
            <h3 className="font-jakarta font-semibold text-brand-secondary text-[22px] max-[768px]:text-[20px] mb-4">
              Potrzebujesz bezpośredniej pomocy?
            </h3>
            <p className="typography-paragraph text-brand-secondary/80 mb-8 max-w-[450px]">
              Zmagasz się z bólem, jesteś po urazie lub szukasz precyzyjnej
              diagnozy? Wybierz terapię stacjonarną. Znajdziemy prawdziwe źródło
              problemu i wspólnie zaplanujemy proces leczenia.
            </p>
            <Button showArrow href="/gabinet">
              Umów wizytę w gabinecie
            </Button>
          </motion.div>

          {/* PRAWA KOLUMNA: Platforma VOD */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-col items-center text-center"
          >
            <h3 className="font-jakarta font-semibold text-brand-secondary text-[22px] max-[768px]:text-[20px] mb-4">
              Chcesz bezpiecznie ćwiczyć w domu?
            </h3>
            <p className="typography-paragraph text-brand-secondary/80 mb-8 max-w-[450px]">
              Zależy Ci na poprawie postawy, zapobieganiu kontuzjom lub
              podtrzymaniu efektów terapii? Zyskaj dostęp do autorskich
              programów treningowych i dbaj o ciało z dowolnego miejsca.
            </p>
            {/* Brak trasy /platforma-vod — kierujemy na placeholder „w-budowie",
                aż VOD pojawi się w app routerze. */}
            <Button showArrow href="/w-budowie">
              Odkryj platformę VOD
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
