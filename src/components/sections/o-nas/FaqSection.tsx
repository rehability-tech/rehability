"use client";

import { FAQ, FAQItemData } from "@/components/ui/FAQ";
import React from "react";

// 1. Zoptymalizowane pod SEO dane FAQ
const REHABILITY_FAQ_DATA: FAQItemData[] = [
  {
    question: "Jak przygotować się do pierwszej wizyty u fizjoterapeuty?",
    answer:
      "Na pierwszą wizytę w Rehability warto zabrać ze sobą dotychczasową dokumentację medyczną (np. wyniki badań RTG, rezonansu magnetycznego, USG) oraz wygodny, niekrępujący ruchów strój sportowy. Przed spotkaniem nie musisz wykonywać żadnych specjalistycznych przygotowań – przeprowadzimy dokładny wywiad i badanie funkcjonalne, aby znaleźć pierwotną przyczynę Twojego bólu.",
  },
  {
    question: "Czy potrzebuję skierowania na rehabilitację i terapię manualną?",
    answer:
      "Nie, w naszym gabinecie nie wymagamy skierowania od lekarza. Nasi specjaliści posiadają odpowiednie kwalifikacje do przeprowadzenia pełnej diagnostyki fizjoterapeutycznej i ułożenia skutecznego planu terapii manualnej oraz ruchowej od razu na pierwszej wizycie.",
  },
  {
    question: "Co odróżnia Rehability od standardowego gabinetu fizjoterapii?",
    answer:
      "Nie skupiamy się tylko na chwilowym ugaszeniu bólu. Tworzymy kompleksowy ekosystem powrotu do zdrowia. Poza zaawansowaną terapią w gabinecie, oferujemy autorską platformę VOD z programami ruchowymi do ćwiczeń w domu, profesjonalne masaże oraz wyjazdy holistyczne (Campy Wellness). Edukujemy Cię, abyś odzyskał pełną kontrolę nad własnym ciałem.",
  },
  {
    question: "Czy na platformie VOD znajdę ćwiczenia na ból kręgosłupa?",
    answer:
      "Tak! Nasza platforma VOD działa jak Twój wirtualny terapeuta. Znajdziesz tam precyzyjne, autorskie programy ruchowe dedykowane m.in. bólom kręgosłupa, obręczy barkowej czy stawów kolanowych. To idealne uzupełnienie terapii gabinetowej, pozwalające na bezpieczny i świadomy trening we własnym domu.",
  },
  {
    question: "Dla kogo przeznaczone są Campy Wellness i wyjazdy holistyczne?",
    answer:
      "Nasze Campy to ekskluzywne wyjazdy skierowane do osób, które potrzebują całkowitego resetu dla ciała i umysłu z dala od miejskiego zgiełku. Są idealne zarówno dla osób zmagających się z przewlekłym stresem i napięciami, jak i dla tych, którzy chcą połączyć aktywny, mądry ruch z głęboką odnową biologiczną w otoczeniu natury.",
  },
];

// 2. Komponent sekcji (Wrapper), który przekazuje dane do Twojego reużywalnego FAQ
export const FAQSection = () => {
  return (
    <div className="-mt-12">
      <FAQ
        titlePrefix="Najczęściej zadawane"
        titleHighlight="pytania"
        items={REHABILITY_FAQ_DATA}
      />
    </div>
  );
};
