"use client";

import React, { useState } from "react";
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

  return (
    <div className="-mt-8">
      <GabinetControls activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Przekazujemy stan do obu sekcji, aby wiedziały co wyrenderować */}
      <StrefaDynamiczna activeTab={activeTab} />
      <SpecjalisciSection activeTab={activeTab} />

      {/* Reużywalny komponent FAQ */}
      <FAQ
        titlePrefix="Najczęściej zadawane"
        titleHighlight="pytania"
        items={GABINET_FAQ_DATA}
      />
      <GabinetContact />
    </div>
  );
}
