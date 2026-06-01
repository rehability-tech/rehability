import React from "react";
import Image from "next/image";
import { Clock } from "@phosphor-icons/react/dist/ssr";

export default function PricingListBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="flex flex-col gap-3 w-full text-left">
      {content.items.map((item: any, idx: number) => (
        <div
          key={item.id || idx}
          className="
            relative flex flex-col @xl:flex-row @xl:items-stretch
            border-2 rounded-[24px] w-full bg-white overflow-hidden
            transition-colors duration-300 group/price
          "
          style={{ borderColor: "#EBF4F5" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {item.image && (
            <div className="relative w-full @xl:w-[180px] aspect-[16/10] @xl:aspect-auto @xl:h-auto shrink-0 overflow-hidden bg-[#EBF4F5]">
              <Image
                src={item.image}
                alt={item.name || "Zdjęcie usługi"}
                fill
                sizes="(max-width: 768px) 100vw, 180px"
                className="object-cover"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col @xl:flex-row @xl:items-center justify-between flex-1 p-5 @xl:p-6 gap-3">
            <div className="flex flex-col gap-2 w-full @xl:w-2/3 pr-2 @xl:pr-8">
              <div className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C]">
                {item.name}
              </div>
              {item.duration && (
                <div className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
                  <Clock size={16} weight="duotone" className="text-[#287D88]" />
                  <span>{item.duration} minut</span>
                </div>
              )}
              {item.description && (
                <p className="font-montserrat text-[13px] leading-relaxed text-[#0B3B4C]/70 mt-1">
                  {item.description}
                </p>
              )}
            </div>

            <div className="mt-2 @xl:mt-0 flex items-center justify-start @xl:justify-end w-full @xl:w-1/3">
              <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88]">
                {item.price} zł
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
