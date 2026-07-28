"use client";

import React, { useState } from "react";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";
import TripCard from "./TripCard"; // <--- Import naszego nowego komponentu

// --- ANIMACJE ---
const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const ITEMS_PER_PAGE = 4; // Nasz limit na stronę

// --- INTERFEJSY PROPSÓW ---
interface AllTripsListProps {
  initialTrips: any[];
  totalCount: number;
}

export function AllTripsList({ initialTrips, totalCount }: AllTripsListProps) {
  // Stany przechowujące aktualną stronę i listę wydarzeń do wyświetlenia
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTrips, setCurrentCamps] = useState<any[]>(initialTrips);
  const [isLoading, setIsLoading] = useState(false);

  // Obliczenia paginacji
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Funkcja wywoływana przy kliknięciu w dowolną nawigację paginacji
  const fetchPage = async (pageNumber: number) => {
    setIsLoading(true);
    setCurrentPage(pageNumber);

    try {
      const res = await fetch(
        `/api/public/wydarzenia?page=${pageNumber}&limit=${ITEMS_PER_PAGE}`,
      );
      if (!res.ok) throw new Error("Błąd pobierania");
      const data = await res.json();

      setCurrentCamps(data.trips || []);

      // Delikatny scroll do góry listingu po zmianie strony
      const headingElement = document.getElementById("all-trips-heading");
      if (headingElement) {
        headingElement.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Wystąpił błąd podczas zmiany strony", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) fetchPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) fetchPage(currentPage + 1);
  };

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== currentPage) fetchPage(pageNumber);
  };

  // Jeśli nie ma żadnych wydarzeń w bazie
  if (!currentTrips || currentTrips.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="font-jakarta font-semibold text-[32px] text-[#0B3B4C] mb-4">
          Wkrótce nowe wydarzenia
        </h2>
        <p className="text-gray-500 font-montserrat">
          Pracujemy nad kolejnymi niesamowitymi wydarzenieami. Zaglądaj tu regularnie!
        </p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 py-16">
      <div className="flex flex-col items-center mb-12">
        <h2
          id="all-trips-heading"
          className="font-jakarta font-semibold text-[36px] md:text-[42px] text-[#0B3B4C]"
        >
          Wszystkie <span className="text-[#287D88]">wydarzenia</span>
        </h2>
      </div>

      <div className="relative min-h-[400px]">
        {/* Nakładka ładowania przy zmienianiu strony */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex justify-center items-start pt-20 rounded-3xl">
            <CircleNotch
              size={48}
              weight="bold"
              className="text-brand-primary animate-spin"
            />
          </div>
        )}

        <motion.div
          key={currentPage} // Powoduje zresetowanie animacji Framer Motion przy zmianie strony
          className="flex flex-col gap-24 min-[1090px]:gap-10 max-w-full px-3 mx-auto items-center"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {currentTrips.map((trip) => (
            /* WSTRZYKNIĘTY NOWY KOMPONENT KARTY */
            <TripCard key={trip.id} trip={trip} variants={cardVariants} />
          ))}
        </motion.div>
      </div>

      {/* === PAGINACJA === */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-20">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#287D88] text-white hover:bg-[#1f666f] shadow-md cursor-pointer"
            }`}
          >
            <ArrowRight size={16} weight="bold" className="rotate-180" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageClick(pageNumber)}
                disabled={isLoading}
                className={`w-10 h-10 rounded-full cursor-pointer font-montserrat font-medium text-[15px] transition-all ${
                  currentPage === pageNumber
                    ? "bg-[#287D88] text-white font-semibold shadow-md scale-105"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#287D88] text-white hover:bg-[#1f666f] shadow-md cursor-pointer"
            }`}
          >
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
