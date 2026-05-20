"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";

export interface SingleCampHeroProps {
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function SingleCampHero({
  title,
  subtitle,
  tags,
  heroImage,
}: SingleCampHeroProps) {
  // Funkcja scrollująca do zakładek/formularza
  const handleScrollToForm = () => {
    // Możesz dostosować ID do tego, gdzie znajduje się Twój formularz lub sekcja z zakładkami
    window.scrollBy({ top: 600, behavior: "smooth" });
  };

  return (
    <section className="relative w-full pt-[220px] max-[1024px]:pt-[160px] pb-[120px] overflow-hidden rounded-b-[56px] shadow-sm">
      {/* === TŁO I GRADIENTY (Odwzorowanie Figmy) === */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage}
          fill
          className="object-cover object-center"
          alt={title}
          priority
        />
        {/* Delikatne przyciemnienie całości dla czytelności białego tekstu */}
        <div className="absolute inset-0 bg-[#0B3B4C]/20" />

        {/* Gradient z Figmy: #287D88 od 0% do 100%, Opacity warstwy 54% */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#287D88]/[0.54]" />
      </div>

      {/* === TREŚĆ === */}
      <motion.div
        className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center text-white"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* 1. TYTUŁ */}
        <motion.h1
          variants={fadeUpVariants}
          className="font-jakarta font-bold text-[56px] md:text-[72px] leading-[1.05] mb-8 drop-shadow-md uppercase max-w-[800px]"
        >
          {title}
        </motion.h1>

        {/* 2. TAGI W PASTYLCE */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-6 md:px-8 py-3 mb-4 flex flex-wrap justify-center items-center gap-3 border border-white/10"
        >
          {tags.map((tag: string, idx: number) => (
            <React.Fragment key={idx}>
              <span className="font-montserrat font-medium text-[13px] md:text-[14px]">
                {tag}
              </span>
              {idx < tags.length - 1 && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#287D88] opacity-80" />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* 3. PODTYTUŁ W PASTYLCE */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-8 py-3 mb-10 border border-white/10"
        >
          <p className="font-montserrat font-medium text-[14px] md:text-[15px]">
            {subtitle}
          </p>
        </motion.div>

        {/* 4. PRZYCISK CTA */}
        <motion.div variants={fadeUpVariants}>
          <Button showArrow>Zapsiz się teraz</Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
