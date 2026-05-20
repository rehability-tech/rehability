"use client";

import React, { useRef } from "react";
import { Camera, Image } from "@phosphor-icons/react/dist/ssr";
import { useBlogUploadImage } from "../lib/useBlogUploadImage";

interface Props {
  content: any;
  onChange: (newContent: any) => void;
}

export default function BlogInlineImageBlock({ content, onChange }: Props) {
  const imageUrl = content?.url || "";
  const imageAlt = content?.alt || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading, uploadError } = useBlogUploadImage((newUrl) => {
    onChange({ url: newUrl, alt: imageAlt });
  });

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm group/image">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); }}
        accept="image/*"
        className="hidden"
      />

      <div className="flex justify-between items-center gap-3">
        <label className="font-montserrat font-semibold text-[#0B3B4C] text-sm">
          Zdjęcie w treści
        </label>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-full text-xs font-montserrat font-semibold text-[#0B3B4C] transition-colors"
        >
          {isUploading ? (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <Image size={16} weight="duotone" className="text-[#287D88]" />
          )}
          {isUploading ? "Przesyłanie..." : imageUrl ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
        </button>
      </div>

      {imageUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mt-2">
          <img src={imageUrl} alt={imageAlt} className="w-full h-auto object-contain max-h-[500px]" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-full bg-white text-[#0B3B4C] hover:scale-105 transition-all"
            >
              <Camera size={20} weight="fill" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[4/3] max-h-[300px] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4 mt-2">
          <Image size={50} weight="duotone" className="text-gray-300" />
          <span className="font-montserrat text-sm font-medium text-center px-6">
            Wybierz zdjęcie, aby wstawić je w treść artykułu
          </span>
        </div>
      )}

      <input
        type="text"
        value={imageAlt}
        onChange={(e) => onChange({ url: imageUrl, alt: e.target.value })}
        placeholder="Opis alternatywny zdjęcia (SEO)..."
        className="w-full p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl font-montserrat text-sm outline-none focus:border-brand-primary/30 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
      />
      {uploadError && (
        <span className="text-red-500 font-montserrat text-xs px-2">{uploadError}</span>
      )}
    </div>
  );
}
