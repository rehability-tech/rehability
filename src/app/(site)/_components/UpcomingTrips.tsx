"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CalendarCheck,
  MapPin,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { AsteriskSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

// ==========================================
// 1. DANE DLA DESKTOPU (Siatka 4x2 = 8 bloków) | Od 900px
// ==========================================
const MASK_BLOCKS_DESKTOP = [
  { id: 1, radius: "rounded-tl-none rounded-[110px]" },
  {
    id: 2,
    radius:
      "rounded-[110px] rounded-tr-[110px] rounded-br-[110px] rounded-tr-none",
  },
  { id: 3, radius: "rounded-[110px] rounded-tl-none" },
  { id: 4, radius: "rounded-[110px] rounded-tr-none " },
  { id: 5, radius: "rounded-[110px] rounded-bl-none" },
  { id: 6, radius: "rounded-[110px] rounded-br-none" },
  { id: 7, radius: "rounded-[110px] rounded-bl-none" },
  { id: 8, radius: "rounded-[110px]  rounded-br-none" },
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

// ==========================================
// 2. DANE DLA TABLETU (Siatka 2x3 = 6 bloków) | 500px - 899px
// ==========================================
const MASK_BLOCKS_TABLET = [
  { id: 1, radius: "rounded-tl-none rounded-[60px]" },
  { id: 2, radius: "rounded-[60px] rounded-b-none" },
  { id: 3, radius: "rounded-[60px] rounded-tr-none" },
  { id: 4, radius: "rounded-[60px] rounded-l-none" },
  { id: 5, radius: "rounded-[60px] rounded-t-none" },
  { id: 6, radius: "rounded-[60px] rounded-br-none" },
];

const FILLED_BLOCKS_TABLET = [
  { id: 1, radius: "rounded-tl-[48px]" },
  { id: 2, radius: "rounded-tr-[48px]" },
  { id: 3, radius: "rounded-none" },
  { id: 4, radius: "rounded-none" },
  { id: 5, radius: "rounded-bl-[48px]" },
  { id: 6, radius: "rounded-br-[48px]" },
];

// ==========================================
// 3. DANE DLA MOBILE (Siatka 2x2 = 4 bloki) | Poniżej 500px
// ==========================================
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

// ==========================================
// TYPY
// ==========================================
interface FeaturedTrip {
  id: string;
  title: string;
  subtitle: string | null;
  tags: string[];
  heroImage: string | null;
  location: string;
  price: number | null;
  startDate: Date | string;
  endDate: Date | string;
}

interface UpcomingTripsProps {
  featuredTrip: FeaturedTrip;
}

// ==========================================
// POMOCNICZE
// ==========================================
function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    return `${s.getDate()}–${e.getDate()}.${String(s.getMonth() + 1).padStart(2, "0")}.${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}`;
}

function parseLocation(raw: string): string {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed.name || parsed.city || raw;
  } catch {
    return raw;
  }
}

