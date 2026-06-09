"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FlowerLotus, CaretDown } from "@phosphor-icons/react";

function PricingItem({
  item,
  isOpen,
  onToggle,
}: {
  item: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasDescription = Boolean(item.description);

  return (
    <div
      role={hasDescription ? "button" : undefined}
      tabIndex={hasDescription ? 0 : undefined}
      aria-expanded={hasDescription ? isOpen : undefined}
      onClick={hasDescription ? onToggle : undefined}
      onKeyDown={
        hasDescription
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      className={`
        group/price relative flex flex-col @xl:flex-row overflow-hidden
        rounded-[28px] rounded-tr-none border bg-white
        transition-all duration-300 focus-visible:outline-none
        ${hasDescription ? "cursor-pointer" : ""}
        ${
          isOpen
            ? "border-[#287D88]/30 shadow-[0_12px_38px_rgba(40,125,136,0.16)]"
            : "border-[#EBF4F5] shadow-[0_4px_24px_rgba(3,63,99,0.05)] hover:-translate-y-0.5 hover:border-[#287D88]/25 hover:shadow-[0_12px_38px_rgba(40,125,136,0.14)]"
        }
      `}
    >
      <div className="relative w-full @xl:w-[210px] aspect-[16/10] @xl:aspect-auto @xl:min-h-[190px] shrink-0 overflow-hidden bg-[#EBF4F5]">
        {item.image ? (
          <>
            <Image
              src={item.image}
              alt={item.name || "Zdjęcie usługi"}
              fill
              sizes="(max-width: 768px) 100vw, 210px"
              className="object-cover transition-transform duration-500 ease-out group-hover/price:scale-105"
            />
            {/* Delikatne przyciemnienie krawędzi przy zdjęciu dla lepszego kontrastu */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent @xl:bg-gradient-to-r @xl:from-transparent @xl:to-black/5 pointer-events-none" />
          </>
        ) : (
          /* Brak zdjęcia → placeholder z ikoną lotosu */
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EBF4F5] to-[#D7EBED]">
            <FlowerLotus
              size={56}
              weight="duotone"
              className="text-[#287D88]/45 transition-transform duration-500 ease-out group-hover/price:scale-110"
            />
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-5 @xl:p-6">
        {/* Nagłówek: tytuł + cena (pill) */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-jakarta font-bold text-lg @xl:text-xl text-[#0B3B4C] leading-snug">
            {item.name}
          </h3>
          <div className="shrink-0 rounded-full rounded-tr-[4px] bg-[#287D88]/10 px-4 py-1.5 border border-[#287D88]/10">
            <span className="font-montserrat font-bold text-base @xl:text-lg text-[#287D88] whitespace-nowrap">
              {item.price} zł
            </span>
          </div>
        </div>

        {item.duration && (
          <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#EBF4F5] px-3 py-1 font-montserrat text-[13px] font-semibold text-[#287D88]">
            <Clock size={15} weight="duotone" />
            <span>{item.duration} minut</span>
          </div>
        )}

        {hasDescription && (
          <>
            {/* Pasek-wskaźnik rozwinięcia (cała karta jest klikalna) */}
            <div className="flex items-center gap-2 mt-0.5 font-montserrat text-[13px] font-semibold text-[#287D88]">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${
                  isOpen ? "bg-[#287D88] text-white" : "bg-[#287D88]/10 text-[#287D88]"
                }`}
              >
                <CaretDown
                  size={13}
                  weight="bold"
                  className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
              {isOpen ? "Ukryj szczegóły" : "Zobacz szczegóły"}
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="desc"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="font-montserrat text-[13.5px] leading-relaxed text-[#0B3B4C]/70 pt-1">
                    {item.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default function PricingListBlock({ content }: { content: any }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="flex flex-col gap-4 w-full text-left">
      {content.items.map((item: any, idx: number) => (
        <PricingItem
          key={item.id || idx}
          item={item}
          isOpen={openIdx === idx}
          onToggle={() => setOpenIdx((cur) => (cur === idx ? null : idx))}
        />
      ))}
    </div>
  );
}
