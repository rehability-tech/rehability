"use client";

import React from "react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

// 1. Definiujemy typ
export type ServiceTab = "fizjoterapia" | "masaze";

// 2. Definiujemy interfejs propsów
interface GabinetServicesProps {
  activeTab: ServiceTab;
  setActiveTab: (tab: ServiceTab) => void;
}

// === DEFINICJE ANIMACJI ===
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// 3. Komponent
export function GabinetControls({
  activeTab,
  setActiveTab,
}: GabinetServicesProps) {
  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pb-24 max-[1024px]:pb-16 mt-8 max-[1024px]:mt-4 flex flex-col items-center overflow-hidden">
      {/* Kontener na dwa kafelki - Zanimowany z Framer Motion */}
      <motion.div
        className="flex flex-row-reverse max-[768px]:flex-col justify-center items-start gap-4 max-[1024px]:gap-6 max-[768px]:gap-8 min-h-[350px]"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {/* === KAFELEK 1: Fizjoterapia === */}
        <motion.button
          variants={cardVariants}
          onClick={() => setActiveTab("fizjoterapia")}
          className={`relative block min-w-[300px] h-[300px] max-[1024px]:w-[280px] max-[1024px]:h-[270px] max-[768px]:w-full max-[768px]:max-w-[350px] overflow-hidden transition-all duration-500 ease-in-out ${
            activeTab === "fizjoterapia"
              ? "mt-8 max-[768px]:mt-0 cursor-default shadow-[8px_12px_30px_rgba(0,0,0,0.15)]"
              : "mt-0 cursor-pointer hover:-translate-y-2 group shadow-md"
          }`}
          style={{
            borderRadius: "160px 160px 160px 0px",
          }}
        >
          <Image
            src="/images/gabinet/controls/fizjoterapia.jpg"
            fill
            className={`object-cover transition-all duration-700 ${
              activeTab === "fizjoterapia"
                ? "scale-105 blur-0"
                : "scale-100 blur-[3px] group-hover:blur-0 group-hover:scale-110"
            }`}
            alt="Fizjoterapia"
          />

          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              activeTab === "fizjoterapia"
                ? "bg-[#287D88]/20"
                : "bg-[#287D88]/50 group-hover:bg-[#287D88]/40"
            }`}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <h3
              className={`font-jakarta font-bold text-white text-[32px] max-[1024px]:text-[28px] drop-shadow-md transition-opacity duration-300 ${
                activeTab === "fizjoterapia"
                  ? "opacity-100"
                  : "opacity-80 group-hover:opacity-100"
              }`}
            >
              Fizjoterapia
            </h3>
          </div>
        </motion.button>

        {/* === KAFELEK 2: Masaże i relax === */}
        <motion.button
          variants={cardVariants}
          onClick={() => setActiveTab("masaze")}
          className={`relative block w-[320px] h-[300px] max-[1024px]:w-[280px] max-[1024px]:h-[270px] max-[768px]:w-full max-[768px]:max-w-[350px] overflow-hidden transition-all duration-500 ease-in-out ${
            activeTab === "masaze"
              ? "mt-8 max-[768px]:mt-0 cursor-default shadow-[8px_12px_30px_rgba(0,0,0,0.15)]"
              : "mt-0 cursor-pointer hover:-translate-y-2 group shadow-md"
          }`}
          style={{
            borderRadius: "160px 160px 0px 160px",
          }}
        >
          <Image
            src="/images/gabinet/controls/masaże_relax.jpg"
            fill
            className={`object-cover transition-all duration-700 ${
              activeTab === "masaze"
                ? "scale-105 blur-0"
                : "scale-100 blur-[3px] group-hover:blur-0 group-hover:scale-110"
            }`}
            alt="Masaże i relax"
          />

          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              activeTab === "masaze"
                ? "bg-[#287D88]/20"
                : "bg-[#287D88]/50 group-hover:bg-[#287D88]/40"
            }`}
          />

          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <h3
              className={`font-jakarta font-bold text-white text-[32px] max-[1024px]:text-[28px] leading-tight text-center drop-shadow-md transition-opacity duration-300 ${
                activeTab === "masaze"
                  ? "opacity-100"
                  : "opacity-80 group-hover:opacity-100"
              }`}
            >
              Masaże
              <br />i relax
            </h3>
          </div>
        </motion.button>
      </motion.div>
    </section>
  );
}
