"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MagnifyingGlassPlus, X } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence, Variants } from "framer-motion";

const GALLERY_IMAGES = [
  {
    id: 1,
    src: "/images/gabinet/hero/gabinet_1.jpg",
    alt: "Gabinet widok 1",
    aspect: "aspect-[3/4] max-[1024px]:aspect-[4/3]",
    mt: "mt-0",
  },
  {
    id: 2,
    src: "/images/gabinet/hero/gabinet_2.jpg",
    alt: "Gabinet widok 2",
    aspect: "aspect-[4/3] max-[1024px]:aspect-[4/3]",
    mt: "mt-[60px] max-[1024px]:mt-0",
  },
  {
    id: 3,
    src: "/images/gabinet/hero/gabinet_3.jpg",
    alt: "Gabinet widok 3",
    aspect: "aspect-[3/3] max-[1024px]:aspect-[4/3]",
    mt: "mt-[20px] max-[1024px]:mt-0",
  },
  {
    id: 4,
    src: "/images/gabinet/hero/gabinet_4.jpg",
    alt: "Gabinet widok 4",
    aspect: "aspect-[4/5] max-[1024px]:aspect-[4/3]",
    mt: "mt-[10px] max-[1024px]:mt-0",
  },
];

// === DEFINICJE ANIMACJI ===
const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const galleryContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const galleryItemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export function GabinetHero() {
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    src: GALLERY_IMAGES[0].src,
  });

  useEffect(() => {
    if (lightbox.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightbox.isOpen]);

  const openLightbox = (src: string) => {
    setLightbox({ isOpen: true, src });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      {/* === HERO SECTION === */}
      <section className="relative w-full pt-[220px] max-[1024px]:pt-[160px] pb-[280px] max-[1024px]:pb-[180px] overflow-hidden">
        {/* === TŁO I OVERLAY === */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/about/gabinet_fizjoterapii.jpg"
            fill
            className="object-cover"
            alt="Gabinet Rehability Tło"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#287D88]/0 from-0% via-[#287D88]/[54%] via-[51%] to-[#287D88]/[54%]" />
        </div>

        {/* Zawartość Hero */}
        <motion.div
          className="relative z-20 container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center text-center text-white"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUpVariants}
            className="font-jakarta font-bold text-[64px] max-[1024px]:text-[48px] max-[768px]:text-[40px] mb-6 drop-shadow-md"
          >
            Gabinet
          </motion.h1>
          <motion.p
            variants={fadeUpVariants}
            className="font-montserrat font-medium text-[16px] max-[1024px]:text-[16px] max-[768px]:text-[15px] max-w-[800px] leading-[160%] text-white/90"
          >
            Precyzyjna diagnostyka, nowoczesna terapia manualna i holistyczna
            praca z ciałem. Zaufaj naszym ekspertom i odzyskaj pełną sprawność w
            komfortowej przestrzeni naszego gabinetu.
          </motion.p>
        </motion.div>

        {/* Asymetryczna fala SVG */}
        <div className="absolute bottom-0 left-0 w-full leading-none z-10 text-slate-50">
          <svg
            viewBox="0 0 1440 150"
            fill="currentColor"
            preserveAspectRatio="none"
            className="w-full h-[150px] max-[1024px]:h-[80px] block"
          >
            <path d="M0 50 C 400 150 1000 0 1440 80 L 1440 150 L 0 150 Z" />
          </svg>
        </div>
      </section>

      {/* === SEKACJA GALERII === */}
      <section className="relative z-30 container mx-auto px-4 max-[1024px]:px-6 -mt-[180px] max-[1024px]:-mt-[100px] max-[768px]:-mt-[80px] mb-50 ">
        <motion.div
          className="grid grid-cols-4 max-[1024px]:grid-cols-2 max-[600px]:grid-cols-1 gap-6 max-[1024px]:gap-4 items-start"
          variants={galleryContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {GALLERY_IMAGES.map((img) => (
            <motion.div
              key={img.id}
              variants={galleryItemVariants}
              onClick={() => openLightbox(img.src)}
              className={`relative w-full ${img.aspect} ${img.mt} rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] group cursor-pointer`}
            >
              <Image
                src={img.src}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt={img.alt}
              />

              {/* Overlay na Hover z ikoną lupy */}
              <div className="absolute inset-0 bg-[#287D88]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-lg">
                  <MagnifyingGlassPlus
                    size={28}
                    className="text-white drop-shadow-md"
                    weight="bold"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* === LIGHTBOX (Pełnoekranowy podgląd z AnimatePresence) === */}
      <AnimatePresence>
        {lightbox.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-white/20 backdrop-blur-md flex items-center justify-center p-4 max-[768px]:p-2"
            onClick={closeLightbox}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={closeLightbox}
              className="absolute cursor-pointer top-6 right-6 z-[110] w-12 h-12 bg-black/5 hover:bg-black/10 border border-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#fff] transition-colors duration-300"
              aria-label="Zamknij"
            >
              <X size={24} weight="bold" />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
              className="relative w-full max-w-[1200px] h-full max-h-[85vh] rounded-[24px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox.src}
                fill
                className="object-contain"
                alt="Pełny podgląd"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
