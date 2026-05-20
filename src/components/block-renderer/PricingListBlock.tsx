import React from "react";
import { Clock } from "@phosphor-icons/react/dist/ssr";

export default function PricingListBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-3xl mx-auto px-4 w-full my-8">
      <div className="flex flex-col gap-2 w-full">
        {content.items.map((item: any, idx: number) => (
          <div
            key={item.id || idx}
            className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88] transition-colors duration-300 w-full bg-white group/price overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-1.5 w-full sm:w-2/3 pr-2 sm:pr-8">
              <div className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C]">
                {item.name}
              </div>
              {item.duration && (
                <div className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
                  <Clock
                    size={16}
                    weight="duotone"
                    className="text-[#287D88]"
                  />
                  <span>{item.duration} minut</span>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-3 sm:mt-0 flex items-center justify-start sm:justify-end w-full sm:w-1/3">
              <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88]">
                {item.price} zł
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
