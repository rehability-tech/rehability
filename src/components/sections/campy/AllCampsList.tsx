"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CalendarBlank,
  MapPin,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";

// === ROZBUDOWANE MOCK DATA ===
const CAMPS_DATA = [
  {
    id: 1,
    date: "28-31.05.2026",
    title: "Między nami Kobietami (Edycja Majowa)",
    location: "Holiday Sky Park",
    price: "od 499 zł / os.",
    image: "/images/gabinet/hero/gabinet_1.jpg",
  },
  {
    id: 2,
    date: "12-15.06.2026",
    title: "Reset dla Ciała i Umysłu",
    location: "Holiday Sky Park",
    price: "od 499 zł / os.",
    image: "/images/gabinet/hero/gabinet_2.jpg",
  },
  {
    id: 3,
    date: "05-08.07.2026",
    title: "Świadomy Ruch i Powięź",
    location: "Góry Stołowe",
    price: "od 549 zł / os.",
    image: "/images/gabinet/hero/gabinet_3.jpg",
  },
  {
    id: 4,
    date: "20-23.08.2026",
    title: "Zdrowy Kręgosłup - Warsztaty",
    location: "Dolina Mocy",
    price: "od 499 zł / os.",
    image: "/images/gabinet/hero/gabinet_4.jpg",
  },
  {
    id: 5,
    date: "10-13.09.2026",
    title: "Jesienny Detoks z Jogą",
    location: "Holiday Sky Park",
    price: "od 599 zł / os.",
    image: "/images/gabinet/hero/gabinet_1.jpg",
  },
  {
    id: 6,
    date: "01-04.10.2026",
    title: "Męski Wypad: Siła i Mobilność",
    location: "Tatry",
    price: "od 649 zł / os.",
    image: "/images/gabinet/hero/gabinet_2.jpg",
  },
];

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const ITEMS_PER_PAGE = 4;

export function AllCampsList() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(CAMPS_DATA.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCamps = CAMPS_DATA.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 py-16">
      <div className="flex flex-col items-center mb-12">
        <h2 className="font-jakarta font-semibold text-[36px] md:text-[42px] text-[#0B3B4C]">
          Wszystkie <span className="text-[#287D88]">campy</span>
        </h2>
      </div>

      <motion.div
        key={currentPage}
        className="flex flex-col gap-24 min-[1090px]:gap-10 max-w-full px-3 mx-auto items-center"
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {currentCamps.map((camp) => (
          <motion.div
            key={camp.id}
            variants={cardVariants}
            // KLUCZOWE ZMIANY TUTAJ:
            // 1. Zmiana layoutu po 1090px (min-[1090px]:flex-row, inaczej flex-col)
            // 2. Wyrównanie items-stretch na desktopie rozciąga zdjęcie i kontent do równej wysokości
            className="flex flex-col min-[1090px]:flex-row max-[1090px]:max-w-[750px] items-stretch gap-3  w-full group  max-[1090px]:gap-0"
          >
            {/* ZDJĘCIE KARTY (ODDZIELNE) */}
            {/* Zmiana: Wysokość auto na desktopie, sztywna wysokość tylko na mobile */}
            <div className="relative w-full min-[1090px]:w-[320px] h-[260px] min-[1090px]:h-auto rounded-[24px] overflow-hidden shrink-0 shadow-sm max-[1090px]:w-[90%] max-[1090px]:self-center">
              <Image
                src={camp.image}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                alt={camp.title}
              />
            </div>

            {/* BLOK Z KONTENTEM */}
            <div className="flex flex-col md:flex-row justify-between flex-1 p-6 md:p-8 bg-white border border-[#287D88]/20 rounded-[26px] shadow-sm gap-6 md:gap-8 hover:shadow-md transition-shadow max-[1090px]:-mt-12 min-[1090px]:gap-0  max-[1090px]:!pt-18">
              {/* LEWY KONTENER */}
              <div className="flex flex-col items-start gap-4 flex-1 max-[530px]:items-center">
                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1 rounded-full">
                  <CalendarBlank size={16} />
                  <span>{camp.date}</span>
                </div>

                <div className="max-[530px]:text-center">
                  <h3 className="font-jakarta font-bold text-[24px] text-[#0B3B4C] mb-3">
                    {camp.title}
                  </h3>
                  <p className="font-montserrat text-[14px] text-gray-500 max-w-[95%] leading-[160%] max-[768px]:w-full">
                    Szczegółowy wywiad, ocena stanu funkcjonalnego i
                    indywidualnie dobrana terapia ukierunkowana na szybkie i
                    skuteczne zmniejszenie dolegliwości bólowych.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-gray-500 font-montserrat text-[13px] border border-gray-200 w-fit px-3 py-1.5 rounded-full mt-auto">
                  <MapPin size={16} />
                  <span>{camp.location}</span>
                </div>
              </div>

              {/* PRAWY KONTENER */}
              <div className="flex flex-col justify-between items-end md:items-end max-[768px]:items-start shrink-0 max-[768px]:gap-6 py-2 max-[768px]:flex-row max-[530px]:flex-col max-[530px]:items-center">
                <span className="font-jakarta font-bold text-[24px] text-[#0B3B4C] block text-right max-[768px]:text-left">
                  {camp.price}
                </span>
                <Button showArrow>Poznaj szczegóły</Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* === PAGINACJA === */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-20">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#287D88] text-white hover:bg-[#1f666f] shadow-md"
            }`}
          >
            <ArrowRight size={16} weight="bold" className="rotate-180" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageClick(pageNumber)}
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
            disabled={currentPage === totalPages}
            className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-colors ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#287D88] text-white hover:bg-[#1f666f] shadow-md"
            }`}
          >
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
