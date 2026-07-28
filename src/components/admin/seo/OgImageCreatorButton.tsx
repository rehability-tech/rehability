"use client";

import { useState } from "react";
import { PaintBrush } from "@phosphor-icons/react/dist/ssr";
import OgImageCreator from "./OgImageCreator";

/**
 * Przycisk otwierający kreator grafiki OG (1200×630) — wspólny dla bloga,
 * wydarzeń i kursów. Składa grafikę ze zdjęcia tła + tytułu/etykiety i wgrywa
 * gotowy PNG do magazynu, zwracając URL do pola `ogImage`.
 */
export default function OgImageCreatorButton({
  onApply,
  title = "",
  category = "",
  image = "",
  subtitle,
}: {
  onApply: (url: string) => void;
  title?: string;
  category?: string;
  image?: string;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold font-montserrat transition-colors"
      >
        <PaintBrush size={16} weight="duotone" />
        Stwórz w kreatorze
      </button>
      <OgImageCreator
        isOpen={open}
        onClose={() => setOpen(false)}
        onApply={(url) => {
          onApply(url);
          setOpen(false);
        }}
        initialTitle={title}
        initialCategory={category}
        initialImage={image}
        initialSubtitle={subtitle}
      />
    </>
  );
}
