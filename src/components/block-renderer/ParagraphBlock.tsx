import React from "react";
import parse from "html-react-parser";

export default function ParagraphBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div
      className="
        w-full text-left text-gray-600 font-montserrat text-base leading-[1.7]
        [&_p]:m-0 [&_p+p]:mt-3
        [&_strong]:font-semibold [&_strong]:text-[#0B3B4C]
        [&_em]:italic
        [&_a]:text-[#287D88] [&_a]:underline [&_a]:underline-offset-2
        [&_span]:text-inherit
      "
    >
      {parse(content.text)}
    </div>
  );
}
