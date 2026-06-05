"use client";

import { useEffect, useRef } from "react";
import { htmlToTemplate, templateToHtml } from "../../_lib/templateHelpers";

interface TextSectionProps {
  content: string;
  previewValues: Record<string, string>;
  onFocusEditor: (el: HTMLElement) => void;
  onChange: (content: string) => void;
  onInput: () => void;
}

export default function TextSection({
  content,
  previewValues,
  onFocusEditor,
  onChange,
  onInput,
}: TextSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = templateToHtml(content, previewValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    Object.entries(previewValues).forEach(([key, val]) => {
      ref.current?.querySelectorAll<HTMLElement>(`[data-tag="${key}"]`).forEach((span) => {
        span.textContent = val;
      });
    });
  }, [previewValues]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { if (ref.current) onFocusEditor(ref.current); }}
      onInput={() => {
        if (ref.current) onChange(htmlToTemplate(ref.current));
        onInput();
      }}
      style={{
        margin: "0 0 14px",
        color: "#475569",
        fontSize: 15,
        lineHeight: 1.65,
        outline: "none",
        borderBottom: "2px dashed rgba(40,125,136,0.2)",
        cursor: "text",
        minHeight: 22,
        paddingBottom: 3,
      }}
    />
  );
}
