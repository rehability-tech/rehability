import React from "react";

export default function InlineImageBlock({ content }: { content: any }) {
  // Jeśli organizator jeszcze nie dodał linku do zdjęcia, nic nie pokazujemy
  if (!content?.url) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 w-full my-10">
      <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100 aspect-video md:aspect-[21/9]">
        <img
          src={content.url}
          alt={content.alt || "Zdjęcie z wyjazdu"}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
    </div>
  );
}
