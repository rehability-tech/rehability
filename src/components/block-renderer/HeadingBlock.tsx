import React from "react";
import parse from "html-react-parser";

export default function HeadingBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div className="text-2xl md:text-3xl font-jakarta font-bold text-[#0B3B4C] leading-[1.2]">
      {parse(content.text)}
    </div>
  );
}
