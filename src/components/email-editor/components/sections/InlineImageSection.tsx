"use client";

import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";

interface InlineImageSectionProps {
  image: string;
  onOpenPicker: () => void;
  readonly?: boolean;
}

export default function InlineImageSection({ image, onOpenPicker, readonly = false }: InlineImageSectionProps) {
  return (
    <div
      role={readonly ? undefined : "button"}
      tabIndex={readonly ? undefined : 0}
      onClick={readonly ? undefined : onOpenPicker}
      onKeyDown={readonly ? undefined : (e) => e.key === "Enter" && onOpenPicker()}
      style={{ position: "relative", cursor: readonly ? "default" : "pointer", margin: "0 0 16px" }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Zdjęcie"
          style={{
            width: "100%",
            aspectRatio: "16/9",
            objectFit: "cover",
            borderRadius: "12px 0 12px 12px",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            background: "linear-gradient(135deg,#f4fafb,#e6f3f5)",
            border: "1.5px dashed #a8cdd2",
            borderRadius: "12px 0 12px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <ImageIcon size={22} weight="duotone" color="#5da6af" />
          <span style={{
            fontSize: 11,
            color: "#5da6af",
            fontWeight: 700,
            fontFamily: "Montserrat,sans-serif",
          }}>
            Kliknij, aby dodać zdjęcie
          </span>
        </div>
      )}
      {!readonly && (
        <div style={{
          position: "absolute",
          bottom: 6,
          right: 6,
          background: image ? "rgba(255,255,255,0.92)" : "rgba(40,125,136,0.9)",
          color: image ? "#287d88" : "#fff",
          borderRadius: 5,
          padding: "2px 7px",
          fontSize: 9,
          fontWeight: 700,
          fontFamily: "Montserrat,sans-serif",
          pointerEvents: "none",
        }}>
          {image ? "✏ Zmień" : "＋ Dodaj"}
        </div>
      )}
    </div>
  );
}
