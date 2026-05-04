"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SealCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

interface SpecjalisciProps {
  activeTab: "fizjoterapia" | "masaze";
}

// === DANE SPECJALISTÓW ===
const SPECIALISTS = [
  // --- MASAŻE ---
  {
    id: "natalia",
    category: "masaze",
    name: "Natalia Głód",
    role: "Terapeutka Kobido",
    description:
      "Twarz to mapa emocji i napięć, z którymi zmagamy się każdego dnia. Wykorzystując starojapońskie techniki masażu Kobido, pracuję na głębokich warstwach skóry i mięśni, oferując Ci w pełni naturalną odnowę. To znacznie więcej niż zabieg estetyczny – to holistyczny rytuał, który odmładza, poprawia krążenie i skutecznie wycisza przebodźcowany umysł.",
    imageSrc: "/images/gabinet/specjalisci/natalia_glod.png",
    layout: "text-left",
    bullets: [
      "Niechirurgiczny, głęboki lifting i ujędrnianie twarzy.",
      "Niwelowanie napięć karku i żuchwy (wsparcie w bruksizmie).",
      "Holistyczny relaks, poprawa krążenia i redukcja stresu.",
    ],
    services: [
      {
        title: "Japoński Masaż Kobido",
        desc: "Tradycyjna technika nazywana „naturalnym liftingiem bez skalpela”. Łączy drenaż limfatyczny i intensywny lifting...",
        price: "150 zł",
        time: "70min",
      },
      {
        title: "Masaż Pleców i Kręgosłupa",
        desc: "Kompleksowy zabieg relaksacyjno-terapeutyczny. Głęboko rozluźnia napięte mięśnie od karku aż po odcinek lędźwiowy...",
        price: "130 zł",
        time: "45min",
      },
    ],
    ctaText: "Zarezerwuj sesję Kobido",
    ctaLink: "#",
  },
  {
    id: "wiktoria",
    category: "masaze",
    name: "Wiktoria Benroth",
    role: "Technik Masażysta",
    description:
      "Świadoma regeneracja to fundament zdrowia. W dzisiejszym przebodźcowanym świecie to Twój układ nerwowy i mięśniowy potrzebują największej opieki. W Rehability zajmuję się uwalnianiem ciała od przewlekłego napięcia, sztywności i stresu. Moje sesje to przestrzeń na głęboki oddech i idealne uzupełnienie pracy fizjoterapeutycznej – przywracam Ci lekkość i balans...",
    imageSrc: "/images/gabinet/specjalisci/wiktoria_benroth.png",
    layout: "text-right",
    bullets: [
      "Masaż tkanek głębokich i uwalnianie punktów spustowych.",
      "Redukcja przewlekłego napięcia mięśniowego i stresu.",
      "Masaż sportowy i regeneracja po intensywnym wysiłku.",
    ],
    services: [
      {
        title: "Masaż Klasyczny",
        desc: "Płynny i spokojny zabieg mający na celu ogólne odprężenie organizmu. Redukuje poziom stresu, poprawia krążenie...",
        price: "110 zł",
        time: "45min",
      },
      {
        title: "Masaż Tkanek Głębokich",
        desc: "Wolna, precyzyjna praca skupiona na głębokich warstwach powięzi. Doskonały wybór w celu zniwelowania przewlekłego bólu...",
        price: "110 zł",
        time: "45min",
      },
      {
        title: "Masaż Sportowy",
        desc: "Intensywna forma masażu dedykowana osobom aktywnym fizycznie. Przyspiesza regenerację po wysiłku, zapobiega kontuzjom...",
        price: "130 zł",
        time: "45min",
      },
    ],
    ctaText: "Umów masaż u Wiktorii",
    ctaLink: "#",
  },

  // --- FIZJOTERAPIA ---
  {
    id: "piotr",
    category: "fizjoterapia",
    name: "Piotr Siemaszko",
    role: "Założyciel i główny fizjoterapeuta",
    description:
      "Jako założyciel Rehability, stawiam na leczenie, które sięga do prawdziwego źródła problemu, a nie tylko maskuje jego objawy. Od lat specjalizuję się w prowadzeniu najtrudniejszych przypadków ortopedycznych i przewlekłych stanów bólowych. Łączę nowoczesną diagnostykę z zaawansowaną pracą na tkankach, aby bezpiecznie i trwale przywrócić Ci swobodę ruchu.",
    imageSrc: "/images/gabinet/specjalisci/piotr_siemaszko.png",
    layout: "text-left",
    bullets: [
      "Kompleksowa terapia bólów kręgosłupa (rwa kulszowa, dyskopatia).",
      "Zaawansowana terapia manualna i uwalnianie powięziowe.",
      "Rehabilitacja pourazowa i pooperacyjna.",
    ],
    services: [
      {
        title: "Wizyta Fizjoterapeutyczna",
        desc: "Szczegółowy wywiad, ocena stanu funkcjonalnego i indywidualnie dobrana terapia ukierunkowana na szybkie i skuteczne zmniejszenie dolegliwości bólowych.",
        price: "170 zł",
        time: "45min",
      },
      {
        title: "Terapia manualna",
        desc: "Precyzyjna praca z tkankami i stawami (m.in. masaż tkanek głębokich, mobilizacje) mająca na celu redukcję napięć i przywrócenie pełnej swobody ruchu.",
        price: "170 zł",
        time: "45min",
      },
      {
        title: "Diagnostyka USG-RUSI",
        desc: "Nowoczesna, nieinwazyjna metoda obrazowania, która pozwala nam na precyzyjną ocenę pracy Twoich mięśni w czasie rzeczywistym podczas terapii.",
        price: "80 zł",
        time: "30min",
      },
    ],
    ctaText: "Umów wizytę u Piotra",
    ctaLink: "#",
  },
  {
    id: "paulina",
    category: "fizjoterapia",
    name: "Paulina Adamska",
    role: "Fizjoterapeutka",
    description:
      "W mojej praktyce łączę twardą wiedzę z zakresu biomechaniki z ogromną uważnością na sygnały, które wysyła Twoje ciało. Zależy mi na tym, byś podczas sesji czuł się w pełni bezpiecznie, a każdy etap leczenia był dla Ciebie jasny. Skupiam się na przywracaniu prawidłowych wzorców ruchowych, aby efekty naszej wspólnej pracy były nie tylko szybkie, ale przede wszystkim długotrwałe.",
    imageSrc: "/images/gabinet/specjalisci/paulina_adamska.png",
    layout: "text-right",
    bullets: [
      "Fizjoterapia ortopedyczna i leczenie przeciążeń narządu ruchu.",
      "Korekcja wad postawy i bezpieczna reedukacja ruchowa.",
      "Zapobieganie kontuzjom i bezpieczny powrót do sportu.",
    ],
    services: [
      {
        title: "Wizyta Fizjoterapeutyczna",
        desc: "Szczegółowy wywiad, ocena stanu funkcjonalnego i indywidualnie dobrana terapia łącząca m.in. terapię manualną i ćwiczenia lecznicze, by skutecznie zredukować ból.",
        price: "150 zł",
        time: "60min",
      },
      {
        title: "Wizyta Domowa",
        desc: "Pełnowymiarowa usługa terapeutyczna realizowana w komforcie Twojego domu. Bezpieczne rozwiązanie dla pacjentów, którzy z powodu ostrego bólu mają trudności z dojazdem.",
        price: "170 zł",
        time: "45min",
      },
      {
        title: "Masaż Tkanek Głębokich",
        desc: "Precyzyjna praca na głębokich warstwach mięśni i powięzi. Skutecznie rozluźnia przewlekle napięcia, uwalnia punkty spustowe i poprawia ogólną ruchomość stawów.",
        price: "110 zł",
        time: "25min",
      },
    ],
    ctaText: "Umów wizytę u Pauliny",
    ctaLink: "#",
  },
];

