"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  Star,
  Quotes,
  Stethoscope,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";
import React from "react";
import { motion, Variants } from "framer-motion";
import reviewsData from "../_data/booksy-reviews.json";

// --- TYP OPINII (z profilu Booksy) ---
export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  service?: string;
}

// Prawdziwe opinie z Booksy — źródło: src/app/(site)/_data/booksy-reviews.json
const REVIEWS: Review[] = reviewsData.map((r, index) => ({
  id: `booksy-${index}`,
  name: r.name,
  text: r.text,
  rating: r.rating,
  service: r.service,
}));

// Dzielimy opinie naprzemiennie na dwie kolumny, by każda przewijała inną treść.
const REVIEWS_COL_1 = REVIEWS.filter((_, i) => i % 2 === 0);
const REVIEWS_COL_2 = REVIEWS.filter((_, i) => i % 2 === 1);

// --- DEFINICJE ANIMACJI (Framer Motion) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Odstęp czasowy między pojawianiem się kolejnych elementów
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }, // Elegancka krzywa przejścia
  },
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1, ease: "easeOut" },
  },
};

const badgePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 15 }, // Efekt "sprężynki"
  },
};

export function SocialProofSection() {
  return (
    <section className="relative py-24 max-[1200px]:px-3 pb-0">
      {/* TŁO MORSKIE */}
      <div className="absolute top-0 left-0 right-0 h-[500px] max-[1024px]:h-[800px] bg-brand-primary rounded-[40px] z-0 shadow-lg max-w-[1400px] mx-auto" />

      {/* KONTENER (1200px) */}
      <div className="container relative z-10 !p-1 max-[1024px]:text-center">
        {/* motion.div odpala całą sekwencję, gdy kontener pojawi się w oknie przeglądarki */}
        <motion.div
          className="grid grid-cols-12 max-[1024px]:grid-cols-1 gap-8 -mt-5 max-[1024px]:p-6 max-[450px]:p-0"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* LEWA KOLUMNA (7/12) */}
          <div className="col-span-6 flex flex-col">
            <motion.h2
              variants={fadeUpVariants}
              className="typography-heading-sec font-semibold text-white max-[1024px]:text-[40px]"
            >
              Ekspertyza <br /> potwierdzona wynikami.
            </motion.h2>
            <motion.p
              variants={fadeUpVariants}
              className="typography-paragraph text-white/90 mt-10 max-w-[550px] leading-[170%] max-[1024px]:self-center"
            >
              Od lat przywracamy pacjentom ruch bez bólu, a fizjoterapeutom
              przekazujemy wiedzę, która zmienia ich praktykę gabinetową. Za
              naszymi metodami stoją setki udokumentowanych historii i realne
              efekty.
            </motion.p>

            {/* Plakietki (Pills) ze statystykami - widoczne na desktop */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-wrap gap-6 mt-4 mb-24 max-[1024px]:mb-16 max-[1024px]:justify-center max-[1024px]:mt-12 max-[440px]:hidden"
            >
              <motion.div variants={badgePopVariants}>
                <StatBadge
                  value="5.0"
                  label="Średnia ocena na Booksy"
                  imageSrc={
                    "https://images.pexels.com/photos/20860585/pexels-photo-20860585.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                  }
                  icon="/logotypy/booksy-logotype.svg"
                />
              </motion.div>
              <motion.div variants={badgePopVariants}>
                <StatBadge
                  value="500+"
                  label="Przeszkolonych fizjoterapeutów"
                  imageSrc={
                    "https://images.pexels.com/photos/20860622/pexels-photo-20860622.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                  }
                  icon={GraduationCap}
                />
              </motion.div>
            </motion.div>

            {/* Dolna sekcja (poza tłem) - widoczna na desktop */}
            <motion.div
              variants={fadeUpVariants}
              className="mt-auto max-[1024px]:hidden"
            >
              <h2 className="typography-heading-sec text-brand-secondary max-[1024px]:text-[36px]">
                Rozwiń swój warsztat <br /> diagnostyczny.
              </h2>
              <p className="typography-paragraph text-brand-secondary/80 mt-6 mb-8 max-w-[450px]">
                Niezależnie czy preferujesz naukę we własnym tempie na
                platformie VOD, czy intensywny trening na żywo podczas naszych
                Wyjazdów – przygotowaliśmy dla Ciebie sprawdzoną ścieżkę rozwoju.
              </p>
              <Button showArrow variant="primary" href="/kursy">
                Poznaj strefę edukacji
              </Button>
            </motion.div>
          </div>

          {/* PRAWA KOLUMNA (Nieskończone Opinie) */}
          <motion.div
            variants={fadeInVariants}
            className="col-span-6 h-[750px] max-[1024px]:h-[600px] relative max-[1024px]:mt-2 pause-on-hover"
          >
            {/* Maska z wydłużonym gradientem */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-auto"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
              }}
            >
              <div className="grid grid-cols-2 max-[640px]:grid-cols-1 gap-4 h-full relative">
                {/* === KOLUMNA 1 (W Górę) === */}
                <div className="relative h-full w-full overflow-hidden">
                  <div
                    className="flex flex-col w-full animate-scroll-y"
                    style={{ "--duration": "75s" } as React.CSSProperties}
                  >
                    {/* Paczka 1 */}
                    <div className="flex flex-col gap-4 pb-4 w-full">
                      {REVIEWS_COL_1.map((r) => (
                        <ReviewCard key={`c1-org-${r.id}`} review={r} />
                      ))}
                    </div>
                    {/* Paczka 2 (Klon) */}
                    <div className="flex flex-col gap-4 pb-4 w-full">
                      {REVIEWS_COL_1.map((r) => (
                        <ReviewCard key={`c1-dup-${r.id}`} review={r} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* === KOLUMNA 2 (W Dół) === */}
                <div className="relative h-full w-full overflow-hidden hidden sm:block">
                  <div
                    className="flex flex-col w-full animate-scroll-y-reverse"
                    style={{ "--duration": "95s" } as React.CSSProperties}
                  >
                    {/* Paczka 1 */}
                    <div className="flex flex-col gap-4 pb-4 w-full">
                      {REVIEWS_COL_2.map((r) => (
                        <ReviewCard key={`c2-org-${r.id}`} review={r} />
                      ))}
                    </div>
                    {/* Paczka 2 (Klon) */}
                    <div className="flex flex-col gap-4 pb-4 w-full">
                      {REVIEWS_COL_2.map((r) => (
                        <ReviewCard key={`c2-dup-${r.id}`} review={r} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pillsy Mobile (Ukryte na desktopie) */}
          <motion.div
            variants={fadeUpVariants}
            className="flex-wrap gap-6 mt-4 mb-24 max-[1024px]:mb-16 max-[1024px]:justify-center max-[1024px]:mt-12 hidden max-[440px]:flex col-span-6"
          >
            <motion.div variants={badgePopVariants}>
              <StatBadge
                value="5.0"
                label="Średnia ocena na Booksy"
                imageSrc={
                  "https://images.pexels.com/photos/20860585/pexels-photo-20860585.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                }
                icon="/logotypy/booksy-logotype.svg"
              />
            </motion.div>
            <motion.div variants={badgePopVariants}>
              <StatBadge
                value="500+"
                label="Przeszkolonych fizjoterapeutów"
                imageSrc={
                  "https://images.pexels.com/photos/20860622/pexels-photo-20860622.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"
                }
                icon={GraduationCap}
              />
            </motion.div>
          </motion.div>

          {/* Dolna sekcja (widoczna tylko na mobile) */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-12 hidden max-[1024px]:flex flex-col items-center text-center w-full col-span-6"
          >
            <h2 className="typography-heading-sec text-brand-secondary text-[36px]">
              Rozwiń swój warsztat <br /> diagnostyczny.
            </h2>
            <p className="typography-paragraph text-brand-secondary/80 mt-6 mb-8 max-w-[450px]">
              Niezależnie czy preferujesz naukę we własnym tempie na platformie
              VOD, czy intensywny trening na żywo podczas naszych Wyjazdów –
              przygotowaliśmy dla Ciebie sprawdzoną ścieżkę rozwoju.
            </p>
            <Button showArrow variant="primary" href="/kursy">
              Poznaj strefę edukacji
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// --- KOMPONENTY POMOCNICZE ---

function StatBadge({
  value,
  label,
  imageSrc,
  icon: IconOrPath,
}: {
  value: string;
  label: string;
  imageSrc: string;
  icon?: React.ElementType | string;
}) {
  return (
    <div className="relative bg-white rounded-full flex flex-col items-center border-[8px] border-brand-primary shadow-2xl w-[165px] h-[250px] justify-between pb-8 pt-5">
      <div className="relative w-[110px] h-[110px] shrink-0 rounded-full">
        <Image
          src={imageSrc}
          fill
          alt={label}
          sizes="110px"
          className="object-cover rounded-full"
        />
        {IconOrPath && (
          <div className="absolute -top-7 -right-7 bg-white rounded-full p-1.5 border-[5px] border-brand-primary shadow-sm z-10 w-[60px] h-[60px] flex items-center justify-center">
            {typeof IconOrPath === "string" ? (
              <img
                src={IconOrPath}
                alt="Ikona"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <IconOrPath
                size={32}
                weight="bold"
                className="text-brand-primary"
              />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 px-1">
        <span className="font-montserrat font-bold text-[32px] text-brand-primary leading-none">
          {value}
        </span>
        <span className="font-montserrat font-semibold text-[12px] text-brand-primary/90 text-center leading-tight">
          {label}
        </span>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-[24px] p-[20px] w-full h-fit shadow-sm flex flex-col gap-[10px] pointer-events-auto">
      <div className="flex flex-col">
        <span className="font-montserrat font-bold text-brand-secondary text-[16px]">
          {review.name}
        </span>
        {review.service && (
          <span className="font-montserrat font-medium text-[11px] text-brand-primary/80">
            {review.service}
          </span>
        )}
      </div>
      <Quotes weight="fill" className="text-brand-primary -mt-1" size={32} />
      <p className="font-montserrat font-regular text-[12px] leading-[159%] text-brand-secondary/80 whitespace-normal break-words line-clamp-[10]">
        {review.text}
      </p>
      <div className="flex gap-1 mt-1">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} weight="fill" className="text-brand-yellow" size={18} />
        ))}
      </div>
    </div>
  );
}
