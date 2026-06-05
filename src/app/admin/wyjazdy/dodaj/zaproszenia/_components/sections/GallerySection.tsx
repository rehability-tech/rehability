"use client";

import GallerySlot from "../GallerySlot";

interface GallerySectionProps {
  images: string[];
  onSlotClick: (idx: number) => void;
}

export default function GallerySection({ images, onSlotClick }: GallerySectionProps) {
  return (
    <div style={{ margin: "0 0 22px" }}>
      <p style={{ margin: "0 0 10px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>
        Klimat wyjazdu
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
        {images.map((url, i) => (
          <GallerySlot key={i} src={url} index={i} onClick={() => onSlotClick(i)} />
        ))}
      </div>
    </div>
  );
}
