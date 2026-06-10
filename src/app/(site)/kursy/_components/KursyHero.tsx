"use client";

import Image from "next/image";
import { Play } from "@phosphor-icons/react/dist/ssr";

export function KursyHero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36 pb-12 md:pb-20">
      {/* Dekoracyjna żółto-morska poświata w prawym górnym rogu */}
      <div className="pointer-events-none absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-brand-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-10 right-24 w-72 h-72 rounded-full bg-brand-yellow/20 blur-[100px]" />

      <div className="container relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-[73px] items-center">
        {/* === LEWA KOLUMNA: TEKST === */}
        <div className="flex flex-col gap-8 max-w-[592px]">
          <div className="flex flex-col gap-3 items-start">
            <span className="inline-flex items-center bg-brand-primary text-white font-jakarta font-semibold text-[12px] tracking-[0.48px] uppercase px-5 py-[7px] rounded-full">
              Twoja Cyfrowa Przestrzeń Zdrowia
            </span>
            <h1 className="font-jakarta font-semibold text-brand-secondary text-[34px] md:text-[44px] lg:text-[48px] leading-[1.2]">
              Trenuj <span className="text-brand-primary">bezpiecznie</span> z
              domu i buduj swoją pełną{" "}
              <span className="text-brand-primary">sprawność</span>.
            </h1>
          </div>

          <div className="font-montserrat text-brand-secondary text-[16px] leading-[1.7] space-y-4">
            <p>
              <span className="font-bold">Zapomnij</span> o przypadkowych
              filmach z internetu.
            </p>
            <p>
              Zyskaj dostęp do{" "}
              <span className="font-bold">autorskich programów ruchowych</span>{" "}
              stworzonych przez doświadczonych fizjoterapeutów.
            </p>
            <p>
              Podtrzymaj efekty terapii, uwolnij się od napięć i naucz się
              świadomie pracować ze swoim ciałem – we własnym tempie, z dowolnego
              miejsca.
            </p>
          </div>
        </div>

        {/* === PRAWA KOLUMNA: OBRAZ + BADGE'E === */}
        <div className="relative mx-auto lg:mx-0 lg:justify-self-end w-full max-w-[424px]">
          <div className="relative aspect-[424/599] w-full rounded-[32px] rounded-tr-none overflow-hidden shadow-[0_30px_70px_-30px_rgba(3,63,99,0.45)]">
            <Image
              src="/images/kursy/hero.png"
              alt="Trening rehabilitacyjny online"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 424px"
              className="object-cover"
            />
          </div>

          {/* Badge: Dostęp 24/7 (lewy górny) */}
          <div className="absolute left-2 top-12 sm:left-4 sm:top-14 flex items-center justify-center text-center bg-brand-primary text-white rounded-full size-[120px] sm:size-[150px] p-3 shadow-[0_10px_30px_-8px_rgba(40,125,136,0.6)]">
            <p className="font-montserrat text-[13px] sm:text-[16px] leading-[1.4]">
              <span className="font-bold">Dostęp 24/7</span> na każdym
              urządzeniu
            </p>
          </div>

          {/* Badge: Ułożone przez fizjoterapeutów (prawy dolny) */}
          <div className="absolute right-0 bottom-12 sm:bottom-14 flex items-center justify-center text-center bg-brand-primary text-white rounded-full size-[120px] sm:size-[150px] p-3 shadow-[0_10px_30px_-8px_rgba(40,125,136,0.6)]">
            <p className="font-montserrat text-[13px] sm:text-[16px] leading-[1.4]">
              Ułożone przez <span className="font-bold">fizjoterapeutów</span>
            </p>
          </div>

          {/* Przycisk Play */}
          <button
            type="button"
            aria-label="Odtwórz zapowiedź"
            className="absolute right-6 bottom-2 sm:bottom-3 flex items-center justify-center size-10 rounded-full bg-white text-brand-primary shadow-[0_8px_20px_-6px_rgba(3,63,99,0.4)] transition-transform hover:scale-110"
          >
            <Play size={18} weight="fill" />
          </button>
        </div>
      </div>
    </section>
  );
}
