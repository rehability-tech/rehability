import React from "react";
import parse from "html-react-parser";

export default function ParagraphBlock({ content }: { content: any }) {
  if (!content?.text) return null;

  return (
    <div className="prose prose-lg prose-p:text-gray-600 prose-p:font-montserrat prose-p:leading-relaxed max-w-3xl mx-auto px-4 text-center mt-4 mb-6">
      {parse(content.text)}
    </div>
  );
}
