import React from "react";
import parse from "html-react-parser";

export default function HeadingBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div
      className="
        w-full text-left mt-6 mb-2
        font-jakarta font-bold text-[#0B3B4C] leading-[1.2] 
        text-2xl md:text-3xl
        [&_p]:m-0 [&_strong]:font-bold [&_em]:italic
        [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0
      "
    >
      {parse(content.text)}
    </div>
  );
}
