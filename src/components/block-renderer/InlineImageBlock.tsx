import React from "react";
import Image from "next/image";

export default function InlineImageBlock({ content }: { content: any }) {
  if (!content?.url) return null;

  const alt = content.alt || "Zdjęcie z wydarzenia";
  const caption = typeof content.alt === "string" ? content.alt.trim() : "";
  const showCaption = content.showCaption === true && caption.length > 0;

  return (
    <figure className="w-full">
      <div className="w-full bg-white p-5 @md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 aspect-[16/9]">
          <Image
            src={content.url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 1000px"
            className="object-cover"
          />
        </div>
      </div>
      {/* Pole `alt` domyślnie NIE jest podpisem dla czytelnika — to opis
          rekomendacji zdjęcia generowany przez AI („Wysokiej jakości zdjęcie
          wnętrza…"), służący SEO i czytnikom ekranu. Pokazujemy je pod zdjęciem
          tylko wtedy, gdy admin świadomie włączy podpis ikonką oka w edytorze. */}
      {showCaption && (
        <figcaption className="mt-3 px-1 text-center font-montserrat text-[13px] @md:text-[14px] leading-relaxed text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
