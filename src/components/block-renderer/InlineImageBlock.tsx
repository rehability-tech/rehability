import React from "react";
import Image from "next/image";

export default function InlineImageBlock({ content }: { content: any }) {
  if (!content?.url) return null;

  const alt = content.alt || "Zdjęcie z wyjazdu";

  return (
    <figure className="max-w-5xl mx-auto px-4 w-full">
      <div className="w-full bg-white p-5 @md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 aspect-[16/9]">
          <Image
            src={content.url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
            className="object-cover"
          />
        </div>
      </div>
      {content.alt && (
        <figcaption className="mt-2 text-center text-[12px] text-[#0B3B4C]/55 italic font-montserrat">
          {content.alt}
        </figcaption>
      )}
    </figure>
  );
}
