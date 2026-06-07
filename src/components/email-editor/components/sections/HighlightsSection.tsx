"use client";

import { useEffect, useRef } from "react";
import PhosphorIcon from "../PhosphorIcon";

interface HighlightsSectionProps {
  icons: string[];
  labels: string[];
  onChange: (update: { icons?: string[]; labels?: string[] }) => void;
  onInput: () => void;
  onOpenIconPicker: (idx: number, rect: DOMRect) => void;
  readonly?: boolean;
}

export default function HighlightsSection({
  icons,
  labels,
  onChange,
  onInput,
  onOpenIconPicker,
  readonly = false,
}: HighlightsSectionProps) {
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([null, null, null]);

  useEffect(() => {
    labels.forEach((label, i) => {
      if (labelRefs.current[i]) labelRefs.current[i]!.innerText = label;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ margin: "0 0 22px" }}>
      <p style={{ margin: "0 0 14px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>
        Co Cię czeka
      </p>
      <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <button
              type="button"
              title={readonly ? undefined : "Kliknij, aby zmienić ikonę"}
              onClick={readonly ? undefined : (e) => onOpenIconPicker(i, (e.currentTarget as HTMLButtonElement).getBoundingClientRect())}
              style={{
                background: "linear-gradient(135deg,#287d88,#1d6b76)",
                border: "none",
                borderRadius: 14,
                width: 54,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: readonly ? "default" : "pointer",
                boxShadow: "0 4px 14px rgba(40,125,136,.35)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <PhosphorIcon name={icons[i] ?? "Sparkle"} size={26} weight="fill" color="#fff" />
              {!readonly && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#f2d967",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 7,
                    fontWeight: 900,
                    color: "#7a6008",
                  }}
                >
                  ✏
                </span>
              )}
            </button>

            {/* Editable label */}
            <span
              ref={(el) => { labelRefs.current[i] = el; }}
              contentEditable={!readonly}
              suppressContentEditableWarning
              onInput={readonly ? undefined : () => {
                const newLabels = labels.map((l, j) =>
                  j === i ? (labelRefs.current[i]?.innerText ?? l) : l,
                );
                onChange({ labels: newLabels });
                onInput();
              }}
              style={{
                color: "#033f63",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.4,
                outline: "none",
                borderBottom: readonly ? "none" : "1.5px dashed rgba(40,125,136,0.35)",
                cursor: readonly ? "default" : "text",
                minWidth: 40,
                display: "inline-block",
                textAlign: "center",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
