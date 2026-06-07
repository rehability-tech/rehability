"use client";

import { useEffect, useRef } from "react";
import { htmlToTemplate, templateToHtml } from "../../lib/templateHelpers";

interface TextSectionProps {
  content: string;
  previewValues: Record<string, string>;
  onFocusEditor: (el: HTMLElement) => void;
  onChange: (content: string) => void;
  onInput: () => void;
  readonly?: boolean;
}

export default function TextSection({
  content,
  previewValues,
  onFocusEditor,
  onChange,
  onInput,
  readonly = false,
}: TextSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = templateToHtml(content, previewValues, { plain: readonly });
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
      contentEditable={!readonly}
      suppressContentEditableWarning
      onFocus={readonly ? undefined : () => { if (ref.current) onFocusEditor(ref.current); }}
      onInput={readonly ? undefined : () => {
        if (ref.current) onChange(htmlToTemplate(ref.current));
        onInput();
      }}
      style={{
        margin: "0 0 14px",
        color: "#475569",
        fontSize: 15,
        lineHeight: 1.65,
        outline: "none",
        borderBottom: readonly ? "none" : "2px dashed rgba(40,125,136,0.2)",
        cursor: readonly ? "default" : "text",
        minHeight: readonly ? undefined : 22,
        paddingBottom: 3,
      }}
    />
  );
}

