"use client";

import React from "react";
import { Clock, Users, Star, Trophy } from "@phosphor-icons/react/dist/ssr";

export function GabinetSocialProof() {
  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pb-32 max-[1024px]:pb-20 mt-16 max-[1024px]:mt-10">
      {/* === NAGŁÓWEK I KOLUMNY === */}
      <h2 className="font-jakarta font-bold text-[56px] max-[1024px]:text-[48px] max-[768px]:text-center max-[768px]:text-[42px] text-[#0B3B4C] leading-[110%] mb-12 max-[1024px]:mb-8">
        Więcej niż tylko <span className="text-[#287D88]">gaszenie bólu.</span>
      </h2>

      <div className="grid grid-cols-2 max-[768px]:grid-cols-1 gap-12 max-[1024px]:gap-8 max-[768px]:gap-6 max-[768px]:text-center">
        <p className="font-montserrat text-paragraph ">
          Zauważyliśmy, że tradycyjna rehabilitacja często ogranicza się do
          szybkiej ulgi. Pacjent wychodzi z gabinetu, ale po kilku miesiącach
          problem powraca, ponieważ nie usunięto jego pierwotnej przyczyny. W
          tym standardowym procesie brakowało nam jednego – ciągłości i nauki
          świadomego ruchu.
        </p>
        <p className="font-montserrat text-paragraph">
          Dlatego w gabinecie Rehability nie skupiamy się na maskowaniu objawów,
          ale na celowanym leczeniu. Łączymy zaawansowaną terapię manualną,
          pracę na powięziach i nowoczesną wiedzę z zakresu biomechaniki. Nasz
          zespół terapeutów ściśle ze sobą współpracuje, aby stworzyć dla Ciebie
          indywidualny plan powrotu do zdrowia – od pierwszej diagnozy, przez
          zlikwidowanie ostrego bólu, aż po naukę prawidłowych wzorców
          ruchowych.
        </p>
      </div>

      {/* === CYTAT === */}
      <div className="mt-16 max-[1024px]:mt-12 mb-16 max-[1024px]:mb-12 text-center px-4">
        <p className="font-montserrat italic font-medium text-[24px] max-[768px]:text-[18px] text-[#287D88] max-w-[1000px] mx-auto leading-[160%]">
          &quot;Nie interesują nas chwilowe rozwiązania. Przywracamy Ci swobodę
          ruchu, która pozwala żyć, trenować i odpoczywać na własnych
          zasadach.&quot;
        </p>
      </div>

      {/* === PASEK STATYSTYK (SOCIAL PROOF) === */}
      <div className="w-full bg-[#35828a] rounded-[32px] p-10 max-[1024px]:p-8 max-[600px]:p-10 shadow-lg max-[600px]:w-fit max-[600px]:justify-self-center">
        <div className="grid grid-cols-4 max-[1024px]:grid-cols-2 max-[600px]:grid-cols-1 gap-8 max-[1024px]:gap-8 max-[600px]:gap-10">
          {/* Statystyka 1 */}
          <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:text-center">
            <div className="w-14 h-14 max-[768px]:w-12 max-[768px]:h-12 rounded-full bg-[#E8F0F1] flex items-center justify-center shrink-0">
              <Clock
                size={28}
                className="text-[#35828a] max-[768px]:w-[24px] max-[768px]:h-[24px]"
                weight="regular"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-jakarta font-bold text-white text-[24px] max-[768px]:text-[22px] leading-tight">
                10+
              </span>
              <span className="font-montserrat font-medium text-white/80 text-[13px] max-[768px]:text-[12px] leading-[130%] mt-1">
                Lat praktyki
                <br />
                klinicznej
              </span>
            </div>
          </div>

          {/* Statystyka 2 */}
          <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:text-center">
            <div className="w-14 h-14 max-[768px]:w-12 max-[768px]:h-12 rounded-full bg-[#E8F0F1] flex items-center justify-center shrink-0">
              <Users
                size={28}
                className="text-[#35828a] max-[768px]:w-[24px] max-[768px]:h-[24px]"
                weight="regular"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-jakarta font-bold text-white text-[24px] max-[768px]:text-[22px] leading-tight">
                3000+
              </span>
              <span className="font-montserrat font-medium text-white/80 text-[13px] max-[768px]:text-[12px] leading-[130%] mt-1">
                Przeprowadzonych
                <br />
                terapii
              </span>
            </div>
          </div>

          {/* Statystyka 3 */}
          <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:text-center">
            <div className="w-14 h-14 max-[768px]:w-12 max-[768px]:h-12 rounded-full bg-[#E8F0F1] flex items-center justify-center shrink-0">
              <Star
                size={28}
                className="text-[#35828a] max-[768px]:w-[24px] max-[768px]:h-[24px]"
                weight="regular"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-jakarta font-bold text-white text-[24px] max-[768px]:text-[22px] leading-tight">
                40+
              </span>
              <span className="font-montserrat font-medium text-white/80 text-[13px] max-[768px]:text-[12px] leading-[130%] mt-1">
                Ukończonych szkoleń
                <br />i certyfikacji
              </span>
            </div>
          </div>

          {/* Statystyka 4 */}
          <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:text-center">
            <div className="w-14 h-14 max-[768px]:w-12 max-[768px]:h-12 rounded-full bg-[#E8F0F1] flex items-center justify-center shrink-0">
              <Trophy
                size={28}
                className="text-[#35828a] max-[768px]:w-[24px] max-[768px]:h-[24px]"
                weight="regular"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-jakarta font-bold text-white text-[24px] max-[768px]:text-[22px] leading-tight">
                5.0
              </span>
              <span className="font-montserrat font-medium text-white/80 text-[13px] max-[768px]:text-[12px] leading-[130%] mt-1">
                Średnia ocen
                <br />
                pacjentów (Booksy)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
