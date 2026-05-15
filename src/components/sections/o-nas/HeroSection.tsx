"use client";

import Image from "next/image";
import React from "react";
import { Tag } from "../AppPresentation"; // Upewnij się, że ścieżka jest poprawna
import { motion, Variants } from "framer-motion";

// --- DEFINICJE ANIMACJI ---
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

const imageRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, x: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

export const HeroSection = () => {
  return (
    <section className="container max-[1100px]:mt-24 mt-21">
      {/* Używamy initial i animate, bo to Hero Section (musi działać od razu po załadowaniu) */}
      <motion.div
        className="grid grid-cols-[2fr_1fr] max-[1100px]:grid-cols-1 gap-12 justify-between items-center max-w-[1300px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* === LEWA KOLUMNA: Tekst === */}
        <div className="flex flex-col items-start max-[1100px]:items-center max-[1100px]:text-center">
          <motion.div variants={fadeUpVariants}>
            <Tag label="O nas" />
          </motion.div>

          <motion.h1
            variants={fadeUpVariants}
            className="typography-heading-sec font-semibold text-brand-secondary leading-[120%] mb-8 min-w-[525px] max-[1100px]:min-w-0"
          >
            Więcej niż <span className="text-brand-primary">fizjoterapia</span>.
            <br className="max-[1100px]:hidden" /> Tworzymy ekosystem
            <br className="max-[1100px]:hidden" /> życia{" "}
            <span className="text-brand-primary">bez bólu</span>.
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            className="typography-paragraph text-brand-secondary/80 text-[18px] max-[1100px]:text-[16px] max-w-[600px]"
          >
            <strong className="text-brand-secondary font-semibold">
              Rehability
            </strong>{" "}
            powstało z prostej, ale odważnej myśli: pacjent nie powinien być
            uzależniony od swojego terapeuty. Zamiast maskować objawy, dajemy Ci
            wiedzę, narzędzia i przestrzeń, byś odzyskał pełną kontrolę nad
            własnym ciałem – w gabinecie i poza nim.
          </motion.p>
        </div>

        {/* === PRAWA KOLUMNA: Zdjęcie === */}
        <motion.div
          variants={imageRevealVariants}
          className="relative w-full flex max-[1100px]:justify-center"
        >
          <div className="relative w-full aspect-[4/5] max-[1100px]:aspect-square max-[768px]:aspect-[4/5] rounded-[48px] max-[768px]:rounded-[32px] overflow-hidden shadow-xl min-h-[600px] max-[1100px]:min-h-0 max-[1100px]:max-w-[600px] max-[1100px]:self-center ">
            <Image
              src="/images/o-nas/hero.jpg"
              fill
              priority
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
              alt="Trening z dziećmi na świeżym powietrzu - filozofia Rehability"
              sizes="(max-width: 1100px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -z-10 top-1/2 -right-10 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/10 blur-[100px] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};
