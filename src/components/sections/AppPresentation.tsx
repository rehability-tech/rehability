"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/Button";

// === KOMPONENT TAG (Z Twojego kodu) ===
export const Tag = ({ label }: { label: string }) => {
  return (
    <div className="inline-block px-5 py-1.5 rounded-full bg-brand-primary/90 text-white font-montserrat text-[12px] font-bold tracking-wider mb-3 max-[1024px]:self-center uppercase">
      {label}
    </div>
  );
};

export function AppPresentation() {
  return (
    // Zwróć uwagę: brak tła w sekcji! Zgodnie z naszą zasadą.
    <section className="py-24 max-[1024px]:py-16 overflow-hidden">
      <div className="container mx-auto px-4 max-[1024px]:px-6">
        {/* === LAYOUT GRID (Dwie kolumny na desktopie, jedna na mobile) === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* --- LEWA KOLUMNA (TEKSTY) --- */}
          <div className="flex flex-col items-start max-[1024px]:items-center max-[1024px]:text-center">
            <Tag label="Aplikacja Rehability" />

            <h2 className="typography-subheading font-semibold text-brand-secondary text-[36px] md:text-[42px] lg:text-[48px] leading-[115%] mb-6">
              Twoja wiedza zawsze pod ręką. <br className="hidden lg:block" />
              <span className="text-brand-primary">
                Poznaj naszą aplikację.
              </span>
            </h2>

            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px] md:text-[16px] mb-8 max-w-[550px]">
              Ucz się tak, jak lubisz. Zyskaj wygodny dostęp do wszystkich
              kursów z fizjoterapii na smartfonie, tablecie i komputerze. Śledź
              swoje postępy, pobieraj skrypty PDF i wracaj do lekcji wideo z
              dowolnego miejsca – w gabinecie, w domu lub w drodze.
            </p>

            {/* Przycisk z białym kółkiem na ikonę */}
            <Button showArrow>Otrzymaj dostęp</Button>
          </div>

          {/* --- PRAWA KOLUMNA (ZDJĘCIE APLIKACJI) --- */}
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[640px] flex justify-center items-center">
            <Image
              src="/images/app-presentation/platforma_vod_prezentacja.png"
              fill
              alt="Prezentacja aplikacji mobilnej Rehability"
              // object-contain sprawi, że grafika dopasuje się idealnie do diva i nie zostanie ucięta!
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
