"use client";

import React, { useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Camera,
  Plus,
  X,
  MapPin,
  CalendarBlank,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

import { Trash } from "@phosphor-icons/react";
import { CampContentState } from "./hooks/useCampContent";

interface EditableHeroProps {
  title: string;
  data: CampContentState;
  updateField: (field: keyof CampContentState, value: any) => void;
  campId: string;
  // --- NOWOŚĆ: Dane podstawowe przekazywane z zewnątrz (tylko do odczytu w tym kroku) ---
  location?: string;
  dateRange?: string; // np. "12-15 Października 2024"
  price?: string; // np. "3500"
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

function parseLocation(raw?: string): string {
  if (!raw) return "Brak lokalizacji";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed.city || parsed.name || raw;
  } catch {
    return raw;
  }
}

export default function EditableHero({
  title,
  data,
  updateField,
  campId,
  location,
  dateRange,
  price,
}: EditableHeroProps) {
  const displayLocation = parseLocation(location);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const cleanDbImage = data.heroImage?.startsWith("blob:")
    ? null
    : data.heroImage;

  const displayImage = localPreview || cleanDbImage || null;

  const handleRemoveTag = (indexToRemove: number) => {
    updateField(
      "tags",
      data.tags.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        setLocalPreview(reader.result as string);
        setIsUploading(true);
        try {
          const response = await fetch(
            `/api/admin/campy/${campId}/upload?filename=${file.name}`,
            { method: "POST", body: file },
          );
          if (!response.ok) throw new Error("Błąd podczas uploadu na serwer");
          const responseData = await response.json();
          updateField("heroImage", responseData.url);
          setLocalPreview(null);
        } catch (error) {
          console.error("Upload failed:", error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    if (!data.heroImage) return;
    if (data.heroImage.startsWith("blob:")) {
      updateField("heroImage", null);
      setLocalPreview(null);
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/campy/${campId}/upload?url=${encodeURIComponent(data.heroImage)}`,
        { method: "DELETE" },
      );
      if (!response.ok)
        throw new Error("Błąd podczas usuwania zdjęcia z chmury");
      setLocalPreview(null);
      updateField("heroImage", null);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmTag = (keepOpen: boolean = false) => {
    if (newTagValue.trim() !== "" && data.tags.length < 6) {
      updateField("tags", [...data.tags, newTagValue.trim()]);
    }
    setNewTagValue("");
    if (!keepOpen || data.tags.length >= 5) {
      setIsAddingTag(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmTag(true);
    } else if (e.key === "Escape") {
      setNewTagValue("");
      setIsAddingTag(false);
    }
  };

  return (
    <section className="relative w-full pt-[140px] pb-[80px] overflow-hidden rounded-[32px] shadow-sm mb-12 group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      <div className="absolute top-6 right-6 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
          className={`bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-full font-montserrat text-sm font-semibold flex items-center gap-2 transition-all shadow-lg border border-white/30 cursor-pointer ${
            isUploading ? "cursor-wait" : ""
          }`}
        >
          {isUploading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Camera size={18} weight="fill" />
          )}
          {isUploading ? "Wysyłanie..." : "Zmień tło Hero"}
        </button>

        {data.heroImage && (
          <button
            onClick={handleRemoveImage}
            disabled={isUploading || isDeleting}
            className={`w-9 h-9 flex items-center justify-center bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-full transition-all shadow-lg border border-red-400/30 cursor-pointer ${
              isDeleting ? "cursor-wait opacity-50" : ""
            }`}
            title="Usuń własne tło"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash size={16} weight="bold" />
            )}
          </button>
        )}
      </div>

      {/* === TŁO I GRADIENTY === */}
      <div className="absolute inset-0 z-0 bg-[#0B3B4C]/90">
        {displayImage && (
          <img
            src={displayImage}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-[#0B3B4C]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#287D88]/[0.8]" />
      </div>

      {/* === TREŚĆ === */}
      <motion.div
        className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center text-white"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* --- NOWOŚĆ: PASEK META DANYCH --- */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-wrap justify-center items-center gap-3 md:gap-5 mb-6 font-montserrat text-[12px] md:text-[14px] font-semibold text-white/90"
        >
          {/* LOKALIZACJA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <MapPin size={16} weight="fill" className="text-brand-primary" />
            <span>{displayLocation}</span>
          </div>

          {/* DATA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <CalendarBlank
              size={16}
              weight="bold"
              className="text-brand-primary"
            />
            <span>{dateRange || "Brak terminu"}</span>
          </div>

          {/* CENA */}
          <div className="flex items-center gap-2 drop-shadow-lg bg-black/25 px-4 py-1.5 rounded-full border border-brand-primary/50 backdrop-blur-md shadow-[0_0_15px_rgba(40,125,136,0.3)]">
            <Wallet size={16} weight="fill" className="text-brand-primary" />
            <span>{price ? `od ${price} zł / os.` : "Brak ceny"}</span>
          </div>
        </motion.div>

        <motion.h1
          variants={fadeUpVariants}
          className="font-jakarta font-bold text-[40px] md:text-[56px] leading-[1.05] mb-8 drop-shadow-md uppercase max-w-[800px]"
          title="Tytuł edytuje się w kroku 'Dane podstawowe'"
        >
          {title || "TYTUŁ WYJAZDU"}
        </motion.h1>

        {/* Reszta bez zmian (Podtytuł, Tagi, Przycisk) */}
        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-6 py-2 mb-6 border border-white/20 focus-within:border-brand-primary focus-within:bg-black/40 transition-all min-w-[300px] max-w-2xl w-full flex items-center"
        >
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            placeholder="Wpisz chwytliwy podtytuł lub wezwanie do akcji..."
            className="bg-transparent text-white font-montserrat font-medium text-[14px] md:text-[15px] w-full text-center outline-none placeholder:text-white/40 py-1"
          />
        </motion.div>

        <motion.div
          variants={fadeUpVariants}
          className="bg-black/25 backdrop-blur-md rounded-full px-4 py-2.5 mb-8 flex flex-wrap justify-center items-center gap-2 border border-white/20 transition-all hover:bg-black/40 min-h-[46px]"
        >
          {data.tags.length === 0 && !isAddingTag && (
            <span className="text-white/50 text-sm italic mx-2">
              Brak tagów (np. Joga, Spa, Natura)
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

          {isAddingTag ? (
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full border border-white/40">
              <input
                autoFocus
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => confirmTag()}
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
