"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  MapPin,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { AsteriskSimpleIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";

// ==========================================
// KONFIGURACJA MASEK DLA PODGLĄDU
// ==========================================
const MASK_BLOCKS_DESKTOP = [
  { id: 1, radius: "rounded-tl-none rounded-[110px]" },
  {
    id: 2,
    radius:
      "rounded-[110px] rounded-tr-[110px] rounded-br-[110px] rounded-tr-none",
  },
  { id: 3, radius: "rounded-[110px] rounded-tl-none" },
  { id: 4, radius: "rounded-[110px] rounded-tr-none" },
  { id: 5, radius: "rounded-[110px] rounded-bl-none" },
  { id: 6, radius: "rounded-[110px] rounded-br-none" },
  { id: 7, radius: "rounded-[110px] rounded-bl-none" },
  { id: 8, radius: "rounded-[110px] rounded-br-none" },
];

const FILLED_BLOCKS_DESKTOP = [
  { id: 1, radius: "rounded-tl-[32px] rounded-bl-[64px]" },
  { id: 2, radius: "rounded-none" },
  { id: 3, radius: "rounded-none" },
  { id: 4, radius: "rounded-none rounded-tr-[32px] rounded-br-[64px]" },
  { id: 5, radius: "rounded-none rounded-tl-[64px] rounded-bl-[32px]" },
  { id: 6, radius: "rounded-none" },
  { id: 7, radius: "rounded-none" },
  { id: 8, radius: "rounded-br-[32px] rounded-tr-[64px]" },
];

const MASK_BLOCKS_MOBILE = [
  { id: 1, radius: "rounded-tl-none rounded-[50px]" },
  { id: 2, radius: "rounded-[50px] rounded-bl-none" },
  { id: 3, radius: "rounded-[50px] rounded-tr-none" },
  { id: 4, radius: "rounded-[50px] rounded-br-none" },
];

const FILLED_BLOCKS_MOBILE = [
  { id: 1, radius: "rounded-tl-[40px]" },
  { id: 2, radius: "rounded-tr-[40px]" },
  { id: 3, radius: "rounded-bl-[40px]" },
  { id: 4, radius: "rounded-br-[40px]" },
];

interface PreviewUpcomingCampsProps {
  camp: any;
  viewMode: "desktop" | "mobile";
}

