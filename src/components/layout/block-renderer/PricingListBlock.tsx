import React from "react";
import parse from "html-react-parser";

export default function PricingListBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-3xl mx-auto px-4 w-full my-8">
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-gray-100">
        <ul className="flex flex-col gap-5">
          {content.items.map((item: any, idx: number) => (
            <li key={item.id || idx} className="flex items-end gap-4 group">
              {/* Lewa strona: Nazwa i ew. czas trwania */}
              <div className="flex flex-col flex-shrink-0">
                <span className="font-jakarta font-bold text-[#0B3B4C] text-lg">
                  {item.name}
                </span>
                {item.duration && (
                  <span className="text-xs text-gray-400 font-montserrat font-medium mt-0.5 uppercase tracking-wider">
                    ⏱ {item.duration} MIN
                  </span>
                )}
              </div>

              {/* Środek: Kropkowana linia wypełniająca */}
              <div className="flex-grow border-b-2 border-dotted border-gray-200 mb-1.5 group-hover:border-brand-primary/30 transition-colors" />

              {/* Prawa strona: Cena */}
              <div className="flex-shrink-0 mb-0.5">
                <span className="font-jakarta font-extrabold text-brand-primary text-xl">
                  {item.price} zł
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
