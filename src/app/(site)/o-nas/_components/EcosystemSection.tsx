"use client";

import Image from "next/image";
import React from "react";
import {
  Stethoscope,
  Play,
  Mountains,
  FlowerLotus,
} from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";

const ECOSYSTEM_CARDS = [
  {
    id: "terapia",
    icon: Stethoscope,
    title: "Terapia i Diagnostyka",
    description:
      "Zaawansowana fizjoterapia i terapia manualna. Znajdujemy prawdziwe źródło bólu i skutecznie je eliminujemy, przywracając Ci pełną sprawność.",
  },
  {
    id: "vod",
    icon: Play,
    title: "Platforma VOD",
    description:
      "Twój wirtualny terapeuta. Autorskie programy ruchowe, dzięki którym trenujesz bezpiecznie i świadomie we własnym domu.",
  },
  {
    id: "campy",
    icon: Mountains,
    title: "Wydarzenia",
    description:
      "Warsztaty, treningi, weekendy regeneracyjne i akcje specjalne. Mądry ruch połączony z głębokim relaksem — na jedno popołudnie albo na dłużej.",
  },
  {
    id: "masaze",
    icon: FlowerLotus,
    title: "Masaże",
    description:
      "Przestrzeń głębokiej odnowy. Uwalniamy ciało od stresu i napięć, wyciszając układ nerwowy i przywracając mu naturalny balans.",
  },
];

const EcosystemCard = ({
  icon: Icon,
  title,
  description,
}: (typeof ECOSYSTEM_CARDS)[0]) => {
  return (
    <div className="bg-white/30 backdrop-blur-sm rounded-[24px] p-8 max-[768px]:p-6 shadow-lg border border-white/5 transition-transform hover:-translate-y-1 duration-300 h-[250px] w-[330px] max-[360px]:w-full flex flex-col gap-3 shrink-0 max-[1160px]:h-[260px]">
      <div className="w-12 h-12 bg-white rounded-[12px] flex items-center justify-center shadow-sm shrink-0">
        <Icon size={36} weight="fill" className="text-brand-primary" />
      </div>
      <h3 className="font-jakarta font-semibold text-white text-[20px]">
        {title}
      </h3>
      <p className="font-montserrat text-white/80 text-[13px] leading-[1.6] tracking-wide">
        {description}
      </p>
    </div>
  );
};

// --- DEFINICJE ANIMACJI ---
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

const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export const EcosystemSection = () => {
  return (
    <section className="w-full overflow-hidden">
      <div className="container max-w-[1300px] mx-auto">
        <div className="relative w-full bg-brand-primary rounded-[49px] max-[768px]:rounded-[32px] py-12 px-6 max-[1160px]:p-12 max-[768px]:p-6 max-[768px]:py-12 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] border-brand-secondary/40 border-[96px] rounded-full z-0 pointer-events-none" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] border-brand-secondary/40 border-[96px] rounded-full z-0 pointer-events-none" />

          <motion.div
            className="relative z-10 flex flex-col items-center text-center max-w-[900px] mx-auto mb-16 max-[768px]:mb-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              variants={fadeUpVariants}
              className="typography-heading-sec text-white leading-[1.2] mb-6 font-semibold text-4xl"
            >
              Więcej niż gabinet.
              <br /> Poznaj ekosystem Rehability.
            </motion.h2>
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-white font-normal max-[768px]:text-[15px]"
            >
              Zrozumieliśmy, że powrót do pełnej sprawności wymaga działania na
              wielu płaszczyznach. Dlatego stworzyliśmy autorski ekosystem, w
              którym precyzyjne leczenie płynnie łączy się z edukacją, mądrym
              ruchem i głęboką odnową biologiczną. Poznaj cztery filary, które
              pomogą Ci odzyskać kontrolę nad własnym ciałem.
            </motion.p>
          </motion.div>

          <motion.div
            className="relative z-10 flex flex-row max-[1160px]:flex-col gap-6 lg:gap-8 max-[1160px]:max-w-[700px] mx-auto items-stretch max-[1160px]:items-center w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* LEWA KOLUMNA */}
            <div className="flex flex-col justify-between gap-6 w-[330px] max-[1160px]:w-full max-[1160px]:grid max-[1160px]:grid-cols-2 max-[820px]:grid-cols-1 max-[1160px]:order-2 place-items-center shrink-0">
              {ECOSYSTEM_CARDS.slice(0, 2).map((card) => (
                <motion.div
                  key={card.id}
                  variants={scaleUpVariants}
                  className="w-full flex justify-center"
                >
                  <EcosystemCard {...card} />
                </motion.div>
              ))}
            </div>

            {/* ŚRODEK (Zdjęcie Piotra) */}
            <motion.div
              variants={scaleUpVariants}
              className="flex-1 relative w-full min-h-[464px] max-[1160px]:min-h-0 max-[1160px]:aspect-video max-[820px]:aspect-[4/4] rounded-[32px] overflow-hidden shadow-2xl max-[1160px]:order-1 max-[1160px]:mb-6"
            >
              <Image
                src="/images/o-nas/piotr.jpg"
                fill
                className="object-cover object-center"
                alt="Piotr Siemaszko - Założyciel Rehability"
                sizes="(max-width: 1160px) 100vw, 50vw"
              />
            </motion.div>

            {/* PRAWA KOLUMNA */}
            <div className="flex flex-col justify-between gap-6 w-[330px] max-[1160px]:w-full max-[1160px]:grid max-[1160px]:grid-cols-2 max-[820px]:grid-cols-1 max-[1160px]:order-3 place-items-center shrink-0">
              {ECOSYSTEM_CARDS.slice(2, 4).map((card) => (
                <motion.div
                  key={card.id}
                  variants={scaleUpVariants}
                  className="w-full flex justify-center"
                >
                  <EcosystemCard {...card} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
