"use client";

import React from "react";
import {
  GraduationCap,
  MagnifyingGlass,
  Person,
} from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";

// === DEFINICJE ANIMACJI ===
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// 1. Zdefiniowanie danych dla kart wartości
const VALUES_CARDS = [
  {
    id: "edukujemy",
    icon: GraduationCap,
    title: "Edukujemy, nie uzależniamy.",
    description:
      "Naszym największym sukcesem jest moment, w którym przestajesz nas potrzebować. Tłumaczymy mechanikę Twojego ciała, byś umiał dbać o nie samodzielnie.",
  },
  {
    id: "szukamy",
    icon: MagnifyingGlass,
    title: "Szukamy przyczyny, nie objawu.",
    description:
      'Nie interesuje nas chwilowe "ugaszenie pożaru". Zawsze drążymy do źródła problemu, aby efekty terapii były długotrwałe.',
  },
  {
    id: "traktujemy",
    icon: Person,
    title: "Traktujemy ciało jako całość.",
    description:
      "Ból kolana rzadko zaczyna się w kolanie. Patrzymy na Ciebie przez pryzmat całościowej, holistycznej biomechaniki i układu nerwowego.",
  },
];

// 2. Reużywalny komponent pojedynczej karty
const ValueCard = ({
  icon: Icon,
  title,
  description,
}: (typeof VALUES_CARDS)[0]) => {
  return (
    <div className="relative bg-brand-primary/80 rounded-full shadow-xl transition-transform hover:-translate-y-2 duration-300 w-[360px] h-[320px] max-[400px]:w-full rounded-tl-none max-[400px]:h-[370px]">
      <div className="absolute top-0 left-0 bg-white/90 w-[75px] h-[75px] rounded-full rounded-tl-none flex items-center justify-center shadow-md">
        <Icon size={42} weight="fill" className="text-brand-primary" />
      </div>

      <div className="flex flex-col p-10 pl-12 pt-[84px]">
        <h3 className="font-jakarta font-semibold text-white text-[20px] mb-3 leading-tight">
          {title}
        </h3>
        <p className="font-montserrat text-white/80 text-[15px] leading-[1.6]">
          {description}
        </p>
      </div>
    </div>
  );
};

// 3. Główny komponent sekcji
export const ValuesSection = () => {
  return (
    <section className="w-full overflow-hidden">
      <motion.div
        className="container max-w-[1300px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* === Nagłówek i Opis === */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col mb-12 max-[1170px]:text-center max-[1170px]:items-center"
        >
          <h2 className="typography-heading-sec text-brand-secondary leading-[1.2] mb-6">
            Poznaj nasze <span className="text-brand-primary">wartości</span>
          </h2>
          <p className="typography-paragraph text-brand-secondary/80 max-w-[650px] max-[1170px]:mx-auto">
            Wierzymy, że{" "}
            <strong className="font-semibold text-brand-secondary">
              skuteczna fizjoterapia
            </strong>{" "}
            to coś więcej niż tylko wyuczone schematy. To przede wszystkim
            filozofia pracy oparta na zaufaniu i głębokim zrozumieniu Twojego
            ciała. Oto trzy fundamenty, na których opieramy każdą terapię
          </p>
        </motion.div>

        {/* === KARTY: FLEX-ROW === */}
        <div className="flex flex-row max-[1170px]:flex-col justify-between items-center gap-6 max-[1170px]:gap-12 w-full -mt-64 max-[1170px]:mt-0">
          <motion.div
            variants={fadeUpVariants}
            className="mt-96 max-[1170px]:mt-0"
          >
            <ValueCard {...VALUES_CARDS[0]} />
          </motion.div>

          <motion.div
            variants={fadeUpVariants}
            className="mt-48 max-[1170px]:mt-0"
          >
            <ValueCard {...VALUES_CARDS[1]} />
          </motion.div>

          <motion.div variants={fadeUpVariants} className="mt-0">
            <ValueCard {...VALUES_CARDS[2]} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