export function SpecjalisciSection({ activeTab }: SpecjalisciProps) {
  // Filtrujemy specjalistów na podstawie wybranej zakładki (activeTab)
  const filteredSpecialists = SPECIALISTS.filter(
    (spec) => spec.category === activeTab,
  );

  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 ">
      <h2 className="font-jakarta font-bold text-[64px] max-[1024px]:text-[48px] max-[768px]:text-[40px] text-[#0B3B4C] text-center mb-24 max-[1024px]:mb-16">
        Specjaliści
      </h2>

      <div className="flex flex-col gap-32 max-[1024px]:gap-24">
        {filteredSpecialists.map((spec) => {
          const isTextLeft = spec.layout === "text-left";

          return (
            <div
              key={spec.id}
              className="flex flex-col w-full max-w-[1200px] mx-auto transition-opacity duration-500"
            >
              {/* TOP: Zdjęcie, Tekst i Punktory */}
              <div className="flex flex-row max-[1024px]:flex-col items-center gap-12 max-[1024px]:gap-10">
                <div
                  className={`flex-1 flex flex-col max-[1024px]:text-center max-[1024px]:items-center ${isTextLeft ? "order-1 max-[1024px]:order-2" : "order-3 max-[1024px]:order-2"}`}
                >
                  <h3 className="font-jakarta font-semibold text-[40px] max-[768px]:text-[32px] text-[#287D88] leading-tight">
                    {spec.name}
                  </h3>
                  <p className="font-montserrat font-medium text-[20px] max-[768px]:text-[18px] text-[#0B3B4C] mt-2 mb-6">
                    {spec.role}
                  </p>
                  <p className="font-montserrat font-normal text-[15px] text-[#0B3B4C]/80 leading-[170%]">
                    {spec.description}
                  </p>
                </div>

                {/* ZDJĘCIE */}
                <div className="order-2 max-[1024px]:order-1 shrink-0 flex justify-center">
                  <Image
                    src={spec.imageSrc}
                    width={350}
                    height={400}
                    className="w-[350px] max-[768px]:w-[280px] h-auto object-contain"
                    alt={spec.name}
                  />
                </div>

                {/* PUNKTORY */}
                <div
                  className={`flex-1 flex flex-col gap-4 ${isTextLeft ? "order-3 max-[1024px]:order-3" : "order-1 max-[1024px]:order-3"}`}
                >
                  {spec.bullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="bg-[#287D88] text-white rounded-[20px] p-5 max-[768px]:p-4 flex items-start gap-4 shadow-md"
                    >
                      <SealCheckIcon
                        size={21}
                        weight="fill"
                        className="text-white shrink-0 mt-0.5"
                      />
                      <p className="font-montserrat font-normal text-[14px] leading-[150%]">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM: Karty Usług */}
              <div className="flex flex-row max-[1024px]:flex-col justify-center max-[1024px]:items-center gap-6 mt-16 max-[1024px]:mt-12 items-stretch">
                {spec.services.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[280px] max-w-[640px]   bg-[#ECF6F6] rounded-[28px] overflow-hidden flex flex-col shadow-sm border border-[#287D88]/5 relative group cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <div className="p-8 max-[768px]:p-6 flex-grow flex flex-col">
                      <h4 className="font-jakarta font-semibold text-[20px] text-[#0B3B4C] mb-4 leading-tight">
                        {service.title}
                      </h4>
                      <p className="font-montserrat font-light text-[13px] text-[#0B3B4C]/70 leading-[170%]">
                        {service.desc}
                      </p>
                    </div>
                    <div className="px-8 max-[768px]:px-6 pb-8 max-[768px]:pb-6 mt-auto">
                      <div className="bg-[#287D88] rounded-full pl-6 pr-3 py-1 flex justify-between items-center text-white transition-colors group-hover:bg-[#1f666f] rounded-tr-none">
                        <div className="flex items-center gap-1">
                          <span className="font-jakarta font-bold text-[16px]">
                            {service.price}
                          </span>
                          <span className="text-white/40 text-[14px]">|</span>
                          <span className="font-montserrat font-light text-[13px]">
                            {service.time}
                          </span>
                        </div>
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                          <ArrowRight
                            size={16}
                            weight="bold"
                            className="text-[#287D88]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* BOTTOM: Przycisk CTA Zarezerwuj sesję z idealnym kształtem z projektu */}
              <div className="mt-12 flex justify-center">
                <Button showArrow>{spec.ctaText}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
