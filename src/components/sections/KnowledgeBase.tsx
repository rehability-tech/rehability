"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import useEmblaCarousel from "embla-carousel-react";

// === DANE ARTYKUŁÓW ===
const ARTICLES = [
  {
    id: 1,
    category: "Ergonomia",
    title: "Zdrowy kręgosłup w biurze",
    desc: "5 prostych ćwiczeń, które zlikwidują ból karku.",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg", // Podmień na docelowe zdjęcie
    link: "#",
  },
  {
    id: 2,
    category: "Regeneracja",
    title: "Czym jest masaż Kobido?",
    desc: "Poznaj japoński sekret głębokiego relaksu i liftingu.",
    image: "/images/about/gabinet_fizjoterapii.jpg", // Podmień na docelowe zdjęcie
    link: "#",
  },
  {
    id: 3,
    category: "Terapia",
    title: "Mity o rwie kulszowej",
    desc: "Fakty i sprawdzone metody, które przyspieszą Twoje leczenie",
    image: "/images/about/piotr_siemaszko.png", // Podmień na docelowe zdjęcie
    link: "#",
  },
];

export function KnowledgeBase() {
  // === INICJALIZACJA EMBLA CAROUSEL ===
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Używamy setTimeout aby uniknąć problemu "cascading renders"
    const timeoutId = setTimeout(() => {
      onInit();
      onSelect();
    }, 0);

    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);

    return () => clearTimeout(timeoutId);
  }, [emblaApi, onInit, onSelect]);

  return (
    <section className="py-24 max-[1024px]:py-16 overflow-hidden">
      <div className="container mx-auto px-4 max-[1024px]:px-6">
        {/* === GÓRNA CZĘŚĆ (OPIS I NAGŁÓWEK) === */}
        <div className="flex flex-col-reverse justify-between items-start mb-16 gap-8 max-[800px]:flex-col-reverse max-[800px]:items-center max-[800px]:text-center">
          {/* Lewa strona: Ikonka i tekst */}
          <div className="w-full md:w-1/2 flex flex-col items-start gap-6 max-w-[480px]">
            <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-sm max-[800px]:hidden">
              <BookOpenText size={24} weight="fill" />
            </div>
            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[16px] max-[800px]:ml-5">
              Na naszym blogu dzielimy się sprawdzoną wiedzą z zakresu
              fizjoterapii, osteopatii i zdrowego ruchu. Poznaj praktyczne
              wskazówki naszych specjalistów, które pomogą Ci odzyskać pełną
              sprawność.
            </p>
          </div>

          <div className="w-full md:w-1/2 md:text-right">
            <h2 className="font-jakarta font-semibold text-brand-secondary text-[40px] md:text-[56px] lg:text-[64px] leading-[110%]">
              Baza <span className="text-brand-primary">wiedzy</span> i{" "}
              <br className="hidden md:block" /> poradników
            </h2>
          </div>
          <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white hidden shadow-sm max-[800px]:flex">
            <BookOpenText size={24} weight="fill" />
          </div>
        </div>

        {/* === DOLNA CZĘŚĆ (KARUZELA / SIATKA) === */}
        <div className="relative w-full">
          {/* Znikający Gradient - jeśli tło masz białe, zmień 'from-[#F4F8FA]' na 'from-white' */}
          <div
            className={`absolute -right-4 max-[1024px]:-right-6 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-[#F4F8FA] to-transparent z-10 pointer-events-none transition-opacity duration-500 min-[900px]:hidden ${
              nextBtnEnabled ? "opacity-100" : "opacity-0"
            }`}
          />

          <div className="overflow-hidden" ref={emblaRef}>
            {/* Ujemny margines po lewej wyrównuje grid */}
            <div className="flex touch-pan-y -ml-4 min-[900px]:-ml-6">
              {ARTICLES.map((article) => (
                <div
                  key={article.id}
                  // Poniżej 900px karta zajmuje 100% ekranu, powyżej zajmuje dokładnie 1/3 (czyli zachowuje się jak Grid)
                  className="flex-none min-w-0 pl-4 min-[900px]:pl-6 w-full min-[900px]:w-1/3 flex justify-center"
                >
                  <Link
                    href={article.link}
                    // Dodałem w-full max-w-[320px], aby zapobiec uciekaniu karty z ekranu na małych smartfonach (iPhone SE)
                    className="group relative h-[250px] w-full max-w-[320px] bg-[#7CAEB2] rounded-[36px] rounded-tr-none p-6 flex flex-col justify-end overflow-hidden hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl"
                  >
                    {/* Ozdobne fale/koła w tle karty */}
                    <div className="absolute -bottom-30 -right-40 w-[300px] h-[300px] rounded-full border-60 border-brand-primary/50 z-0 transition-transform duration-500 group-hover:scale-110" />

                    {/* Ikonka strzałki w lewym górnym rogu */}
                    <div className="absolute top-6 left-6 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#7CAEB2] transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight size={20} weight="bold" />
                    </div>

                    {/* Okrągłe zdjęcie w prawym górnym rogu */}
                    <div className="absolute top-3 right-3 z-10 w-[172px] h-[125px] rounded-[65px] rounded-tr-none overflow-hidden shadow-md">
                      <Image
                        src={article.image}
                        fill
                        alt={article.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 172px, 172px"
                      />
                    </div>

                    {/* Teksty na dole karty */}
                    <div className="relative z-10 mt-32 flex flex-col items-start">
                      <span className="bg-white text-brand-primary font-montserrat font-medium text-[11px] px-2 py-0.5 rounded-full mb-4 shadow-sm">
                        {article.category}
                      </span>

                      <h4 className="font-montserrat font-bold text-white text-[16px] leading-[120%] -mt-2">
                        {article.title}
                      </h4>

                      <p className="font-montserrat text-white/90 text-[13px] leading-[150%] mt-1">
                        {article.desc}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === KONTROLKI (KROPKI I STRZAŁKI) === */}
        {/* Widoczne tylko poniżej 900px */}
        <div className="flex flex-col items-center gap-6 mt-10 min-[900px]:hidden">
          {/* KROPKI */}
          <div className="flex items-center justify-center gap-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "w-8 bg-brand-primary"
                    : "w-2.5 bg-brand-primary/20 hover:bg-brand-primary/40"
                }`}
                aria-label={`Przejdź do artykułu ${index + 1}`}
              />
            ))}
          </div>

          {/* STRZAŁKI */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2
                ${prevBtnEnabled ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
              `}
              aria-label="Przewiń w lewo"
            >
              <ArrowLeft size={24} weight="regular" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2
                ${nextBtnEnabled ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
              `}
              aria-label="Przewiń w prawo"
            >
              <ArrowRight size={24} weight="regular" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
