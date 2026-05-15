"use client";

import Image from "next/image";
import React from "react";
import { motion, Variants } from "framer-motion";

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

const fadeLeftVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export const WhySection = () => {
  return (
    <section className="w-full overflow-hidden ">
      <motion.div
        className="container flex flex-col max-w-[1250px] mx-auto gap-6 max-[1024px]:gap-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={fadeUpVariants} className="w-full">
          <h2 className="typography-heading-sec text-brand-secondary font-semibold leading-[1.1] max-[1024px]:text-center">
            Dlaczego wyszliśmy poza{" "}
            <span className="text-brand-primary">ściany gabinetu?</span>
          </h2>
        </motion.div>

        <div className="flex flex-row max-[1024px]:flex-col max-[1024px]:text-center items-center gap-24 max-[1024px]:gap-4 content-center h-fit ">
          {/* Teksty */}
          <div className="flex-1 flex flex-col gap-6">
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-brand-secondary/80"
            >
              Zauważyliśmy, że tradycyjna rehabilitacja często ogranicza się do
              szybkiej ulgi.
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-brand-secondary/80"
            >
              Pacjent wychodzi z gabinetu, ale po kilku miesiącach problem
              powraca, ponieważ nie usunięto jego pierwotnej przyczyny. W tym
              standardowym procesie brakowało nam jednego – ciągłości i nauki
              świadomego ruchu.
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-brand-secondary/80"
            >
              Postanowiliśmy stworzyć miejsce, które opiekuje się pacjentem
              kompleksowo.
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-brand-secondary/80"
            >
              <strong className="font-semibold text-brand-secondary">
                Tak narodziło się Rehability{" "}
              </strong>
              – przestrzeń, w której precyzyjna terapia manualna płynnie łączy
              się z edukacją ruchową i głęboką odnową biologiczną. Zbudowaliśmy
              miejsce, którego sami szukaliśmy.
            </motion.p>
          </div>

          {/* Zdjęcie */}
          <motion.div
            variants={fadeLeftVariants}
            className="relative w-full max-w-[300px] flex-shrink-0 flex justify-center mt-6 max-[1024px]:mt-2"
          >
            <div className="relative w-full aspect-[4/5] mask-shape-2 overflow-hidden transition-transform hover:scale-105 duration-500">
              <Image
                src="/images/o-nas/why.jpg"
                fill
                className="object-cover object-center"
                alt="Uczestniczki treningu Rehability"
                sizes="300px"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
