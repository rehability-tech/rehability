"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MagnifyingGlassPlus, X } from "@phosphor-icons/react/dist/ssr";

const GALLERY_IMAGES = [
  {
    id: 1,
    src: "/images/gabinet/hero/gabinet_1.jpg",
    alt: "Gabinet widok 1",
    // Na desktopie pionowe, poniżej 1024px standardowy prostokąt
    aspect: "aspect-[3/4] max-[1024px]:aspect-[4/3]",
    mt: "mt-0",
  },
  {
    id: 2,
    src: "/images/gabinet/hero/gabinet_2.jpg",
    alt: "Gabinet widok 2",
    aspect: "aspect-[4/3] max-[1024px]:aspect-[4/3]",
    // Na desktopie zjeżdża w dół o 60px, poniżej 1024px wyrównuje się do zera
    mt: "mt-[60px] max-[1024px]:mt-0",
  },
  {
    id: 3,
    src: "/images/gabinet/hero/gabinet_3.jpg",
    alt: "Gabinet widok 3",
    aspect: "aspect-[3/3] max-[1024px]:aspect-[4/3]",
    // Na desktopie zjeżdża w dół o 20px, poniżej 1024px wyrównuje się do zera
    mt: "mt-[20px] max-[1024px]:mt-0",
  },
  {
    id: 4,
    src: "/images/gabinet/hero/gabinet_4.jpg",
    alt: "Gabinet widok 4",
    aspect: "aspect-[4/5] max-[1024px]:aspect-[4/3]",
    // Na desktopie zjeżdża w dół o 10px, poniżej 1024px wyrównuje się do zera
    mt: "mt-[10px] max-[1024px]:mt-0",
  },
];

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
        <div className="relative z-20 container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center text-center text-white">
          <h1 className="font-jakarta font-bold text-[64px] max-[1024px]:text-[48px] max-[768px]:text-[40px] mb-6 drop-shadow-md">
            Gabinet
          </h1>
          <p className="font-montserrat font-medium text-[16px] max-[1024px]:text-[16px] max-[768px]:text-[15px] max-w-[800px] leading-[160%] text-white/90">
            Precyzyjna diagnostyka, nowoczesna terapia manualna i holistyczna
            praca z ciałem. Zaufaj naszym ekspertom i odzyskaj pełną sprawność w
            komfortowej przestrzeni naszego gabinetu.
          </p>
        </div>

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
      {/* max-[1024px]:-mt-[100px] sprawia, że cały równy układ wyraźnie nachodzi na Hero */}
      <section className="relative z-30 container mx-auto px-4 max-[1024px]:px-6 -mt-[180px] max-[1024px]:-mt-[100px] max-[768px]:-mt-[80px] mb-24 max-[1024px]:mb-16">
        <div className="grid grid-cols-4 max-[1024px]:grid-cols-2 max-[600px]:grid-cols-1 gap-6 max-[1024px]:gap-4 items-start">
          {GALLERY_IMAGES.map((img) => (
            <div
              key={img.id}
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
            </div>
          ))}
        </div>
      </section>

      {/* === LIGHTBOX (Pełnoekranowy podgląd) === */}
      <div
        className={`fixed inset-0 z-[100] bg-white/20 backdrop-blur-md flex items-center justify-center p-4 max-[768px]:p-2 transition-all duration-500 ease-out ${
          lightbox.isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeLightbox}
      >
        <button
          onClick={closeLightbox}
          className={`absolute cursor-pointer top-6 right-6 z-[110] w-12 h-12 bg-black/5 hover:bg-black/10 border border-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#fff] transition-all duration-500 delay-100 ${
            lightbox.isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
          aria-label="Zamknij"
        >
          <X size={24} weight="bold" />
        </button>

        <div
          className={`relative w-full max-w-[1200px] h-full max-h-[85vh] rounded-[24px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-all duration-500 delay-75 ease-out ${
            lightbox.isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={lightbox.src}
            fill
            className="object-contain"
            alt="Pełny podgląd"
          />
        </div>
      </div>
    </>
  );
}