export default function PreviewUpcomingCamps({
  camp,
  viewMode,
}: PreviewUpcomingCampsProps) {
  const [isFilled, setIsFilled] = useState(false);
  const isMobile = viewMode === "mobile";

  useEffect(() => {
    setIsFilled(false);
    const timer = setTimeout(() => setIsFilled(true), 300);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Wybieramy odpowiednią siatkę w zależności od zadanego widoku
  const activeArray = isFilled
    ? isMobile
      ? FILLED_BLOCKS_MOBILE
      : FILLED_BLOCKS_DESKTOP
    : isMobile
      ? MASK_BLOCKS_MOBILE
      : MASK_BLOCKS_DESKTOP;

  const titleWords = camp?.title
    ? camp.title.split(" ")
    : ["Między nami", "Kobietami"];
  const titlePart1 = titleWords
    .slice(0, Math.ceil(titleWords.length / 2))
    .join(" ");
  const titlePart2 = titleWords
    .slice(Math.ceil(titleWords.length / 2))
    .join(" ");

  const tags =
    camp?.tags && camp.tags.length > 0
      ? camp.tags
      : ["Świadomy ruch", "Masaże", "Góry", "Czas dla siebie"];

  const formatPrice = (price: any) => {
    const num = parseFloat(price);
    return isNaN(num)
      ? "0.00"
      : num.toLocaleString("pl-PL", { minimumFractionDigits: 0 });
  };

  let locationName = "Brak lokacji";
  let locationCity = "Miejsce wyjazdu";

  if (camp?.location) {
    try {
      const parsedLocation =
        typeof camp.location === "string"
          ? JSON.parse(camp.location)
          : camp.location;
      locationName = parsedLocation.name || "Brak lokacji";
      locationCity = parsedLocation.city || "Miejsce wyjazdu";
    } catch (e) {
      locationName = camp.location;
    }
  }

  const INFO_CIRCLES = [
    {
      icon: (
        <CalendarCheck
          size={isMobile ? 12 : 14}
          weight="fill"
          className="text-white"
        />
      ),
      label: "Termin",
      value: camp?.startDate
        ? new Date(camp.startDate).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "2-digit",
          })
        : "Brak",
      sub: "Rezerwuj czas",
    },
    {
      icon: (
        <MapPin
          size={isMobile ? 12 : 14}
          weight="fill"
          className="text-white"
        />
      ),
      label: "Lokalizacja",
      value: locationName,
      sub: locationCity,
    },
    {
      icon: (
        <CreditCard
          size={isMobile ? 12 : 14}
          weight="fill"
          className="text-white"
        />
      ),
      label: "Cena",
      value: `od ${formatPrice(camp?.price)} zł`,
      sub: "Inwestycja",
    },
  ];

  return (
    <section className="relative overflow-hidden w-full bg-white pt-8 pb-16">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className={`font-jakarta font-semibold text-[#033f63] leading-[120%] mb-2 ${isMobile ? "text-[26px]" : "text-[32px]"}`}
          >
            Zasługujesz na <span className="text-[#287d88]">reset</span>
          </h2>
          <p
            className={`font-montserrat font-medium text-[#287d88]/80 ${isMobile ? "text-[12px]" : "text-[14px]"}`}
          >
            Podgląd najnowszej oferty
          </p>
        </motion.div>

        <div className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center">
          <div className="relative w-full bg-gray-50 rounded-[32px] overflow-hidden">
            {/* DYNAMICZNA SIATKA (Mobile: 2 kolumny, Desktop: 4 kolumny) */}
            <div
              className={`grid w-full gap-0 scale-[1.01] ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}
            >
              {activeArray.map((block, index) => {
                const cols = isMobile ? 2 : 4;
                const rows = isMobile ? 2 : 2;
                const col = index % cols;
                const row = Math.floor(index / cols);

                return (
                  <div
                    key={block.id}
                    className={`relative w-full aspect-square overflow-hidden transition-all duration-700 ease-in-out ${block.radius}`}
                  >
                    {/* Ten kontener symuluje pełen rozmiar całej siatki (np. 400% x 200%),
                        a dzięki left/top przesuwa się tak, by w okienku znalazł się właściwy wycinek */}
                    <div
                      className="absolute"
                      style={{
                        width: `${cols * 100}%`,
                        height: `${rows * 100}%`,
                        left: `-${col * 100}%`,
                        top: `-${row * 100}%`,
                      }}
                    >
                      <Image
                        src={camp?.heroImage || "/images/static/camp.png"}
                        alt={camp?.title || "Wyjazd"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 1000px"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-2 ${isMobile ? "pb-12" : "pb-6"}`}
            >
              <h3
                className={`font-jakarta font-extrabold text-white leading-[100%] text-center tracking-wide uppercase transition-all duration-700 ease-in-out drop-shadow-md mb-4 ${
                  isFilled ? "opacity-100 scale-100" : "opacity-0 scale-95"
                } ${isMobile ? "text-[32px]" : "text-[46px]"}`}
              >
                {titlePart1} <br />
                <span className="text-[#287D88]">{titlePart2}</span>
              </h3>

              <div
                className={`flex flex-col items-center transition-all duration-700 ease-in-out delay-100 ${
                  isFilled
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                } ${isMobile ? "gap-2 w-full" : "gap-3"}`}
              >
                {/* Całkowicie rozdzielone renderowanie tagów dla bezpieczeństwa Desktopu */}
                <div
                  className={`flex flex-wrap justify-center items-center pointer-events-auto ${
                    isMobile
                      ? "gap-1.5 bg-transparent shadow-none border-none p-0 w-full"
                      : "gap-2.5 px-5 py-2.5 bg-black/30 backdrop-blur-sm rounded-full shadow-lg border border-white/10"
                  }`}
                >
                  {tags
                    .slice(0, isMobile ? 3 : 6)
                    .map((item: string, i: number, arr: any) => (
                      <React.Fragment key={i}>
                        <span
                          className={`font-montserrat text-white font-medium tracking-wide ${
                            isMobile
                              ? "text-[9px] bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full"
                              : "text-[11px]"
                          }`}
                        >
                          {item}
                        </span>
                        {i !== arr.length - 1 && !isMobile && (
                          <AsteriskSimpleIcon
                            fill="#287D88"
                            weight="fill"
                            className="w-3 h-3"
                          />
                        )}
                      </React.Fragment>
                    ))}
                </div>
                <p
                  className={`font-montserrat font-medium text-white drop-shadow-md text-center ${isMobile ? "text-[10px] mt-1" : "text-[12px]"}`}
                >
                  Pod opieką fizjoterapeuty i dietetyka klinicznego
                </p>
              </div>
            </div>

            {/* ZMNIEJSZONY PRZYCISK (Widoczny NA ZDJĘCIU tylko w Desktop) */}
            {!isMobile && (
              <div
                className={`absolute right-4 bottom-4 flex flex-col z-20 transition-all duration-700 delay-300 ${
                  isFilled
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <button className="relative inline-flex items-center justify-center h-[32px] px-4 overflow-hidden font-montserrat font-medium text-[12px] text-white bg-brand-primary rounded-tl-[16px] rounded-tr-[2px] rounded-br-[16px] rounded-bl-[16px] shadow-md transition-colors hover:bg-brand-primary/90 focus-visible:outline-none cursor-pointer pointer-events-auto">
                  Poznaj szczegóły
                </button>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* ROZDZIELENIE LOGIKI KÓŁEK: DESKTOP VS MOBILE              */}
          {/* ========================================================= */}
          {isMobile ? (
            /* --- WIDOK MOBILE: PIRAMIDA/KONICZYNA --- */
            <div
              className={`relative z-20 w-full flex flex-col items-center px-2 transition-all duration-700 ease-in-out ${
                isFilled
                  ? "opacity-100 translate-y-0 delay-200"
                  : "opacity-0 translate-y-8"
              } -mt-12`}
            >
              {/* Górne dwa kółka obok siebie */}
              <div className="flex justify-center gap-1.5">
                {INFO_CIRCLES.slice(0, 2).map((info, i) => (
                  <div
                    key={i}
                    className={`w-[115px] h-[115px] ${
                      i === 0
                        ? "rounded-[111px] rounded-br-none"
                        : "rounded-[111px] rounded-bl-none"
                    } bg-[#39787e]/95 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center relative border border-white/20 p-2 transform hover:scale-105 transition-transform`}
                  >
                    <div
                      className={`absolute ${
                        i === 0 ? "bottom-2 right-2" : "bottom-2 left-2"
                      } w-6 h-6 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner`}
                    >
                      {info.icon}
                    </div>
                    <span className="font-montserrat text-white/90 text-[10px] mb-1">
                      {info.label}
                    </span>
                    <span className="font-montserrat font-bold text-white text-[12px] leading-tight mb-0.5 px-1">
                      {info.value}
                    </span>
                    <span className="font-montserrat text-white/70 text-[8px]">
                      {info.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dolne trzecie kółko wciśnięte w lukę */}
              <div className="flex justify-center mt-2">
                <div className="w-[115px] h-[115px] rounded-[111px] bg-[#39787e]/95 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center relative border border-white/20 p-2 transform hover:scale-105 transition-transform">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner">
                    {INFO_CIRCLES[2].icon}
                  </div>
                  <span className="font-montserrat text-white/90 mb-1 text-[10px] mt-4">
                    {INFO_CIRCLES[2].label}
                  </span>
                  <span className="font-montserrat font-bold text-white text-[12px] leading-tight mb-0.5 px-1">
                    {INFO_CIRCLES[2].value}
                  </span>
                  <span className="font-montserrat text-white/70 text-[8px]">
                    {INFO_CIRCLES[2].sub}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* --- WIDOK DESKTOP: ORYGINALNY, NIENARUSZONY --- */
            <div
              className={`relative z-20 w-full flex justify-center items-center px-2 transition-all duration-700 ease-in-out gap-4 -mt-10 ${
                isFilled
                  ? "opacity-100 translate-y-0 delay-200"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {INFO_CIRCLES.map((info, i) => (
                <div
                  key={i}
                  className="w-[120px] h-[120px] rounded-[111px] rounded-tr-none bg-[#287D88]/90 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center relative border border-white/20 transform transition-transform hover:scale-105"
                >
                  <div className="absolute right-1 w-7 h-7 top-1 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner">
                    {info.icon}
                  </div>
                  <span className="font-montserrat text-white/90 mb-0.5 text-[11px]">
                    {info.label}
                  </span>
                  <span className="font-montserrat font-bold text-white leading-tight mb-0.5 px-1 text-[13px]">
                    {info.value}
                  </span>
                  <span className="font-montserrat text-white/70 text-[10px]">
                    {info.sub}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* PRZYCISK MOBILE (Pod kółkami) */}
          {isMobile && (
            <div
              className={`flex flex-col items-center mt-6 w-full transition-all duration-700 delay-300 ${
                isFilled ? "opacity-100" : "opacity-0"
              }`}
            >
              <button className="relative inline-flex items-center justify-center h-[40px] px-8 overflow-hidden font-montserrat font-bold text-[13px] text-white bg-[#287d88] rounded-tl-[20px] rounded-tr-[4px] rounded-br-[20px] rounded-bl-[20px] shadow-lg transition-colors hover:bg-[#1b5c65] focus-visible:outline-none pointer-events-auto cursor-pointer">
                Poznaj szczegóły
              </button>
              <p className="text-[#033f63] font-medium text-[11px] mt-2 text-center">
                Pozostały tylko{" "}
                <strong className="text-[#287d88]">3 miejsca</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
