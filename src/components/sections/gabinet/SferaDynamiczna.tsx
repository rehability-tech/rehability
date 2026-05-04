"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FlowerLotusIcon, CaretLeft, CaretRight } from "@phosphor-icons/react";

interface StrefaProps {
  activeTab: "fizjoterapia" | "masaze";
}

// Słownik z danymi dla obu zakładek
const STREFA_CONTENT = {
  masaze: {
    titlePrefix: "Strefa",
    titleHighlight: " Głębokiej Regeneracji",
    description:
      "Zwolnij tempo w otoczeniu kojących zapachów i przygaszonego światła. To tutaj, przy dźwiękach relaksacyjnej muzyki, Twoje ciało uwalnia się od napięć, a umysł odzyskuje spokój. Odkryj przestrzeń, w której priorytetem jest Twoja pełna odnowa biologiczna.",
    images: [
      "/images/gabinet/masaz-opcja/masaz_2.jpg",
      "/images/gabinet/masaz-opcja/masaz_1.jpg",
      "/images/gabinet/masaz-opcja/masaz_4.jpg",
      "/images/gabinet/masaz-opcja/masaz_3.jpg",
      "/images/gabinet/masaz-opcja/masaz_5.jpg",
    ],
    Background: () => (
      <>
        <div className="absolute top-1/2 -translate-y-1/2 -left-[10%] w-[600px] h-[600px] text-[#287D88]/10 z-0 pointer-events-none max-[1024px]:w-[400px] max-[1024px]:h-[400px] max-[768px]:hidden">
          <FlowerLotusIcon size={700} weight="fill" />
        </div>
        <div className="absolute top-full -translate-y-1/2 -right-[10%] w-[600px] h-[600px] text-[#287D88]/10 z-0 pointer-events-none max-[1024px]:w-[400px] max-[1024px]:h-[400px] max-[768px]:hidden">
          <FlowerLotusIcon size={700} weight="fill" />
        </div>
      </>
    ),
  },
  fizjoterapia: {
    titlePrefix: "Przestrzeń",
    titleHighlight: " Diagnostyki i Terapii",
    description:
      "Miejsce, w którym precyzja spotyka się z wiedzą. Nasz główny gabinet został zaprojektowany tak, by zapewnić pełną dyskrecję i komfort podczas zaawansowanych sesji terapeutycznych oraz diagnostyki funkcjonalnej.",
    images: [
      "/images/gabinet/fizjo-opcja/fizjo_2.jpg",
      "/images/gabinet/fizjo-opcja/fizjo_1.jpg",
      "/images/gabinet/fizjo-opcja/fizjo_4.jpg",
      "/images/gabinet/fizjo-opcja/fizjo_3.jpg",
      "/images/gabinet/fizjo-opcja/fizjo_5.jpg",
    ],
    Background: () => (
      <>
        <div className="absolute top-0 -left-[20%] w-[800px] h-[800px] border-[120px] border-[#287D88]/10 rounded-full z-0 pointer-events-none max-[1024px]:w-[400px] max-[1024px]:h-[400px] max-[768px]:hidden" />
        <div className="absolute bottom-0 -right-[20%] w-[800px] h-[800px] border-[120px] border-[#287D88]/10 rounded-full z-0 pointer-events-none max-[1024px]:w-[400px] max-[1024px]:h-[400px] max-[768px]:hidden" />
      </>
    ),
  },
};

