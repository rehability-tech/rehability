"use client";

import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import useEmblaCarousel from "embla-carousel-react";
import { Tag } from "../ui/Tag";

export function AboutSection() {
  const TEAM_MEMBERS = [
    {
      name: "Piotr Siemaszko",
      role: "Główny Fizjoterapeuta",
      image: "/images/about/piotr_siemaszko.png",
    },
    {
      name: "Natalia Głód",
      role: "Terapeutka Kobido",
      image: "/images/about/natalia_glod.png",
    },
    {
      name: "Paulina Adamska",
      role: "Fizjoterapeutka",
      image: "/images/about/paulina_adamska.png",
    },
    {
      name: "Wiktoria Benroth",
      role: "Technik Masażysta",
      image: "/images/about/wiktoria_benroth.png",
    },
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  // Dodane stany do obsługi kropek (paginacji)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const castOnInit = () => {
      onInit();
    };
    castOnInit();
    const castSelect = () => {
      onSelect();
    };
    castSelect();

    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  return (
    <section className="relative overflow-hidden py-24 max-[1024px]:py-16">
      <div className="container relative z-10 mx-auto px-4 max-[1024px]:px-6">
        {/* === GÓRNA CZĘŚĆ (TEKSTY) === */}
        <div className="grid grid-cols-12 gap-8 lg:gap-12 mb-10 max-[1024px]:grid-cols-1 max-[640px]:text-center">
          <div className="col-span-5 flex flex-col items-start max-[640px]:items-center max-[640px]:col-span-7 max-[640px]:self-center w-full justify-self-center">
            <Tag label="o nas" />
            <h2 className="typography-subheading font-semibold text-brand-secondary max-[1024px]:text-[36px] leading-[120%]">
              Nowoczesne podejście <br className="hidden lg:block" />
              <span className="text-brand-primary">do twojego zdrowia</span>
            </h2>
          </div>

          <div className="col-span-7 grid grid-cols-2 gap-8 max-[640px]:grid-cols-1 mt-2 lg:mt-12">
            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px]">
              W Rehability nasza fizjoterapia to więcej niż ulga w bólu.
              Stosujemy nowoczesną terapię manualną, przywracając Ci pełną
              sprawność.
            </p>
            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px]">
              Zapewniamy indywidualne podejście. Precyzyjnie diagnozujemy źródło
              problemu i tworzymy spersonalizowany plan rehabilitacji, idealnie
              dopasowany do Twojego stylu życia.
            </p>
          </div>
        </div>

        {/* === ŚRODKOWA CZĘŚĆ (ZDJĘCIA) === */}
        <div className="relative w-full max-w-[800px] mx-auto flex max-[640px]:flex-col max-[640px]:items-center sm:justify-end sm:items-end h-auto sm:h-[350px] lg:h-[420px]">
          <div className="relative w-full max-[640px]:h-[260px] sm:w-[85%] lg:w-[80%] sm:h-[85%] lg:h-[90%] rounded-[32px] overflow-hidden shadow-sm">
            <Image
              src="/images/about/szlolenie_dla_fizjoterapeutów.jpg"
              fill
              alt="Szkolenie dla fizjoterapeutów"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 80vw"
            />
          </div>

          <div
            className="
            z-10 overflow-hidden rounded-[32px] border-[#F4F8FA] shadow-lg
            max-[640px]:relative max-[640px]:w-[85%] max-[640px]:h-[220px] max-[640px]:-mt-12 max-[640px]:border-[8px]
            sm:absolute sm:left-0 sm:top-[55%] sm:-translate-y-1/2 sm:w-[55%] sm:h-[60%] lg:h-[65%] sm:border-[12px]
          "
          >
            <Image
              src="/images/about/gabinet_fizjoterapii.jpg"
              fill
              alt="Gabinet fizjoterapii"
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 40vw"
            />
          </div>
        </div>

        {/* === ZESPÓŁ (EMBLA CAROUSEL) === */}
        <div className="mt-8 pt-20">
          <div className="max-w-[600px] mb-12 max-[640px]:mx-auto max-[640px]:text-center max-[640px]:flex max-[640px]:flex-col max-[640px]:items-center">
            <h2 className="typography-heading-sec font-semibold text-brand-secondary text-[36px] mb-4">
              <span className="text-brand-primary">Poznaj</span> nasz zespół
            </h2>
            <p className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[15px]">
              W Rehability nasza fizjoterapia to więcej niż ulga w bólu.
              Stosujemy nowoczesną terapię manualną, przywracając Ci pełną
              sprawność.
            </p>
          </div>

          <div className="w-full relative">
            {/* ZANIKAJĄCY BIAŁY GRADIENT */}
            <div
              className={`absolute -right-4 max-[1024px]:-right-6 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-l from-white from-20% via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-500 xl:hidden ${
                nextBtnEnabled ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="overflow-hidden" ref={emblaRef}>
              {/* ZMIANA: ml dostosowane dla breakpointu 850px */}
              <div className="flex touch-pan-y -ml-4 min-[850px]:-ml-[62px]">
                {TEAM_MEMBERS.map((member, index) => (
                  <div
                    key={index}
                    // ZMIANA: Wymuszenie w-full poniżej 850px, aby pokazywało 1 kartę na raz. Powyżej: stara logika zachowana.
                    className="flex-none min-w-0 pl-4 w-full min-[850px]:pl-[62px] min-[850px]:w-[calc(335px+62px)] flex justify-center"
                  >
                    <div className="w-full max-w-[335px] h-[415px] relative bg-[#C1DCDF] rounded-[24px] overflow-hidden flex flex-col items-center justify-end pb-6 shadow-sm">
                      <div className="absolute z-0 h-[500px] w-[500px] bottom-[-130px] right-[-100px] pointer-events-none">
                        <Image
                          src="/images/about/tło_karty.svg"
                          fill
                          alt="Wzór tła"
                          className="object-contain object-bottom opacity-80"
                        />
                      </div>

                      <div className="absolute bottom-0 left-0 w-full h-[380px] z-10 pointer-events-none">
                        <Image
                          src={member.image}
                          fill
                          alt={member.name}
                          className="object-contain object-bottom"
                          sizes="(max-width: 850px) 100vw, 335px"
                        />
                      </div>

                      <div className="relative z-20 w-[85%] bg-white rounded-[16px] py-4 px-2 flex flex-col items-center justify-center shadow-md">
                        <span className="font-montserrat font-bold text-brand-secondary text-[20px] leading-tight mb-1 text-center">
                          {member.name}
                        </span>
                        <span className="font-montserrat font-medium text-[#287D88] text-[14px] text-center">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KONTROLKI / KROPKI I STRZAŁKI */}
          <div className="flex flex-col items-center gap-6 mt-10">
            {/* KROPKI */}
            <div className="flex items-center justify-center gap-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "w-8 bg-brand-primary"
                      : "w-2.5 bg-brand-primary/20 hover:bg-brand-primary/40"
                  }`}
                  aria-label={`Przejdź do osoby ${index + 1}`}
                />
              ))}
            </div>

            {/* STRZAŁKI */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2
                  ${prevBtnEnabled ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                `}
                aria-label="Przewiń w lewo"
              >
                <ArrowLeft size={24} weight="regular" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2
                  ${nextBtnEnabled ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                `}
                aria-label="Przewiń w prawo"
              >
                <ArrowRight size={24} weight="regular" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