export function UpcomingTrips({ featuredTrip }: UpcomingTripsProps) {
  const [isFilled, setIsFilled] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            setIsFilled(true);
          }, 1000);

          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.4 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const heroImage = featuredTrip.heroImage ?? "/images/static/camp.png";
  const tripTitle = featuredTrip.title;
  const tripTags = featuredTrip.tags;
  const tripSubtitle = featuredTrip.subtitle ?? "Pod opieką fizjoterapeuty i dietetyka klinicznego";
  const tripLink = `/wyjazdy/${featuredTrip.id}`;

  const infoCircles = [
    {
      icon: <CalendarCheck size={18} weight="fill" className="text-white" />,
      label: "Termin",
      value: formatDateRange(featuredTrip.startDate, featuredTrip.endDate),
      sub: "Twój czas na odpoczynek",
    },
    {
      icon: <MapPin size={18} weight="fill" className="text-white" />,
      label: "Lokalizacja",
      value: parseLocation(featuredTrip.location),
      sub: "Piękne otoczenie",
    },
    {
      icon: <CreditCard size={18} weight="fill" className="text-white" />,
      label: "Cena",
      value: featuredTrip.price ? `od ${featuredTrip.price} zł / os.` : "Sprawdź cennik",
      sub: "Inwestycja w siebie",
    },
  ];

  const activeDesktopArray = isFilled ? FILLED_BLOCKS_DESKTOP : MASK_BLOCKS_DESKTOP;
  const activeTabletArray = isFilled ? FILLED_BLOCKS_TABLET : MASK_BLOCKS_TABLET;
  const activeMobileArray = isFilled ? FILLED_BLOCKS_MOBILE : MASK_BLOCKS_MOBILE;

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div className="container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center">
        {/* === NAGŁÓWEK === */}
        <motion.div
          className="flex flex-col items-center text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="typography-subheading font-semibold text-brand-secondary text-[36px] md:text-[42px] lg:text-[48px] leading-[120%] mb-4">
            Zasługujesz na <span className="text-brand-primary">reset</span>
          </h2>
          <p className="font-montserrat font-medium text-brand-primary/80 text-[16px] md:text-[18px]">
            Dołącz do naszego najbliższego wyjazdu
          </p>
        </motion.div>

        {/* === KONTENER NA ZDJĘCIE I ELEMENTY === */}
        <div className="relative w-full max-w-[1000px] mx-auto flex flex-col items-center">
          <div className="relative w-full">
            {/* === 1. SIATKA DESKTOP (4x2) | Widoczna od 900px === */}
            <div className="hidden min-[900px]:grid grid-cols-4 w-full">
              {activeDesktopArray.map((block, index) => {
                const col = index % 4;
                const row = Math.floor(index / 4);
                const bgPosX = col * (100 / 3);
                const bgPosY = row * 100;

                return (
                  <div
                    key={block.id}
                    className={`w-full aspect-square overflow-hidden transition-all duration-700 ease-in-out ${block.radius}`}
                    style={{
                      backgroundImage: `url('${heroImage}')`,
                      backgroundSize: "400% 200%",
                      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                );
              })}
            </div>

            {/* === 2. SIATKA TABLET (2x3) | Widoczna od 500px do 899px === */}
            <div className="hidden min-[500px]:grid min-[900px]:hidden grid-cols-2 w-full">
              {activeTabletArray.map((block, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const bgPosX = col * 100;
                const bgPosY = row * 50;

                return (
                  <div
                    key={block.id}
                    className={`w-full h-[160px] sm:h-[180px] overflow-hidden transition-all duration-700 ease-in-out ${block.radius}`}
                    style={{
                      backgroundImage: `url('${heroImage}')`,
                      backgroundSize: "200% 300%",
                      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                );
              })}
            </div>

            {/* === 3. SIATKA MOBILE (2x2) | Widoczna poniżej 500px === */}
            <div className="grid min-[500px]:hidden grid-cols-2 w-full">
              {activeMobileArray.map((block, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const bgPosX = col * 100;
                const bgPosY = row * 100;

                return (
                  <div
                    key={block.id}
                    className={`w-full aspect-square overflow-hidden transition-all duration-700 ease-in-out ${block.radius}`}
                    style={{
                      backgroundImage: `url('${heroImage}')`,
                      backgroundSize: "200% 200%",
                      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                );
              })}
            </div>

            {/* === NAKŁADKA Z TEKSTEM (WEWNĄTRZ ZDJĘCIA) === */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-8 md:pb-16 pointer-events-none z-10 px-2">
              <h3
                className={`font-jakarta font-extrabold max-[450px]:text-[39px] text-white text-[42px] sm:text-[52px] md:text-[64px] leading-[100%] text-center tracking-wide uppercase transition-all duration-700 ease-in-out drop-shadow-md mb-4 md:mb-6 ${
                  isFilled ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                {tripTitle.includes(" ") ? (
                  <>
                    {tripTitle.split(" ").slice(0, -1).join(" ")} <br />
                    <span className="text-[#287D88]">
                      {tripTitle.split(" ").at(-1)}
                    </span>
                  </>
                ) : (
                  tripTitle
                )}
              </h3>

              <div
                className={`flex flex-col items-center gap-2 md:gap-3 transition-all duration-700 ease-in-out delay-100 ${
                  isFilled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-5 max-w-[100%] bg-black/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-[32px] md:rounded-full shadow-lg border border-white/10 max-[670px]:bg-transparent max-[670px]:backdrop-filter-none max-[670px]:shadow-none max-[670px]:border-none max-[670px]:p-0">
                  {tripTags.map((item, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="font-montserrat text-white text-[12px] md:text-[14px] max-[450px]:text-[10px] font-medium tracking-wide max-[670px]:bg-black/20 max-[670px]:backdrop-blur-sm max-[670px]:border max-[670px]:border-white/10 max-[670px]:px-3 max-[670px]:py-1.5 max-[670px]:rounded-full">
                        {item}
                      </span>
                      {i !== arr.length - 1 && (
                        <AsteriskSimpleIcon
                          fill="#287D88"
                          weight="fill"
                          className="w-3 h-3 md:w-4 md:h-4 max-[670px]:hidden"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className="font-montserrat font-medium text-white text-[12px] md:text-[16px] mt-1 md:mt-2 drop-shadow-md text-center max-[450px]:text-[10px]">
                  {tripSubtitle}
                </p>
              </div>
            </div>

            {/* === PRZYCISK DESKTOP === */}
            <div
              className={`hidden md:flex absolute right-6 bottom-6 flex-col z-20 transition-all duration-700 delay-300 ${
                isFilled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <Button href={tripLink}>Poznaj szczegóły</Button>
            </div>
          </div>

          {/* === DOLNE ELEMENTY NACHODZĄCE (KÓŁKA I PRZYCISK MOBILE) === */}
          <div
            className={`relative z-20 w-full flex flex-wrap justify-center items-center gap-4 md:gap-6 -mt-12 md:-mt-20 px-2 md:px-4 transition-all duration-700 ease-in-out ${
              isFilled ? "opacity-100 translate-y-0 delay-200" : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            {infoCircles.map((info, i) => (
              <div
                key={i}
                className={`w-[130px] h-[130px] md:w-[160px] md:h-[160px] rounded-[111px] rounded-tr-none bg-brand-primary/80 md:bg-brand-primary/70 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center relative border border-white/20 p-2 transform hover:scale-105 transition-transform ${i === 0 && "max-[470px]:!rounded-br-none max-[470px]:!rounded-[111px]"} ${i === 1 && "max-[470px]:!rounded-bl-none max-[470px]:!rounded-[111px]"} ${i === 2 && "max-[470px]:!rounded-[111px]"}`}
              >
                <div
                  className={`absolute top-1 right-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1b5c65] flex items-center justify-center shadow-inner ${i === 2 && "max-[470px]:left-1/2 max-[470px]:-translate-x-1/2"} ${i === 0 && "max-[470px]:!bottom-1 max-[470px]:top-auto"} ${i === 1 && "max-[470px]:!bottom-1 max-[470px]:top-auto max-[470px]:left-1"}`}
                >
                  {info.icon}
                </div>
                <span className="font-montserrat text-white/90 text-[11px] md:text-[13px] mb-1">
                  {info.label}
                </span>
                <span className="font-montserrat font-bold text-white text-[13px] md:text-[15px] leading-tight mb-0.5 md:mb-1">
                  {info.value}
                </span>
                <span className="font-montserrat text-white/70 text-[9px] md:text-[11px]">
                  {info.sub}
                </span>
              </div>
            ))}

            {/* === PRZYCISK MOBILE === */}
            <div className="flex md:hidden flex-col items-center mt-4 w-full">
              <Button href={tripLink}>Poznaj szczegóły</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
