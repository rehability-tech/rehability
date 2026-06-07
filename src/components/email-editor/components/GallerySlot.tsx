"use client";

import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";

const GALLERY_HINTS = ["Atmosfera miejsca", "Aktywność / atrakcja", "Wspólna chwila"];

interface GallerySlotProps {
  src: string;
  index: number;
  onClick: () => void;
  readonly?: boolean;
}

export default function GallerySlot({ src, index, onClick, readonly = false }: GallerySlotProps) {
  return (
    <div
      role={readonly ? undefined : "button"}
      tabIndex={readonly ? undefined : 0}
      onClick={readonly ? undefined : onClick}
      onKeyDown={readonly ? undefined : (e) => e.key === "Enter" && onClick()}
      style={{ position: "relative", cursor: readonly ? "default" : "pointer" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Galeria ${index + 1}`}
          style={{
            width: "100%",
            aspectRatio: "16/7",
            objectFit: "cover",
            borderRadius: "10px 0 10px 10px",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/7",
            background: "linear-gradient(135deg,#f4fafb,#e6f3f5)",
            border: "1.5px dashed #a8cdd2",
            borderRadius: "10px 0 10px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <ImageIcon size={16} weight="duotone" color="#5da6af" />
          <span
            style={{
              fontSize: 9,
              color: "#5da6af",
              fontWeight: 700,
              fontFamily: "Montserrat,sans-serif",
              textAlign: "center",
              lineHeight: 1.3,
              padding: "0 4px",
            }}
          >
            {GALLERY_HINTS[index]}
          </span>
        </div>
      )}
      {!readonly && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            background: src ? "rgba(255,255,255,0.92)" : "rgba(40,125,136,0.9)",
            color: src ? "#287d88" : "#fff",
            borderRadius: 5,
            padding: "2px 6px",
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "Montserrat,sans-serif",
            pointerEvents: "none",
          }}
        >
          {src ? "✏ Zmień" : "＋"}
        </div>
      )}
    </div>
  );
}
