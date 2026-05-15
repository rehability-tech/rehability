"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Camera, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { CampContentState } from "@/app/admin/campy/dodaj/edytor-tresci/page";

interface EditableHeroProps {
  title: string;
  data: CampContentState;
  updateField: (field: keyof CampContentState, value: any) => void;
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function EditableHero({
  title,
  data,
  updateField,
}: EditableHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stany do obsługi wbudowanego inputa tagów
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");

  // Zastępcze zdjęcie, jeśli admin jeszcze nic nie wgrał
  const displayImage = data.heroImage || "/images/static/camp.png";

  const handleRemoveTag = (indexToRemove: number) => {
    updateField(
      "tags",
      data.tags.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      updateField("heroImage", previewUrl);
    }
  };

  // --- LOGIKA DODAWANIA TAGU W INPUCIE ---
  const confirmTag = (keepOpen: boolean = false) => {
    if (newTagValue.trim() !== "" && data.tags.length < 6) {
      updateField("tags", [...data.tags, newTagValue.trim()]);
    }
    if (newTagValue.trim() !== "") {
      updateField("tags", [...data.tags, newTagValue.trim()]);
    }
    setNewTagValue(""); // Czyścimy wartość, żeby admin mógł pisać dalej

    if (!keepOpen || data.tags.length >= 5) {
      setIsAddingTag(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Po Enterze zapisujemy tag, ale podajemy 'true', by NIE zamykać inputa
      confirmTag(true);
    } else if (e.key === "Escape") {
      setNewTagValue("");
      setIsAddingTag(false);
    }
  };

  return (
    <section className="relative w-full pt-[140px] pb-[80px] overflow-hidden rounded-[32px] shadow-sm mb-12 group">
      {/* UKRYTY INPUT DLA ZDJĘCIA */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* PRZYCISK ZMIANY ZDJĘCIA (Pokazuje się na hover) */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute top-6 right-6 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-full font-montserrat text-sm font-semibold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100 shadow-lg border border-white/30 cursor-pointer"
      >
        <Camera size={18} weight="fill" />
        Zmień tło Hero
      </button>

      {/* === TŁO I GRADIENTY === */}
      <div className="absolute inset-0 z-0">
        <Image
          src={displayImage}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          alt="Podgląd zdjęcia w tle"
          priority
        />
        <div className="absolute inset-0 bg-[#0B3B4C]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#287D88]/[0.6]" />
      </div>

      {/* === TREŚĆ === */}
      <motion.div
        className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center text-white"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* 1. TYTUŁ */}
        <motion.h1
          variants={fadeUpVariants}
          className="font-jakarta font-bold text-[40px] md:text-[56px] leading-[1.05] mb-6 drop-shadow-md uppercase max-w-[800px]"
          title="Tytuł edytuje się w kroku 'Dane podstawowe'"
        >
          {title || "TYTUŁ WYJAZDU"}
        </motion.h1>

        {/* 2. TAGI W PASTYLCE */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-4 py-2.5 mb-4 flex flex-wrap justify-center items-center gap-2 border border-white/20 transition-all hover:bg-black/40 min-h-[46px]"
        >
          {data.tags.length === 0 && !isAddingTag && (
            <span className="text-white/50 text-sm italic mx-2">
              Brak tagów
            </span>
          )}

          {data.tags.map((tag: string, idx: number) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1 group/tag bg-white/10 px-3 py-1 rounded-full border border-white/10 hover:border-white/30 transition-colors">
                <span className="font-montserrat font-medium text-[12px] md:text-[13px]">
                  {tag}
                </span>
                <button
                  onClick={() => handleRemoveTag(idx)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/80 transition-colors opacity-50 group-hover/tag:opacity-100 cursor-pointer"
                >
                  <X size={10} weight="bold" />
                </button>
              </div>
            </React.Fragment>
          ))}

          {/* DYNAMICZNY INPUT LUB PRZYCISK DODAWANIA */}
          {isAddingTag ? (
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full border border-white/40">
              <input
                autoFocus
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => confirmTag()} // Zapisuje też, jeśli klikniesz poza input
                placeholder="Napisz i kliknij Enter..."
                className="bg-transparent text-white font-montserrat font-medium text-[12px] md:text-[13px] outline-none w-36 placeholder:text-white/50"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-brand-primary text-white hover:bg-[#1E6068] transition-colors ml-1 shadow-sm cursor-pointer"
              title="Dodaj nowy tag"
            >
              <Plus size={14} weight="bold" />
            </button>
          )}
        </motion.div>

        {/* 3. PODTYTUŁ */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-6 py-2 mb-8 border border-white/20 focus-within:border-brand-primary focus-within:bg-black/40 transition-all min-w-[300px] max-w-2xl w-full flex items-center"
        >
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            placeholder="Wpisz chwytliwy podtytuł lub wezwanie do akcji..."
            className="bg-transparent text-white font-montserrat font-medium text-[14px] md:text-[15px] w-full text-center outline-none placeholder:text-white/40 py-1"
          />
        </motion.div>

        {/* 4. PRZYCISK CTA */}
        <motion.div
          variants={fadeUpVariants}
          className="opacity-50 pointer-events-none"
          title="Przycisk pokazowy"
        >
          <Button showArrow>Zapisz się teraz</Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
