import React from "react";
import Image from "next/image";
import {
  CheckCircle,
  Clock,
  Sparkle,
  Person,
  Gift,
  Tree,
  Mountains,
  Campfire,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";

// Mapowanie ikon dla featuresGrid (zależnie od tego co zwraca baza)
const IconMap: Record<string, React.ElementType> = {
  Sparkle,
  Person,
  Gift,
  Tree,
  Mountains,
  Campfire,
  CheckCircle,
};

export default function SingleCampBlocksRenderer({
  blocks,
}: {
  blocks: any[];
}) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="w-full font-montserrat z-10 pb-12 flex flex-col items-center">
      {blocks.map((block, index) => {
        // 1. HIGHLIGHT (Wyróżniony tekst)
        if (block.type === "highlight") {
          return (
            <div
              key={block.id}
              className="w-full text-center max-w-[800px] mx-auto text-xl md:text-2xl font-jakarta leading-relaxed mb-8"
            >
              <div
                dangerouslySetInnerHTML={{ __html: block.content?.text || "" }}
              />
            </div>
          );
        }

        // 2. PARAGRAPH (Zwykły tekst / Akapit)
        if (block.type === "paragraph") {
          return (
            <div
              key={block.id}
              className="w-full max-w-[900px] text-gray-600 text-base md:text-lg leading-loose font-light mb-6"
            >
              <div
                dangerouslySetInnerHTML={{ __html: block.content?.text || "" }}
              />
            </div>
          );
        }

        // 3. HEADING (Nagłówki)
        if (block.type === "heading") {
          return (
            <div
              key={block.id}
              className="w-full max-w-[1000px] font-jakarta font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mt-12 mb-6"
            >
              <div
                dangerouslySetInnerHTML={{ __html: block.content?.text || "" }}
              />
            </div>
          );
        }

        // 4. SPACER (Odstęp)
        if (block.type === "spacer") {
          return (
            <div
              key={block.id}
              style={{ height: block.content?.height || "64px" }}
              className="w-full shrink-0"
            />
          );
        }

        // 5. FEATURES GRID (Siatka ikon i tekstu)
        if (block.type === "featuresGrid") {
          return (
            <div
              key={block.id}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-12 w-full max-w-[1200px]"
            >
              {block.content?.items?.map((item: any, idx: number) => {
                const IconComponent = IconMap[item.icon] || CheckCircle;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-start gap-4 p-8 w-full bg-[#287D88] rounded-[24px] shadow-lg transition-transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 flex items-center justify-start text-white">
                      <IconComponent size={32} weight="duotone" />
                    </div>
                    <div className="font-montserrat font-medium text-[16px] leading-relaxed text-white">
                      <div
                        dangerouslySetInnerHTML={{ __html: item.text || "" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // 6. BULLET LIST (Zwykła lista punktowana)
        if (block.type === "bulletList") {
          return (
            <div
              key={block.id}
              className="flex flex-col gap-5 mb-10 w-full max-w-[900px]"
            >
              {block.content?.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 w-full group">
                  <CheckCircle
                    size={24}
                    className="text-[#287D88] shrink-0 mt-[2px] transition-transform duration-300 group-hover:scale-110"
                    weight="fill"
                  />
                  <div className="text-base md:text-lg text-gray-600 leading-relaxed font-light">
                    <div
                      dangerouslySetInnerHTML={{ __html: item.text || "" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // 7. PRICING LIST (Cennik / Opcje)
        if (block.type === "pricingList") {
          return (
            <div
              key={block.id}
              className="flex flex-col gap-3 mb-12 w-full max-w-[1000px]"
            >
              {block.content?.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88] overflow-hidden group transition-colors duration-300 w-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <span className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C]">
                      {item.name}
                    </span>
                    {item.duration && (
                      <span className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
                        <Clock
                          size={16}
                          weight="duotone"
                          className="text-[#287D88]"
                        />
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 mt-4 sm:mt-0 flex items-center">
                    <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88] whitespace-nowrap">
                      {item.price === "w cenie"
                        ? item.price
                        : `${item.price} zł`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // 8. FAQ (Rozwijane pytania)
        if (block.type === "faq") {
          return (
            <div
              key={block.id}
              className="w-full max-w-[900px] flex flex-col gap-4 mb-12"
            >
              {block.content?.items?.map((item: any, idx: number) => (
                <details
                  key={idx}
                  className="group bg-white border border-gray-200 rounded-[20px] [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-jakarta font-bold text-lg text-[#0B3B4C]">
                    {item.question}
                    <span className="transition group-open:rotate-180">
                      <CaretDown size={20} />
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 font-montserrat leading-relaxed">
                    <div
                      dangerouslySetInnerHTML={{ __html: item.answer || "" }}
                    />
                  </div>
                </details>
              ))}
            </div>
          );
        }

        // 9. INLINE IMAGE (Obrazek w treści)
        if (block.type === "inlineImage") {
          return (
            <div
              key={block.id}
              className="w-full max-w-[1000px] relative aspect-video md:aspect-[21/9] rounded-[24px] overflow-hidden mb-12 shadow-lg"
            >
              <Image
                src={block.content?.url}
                alt={block.content?.alt || "Zdjęcie z wyjazdu"}
                fill
                className="object-cover"
              />
            </div>
          );
        }

        // 10. VIDEO EMBED (YouTube)
        if (block.type === "videoEmbed") {
          // Bezpieczna konwersja linku youtube na format embed
          const embedUrl = block.content?.url?.replace("watch?v=", "embed/");
          return (
            <div
              key={block.id}
              className="w-full max-w-[1000px] aspect-video rounded-[24px] overflow-hidden mb-12 shadow-lg"
            >
              <iframe
                src={embedUrl}
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
