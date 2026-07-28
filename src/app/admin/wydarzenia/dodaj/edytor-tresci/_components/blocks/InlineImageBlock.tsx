"use client";

import React, { useState } from "react";
import { Camera, Eye, EyeSlash, Image } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";

// TYPOWANIE PROPSÓW (Z tripId!)
interface InlineImageBlockProps {
  content: any;
  onChange: (newContent: any) => void;
  tripId: string;
}

export default function InlineImageBlock({
  content,
  onChange,
  tripId,
}: InlineImageBlockProps) {
  const imageUrl = content?.url || "";
  const imageAlt = content?.alt || "";
  // Podpis domyślnie jest ukryty: `alt` bywa rekomendacją zdjęcia od AI
  // („Wysokiej jakości ujęcie wnętrza…"), która pod zdjęciem wygląda jak
  // wyciek promptu. Ikonka oka pozwala go świadomie pokazać na stronie.
  const showCaption = content?.showCaption === true;
  const [pickerOpen, setPickerOpen] = useState(false);

  const update = (patch: Record<string, unknown>) =>
    onChange({ url: imageUrl, alt: imageAlt, showCaption, ...patch });

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 transition-colors shadow-sm group/image">
      <div className="flex justify-between items-center gap-3">
        <label className="font-montserrat font-semibold text-[#0B3B4C] text-sm">
          Zdjęcie w treści
        </label>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-full text-xs font-montserrat font-semibold text-[#0B3B4C] transition-colors"
        >
          <Image size={16} weight="duotone" className="text-[#287D88]" />
          {imageUrl ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
        </button>
      </div>

      {imageUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mt-2">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto object-contain max-h-[500px]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => setPickerOpen(true)}
              className="p-3.5 rounded-full bg-white text-[#0B3B4C] hover:scale-105 transition-all"
            >
              <Camera size={20} weight="fill" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full aspect-[4/3] max-h-[300px] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4 mt-2 hover:border-brand-primary/40 hover:bg-brand-primary/[0.03] transition-colors"
        >
          <Image size={50} weight="duotone" className="text-gray-300" />
          <span className="font-montserrat text-sm font-medium text-center px-6">
            Wybierz zdjęcie z Pexels lub wgraj własne, aby wstawić je w treść
          </span>
        </button>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => update({ alt: e.target.value })}
            placeholder="Krótki opis zdjęcia (np. Masaż twarzy na werandzie)..."
            className="flex-1 min-w-0 p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl font-montserrat text-sm outline-none focus:border-brand-primary/30 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => update({ showCaption: !showCaption })}
            aria-pressed={showCaption}
            title={
              showCaption
                ? "Podpis jest widoczny pod zdjęciem — kliknij, aby go ukryć"
                : "Podpis jest ukryty — kliknij, aby pokazać go pod zdjęciem"
            }
            className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border transition-colors ${
              showCaption
                ? "bg-brand-primary border-brand-yellow/30 text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                : "bg-gray-50/80 border-gray-100 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100/70"
            }`}
          >
            {showCaption ? (
              <Eye size={18} weight="fill" />
            ) : (
              <EyeSlash size={18} weight="regular" />
            )}
          </motion.button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={showCaption ? "visible" : "hidden"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="font-montserrat text-[12px] text-gray-400 px-1"
          >
            {showCaption
              ? "Ten opis pojawi się jako podpis pod zdjęciem na stronie wydarzenia."
              : "Opis służy tylko SEO i czytnikom ekranu — nie zobaczy go osoba odwiedzająca stronę."}
          </motion.p>
        </AnimatePresence>
      </div>

      <BlogCoverPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          update({ url });
          setPickerOpen(false);
        }}
        defaultQuery={imageAlt}
        heading="Zdjęcie w treści wydarzenia"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne — trafi prosto do naszego magazynu."
        uploadEndpoint={`/api/admin/wydarzenia/${tripId}/upload`}
      />
    </div>
  );
}
