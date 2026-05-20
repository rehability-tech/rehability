import CampCreatorStepper from "./_components/CampCreatorStepper";
import React from "react";

export default function CampCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 p-6">
      {/* Nagłówek sekcji osadzony normalnie w DOM */}
      <div className="my-8 mt-2 text-center">
        <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
          Kreator wyjazdów
        </h1>
        <p className="text-gray-500 font-montserrat text-[14px] md:text-[15px] mt-1">
          Skonfiguruj nowy wyjazd, uzupełnij opłaty i dodaj treści krok po
          kroku.
        </p>
      </div>

      {/* Główna karta z białym tłem, w której dzieje się cała akcja */}
      <div className=" min-h-[500px]">
        <CampCreatorStepper />

        {/* Kreska oddzielająca stepper od formularza */}
        <div className="border-t border-gray-50 pt-8 mt-2">
          {/* Tu będzie się ładował page.tsx z danego kroku */}
          {children}
        </div>
      </div>
    </div>
  );
}
