import React from "react";

export default function InlineImageBlock({ content }: { content: any }) {
  if (!content?.url) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 w-full">
      <div className="w-full bg-white p-5 @md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
          <img
            src={content.url}
            alt={content.alt || "Zdjęcie z wyjazdu"}
            className="w-full h-auto object-contain max-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
}
