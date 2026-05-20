import React from "react";
import parse from "html-react-parser";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

export default function FaqBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-3xl mx-auto px-4 w-full my-10">
      <div className="flex flex-col gap-4">
        {content.items.map((item: any, idx: number) => (
          <details
            key={item.id || idx}
            className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden cursor-pointer open:ring-2 open:ring-brand-primary/20 transition-all"
          >
            <summary className="flex items-center justify-between p-6 font-jakarta font-semibold text-[#0B3B4C] text-lg list-none [&::-webkit-details-marker]:hidden">
              {item.question}
              <CaretDown
                size={20}
                weight="bold"
                className="text-brand-primary transform group-open:rotate-180 transition-transform duration-300 shrink-0 ml-4"
              />
            </summary>

            <div className="px-6 pb-6 pt-0 font-montserrat text-gray-600 leading-relaxed mt-2">
              {parse(item.answer || "")}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
