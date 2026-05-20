"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { BookOpenText, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const CATEGORIES = ["Wszystkie", "Fizjoterapia", "Mindfulness", "Żywienie", "Ruch", "Camp Stories", "Terapia"];

interface BlogHeroProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export function BlogHero({ activeCategory, onCategoryChange }: BlogHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#dafbff] to-white pt-28 pb-16">
      {/* Dekoracyjne kółka w tle */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-brand-primary/5 pointer-events-none" />
      <div className="absolute top-40 -left-32 w-[320px] h-[320px] rounded-full bg-brand-primary/5 pointer-events-none" />

      <motion.div
        className="container"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-sm">
            <BookOpenText size={18} weight="fill" />
          </div>
          <span className="text-sm font-semibold font-montserrat text-brand-primary tracking-wider uppercase">
            Baza wiedzy
          </span>
        </motion.div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <motion.div variants={fadeUp} className="max-w-[620px]">
            <h1 className="font-jakarta font-bold text-brand-secondary text-[46px] sm:text-[58px] leading-[1.1] mb-4">
              Blog{" "}
              <span className="text-brand-primary">Rehability</span>
            </h1>
            <p className="font-montserrat text-gray-500 text-[16px] leading-[170%] max-w-[480px]">
              Sprawdzona wiedza z zakresu fizjoterapii, osteopatii, mindfulness i zdrowego stylu życia. Pisana przez specjalistów — dla Ciebie.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div variants={fadeUp} className="w-full lg:w-[340px] shrink-0">
            <div className="relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Szukaj artykułu..."
                className="w-full bg-white border border-gray-200 rounded-[14px] pl-11 pr-4 py-3 font-montserrat text-sm text-[#0B3B4C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors shadow-sm"
              />
            </div>
          </motion.div>
        </div>

        {/* Category pills */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold font-montserrat transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-primary/40 hover:text-brand-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