export function StrefaDynamiczna({ activeTab }: StrefaProps) {
  const content = STREFA_CONTENT[activeTab];
  const BackgroundGraphic = content.Background;

  // Stan do zarządzania mobilną karuzelą
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = content.images.length;

  // Reset karuzeli przy zmianie zakładki
  useEffect(() => {
    const castSlideSelect = () => {
      setCurrentSlide(0);
    };
    castSlideSelect();
  }, [activeTab]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  return (
    <section className="relative w-full py-32 max-[1024px]:py-20 overflow-x-clip ">
      {/* Tło zmienia się dynamicznie */}
      <BackgroundGraphic />

      <div className="container relative z-10 mx-auto px-4 max-[1024px]:px-6">
        {/* === NAGŁÓWEK I OPIS === */}
        <div className="max-w-[900px] mx-auto text-center mb-24 max-[1024px]:mb-16 transition-all duration-500">
          <h2 className="font-jakarta font-bold text-[56px] max-[1024px]:text-[48px] max-[768px]:text-[36px] text-[#0B3B4C] leading-[110%] mb-8 max-[1024px]:mb-6">
            {content.titlePrefix}{" "}
            <span className="text-[#287D88]">{content.titleHighlight}</span>
          </h2>
          <p className="font-montserrat font-medium text-[#0B3B4C]/80 text-[16px] max-[768px]:text-[15px] leading-[170%]">
            {content.description}
          </p>
        </div>

        {/* === ASYMETRYCZNA GALERIA (DESKTOP) === */}
        {/* Kontener ukryty na urządzeniach mobilnych, aktywny powyżej 1024px */}
        <div className="hidden min-[1024px]:flex flex-row justify-center items-start max-w-[1200px] mx-auto">
          {/* LEWA KOLUMNA */}
          <div className="relative w-[385px] h-[347px] mr-[41px] mt-[28px] shrink-0">
            <div className="absolute top-0 right-0 w-[220px] h-[235px] rounded-[29px] overflow-hidden shadow-md">
              <Image
                src={content.images[0]}
                fill
                className="object-cover"
                alt="Galeria 1"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-[138px] h-[138px] rounded-[29px] overflow-hidden shadow-sm">
              <Image
                src={content.images[1]}
                fill
                className="object-cover"
                alt="Galeria 2"
              />
            </div>
          </div>

          {/* CENTRALNA KOLUMNA */}
          <div className="relative w-[360px] h-[363px] rounded-[29px] overflow-hidden shadow-xl z-10 shrink-0">
            <Image
              src={content.images[2]}
              fill
              className="object-cover"
              alt="Galeria Główne"
            />
          </div>

          {/* PRAWA KOLUMNA */}
          <div className="relative w-[251px] h-[344px] ml-[31px] shrink-0">
            <div className="absolute top-0 left-0 w-[155px] h-[163px] rounded-[29px] overflow-hidden shadow-sm">
              <Image
                src={content.images[3]}
                fill
                className="object-cover"
                alt="Galeria 3"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-[159px] h-[151px] rounded-[29px] overflow-hidden shadow-md">
              <Image
                src={content.images[4]}
                fill
                className="object-cover"
                alt="Galeria 4"
              />
            </div>
          </div>
        </div>

        {/* === KARUZELA MOBILNA (MOBILE & TABLET) === */}
        {/* Aktywna tylko poniżej 1024px */}
        <div className="min-[1024px]:hidden relative w-full max-w-[600px] mx-auto aspect-[4/3] rounded-[32px] overflow-hidden shadow-xl">
          {/* Wyświetlane zdjęcie (slider) */}
          <Image
            src={content.images[currentSlide]}
            fill
            className="object-cover transition-all duration-500 ease-in-out"
            alt={`Galeria slajd ${currentSlide + 1}`}
          />

          {/* Nakładka z nawigacją - strzałka lewa */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-20 shadow-sm"
            aria-label="Poprzednie zdjęcie"
          >
            <CaretLeft size={24} weight="bold" />
          </button>

          {/* Nakładka z nawigacją - strzałka prawa */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-20 shadow-sm"
            aria-label="Następne zdjęcie"
          >
            <CaretRight size={24} weight="bold" />
          </button>

          {/* Wskaźniki (kropki) na dole */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/10 px-3 py-2 rounded-full backdrop-blur-sm">
            {content.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? "w-6 h-2 bg-[#287D88]" // Aktywny wskaźnik - dłuższy turkusowy
                    : "w-2 h-2 bg-white/70 hover:bg-white" // Nieaktywny - mała kropka
                }`}
                aria-label={`Przejdź do slajdu ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
