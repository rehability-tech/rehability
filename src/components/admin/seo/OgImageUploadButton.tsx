"use client";

import { useRef } from "react";
import { UploadSimple, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useBlogUploadImage } from "@/app/admin/blog/dodaj/edytor-tresci/_components/lib/useBlogUploadImage";

/**
 * Przycisk wgrania własnego zdjęcia OG (Social Media) na obu stronach SEO
 * (blog i wyjazd). Plik leci do Vercel Blob przez wspólny endpoint uploadu,
 * a zwrócony URL trafia do pola `ogImage`.
 */
export default function OgImageUploadButton({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useBlogUploadImage(onUploaded);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold font-montserrat transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <CircleNotch size={16} weight="bold" className="animate-spin" />
        ) : (
          <UploadSimple size={16} weight="bold" />
        )}
        {isUploading ? "Przesyłanie..." : "Wgraj własne zdjęcie"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        disabled={isUploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
