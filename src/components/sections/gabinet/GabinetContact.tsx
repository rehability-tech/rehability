"use client";

import React from "react";
import Image from "next/image";
import {
  Phone,
  EnvelopeSimple,
  MapPin,
  FacebookLogo,
  InstagramLogo,
} from "@phosphor-icons/react/dist/ssr";

export function GabinetContact() {
  return (
    <section className="py-24 max-[1024px]:py-16 overflow-hidden ">
      <div className="container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center">
        {/* === NAGŁÓWEK === */}
        <div className="w-full flex justify-start mb-10 max-[1024px]:mb-12">
          <h2 className="font-jakarta font-semibold text-[#0B3B4C] text-[48px] max-[1024px]:text-[36px] leading-[110%]">
            {" "}
            <span className="text-[#287D88]">Nie wiesz</span> co wybrać?
          </h2>
        </div>

        {/* === MAPA I KARTA KONTAKTOWA === */}
        {/* Tło karty jest transparentne, polegamy na układzie z pozycjonowaniem absolutnym */}
        <div className="relative flex flex-col min-[901px]:flex-row w-full min-[901px]:h-[580px]">
          {/* MAPA */}
          {/* Powyżej 900px mapa ma pełną wysokość, poniżej jest stała (350px) */}
          <div className="w-[70%] max-[900px]:w-full h-full max-[900px]:h-[350px] rounded-[32px] overflow-hidden shadow-lg bg-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2551.4938676902253!2d17.575231776510344!3d50.32009297156942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4711bc64d420f865%3A0xc682ce18175de0dc!2sPiastowska%2030%2C%2048-200%20Prudnik!5e0!3m2!1sen!2spl!4v1700000000000!5m2!1sen!2spl"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              // Lekki filtr, by mapa lepiej współgrała z kolorami marki
              className="grayscale-[20%] contrast-[95%] opacity-90"
            ></iframe>
          </div>

          {/* KARTA KONTAKTOWA (NAKŁADKA) */}
          {/* Poniżej 900px wchodzi na mapę (mt-[-60px]), powyżej pozycjonowana z prawej */}
          <div className="w-[450px] max-[1024px]:w-[400px] max-[900px]:w-full bg-[#287D88] rounded-[48px] max-[900px]:rounded-[32px] p-10 max-[1024px]:p-8 max-[900px]:p-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)] relative z-20 mt-[-60px] min-[901px]:mt-0 min-[901px]:absolute min-[901px]:right-0 min-[901px]:top-1/2 min-[901px]:-translate-y-1/2 mx-auto min-[901px]:mx-0 max-[900px]:max-w-[500px]">
            {/* Lista kontaktów */}
            <div className="flex flex-col gap-4 max-[1024px]:gap-3 mb-10 max-[1024px]:mb-8">
              {/* Telefon */}
              <div className="flex items-center gap-4 bg-white/10 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-white/20 transition-colors cursor-pointer group">
                <Phone
                  size={32}
                  weight="regular"
                  className="text-white shrink-0 group-hover:scale-110 transition-transform"
                />
                <div className="flex flex-col">
                  <span className="font-montserrat text-white/70 font-semibold text-[13px] max-[1024px]:text-[12px] leading-tight uppercase tracking-wider">
                    Telefon
                  </span>
                  <a
                    href="tel:+48693537543"
                    className="font-montserrat text-white text-[16px] max-[1024px]:text-[15px] font-medium mt-0.5"
                  >
                    +48 693 537 543
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 bg-white/10 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-white/20 transition-colors cursor-pointer group">
                <EnvelopeSimple
                  size={32}
                  weight="regular"
                  className="text-white shrink-0 group-hover:scale-110 transition-transform"
                />
                <div className="flex flex-col">
                  <span className="font-montserrat text-white/70 font-semibold text-[13px] max-[1024px]:text-[12px] leading-tight uppercase tracking-wider">
                    Email
                  </span>
                  <a
                    href="mailto:piotrsiemaszko.fizjo@gmail.com"
                    className="font-montserrat text-white text-[15px] max-[1024px]:text-[14px] font-medium mt-0.5 break-all"
                  >
                    piotrsiemaszko.fizjo@gmail.com
                  </a>
                </div>
              </div>

              {/* Adres */}
              <div className="flex items-center gap-4 bg-white/10 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-white/20 transition-colors cursor-pointer group">
                <MapPin
                  size={32}
                  weight="regular"
                  className="text-white shrink-0 group-hover:scale-110 transition-transform"
                />
                <div className="flex flex-col">
                  <span className="font-montserrat text-white/70 font-semibold text-[13px] max-[1024px]:text-[12px] leading-tight uppercase tracking-wider">
                    Adres
                  </span>
                  <span className="font-montserrat text-white text-[15px] max-[1024px]:text-[14px] font-medium mt-0.5">
                    Piastowska 30, Prudnik, 48-200
                  </span>
                </div>
              </div>
            </div>

            {/* Linia oddzielająca */}
            <div className="w-full h-[1px] bg-white/20 mb-6" />

            {/* Social Media */}
            <div>
              <span className="font-montserrat font-semibold text-white/90 text-[15px] mb-4 block text-center min-[901px]:text-left">
                Znajdź nas w sieci
              </span>
              <div className="flex items-center justify-center min-[901px]:justify-start gap-4">
                <a
                  href="#"
                  className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white hover:text-[#287D88] transition-all shadow-sm"
                >
                  <FacebookLogo size={24} weight="fill" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white hover:text-[#287D88] transition-all shadow-sm"
                >
                  <InstagramLogo size={24} weight="fill" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white transition-all group shadow-sm"
                  aria-label="Booksy"
                >
                  <Image
                    src="/logotypy/booksy-logotype-white.svg" // Zakładam, że masz ten plik
                    alt="Booksy"
                    width={24}
                    height={24}
                    className="transition-all duration-300 group-hover:brightness-0 group-hover:invert-[0.3]"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
