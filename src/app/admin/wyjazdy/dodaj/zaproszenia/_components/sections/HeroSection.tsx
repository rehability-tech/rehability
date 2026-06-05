"use client";

import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";

interface HeroSectionProps {
  image: string;
  onOpenPicker: () => void;
}

export default function HeroSection({ image, onOpenPicker }: HeroSectionProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenPicker}
      onKeyDown={(e) => e.key === "Enter" && onOpenPicker()}
      style={{ position: "relative", cursor: "pointer" }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Hero"
          style={{
            width: "100%",
            aspectRatio: "600/220",
            objectFit: "cover",
            borderRadius: "24px 0 0 0",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "600/220",
            background: "linear-gradient(135deg,#e8f6f7,#cde9ec 45%,#e2f3f5)",
            borderRadius: "24px 0 0 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ImageIcon size={28} weight="duotone" color="#94b5b9" />
          <p style={{ margin: 0, color: "#94b5b9", fontSize: 12, fontFamily: "Montserrat,sans-serif" }}>
            Kliknij, aby dodać zdjęcie hero
          </p>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "rgba(255,255,255,0.92)",
          color: "#287d88",
          borderRadius: 6,
          padding: "3px 8px",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "Montserrat,sans-serif",
        }}
      >
        {image ? "✏ Zmień zdjęcie" : "＋ Dodaj zdjęcie"}
      </div>
    </div>
  );
}
