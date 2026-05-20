"use client";

import React, { useState } from "react";
import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";

// === DANE FAQ ===
const FAQ_DATA = [
  {
    question: "Jak powinienem przygotować się do pierwszej wizyty w gabinecie?",
    answer:
      "Zależy nam, abyś podczas wizyty czuł się maksymalnie komfortowo. Prosimy o zabranie ze sobą wygodnego, luźnego stroju (np. dres lub spodenki sportowe i koszulka), który nie krępuje ruchów i ułatwi nam przeprowadzenie pełnej diagnostyki.",
  },
  {
    question:
      "Czy do rozpoczęcia terapii manualnej potrzebuję skierowania lub rezonansu (MRI)?",
    answer:
      "Nie, skierowanie od lekarza ani rezonans magnetyczny nie są wymagane do rozpoczęcia terapii w naszym gabinecie. Podczas pierwszej wizyty przeprowadzimy szczegółowy wywiad i badanie fizykalne. Jeśli uznamy, że konieczna jest dodatkowa diagnostyka obrazowa, poinformujemy Cię o tym.",
  },
  {
    question:
      "Ile trwa standardowa sesja terapeutyczna i jak często muszę ją powtarzać?",
    answer:
      "Standardowa wizyta trwa u nas od 45 do 60 minut. Częstotliwość spotkań jest ustalana indywidualnie po pierwszej wizycie, w zależności od Twojego stanu zdrowia, przewlekłości problemu oraz celów terapeutycznych.",
  },
  {
    question:
      "Jak długo mam dostęp do zakupionych materiałów na platformie VOD?",
    answer:
      "Dostęp do wszystkich wykupionych szkoleń i materiałów wideo na naszej platformie VOD otrzymujesz na zawsze (dożywotnio). Możesz wracać do lekcji w dowolnym momencie, z każdego urządzenia.",
  },
  {
    question:
      "Dla kogo przeznaczone są Campy Wellness? Czy muszę być w świetnej formie fizycznej, żeby wziąć w nich udział?",
    answer:
      "Nasze wyjazdy są dla każdego! Nie musisz być w szczytowej formie. Program jest dostosowany tak, aby zarówno osoby bardzo aktywne, jak i te, które dopiero zaczynają swoją drogę ze świadomym ruchem, czuły się bezpiecznie i komfortowo.",
  },
];

// === DEFINICJE ANIMACJI ===
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <section className="overflow-hidden">
      <motion.div
        className="container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* === NAGŁÓWEK === */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col items-center text-center mb-16"
        >
          <h2 className="typography-subheading font-semibold text-brand-secondary text-[36px] md:text-[48px] leading-[120%]">
            Najczęściej zadawane{" "}
            <span className="text-brand-primary">pytania</span>
          </h2>
        </motion.div>

        {/* === LISTA FAQ === */}
        <div className="w-full max-w-[900px] flex flex-col">
          {FAQ_DATA.map((faq, index) => {
            const isOpen = openIndex === index;
            const formattedNumber = String(index + 1).padStart(2, "0");

            return (
              <motion.div
                key={index}
                variants={fadeUpVariants}
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
                  <button
                    className="min-[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out"
                    aria-label={isOpen ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
                  >
                    <div
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    >
                      {isOpen ? (
                        <Minus size={18} weight="bold" />
                      ) : (
                        <Plus size={18} weight="bold" />
                      )}
                    </div>
                  </button>
                </div>

                {/* 2. TREŚĆ */}
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
                      <p className="font-montserrat text-brand-secondary/80 text-[14px] md:text-[15px] leading-[170%]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. PRZYCISK DESKTOP */}
                <button
                  className="hidden min-[600px]:flex w-10 h-10 self-center shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out mt-1"
                  aria-label={isOpen ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
                >
                  <div
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                  >
                    {isOpen ? (
                      <Minus size={18} weight="bold" />
                    ) : (
                      <Plus size={18} weight="bold" />
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
