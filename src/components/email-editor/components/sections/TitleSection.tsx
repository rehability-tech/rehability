"use client";

import { useEffect, useRef } from "react";
import { htmlToTemplate, templateToHtml } from "../../lib/templateHelpers";

interface TitleSectionProps {
  content: string;
  previewValues: Record<string, string>;
  onFocusEditor: (el: HTMLElement) => void;
  onChange: (content: string) => void;
  onInput: () => void;
  readonly?: boolean;
}

export default function TitleSection({
  content,
  previewValues,
  onFocusEditor,
  onChange,
  onInput,
  readonly = false,
}: TitleSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = templateToHtml(content, previewValues, { plain: readonly });
    }
    // Only on mount â€” pill sync handles preview value changes
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
        margin: "0 0 18px",
        color: "#033f63",
        fontSize: "clamp(18px,4vw,24px)",
        fontWeight: 800,
        textAlign: "center",
        lineHeight: 1.25,
        letterSpacing: "-.01em",
        outline: "none",
        borderBottom: readonly ? "none" : "2px dashed rgba(3,63,99,0.18)",
        cursor: readonly ? "default" : "text",
        minHeight: readonly ? undefined : 28,
        paddingBottom: 4,
      }}
    />
  );
}

