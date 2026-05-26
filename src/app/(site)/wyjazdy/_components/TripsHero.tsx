import React from "react";
import Image from "next/image";

export function TripsHero() {
  return (
    <section className="relative w-full pt-[200px] max-[1024px]:pt-[160px] pb-[180px] max-[1024px]:pb-[120px] overflow-hidden rounded-b-[64px] max-[768px]:rounded-b-[40px] shadow-sm">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/campy/campy_hero.jpg"
          fill
          className="object-cover object-top"
          alt="Wyjazdy Rehability – wyjazdy holistyczne"
          priority
        />
        <div className="absolute inset-0 bg-[#0B3B4C]/50" />
      </div>

      <div className="relative z-20 container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center text-center text-white">
        <h1 className="font-jakarta font-bold text-[56px] max-[1024px]:text-[48px] max-[768px]:text-[40px] mb-2 drop-shadow-md">
          Wyjazdy
        </h1>
        <p className="font-montserrat font-medium text-[16px] max-w-[800px] leading-[160%] text-white/90">
          Ekskluzywne wyjazdy holistyczne — świadomy ruch, masaże, wellness i
          czas dla siebie w pięknym otoczeniu natury.
        </p>
      </div>
    </section>
  );
}
