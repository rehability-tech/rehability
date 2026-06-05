"use client";

import { useEffect, useRef } from "react";

interface CtaSectionProps {
  content: string;
  onFocusEditor: (el: HTMLElement) => void;
  onChange: (content: string) => void;
  onInput: () => void;
}

export default function CtaSection({ content, onFocusEditor, onChange, onInput }: CtaSectionProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerText = content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center", margin: "0 0 6px" }}>
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { if (ref.current) onFocusEditor(ref.current); }}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerText);
          onInput();
        }}
        style={{
          display: "inline-block",
          backgroundColor: "#287d88",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          padding: "14px 32px",
          borderRadius: "14px 0 14px 14px",
          border: "1px solid rgba(242,217,103,.4)",
          boxShadow: "0 6px 18px rgba(242,217,103,.45)",
          cursor: "text",
          outline: "none",
        }}
      />
    </div>
  );
}
