import React from "react";
import parse from "html-react-parser";

export default function HighlightBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div className="w-full border-l-4 border-brand-primary pl-4 py-1">
      <div className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed">
        {parse(content.text)}
      </div>
    </div>
  );
}
