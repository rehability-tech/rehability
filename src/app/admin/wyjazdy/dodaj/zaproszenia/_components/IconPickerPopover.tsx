"use client";

import { ICON_OPTIONS } from "../_lib/constants";
import PhosphorIcon from "./PhosphorIcon";

interface IconPickerPopoverProps {
  selectedIcon: string;
  position: { x: number; y: number };
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function IconPickerPopover({
  selectedIcon,
  position,
  onSelect,
  onClose,
}: IconPickerPopoverProps) {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          top: position.y,
          left: position.x,
          zIndex: 1000,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(3,63,99,.18)",
          border: "1px solid rgba(40,125,136,.12)",
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 3,
        }}
      >
        {ICON_OPTIONS.map((opt) => {
          const isSel = selectedIcon === opt.name;
          return (
            <button
              key={opt.name}
              type="button"
              title={opt.label}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt.name);
              }}
              style={{
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: isSel ? "2px solid #287d88" : "2px solid transparent",
                background: isSel
                  ? "linear-gradient(135deg,#287d88,#1d6b76)"
                  : "transparent",
                cursor: "pointer",
                transition: "all .12s",
              }}
            >
              <PhosphorIcon
                name={opt.name}
                size={20}
                weight={isSel ? "fill" : "duotone"}
                color={isSel ? "#fff" : "#64748b"}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
