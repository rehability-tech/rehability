import React from "react";
import parse from "html-react-parser";

export default function HeadingBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <h2 className="text-3xl md:text-[38px] font-jakarta font-bold text-[#0B3B4C] leading-tight text-center max-w-3xl mx-auto px-4">
      {parse(content.text)}
    </h2>
  );
}
