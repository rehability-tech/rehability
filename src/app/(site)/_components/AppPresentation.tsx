"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";

// === KOMPONENT TAG ===
export const Tag = ({ label }: { label: string }) => {
  return (
    <div className="inline-block px-5 py-1.5 rounded-full bg-brand-primary/90 text-white font-montserrat text-[12px] font-bold tracking-wider mb-3 max-[1024px]:self-center uppercase">
      {label}
    </div>
  );
};

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
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AppPresentation() {
  return (
    <section className="overflow-hidden">
      <motion.div
        className="container mx-auto px-4 max-[1024px]:px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* --- LEWA KOLUMNA (TEKSTY) --- */}
          <div className="flex flex-col items-start max-[1024px]:items-center max-[1024px]:text-center">
            <motion.div variants={fadeUpVariants}>
              <Tag label="Aplikacja Rehability" />
            </motion.div>

            <motion.h2
              variants={fadeUpVariants}
              className="typography-subheading font-semibold text-brand-secondary text-[36px] md:text-[42px] lg:text-[48px] leading-[115%] mb-6"
            >
              Twoja wiedza zawsze pod ręką. <br className="hidden lg:block" />
              <span className="text-brand-primary">
                Poznaj naszą aplikację.
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px] md:text-[16px] mb-8 max-w-[550px]"
            >
              Ucz się tak, jak lubisz. Zyskaj wygodny dostęp do wszystkich
              kursów z fizjoterapii na smartfonie, tablecie i komputerze. Śledź
              swoje postępy, pobieraj skrypty PDF i wracaj do lekcji wideo z
              dowolnego miejsca – w gabinecie, w domu lub w drodze.
            </motion.p>

            <motion.div variants={fadeUpVariants}>
              <Button showArrow>Otrzymaj dostęp</Button>
            </motion.div>
          </div>

          {/* --- PRAWA KOLUMNA (ZDJĘCIE APLIKACJI) --- */}
          <motion.div
            variants={imageRevealVariants}
            className="relative w-full h-[400px] sm:h-[500px] lg:h-[640px] flex justify-center items-center"
          >
            <Image
              src="/images/app-presentation/platforma_vod_prezentacja.png"
              fill
              alt="Prezentacja aplikacji mobilnej Rehability"
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
