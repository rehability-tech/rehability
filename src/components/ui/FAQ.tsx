"use client";

import React, { useState } from "react";
import parse from "html-react-parser";
import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";

// === INTERFEJSY PROPSÓW ===
export interface FAQItemData {
  question: string;
  answer: string;
}

interface FAQProps {
  titlePrefix: string;
  titleHighlight: string;
  items: FAQItemData[];
  // Tryb kontrolowany (opcjonalny) — rodzic może wymusić otwarte pytanie,
  // np. po wejściu z deep-linku „/gabinet#faq-wizyta".
  openIndex?: number | null;
  onToggle?: (index: number) => void;
}

// === REUŻYWALNY KOMPONENT FAQ ===
// Ten komponent zajmuje się tylko wyświetlaniem i logiką otwierania.
// Nie "wie" nic o konkretnych danych gabinetu.
export function FAQ({
  titlePrefix,
  titleHighlight,
  items,
  openIndex: controlledOpenIndex,
  onToggle,
}: FAQProps) {
  const [internalOpenIndex, setInternalOpenIndex] = useState<number | null>(0);
  const isControlled = controlledOpenIndex !== undefined;
  const openIndex = isControlled ? controlledOpenIndex : internalOpenIndex;

  const toggleFAQ = (index: number) => {
    if (isControlled) {
      onToggle?.(index);
    } else {
      setInternalOpenIndex((prevIndex) => (prevIndex === index ? null : index));
    }
  };

  const hasHeading = Boolean(titlePrefix || titleHighlight);

  return (
    <section className={`overflow-hidden ${hasHeading ? "mb-50 max-[1024px]:mb-72" : ""}`}>
      <div className="container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center">
        {hasHeading && (
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="typography-subheading font-semibold text-brand-secondary text-[36px] md:text-[48px] leading-[120%]">
              {titlePrefix}{" "}
              <span className="text-brand-primary">{titleHighlight}</span>
            </h2>
          </div>
        )}

        {/* === LISTA FAQ === */}
        <div className="w-full max-w-[900px] flex flex-col">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            const formattedNumber = String(index + 1).padStart(2, "0");

            return (
              <div
                key={index}
                onClick={() => toggleFAQ(index)}
                className={`flex flex-col min-[600px]:flex-row min-[600px]:items-start gap-4 min-[600px]:gap-10 py-6 md:py-10 cursor-pointer border-b border-brand-secondary/20 group transition-colors ${
                  index === 0 ? "border-t" : ""
                }`}
              >
                {/* 1. GÓRNY PASEK NA MOBILE / LEWA KOLUMNA NA DESKTOP */}
                <div className="flex justify-between items-center w-full min-[600px]:w-auto">
                  <div className="font-jakarta font-bold text-[40px] min-[600px]:text-[48px] min-[600px]:self-center leading-none text-[#0B3B4C] min-[600px]:mt-1">
                    {formattedNumber}
                  </div>

                  {/* PRZYCISK MOBILE (widoczny tylko poniżej 600px) */}
                  <button
                    className="min-[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out"
                    aria-label={isOpen ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
                  >
                    <div
                      className={`transition-transform duration-300 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      {isOpen ? (
                        <Minus size={18} weight="bold" />
                      ) : (
                        <Plus size={18} weight="bold" />
                      )}
                    </div>
                  </button>
                </div>

                {/* 2. TREŚĆ (Pytanie + Odpowiedź) */}
                <div className="flex-1 flex flex-col w-full">
                  <h3
                    className={`font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] transition-colors duration-300 ${
                      isOpen
                        ? "text-brand-primary"
                        : "text-brand-secondary group-hover:text-brand-primary"
                    }`}
                  >
                    {faq.question}
                  </h3>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 mt-4"
                        : "grid-rows-[0fr] opacity-0 mt-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-montserrat text-brand-secondary/80 text-[14px] md:text-[15px] leading-[170%] [&_p]:m-0 [&_p+p]:mt-3 [&_strong]:font-semibold [&_a]:text-brand-primary [&_a]:underline">
                        {parse(faq.answer || "")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PRZYCISK DESKTOP (widoczny tylko powyżej 600px) */}
                <button
                  className="hidden min-[600px]:flex w-10 h-10 self-center shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out mt-1"
                  aria-label={isOpen ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
                >
                  <div
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    {isOpen ? (
                      <Minus size={18} weight="bold" />
                    ) : (
                      <Plus size={18} weight="bold" />
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
