"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Star, Check, DeviceMobile } from "@phosphor-icons/react/dist/ssr";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const AVATARS = [
  "/images/avatars/avatar-1.jpg",
  "/images/avatars/avatar-2.jpg",
  "/images/avatars/avatar-3.jpg",
  "/images/avatars/avatar-4.jpg",
];

const STATS = [
  { value: "4K", label: "Jakość wideo" },
  { value: "24/7", label: "Dostęp z każdego miejsca" },
  { value: "100%", label: "Bezpieczne ruchy" },
];

export function KursyHero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="container relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
      >
        {/* === LEWA KOLUMNA: TEKST === */}
        <div className="flex flex-col gap-7 max-w-[592px] items-center text-center mx-auto md:items-start md:text-left md:mx-0">
          {/* Badge oceny */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 self-center md:self-start"
          >
            <span className="flex items-center justify-center size-7 rounded-full border border-brand-primary text-brand-primary">
              <Star size={15} weight="fill" />
            </span>
            <span className="font-montserrat text-[13px] text-brand-secondary">
              <span className="font-bold">4.9/5</span> w ocenach kursantów
            </span>
          </motion.div>

          {/* Nagłówek z awatarami + akcentem italic */}
          <motion.h1
            variants={fadeUp}
            className="-mt-4 font-jakarta font-semibold text-brand-secondary text-[34px] md:text-[44px] lg:text-[52px] leading-[1.1]"
          >
            Trenuj bezpiecznie
            <br />w domu{" "}
            <span className="inline-flex items-center align-middle -space-x-3 mx-1">
              {AVATARS.map((src) => (
                <span
                  key={src}
                  className="relative size-9 md:size-11 rounded-full overflow-hidden ring-[3px] ring-white shadow-sm"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </span>
              ))}
            </span>
            <br />i odzyskaj swoją{" "}
            <span className="font-serif italic font-medium text-brand-primary">
              sprawność
            </span>
            .
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-montserrat text-gray-500 text-[16px] leading-[1.7] max-w-[460px] mx-auto md:mx-0"
          >
            Autorskie programy ruchowe od fizjoterapeutów. Ćwicz we własnym
            tempie, z dowolnego miejsca.
          </motion.p>

          {/* Liczniki */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-3 gap-4 max-w-[460px] pt-5 mt-1 mx-auto md:mx-0"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-jakarta font-bold text-brand-primary text-[26px] md:text-[30px] leading-none">
                  {s.value}
                </p>
                <p className="font-montserrat text-gray-500 text-[12px] leading-tight mt-1.5">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* === PRAWA KOLUMNA: SAMO ZDJĘCIE === */}
        <motion.div
          variants={fadeUp}
          className="relative mx-auto lg:justify-self-center w-full max-w-[440px]"
        >
          <div className="relative aspect-[440/560] w-full rounded-[32px] rounded-tr-none overflow-hidden shadow-[0_30px_70px_-30px_rgba(3,63,99,0.45)]">
            <Image
              src="/images/chłopak_uczący_się_na_komputerze.jpg"
              alt="Uśmiechnięty mężczyzna korzystający z programu treningowego online przy laptopie"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 440px"
              className="object-cover"
            />
            {/* Overlay z kropkami, zanikający w transparent */}
            <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.55)_1.5px,transparent_1.5px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent_35%)] [-webkit-mask-image:linear-gradient(to_bottom,black,transparent_35%)]" />

            {/* Pigułka: dostęp w aplikacji (lewy dolny róg) */}
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-white/85 backdrop-blur-xl border border-white/50 rounded-full pl-1.5 pr-4 py-1.5 shadow-lg">
              <span className="flex items-center justify-center size-8 rounded-full bg-brand-primary text-white shadow-sm">
                <DeviceMobile size={15} weight="fill" />
              </span>
              <span className="font-montserrat text-[13px] font-semibold text-brand-secondary">
                Dostęp w aplikacji
              </span>
            </div>
          </div>

          {/* Karta z licznikiem (lewa, nieco wyżej niż połowa) */}
          <div className="absolute left-3 top-[40%] -translate-y-1/2 lg:left-0 lg:-translate-x-1/2 bg-brand-primary text-white rounded-3xl rounded-tr-none p-3.5 md:p-4 w-[120px] md:w-[140px] shadow-[0_14px_30px_-10px_rgba(40,125,136,0.7)]">
            <p className="font-jakarta font-bold text-[32px] leading-none">
              50+
            </p>
            <p className="font-montserrat text-[12px] leading-tight mt-1.5 text-white/90">
              ćwiczeń wideo w bibliotece
            </p>
          </div>

          {/* Tagi (prawy górny róg) */}
          <div className="absolute right-3 top-[112px] lg:right-0 lg:top-[88px] lg:translate-x-1/3 flex flex-col items-end gap-2">
            {["Dożywotni dostęp", "Ćwicz w domu"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-xl border border-white/50 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-md font-montserrat text-[12px] font-semibold text-brand-secondary"
              >
                <span className="flex items-center justify-center size-4 rounded-full bg-brand-primary text-white">
                  <Check size={11} weight="bold" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
