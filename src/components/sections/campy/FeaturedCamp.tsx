"use client";

import React from "react";
import Image from "next/image";
import {
  CalendarBlank,
  MapPin,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";
import { Tag } from "@/components/ui/Tag";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
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

export function FeaturedCamp() {
  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pt-24 pb-16 overflow-hidden">
      <motion.div
        className="grid grid-cols-[1.4fr_1fr] max-[1024px]:grid-cols-1 gap-0 items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* LEWA KOLUMNA - Tekst i dane */}
        <div className="flex flex-col items-start max-[1024px]:items-center max-[1024px]:text-center">
          <motion.div variants={fadeUpVariants} className="">
            <Tag label="zbliżajacy sie camp" />
          </motion.div>

          <motion.h2
            variants={fadeUpVariants}
            className="font-jakarta font-semibold text-[48px] max-[768px]:text-[36px] text-[#0B3B4C] leading-[110%] mb-6"
          >
            Między nami <span className="text-[#287D88]">kobietami</span>
          </motion.h2>

          <motion.p
            variants={fadeUpVariants}
            className="font-montserrat text-[#0B3B4C]/80 text-[16px] leading-[170%] mb-10 max-w-[600px]"
          >
            Zostaw codzienny pośpiech za sobą i podaruj sobie 4 dni głębokiego
            resetu w otoczeniu natury. &quot;Między nami kobietami&quot; to
            kameralny wyjazd stworzony po to, byś odzyskała wewnętrzny balans.
            Czeka na Ciebie świadomy ruch, profesjonalne masaże i wspierająca
            kobieca energia – wszystko pod czujnym okiem fizjoterapeuty i
            dietetyka klinicznego. To Twój czas na oddech.
          </motion.p>

          {/* MOBILNE ZDJĘCIE (Wyświetlane tylko poniżej 1024px, zaraz nad kółkami) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
            className="w-full hidden max-[1024px]:flex justify-center"
          >
            <div className="relative w-full max-w-[400px] max-[768px]:max-w-[320px] aspect-square rounded-full overflow-hidden shadow-2xl rounded-tr-none">
              <Image
                src="/images/static/camp.png" // Zmień na docelowe zdjęcie
                fill
                className="object-cover"
                alt="Między nami kobietami"
              />
            </div>
          </motion.div>

          {/* KÓŁKA INFORMACYJNE (Z ujemnym marginesem na mobile, by nachodziły na zdjęcie) */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-wrap gap-4 mb-10 justify-center min-[1025px]:justify-start relative z-10 max-[1024px]:-mt-12"
          >
            {[
              {
                icon: <CalendarBlank size={18} weight="fill" />,
                label: "Termin",
                value: "28–31.05.2026",
                sub: "4 dni pełne relaksu",
              },
              {
                icon: <MapPin size={18} weight="fill" />,
                label: "Lokalizacja",
                value: "Holiday Sky Park",
                sub: "Jarnołtówek",
              },
              {
                icon: <CreditCard size={18} weight="fill" />,
                label: "Cena",
                value: "od 499 zł / os.",
                sub: "Inwestycja w siebie",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`w-[145px] h-[145px] rounded-full rounded-tr-none backdrop-blur-md bg-[#287D88]/70 flex flex-col items-center justify-center text-center text-white p-3 shadow-md relative ${i === 0 ? "max-[1024px]:-mt-12" : i === 2 ? "max-[1024px]:-mt-12" : ""} max-[500px]:mt-0 `}
              >
                {/* Ikonka */}
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>

                <span className="font-montserrat text-white/80 text-[11px] mb-1.5">
                  {item.label}
                </span>
                <span className="font-montserrat font-bold text-[14px] leading-tight mb-1">
                  {item.value}
                </span>
                <span className="font-montserrat text-white/60 text-[10px]">
                  {item.sub}
                </span>
              </div>
            ))}
          </motion.div>

          {/* PRZYCISK */}
          <motion.div variants={fadeUpVariants} className="relative z-20">
            <Button showArrow>Poznaj szczegóły</Button>
          </motion.div>
        </div>

        {/* PRAWA KOLUMNA - Zdjęcie kółko (Tylko na DESKTOP) */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.8, ease: "easeOut" },
            },
          }}
          className="w-full flex justify-center lg:justify-end max-[1024px]:hidden"
        >
          <div className="relative w-full max-w-[500px] aspect-square rounded-full overflow-hidden shadow-2xl rounded-tr-none">
            <Image
              src="/images/static/camp.png" // Zmień na docelowe zdjęcie
              fill
              className="object-cover"
              alt="Między nami kobietami"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
