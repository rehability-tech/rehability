"use client";

import React from "react";
import Image from "next/image";

// 1. Definiujemy typ
export type ServiceTab = "fizjoterapia" | "masaze";

// 2. Definiujemy interfejs propsów
interface GabinetServicesProps {
  activeTab: ServiceTab;
  setActiveTab: (tab: ServiceTab) => void;
}

// 3. TUTAJ JEST KLUCZ: Zwróć uwagę na wąsy {} wokół activeTab i setActiveTab!
export function GabinetControls({
  activeTab,
  setActiveTab,
}: GabinetServicesProps) {
  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pb-24 max-[1024px]:pb-16 mt-8 max-[1024px]:mt-4 flex flex-col items-center">
      {/* Kontener na dwa kafelki - Ściśle scentrowany Flexbox */}
      <div className="flex flex-row-reverse max-[768px]:flex-col justify-center items-start gap-4 max-[1024px]:gap-6 max-[768px]:gap-8 min-h-[350px]">
        {/* === KAFELEK 1: Fizjoterapia === */}
        <button
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
          {/* Zdjęcie z DODANYM ROZMYCIEM na nieaktywnym stanie */}
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
        </button>

        {/* === KAFELEK 2: Masaże i relax === */}
        <button
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
          {/* Zdjęcie z DODANYM ROZMYCIEM na nieaktywnym stanie */}
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
        </button>
      </div>
    </section>
  );
}
