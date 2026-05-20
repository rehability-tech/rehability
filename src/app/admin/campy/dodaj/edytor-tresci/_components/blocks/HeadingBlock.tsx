"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface HeadingBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function HeadingBlock({ content, onChange }: HeadingBlockProps) {
  return (
    <RichTextInput
      value={content?.text || ""}
      onChange={(text) => onChange({ text })}
      className="text-2xl md:text-3xl font-jakarta font-bold text-[#0B3B4C] leading-[1.2]"
    />
  );
}
