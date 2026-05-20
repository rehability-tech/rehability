"use client";

import React, { useState } from "react";
import parse from "html-react-parser";
import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";

export default function FaqBlock({ content }: { content: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-[900px] mx-auto px-4 w-full">
      <div className="w-full flex flex-col bg-white">
        {content.items.map((item: any, idx: number) => {
          const isOpen = openIndex === idx;
          const formattedNumber = String(idx + 1).padStart(2, "0");
          return (
            <div
              key={item.id || idx}
              className={`relative flex flex-col @[600px]:flex-row @[600px]:items-start gap-4 @[600px]:gap-10 py-6 @[600px]:py-10 border-b border-[#0B3B4C]/20 w-full bg-white transition-colors group/faq ${
                idx === 0 ? "border-t" : ""
              }`}
            >
              <div className="flex justify-between items-center w-full @[600px]:w-auto">
                <div className="font-jakarta font-bold text-[40px] @[600px]:text-[48px] @[600px]:self-center leading-none text-[#0B3B4C] @[600px]:mt-1">
                  {formattedNumber}
                </div>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="@[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out cursor-pointer"
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

              <div className="flex-1 flex flex-col w-full pr-0 md:pr-4">
                <div
                  className={`font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] transition-colors duration-300 ${
                    isOpen
                      ? "text-[#287D88]"
                      : "text-[#0B3B4C] group-hover/faq:text-[#287D88]"
                  }`}
                >
                  {item.question}
                </div>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-3"
                      : "grid-rows-[0fr] opacity-0 mt-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="font-montserrat text-[#0B3B4C]/80 text-[14px] md:text-[15px] leading-[170%]">
                      {parse(item.answer || "")}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="hidden @[600px]:flex w-10 h-10 self-start shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 ease-in-out mt-1 hover:scale-105 cursor-pointer"
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
          );
        })}
      </div>
    </div>
  );
}
