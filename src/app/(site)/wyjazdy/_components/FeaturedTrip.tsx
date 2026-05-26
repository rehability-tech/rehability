"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarBlank,
  MapPin,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";
import { Tag } from "@/components/ui/Tag";

// --- FUNKCJE POMOCNICZE ---

// Funkcja ładnie formatująca zakres dat
const formatDateRange = (start: any, end: any) => {
  if (!start) return "Wkrótce";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };

  if (!endDate) {
    return startDate.toLocaleDateString("pl-PL", {
      day: "numeric",
      ...monthOptions,
      year: "numeric",
    });
  }
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}–${endDate.getDate()}.${(startDate.getMonth() + 1).toString().padStart(2, "0")}.${startDate.getFullYear()}`;
  }
  return `${startDate.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}`;
};

// Funkcja ładnie formatująca lokalizację (wyciąga miasto z JSONa)
// Wyciąga osobno nazwę obiektu i miasto z JSONa w bazie
const parseLocation = (location: any) => {
  if (!location) return { name: "Wkrótce podamy", city: "Piękne otoczenie" };
  try {
    const parsed =
      typeof location === "string" ? JSON.parse(location) : location;
    return {
      name: parsed.name || "Brak nazwy",
      city: parsed.city || "Piękne otoczenie",
    };
  } catch {
    // Jeśli to zwykły string, trafia jako nazwa
    return { name: location, city: "Piękne otoczenie" };
  }
};

// Funkcja kolorująca ostatnie słowo w tytule na morski kolor
const formatTitle = (title: string) => {
  if (!title) return "";
  const words = title.trim().split(" ");
  if (words.length <= 1) return title;

  const lastWord = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-[#287D88]">{lastWord}</span>
    </>
  );
};

// --- ANIMACJE ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
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

// --- INTERFEJS PROPSÓW ---
interface FeaturedTripProps {
  initialTrip: any;
}

export function FeaturedTrip({ initialTrip }: FeaturedTripProps) {
  // Jeśli z jakiegoś powodu baza nie zwróci żadnego wyjazdu, po prostu ukrywamy tę sekcję
  if (!initialTrip) return null;
  console.log(initialTrip.location);

  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pt-24 pb-16 overflow-hidden">
      <motion.div
        className="grid grid-cols-[1.4fr_1fr] max-[1024px]:grid-cols-1 gap-0 items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* LEWA KOLUMNA - Tekst i dane */}
        <div className="flex flex-col items-start max-[1024px]:items-center max-[1024px]:text-center">
          <motion.div variants={fadeUpVariants} className="">
            <Tag label="zbliżający się trip" />
          </motion.div>

          <motion.h2
            variants={fadeUpVariants}
            className="font-jakarta font-semibold text-[48px] max-[768px]:text-[36px] text-[#0B3B4C] leading-[110%] mb-6"
          >
            {formatTitle(initialTrip.title)}
          </motion.h2>

          <motion.p
            variants={fadeUpVariants}
            className="font-montserrat text-[#0B3B4C]/80 text-[16px] leading-[170%] mb-10 max-w-[600px]"
          >
            {initialTrip.description ||
              "Zostaw codzienny pośpiech za sobą i podaruj sobie czas głębokiego resetu w otoczeniu natury. Czeka na Ciebie świadomy ruch, profesjonalne masaże i wspierająca energia."}
          </motion.p>

          {/* MOBILNE ZDJĘCIE (Wyświetlane tylko poniżej 1024px, zaraz nad kółkami) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
            className="w-full hidden max-[1024px]:flex justify-center"
          >
            <div className="relative w-full max-w-[400px] max-[768px]:max-w-[320px] aspect-square rounded-full overflow-hidden shadow-2xl rounded-tr-none bg-gray-100">
              <Image
                src={initialTrip.heroImage || "/images/static/camp.png"}
                fill
                className="object-cover"
                alt={initialTrip.title}
              />
            </div>
          </motion.div>

          {/* KÓŁKA INFORMACYJNE */}
          {/* KÓŁKA INFORMACYJNE */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-wrap gap-4 mb-10 justify-center min-[1025px]:justify-start relative z-10 max-[1024px]:-mt-12"
          >
            {[
              {
                icon: <CalendarBlank size={18} weight="fill" />,
                label: "Termin",
                value: formatDateRange(
                  initialTrip.startDate,
                  initialTrip.endDate,
                ),
                sub: "Twój czas na oddech",
              },
              {
                icon: <MapPin size={18} weight="fill" />,
                label: "Lokalizacja",
                // ZMIANA: Wywołujemy parseLocation raz i wyciągamy name do 'value', a city do 'sub'
                value: parseLocation(initialTrip.location).name,
                sub: parseLocation(initialTrip.location).city,
              },
              {
                icon: <CreditCard size={18} weight="fill" />,
                label: "Cena",
                value: initialTrip.price
                  ? `od ${initialTrip.price} zł / os.`
                  : "Sprawdź detale",
                sub: "Inwestycja w siebie",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`w-[145px] h-[145px] rounded-full rounded-tr-none backdrop-blur-md bg-[#287D88]/90 flex flex-col items-center justify-center text-center text-white p-3 shadow-md relative ${i === 0 ? "max-[1024px]:-mt-12" : i === 2 ? "max-[1024px]:-mt-12" : ""} max-[500px]:mt-0 `}
              >
                {/* Ikonka */}
                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>

                <span className="font-montserrat text-white/80 text-[11px] mb-1.5">
                  {item.label}
                </span>
                <span className="font-montserrat font-bold text-[13px] leading-tight mb-1 px-2 line-clamp-2">
                  {item.value}
                </span>
                <span className="font-montserrat text-white/60 text-[10px] line-clamp-1 mt-0.5">
                  {item.sub}
                </span>
              </div>
            ))}
          </motion.div>

          {/* PRZYCISK Z DYNAMICZNYM LINKIEM */}
          <motion.div variants={fadeUpVariants} className="relative z-20">
            <Link href={`/wyjazdy/${initialTrip.id}`}>
              <Button showArrow>Poznaj szczegóły</Button>
            </Link>
          </motion.div>
        </div>

        {/* PRAWA KOLUMNA - Zdjęcie kółko (Tylko na DESKTOP) */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.8, ease: "easeOut" },
            },
          }}
          className="w-full flex justify-center lg:justify-end max-[1024px]:hidden"
        >
          <div className="relative w-full max-w-[500px] aspect-square rounded-full overflow-hidden shadow-2xl rounded-tr-none bg-gray-100">
            <Image
              src={initialTrip.heroImage || "/images/static/camp.png"}
              fill
              className="object-cover"
              alt={initialTrip.title}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
