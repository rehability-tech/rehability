"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";

const SERVICES = [
  {
    title: "Fizjoterapia i Rehabilitacja",
    image: "/images/services/fizjoterapia.jpg",
    bullets: [
      "Kompleksowa diagnostyka i leczenie ostrego oraz przewlekłego bólu.",
      "Indywidualny plan powrotu do pełnej sprawności na co dzień i w sporcie.",
      "Zastosowanie nowoczesnych metod, w tym osteopatii i treningu medycznego.",
    ],
    buttonText: "Umów wizytę",
  },
  {
    title: "Masaże i Terapia Manualna",
    image: "/images/services/masaże.jpg",
    bullets: [
      "Głęboki relaks i skuteczne uwalnianie skumulowanych napięć mięśniowych.",
      "Przyspieszona regeneracja organizmu po urazach i przeciążeniach.",
      "Holistyczne podejście do ciała, poprawiające ogólne samopoczucie.",
    ],
    buttonText: "Sprawdź ofertę zabiegów",
  },
  {
    title: "Szkolenia VOD",
    image: "/images/services/platforma_vod.jpg",
    bullets: [
      "Praktyczna wiedza diagnostyczna gotowa do natychmiastowego wdrożenia w gabinecie.",
      "Autorskie materiały wideo z nielimitowanym dostępem 24/7 z dowolnego miejsca.",
      "Nowoczesne techniki terapii tłumaczone krok po kroku przez ekspertów",
    ],
    buttonText: "Poznaj platformę VOD",
  },
  {
    title: "Campy",
    image: "/images/services/campy.jpg",
    bullets: [
      "100% praktyki i intensywny trening zaawansowanych technik manualnych.",
      "Kameralne grupy pracujące pod bezpośrednim nadzorem doświadczonych praktyków.",
      "Budowanie wartościowych relacji i wymiana branżowych doświadczeń.",
    ],
    buttonText: "Zobacz nadchodzące terminy",
  },
];

const rowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeRightVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeLeftVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function ServicesSection() {
  return (
    <section className="overflow-hidden">
      <div className="container">
        <div className="flex flex-col gap-16 md:gap-24 w-full max-[768px]:!gap-38">
          {SERVICES.map((service, index) => {
            const alignClass =
              index === 0
                ? "self-start"
                : index === 1
                  ? "self-end"
                  : index === 2
                    ? "self-end"
                    : "self-start";

            const imageRadiusClass =
              index === 0
                ? "rounded-[150px] rounded-br-none"
                : index === 1
                  ? "rounded-[150px] rounded-tl-none"
                  : index === 2
                    ? "rounded-[150px] rounded-bl-none"
                    : "rounded-[150px] rounded-tr-none";

            // Zdjęcie wjeżdża z prawej lub z lewej w zależności od strony, po której stoi
            const imageVariants =
              index === 0 || index === 3 ? fadeRightVariants : fadeLeftVariants;

            return (
              // Zawijamy mapowany element w motion.div, by reagował na pojawienie się na ekranie niezależnie od innych!
              <motion.div
                key={index}
                className={`flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 max-w-[900px] ${alignClass} max-[768px]:!self-center `}
                variants={rowVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {/* === ZDJĘCIE === */}
                <motion.div
                  variants={imageVariants}
                  className={`relative shrink-0 w-[260px] h-[250px] md:w-[300px] md:h-[289px] overflow-hidden shadow-sm ${imageRadiusClass}`}
                >
                  <Image
                    src={service.image}
                    fill
                    alt={service.title}
                    className="object-cover"
                    sizes="(max-width: 768px) 260px, 300px"
                  />
                </motion.div>

                {/* === TEKSTY I LISTA === */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left mt-4 md:mt-0">
                  <motion.h3
                    variants={fadeUpVariants}
                    className="font-montserrat font-semibold text-[26px] md:text-[28px] text-brand-primary mb-5"
                  >
                    {service.title}
                  </motion.h3>

                  <motion.ul
                    variants={fadeUpVariants}
                    className="flex flex-col gap-3 mb-8 max-[768px]:max-w-[400px]"
                  >
                    {service.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="text-left max-[768px]:text-center md:flex md:items-start md:gap-3"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40 shrink-0 mt-2 max-[768px]:hidden" />
                        <span className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[14px] md:text-[15px] block">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </motion.ul>

                  <motion.div variants={fadeUpVariants}>
                    <Button showArrow>{service.buttonText}</Button>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
