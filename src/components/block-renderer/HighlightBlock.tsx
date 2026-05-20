import React from "react";
import parse from "html-react-parser";
import { Quotes } from "@phosphor-icons/react/dist/ssr";

export default function HighlightBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 w-full my-12">
      <div className="relative bg-brand-primary/5 rounded-3xl p-8 md:p-12 text-center border border-brand-primary/10 overflow-hidden">
        {/* Dekoracyjna ikona w tle */}
        <Quotes
          size={80}
          weight="fill"
          className="text-brand-primary/10 absolute -top-4 -left-4 transform -rotate-12"
        />

        <div className="relative z-10 font-jakarta font-semibold text-xl md:text-2xl text-[#0B3B4C] leading-snug">
          {parse(content.text)}
        </div>
      </div>
    </div>
  );
}
