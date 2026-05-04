import Image from "next/image";
import Link from "next/link"; // Przydatne do przycisków
import { Button } from "../ui/Button";

// === DANE SEKCJI ===
// Trzymanie danych w tablicy ułatwia zarządzanie i pozwala na zgrabne renderowanie
const SERVICES = [
  {
    title: "Fizjoterapia i Rehabilitacja",
    image: "/images/services/fizjoterapia.jpg",
    bullets: [
      "Kompleksowa diagnostyka i leczenie ostrego oraz przewlekłego bólu.",
      "Indywidualny plan powrotu do pełnej sprawności na co dzień i w sporcie.",
      "Zastosowanie nowoczesnych metod, w tym osteopatii i treningu medycznego.",
    ],
    buttonText: "Umów wizytę",
    buttonLink: "#",
  },
  {
    title: "Masaże i Terapia Manualna",
    image: "/images/services/masaże.jpg", // Uwaga na polskie znaki w nazwach plików, serwery czasami ich nie lubią! Warto zmienić na masaze.jpg
    bullets: [
      "Głęboki relaks i skuteczne uwalnianie skumulowanych napięć mięśniowych.",
      "Przyspieszona regeneracja organizmu po urazach i przeciążeniach.",
      "Holistyczne podejście do ciała, poprawiające ogólne samopoczucie.",
    ],
    buttonText: "Sprawdź ofertę zabiegów",
    buttonLink: "#",
  },
  {
    title: "Szkolenia VOD",
    image: "/images/services/platforma_vod.jpg",
    bullets: [
      "Praktyczna wiedza diagnostyczna gotowa do natychmiastowego wdrożenia w gabinecie.",
      "Autorskie materiały wideo z nielimitowanym dostępem 24/7 z dowolnego miejsca.",
      "Nowoczesne techniki terapii tłumaczone krok po kroku przez ekspertów",
    ],
    buttonText: "Poznaj platformę VOD",
    buttonLink: "#",
  },
  {
    title: "Campy",
    image: "/images/services/campy.jpg",
    bullets: [
      "100% praktyki i intensywny trening zaawansowanych technik manualnych.",
      "Kameralne grupy pracujące pod bezpośrednim nadzorem doświadczonych praktyków.",
      "Budowanie wartościowych relacji i wymiana branżowych doświadczeń.",
    ],
    buttonText: "Zobacz nadchodzące terminy",
    buttonLink: "#",
  },
];

export function ServicesSection() {
  return (
    <section className=" overflow-hidden">
      {/* Kontener ograniczony do 900px zgodnie z prośbą */}
      <div className="container ">
        {/* Lista usług */}
        <div className="flex flex-col gap-16 md:gap-24 w-full max-[768px]:!gap-38">
          {SERVICES.map((service, index) => {
            // === LOGIKA ŚCIĘTYCH NAROŻNIKÓW ===

            const alignClass =
              index === 0
                ? "self-start"
                : index === 1
                  ? "self-end"
                  : index === 2
                    ? "self-end"
                    : "self-start";
            const imageRadiusClass =
              index === 0
                ? "rounded-[150px] rounded-br-none"
                : index === 1
                  ? "rounded-[150px] rounded-tl-none"
                  : index === 2
                    ? "rounded-[150px] rounded-bl-none"
                    : "rounded-[150px] rounded-tr-none";

            return (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 max-w-[900px] ${alignClass} max-[768px]:!self-center `}
              >
                {/* === ZDJĘCIE === */}
                <div
                  // Zablokowane wymiary 300x289 zgodnie z Figmą
                  className={`relative shrink-0 w-[260px] h-[250px] md:w-[300px] md:h-[289px] overflow-hidden shadow-sm ${imageRadiusClass}`}
                >
                  <Image
                    src={service.image}
                    fill
                    alt={service.title}
                    className="object-cover"
                    sizes="(max-width: 768px) 260px, 300px"
                  />
                </div>

                {/* === TEKSTY I LISTA === */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left mt-4 md:mt-0">
                  {/* Tytuł Usługi */}
                  <h3 className="font-montserrat font-semibold text-[26px] md:text-[28px] text-brand-primary mb-5">
                    {service.title}
                  </h3>

                  {/* Punkty (Bullets) */}
                  <ul className="flex flex-col gap-3 mb-8 max-[768px]:max-w-[400px]">
                    {service.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        // ZMIANA: Zmiana z 'flex items-start' na blokowy tekst na mobile, żeby wycentrowanie zadziałało
                        className="text-left max-[768px]:text-center md:flex md:items-start md:gap-3"
                      >
                        {/* ZMIANA: Ukrycie kropki poniżej 768px za pomocą max-[768px]:hidden */}
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40 shrink-0 mt-2 max-[768px]:hidden" />
                        <span className="typography-paragraph text-brand-secondary/80 leading-[170%] text-[14px] md:text-[15px] block">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Przycisk */}
                  <Button>{service.buttonText}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
