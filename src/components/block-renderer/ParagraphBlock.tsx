import React from "react";
import parse from "html-react-parser";

export default function ParagraphBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div className="text-gray-600 font-montserrat text-base leading-[1.7]">
      {parse(content.text)}
    </div>
  );
}
