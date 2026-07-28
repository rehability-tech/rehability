"use client";

import GallerySlot from "../GallerySlot";

interface GallerySectionProps {
  images: string[];
  onSlotClick: (idx: number) => void;
  readonly?: boolean;
}

export default function GallerySection({ images, onSlotClick, readonly = false }: GallerySectionProps) {
  // W podglądzie pomijamy puste sloty — wysłany e-mail nie pokazuje placeholderów.
  const slots = readonly
    ? images.map((url, i) => ({ url, i })).filter((s) => Boolean(s.url))
    : images.map((url, i) => ({ url, i }));

  if (readonly && slots.length === 0) return null;

  return (
    <div style={{ margin: "0 0 22px" }}>
      <p style={{ margin: "0 0 10px", color: "#287d88", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textAlign: "center" }}>
        Klimat wydarzenia
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
        {slots.map(({ url, i }) => (
          <GallerySlot key={i} src={url} index={i} onClick={() => onSlotClick(i)} readonly={readonly} />
        ))}
      </div>
    </div>
  );
}
