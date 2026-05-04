"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import useEmblaCarousel from "embla-carousel-react";
import { CourseCard } from "../ui/CourseCard";
import { Button } from "../ui/Button";

// === MOCKUP DANYCH KURSÓW ===
const MOCK_COURSES = [
  {
    id: 1,
    category: "OSTEOPATIA",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg",
    rating: 4.6,
    reviewsCount: 3,
    title: "Techniki powięziowe i osteopatyczne w ostrych stanach bólowych",
    duration: "160 min",
    price: 250,
  },
  {
    id: 2,
    category: "OSTEOPATIA",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg",
    rating: 4.8,
    reviewsCount: 12,
    title: "Terapia manualna w ujęciu klinicznym - moduł zaawansowany",
    duration: "120 min",
    price: 199,
  },
  {
    id: 3,
    category: "OSTEOPATIA",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg",
    rating: 5.0,
    reviewsCount: 7,
    title: "Masaż tkanek głębokich krok po kroku",
    duration: "90 min",
    price: 149,
  },
];

export function PopularCourses() {
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

    // Rozwiązanie problemu "cascading renders" - opóźnienie inicjalizacji o 1 tick
    const timeoutId = setTimeout(() => {
      onInit();
      onSelect();
    }, 0);

    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);

    // Czyszczenie timeoutu w razie odmontowania komponentu
    return () => clearTimeout(timeoutId);
  }, [emblaApi, onInit, onSelect]);

  return (
    <section className="py-24 max-[1024px]:py-16 overflow-hidden">
      <div className="container mx-auto px-4 max-[1024px]:px-6">
        {/* === GÓRNA CZĘŚĆ (NAGŁÓWKI I OPIS) === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16 items-start">
          <div className="flex flex-col items-start max-[1024px]:items-center max-[1024px]:text-center">
            <h2 className="typography-subheading font-semibold text-brand-secondary text-[36px] leading-[120%] mb-8">
              Najczęściej wybierane kursy <br className="hidden lg:block" />
              przez <span className="text-brand-primary">fizjoterapeutów</span>
            </h2>

            <Button className="max-[1024px]:hidden" showArrow>
              Zobacz wszystkie
            </Button>
          </div>

          <div className="max-[1024px]:text-center">
            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px] md:text-[16px] max-w-[550px] max-[1024px]:mx-auto">
              Ucz się tak, jak lubisz. Zyskaj wygodny dostęp do wszystkich
              kursów z fizjoterapii na smartfonie, tablecie i komputerze. Śledź
              swoje postępy, pobieraj skrypty PDF i wracaj do lekcji wideo z
              dowolnego miejsca – w gabinecie, w domu lub w drodze.
            </p>
          </div>
        </div>

        {/* === DOLNA CZĘŚĆ (KARUZELA EMBLA) === */}
        <div className="relative w-full">
          {/* ZMIANA: Dodano max-[900px]:hidden - gradient nie pokazuje się na małych ekranach */}
          <div
            className={`absolute -right-4 max-[1024px]:-right-6 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-l from-white from-20% via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-500 min-[1160px]:hidden max-[900px]:hidden ${
              nextBtnEnabled ? "opacity-100" : "opacity-0"
            }`}
          />

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y -ml-4 md:-ml-8">
              {MOCK_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="flex-none min-w-0 pl-4 md:pl-8 w-full min-[900px]:w-auto flex justify-center"
                >
                  <CourseCard
                    category={course.category}
                    image={course.image}
                    rating={course.rating}
                    reviewsCount={course.reviewsCount}
                    title={course.title}
                    duration={course.duration}
                    price={course.price}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === KONTROLKI (KROPKI I STRZAŁKI) === */}
        <div className="flex flex-col items-center gap-6 mt-10 min-[1160px]:hidden">
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
                aria-label={`Przejdź do slajdu ${index + 1}`}
              />
            ))}
          </div>

          {/* STRZAŁKI */}
          <div className="flex items-center gap-4">
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

          {/* Przycisk Zobacz wszystkie (Widoczny tylko na mobile) */}
          <div className="hidden max-[1024px]:block mt-4">
            <Button showArrow>Zobacz wszystkie</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
