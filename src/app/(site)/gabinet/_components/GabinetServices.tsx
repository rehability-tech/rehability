"use client";

import React, { useEffect, useRef, useState } from "react";
import { GabinetControls, ServiceTab } from "./ui/GabinetControls";
import { StrefaDynamiczna } from "./SferaDynamiczna";
import { SpecjalisciSection } from "./Specjaliści";
import { FAQ } from "@/components/ui/FAQ"; // Upewnij się, że ścieżka do komponentu FAQ jest poprawna
import { GabinetContact } from "./GabinetContact";

// === DANE FAQ DLA GABINETU ===
const GABINET_FAQ_DATA = [
  {
    question: "Jak przygotować się do pierwszej wizyty w gabinecie?",
    answer:
      "Na pierwszą wizytę warto zabrać ze sobą wygodny, niekrępujący ruchów strój (np. dres, legginsy lub spodenki sportowe i koszulkę). Jeśli posiadasz aktualną dokumentację medyczną (np. zdjęcia RTG, wyniki USG, rezonansu magnetycznego), prosimy o zabranie jej ze sobą – ułatwi nam to postawienie precyzyjnej diagnozy.",
  },
  {
    question: "Czy do rozpoczęcia terapii potrzebuję skierowania od lekarza?",
    answer:
      "Nie, skierowanie od lekarza nie jest wymagane do skorzystania z naszych usług fizjoterapeutycznych ani masaży. Nasi specjaliści przeprowadzą z Tobą dokładny wywiad oraz badanie funkcjonalne na miejscu, aby dobrać odpowiedni plan terapii.",
  },
  {
    question:
      "Ile zazwyczaj trwa pojedyncza sesja i ile zabiegów będę potrzebować?",
    answer:
      "Standardowa wizyta lub masaż trwa zazwyczaj od 45 do 60 minut. Ilość potrzebnych spotkań jest kwestią bardzo indywidualną. Zależy od rodzaju problemu, stopnia zaawansowania dolegliwości oraz celów, jakie chcemy osiągnąć. Szacunkowy plan terapii ustalimy wspólnie na pierwszej wizycie.",
  },
  {
    question: "Jakie formy płatności akceptujecie w gabinecie?",
    answer:
      "Zależy nam na Twojej wygodzie, dlatego w naszym gabinecie możesz zapłacić na kilka sposobów: gotówką, kartą płatniczą za pomocą terminala oraz systemem BLIK.",
  },
  {
    question:
      "Z jakim wyprzedzeniem muszę odwołać wizytę, by nie ponieść kosztów?",
    answer:
      "Szanujemy czas naszych pacjentów i specjalistów. Prosimy o informowanie nas o konieczności odwołania lub zmiany terminu wizyty z minimum 24-godzinnym wyprzedzeniem. Dzięki temu inny pacjent, który potrzebuje pilnej pomocy, będzie mógł skorzystać z tego czasu.",
  },
];

export default function GabinetServices() {
  const [activeTab, setActiveTab] = useState<ServiceTab>("masaze");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const topRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const specialistsRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) =>
    requestAnimationFrame(() =>
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );

  // Klik w kafelek wyboru (Fizjoterapia / Masaże) — ustawiamy zakładkę
  // i płynnie przewijamy w dół do specjalistów (tam są przyciski rezerwacji).
  const handleTileSelect = (tab: ServiceTab) => {
    setActiveTab(tab);
    scrollToRef(specialistsRef);
  };

  const toggleFaq = (index: number) =>
    setFaqOpenIndex((prev) => (prev === index ? null : index));

  // Obsługa deep-linków z kotwicami (ze stopki itp.):
  //   #fizjoterapia / #masaze → wybór zakładki + scroll do kafelków wyboru
  //   #faq                    → scroll do FAQ
  //   #faq-wizyta             → scroll do FAQ + otwarcie pytania „jak przygotować"
  //   #kontakt                → scroll do sekcji kontakt + mapa
  // Reagujemy na wejście z hashem (mount), zmianę hasha (hashchange) ORAZ na
  // zdarzenie `gabinet:goto` — to gwarantuje przewinięcie nawet gdy klikniemy
  // ten sam link będąc już na /gabinet (hash się nie zmienia → brak hashchange).
  useEffect(() => {
    const goTo = (target: string) => {
      if (target === "fizjoterapia" || target === "masaze") {
        setActiveTab(target);
        scrollToRef(topRef);
      } else if (target === "faq") {
        scrollToRef(faqRef);
      } else if (target === "faq-wizyta") {
        setFaqOpenIndex(0);
        scrollToRef(faqRef);
      } else if (target === "kontakt") {
        scrollToRef(contactRef);
      }
    };

    goTo(window.location.hash.replace("#", ""));

    const onHashChange = () => goTo(window.location.hash.replace("#", ""));
    const onGoto = (e: Event) => goTo((e as CustomEvent<string>).detail);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("gabinet:goto", onGoto);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("gabinet:goto", onGoto);
    };
  }, []);

  return (
    <div className="-mt-8" ref={topRef} style={{ scrollMarginTop: "120px" }}>
      <GabinetControls activeTab={activeTab} setActiveTab={handleTileSelect} />

      {/* Przekazujemy stan do obu sekcji, aby wiedziały co wyrenderować */}
      <StrefaDynamiczna activeTab={activeTab} />
      <div ref={specialistsRef} className="scroll-mt-28">
        <SpecjalisciSection activeTab={activeTab} />
      </div>

      {/* Reużywalny komponent FAQ (kontrolowany — by móc otworzyć konkretne pytanie) */}
      <div ref={faqRef} className="scroll-mt-28">
        <FAQ
          titlePrefix="Najczęściej zadawane"
          titleHighlight="pytania"
          items={GABINET_FAQ_DATA}
          openIndex={faqOpenIndex}
          onToggle={toggleFaq}
        />
      </div>
      <div ref={contactRef} className="scroll-mt-28">
        <GabinetContact />
      </div>
    </div>
  );
}
