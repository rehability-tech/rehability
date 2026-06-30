"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_LINK_CLASS =
  "font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors";

// Link do sekcji na /gabinet. Gdy jesteśmy już na /gabinet, zwykła nawigacja
// do tego samego hasha nic nie robi (brak hashchange), więc wysyłamy zdarzenie
// `gabinet:goto` — GabinetServices zawsze wtedy przewinie/otworzy daną sekcję.
function GabinetAnchorLink({
  hash,
  children,
}: {
  hash: string;
  children: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/gabinet"
    ) {
      e.preventDefault();
      window.history.replaceState(null, "", `/gabinet#${hash}`);
      window.dispatchEvent(new CustomEvent("gabinet:goto", { detail: hash }));
    }
  };
  return (
    <Link
      href={`/gabinet#${hash}`}
      onClick={handleClick}
      className={FOOTER_LINK_CLASS}
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const path = usePathname();
  const isExempt =
    path === "/gabinet" || path === "/w-budowie" || "/o-nas" || "/logowanie";

  return (
    <footer
      className={`w-full -mt-120 -z-10 max-[1078px]:-mt-70 overflow-x-clip ${isExempt && "!mt-0 z-20"} `}
    >
      {/* GŁÓWNY BLOK FOOTERA */}
      <div className="relative flex w-full max-w-[1440px] mx-auto min-h-[700px] max-[1078px]:min-h-[auto] pt-[300px] max-[1078px]:pt-32 pb-12 max-[1078px]:pb-8 px-20 max-[1078px]:px-10 max-[600px]:px-6 flex-col justify-end">
        {/* === TŁO SVG === */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full flex justify-center items-end z-0">
          <svg
            className={`w-full h-full min-w-[1400px] min-h-[600px] max-[1078px]:min-h-[900px] max-[599px]:min-h-[1200px] max-[450px]:min-h-[1400px] ${isExempt && "!h-[600px] max-[1078px]:!min-h-[750px] max-[599px]:!min-h-[1050px] max-[450px]:!min-h-[1300px]"} `}
            viewBox="0 0 1420 594"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M1419.85 545.62C1423 575.854 1374.54 591.713 1374.54 591.713C1374.54 591.713 85.594 596.01 42.797 589.712C0 583.413 0 551.289 0 551.289C0 551.289 43.4264 209.894 49.72 174.621C56.0137 139.348 86.8527 131.159 86.8527 131.159L1384.5 0.144088C1384.5 0.144088 1419.85 -3.35592 1419.85 24.1441C1419.85 51.6441 1416.71 515.386 1419.85 545.62Z"
              fill="#287D88"
            />
          </svg>
        </div>

        {/* === GŁÓWNA SIATKA (TREŚĆ) === */}
        <div className="relative z-10 grid grid-cols-12 gap-12 max-[1078px]:gap-10 max-[768px]:gap-8 mb-16 max-[1078px]:mb-12 mt-auto">
          {/* KOLUMNA 1: LOGO I OPIS */}
          <div className="col-span-5 max-[1078px]:col-span-12 flex flex-col items-start max-[1078px]:pr-0">
            <Link href="/" className="mb-6 max-[1078px]:mb-4 block">
              <Image
                src="/logotypy/logo-primary.svg"
                alt="Rehability Logo"
                width={197}
                height={59}
                className="brightness-0 invert w-auto h-[56px] max-[768px]:h-[48px]"
              />
            </Link>
            <p className="font-montserrat font-medium text-white/90 text-[15px] max-[1078px]:text-[14px] leading-[170%] max-w-[500px] max-[400px]:max-w-[320px]">
              Łączymy precyzyjną diagnostykę z holistyczną pracą z ciałem.
              Zaufaj ekspertom i odzyskaj pełną sprawność oraz życiową harmonię
              – w gabinecie, na platformie VOD i podczas naszych Wyjazdów.
            </p>
          </div>

          {/* KOLUMNA 2: Nasze Usługi */}
          <div className="col-span-2 max-[1078px]:col-span-4 max-[599px]:col-span-6 max-[450px]:col-span-12">
            <h4 className="font-jakarta font-bold text-white text-[18px] max-[768px]:text-[16px] mb-6 max-[768px]:mb-5">
              Nasze Usługi
            </h4>
            <ul className="flex flex-col gap-4 max-[768px]:gap-3">
              <li>
                <GabinetAnchorLink hash="fizjoterapia">
                  Terapia Manualna
                </GabinetAnchorLink>
              </li>
              <li>
                <GabinetAnchorLink hash="fizjoterapia">
                  Diagnostyka Funkcjonalna
                </GabinetAnchorLink>
              </li>
              <li>
                <GabinetAnchorLink hash="masaze">
                  Masaż i Relaks
                </GabinetAnchorLink>
              </li>
              <li>
                <Link
                  href="/kursy"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Platforma Kursów VOD
                </Link>
              </li>
              <li>
                <Link
                  href="/wyjazdy"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Wyjazdy Wellness
                </Link>
              </li>
            </ul>
          </div>

          {/* KOLUMNA 3: Strefa Pacjenta */}
          <div className="col-span-3 max-[1078px]:col-span-4 max-[599px]:col-span-6 max-[450px]:col-span-12">
            <h4 className="font-jakarta font-bold text-white text-[18px] max-[768px]:text-[16px] mb-6 max-[768px]:mb-5">
              Strefa Pacjenta
            </h4>
            <ul className="flex flex-col gap-4 max-[768px]:gap-3">
              <li>
                <GabinetAnchorLink hash="fizjoterapia">
                  Umów Wizytę
                </GabinetAnchorLink>
              </li>
              <li>
                <GabinetAnchorLink hash="fizjoterapia">
                  Cennik Gabinetu
                </GabinetAnchorLink>
              </li>
              <li>
                <GabinetAnchorLink hash="faq-wizyta">
                  Jak przygotować się do wizyty?
                </GabinetAnchorLink>
              </li>
              <li>
                <GabinetAnchorLink hash="faq">FAQ</GabinetAnchorLink>
              </li>
              <li>
                <a
                  href="mailto:biuro@kocikdev.com"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Pomoc techniczna (VOD)
                </a>
              </li>
            </ul>
          </div>

          {/* KOLUMNA 4: O Klinice */}
          {/* Usunąłem wymuszony whitespace-nowrap, aby poniżej 450px teksty miały prawo zawijać się naturalnie */}
          <div className="col-span-2 max-[1078px]:col-span-4 max-[599px]:col-span-12 max-[450px]:col-span-12 max-[599px]:mt-6 max-[450px]:mt-0">
            <h4 className="font-jakarta font-bold text-white text-[18px] max-[768px]:text-[16px] mb-6 max-[768px]:mb-5">
              O Klinice
            </h4>
            <ul className="flex flex-col gap-4 max-[768px]:gap-3">
              <li>
                <Link
                  href="/o-nas"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  O Rehability
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Baza Wiedzy
                </Link>
              </li>
              <li>
                <GabinetAnchorLink hash="kontakt">
                  Kontakt i Dojazd
                </GabinetAnchorLink>
              </li>
              <li>
                <Link
                  href="/regulamin"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Regulamin Świadczenia Usług
                </Link>
              </li>
              <li>
                <Link
                  href="/polityka-prywatnosci"
                  className="font-montserrat font-medium text-[13px] text-white/80 hover:text-white transition-colors"
                >
                  Polityka Prywatności
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* === LINIA ODDZIELAJĄCA === */}
        <div className="relative z-10 w-full h-[1px] bg-white/10 mb-6 max-[1078px]:hidden" />

        {/* === COPYRIGHT I AUTOR === */}
        <div className="relative z-10 flex flex-row max-[768px]:flex-col justify-between items-center gap-4 border-none max-[1078px]:border-t max-[1078px]:border-white/10 pt-0 max-[1078px]:pt-6">
          <p className="font-montserrat font-medium text-white/70 text-[13px] max-[1078px]:text-[12px] text-center">
            © {new Date().getFullYear()} Rehability. Wszelkie prawa zastrzeżone.
          </p>

          <a
            href="https://kocikdev.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-montserrat font-medium text-white/70 text-[13px] max-[1078px]:text-[12px] hover:text-white transition-colors group"
          >
            <Image
              src="/logotypy/kocikdev-logo.svg"
              alt="KocikDev Logo"
              width={30}
              height={20}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />
            Projekt i wykonanie | KocikDev
          </a>
        </div>
      </div>
    </footer>
  );
}
