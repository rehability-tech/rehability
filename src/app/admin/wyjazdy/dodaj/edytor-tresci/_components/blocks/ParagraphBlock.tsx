"use client";

import React from "react";
import RichTextInput from "../lib/RichTextInput";

interface ParagraphBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function ParagraphBlock({
  content,
  onChange,
}: ParagraphBlockProps) {
  return (
    <RichTextInput
      value={content?.text || ""}
      onChange={(text) => onChange({ text })}
      className="text-gray-600 font-montserrat text-base leading-[1.7]"
    />
  );
}
