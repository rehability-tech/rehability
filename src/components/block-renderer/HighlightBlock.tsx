import React from "react";
import parse from "html-react-parser";

export default function HighlightBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div
      className="w-full text-left border-l-4 pl-4 py-1"
      style={{ borderColor: "#287D88" }}
    >
      <div
        className="
          font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed
          [&_p]:m-0 [&_p+p]:mt-2
          [&_strong]:font-bold [&_em]:italic
          [&_span]:text-inherit
        "
      >
        {parse(content.text)}
      </div>
    </div>
  );
}
