"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Heart } from "@phosphor-icons/react/dist/ssr";

// Definiujemy, jakie dane przyjmuje karta
interface CourseCardProps {
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
  title: string;
  duration: string; // np. "160 min"
  price: number;
  currency?: string;
  link?: string;
}

export function CourseCard({
  category = "OSTEOPATIA",
  image = "/images/about/szlolenie_dla_fizjoterapeutów.jpg", // Zmień domyślny obrazek na swój
  rating = 4.6,
  reviewsCount = 3,
  title = "Techniki powięziowe i osteopatyczne w ostrych stanach bólowych",
  duration = "160 min",
  price = 250,
  currency = "PLN",
  link = "#",
}: Partial<CourseCardProps>) {
  return (
    // Szerokość dopasowana do Twojego projektu (360px), białe tło, zaokrąglenia i cień
    <div className="w-[360px] max-w-[360px] bg-white rounded-[24px] overflow-hidden shadow-[0px_8px_24px_rgba(3,63,99,0.06)] flex flex-col transition-transform duration-300 hover:-translate-y-1 p-4">
      {/* === GÓRNA CZĘŚĆ (ZDJĘCIE I BADGE) === */}
      <div className="relative w-full h-[220px] rounded-[24px]">
        <Image
          src={image}
          fill
          alt={title}
          className="object-cover rounded-[16px] rounded-b-none "
          sizes="(max-width: 768px) 100vw, 360px"
        />

        {/* Pigułka z kategorią */}
        <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-full shadow-sm">
          {category}
        </div>

        {/* Ikonka ulubionych (Serduszko) */}
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white text-brand-primary rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform focus:outline-none"
          aria-label="Dodaj do ulubionych"
        >
          <Heart size={20} weight="bold" />
        </button>
      </div>

      {/* === DOLNA CZĘŚĆ (TREŚĆ) === */}
      <div className=" flex flex-col grow pt-3">
        {/* Ocena */}
        <div className="flex items-center gap-1.5 mb-3">
          <Star size={18} weight="fill" className="text-[#F5C518]" />
          <span className="font-montserrat text-[#76A8B4] text-[13px] font-medium">
            {rating} ({reviewsCount})
          </span>
        </div>

        {/* Tytuł kursu - line-clamp-3 sprawia, że jak tytuł będzie za długi, obetnie go i doda "..." */}
        <h3 className="font-montserrat font-bold text-brand-secondary text-[17px] leading-[140%] mb-4 line-clamp-3">
          {title}
        </h3>

        {/* Czas trwania */}
        <div className="flex items-center gap-2 text-[#76A8B4] mb-5 mt-auto">
          <Clock size={18} weight="regular" />
          <span className="font-montserrat text-[13px] font-medium">
            {duration}
          </span>
        </div>

        {/* Cienka linia oddzielająca */}
        <div className="w-full h-px bg-brand-secondary/10 mb-5" />

        {/* Cena i Przycisk */}
        <div className="flex items-center justify-between">
          <span className="font-montserrat font-bold text-brand-primary text-[20px]">
            {price} {currency}
          </span>
          <Link
            href={link}
            className="bg-brand-primary text-white font-montserrat font-semibold text-[13px] rounded-xl rounded-tr-none h-8 w-34 hover:bg-brand-primary/90 transition-colors shadow-sm text-center flex items-center justify-center"
          >
            Otrzymaj dostęp
          </Link>
        </div>
      </div>
    </div>
  );
}
