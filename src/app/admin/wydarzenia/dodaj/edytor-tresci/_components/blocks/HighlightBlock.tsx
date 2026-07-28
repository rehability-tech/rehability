"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface HighlightBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function HighlightBlock({
  content,
  onChange,
}: HighlightBlockProps) {
  return (
    <div className="w-full border-l-4 border-brand-primary pl-4 py-1">
      <RichTextInput
        value={content?.text || ""}
        onChange={(text) => onChange({ text })}
        className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed"
      />
    </div>
  );
}
