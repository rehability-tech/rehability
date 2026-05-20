"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CircleNotch,
  Database,
  Palette,
  Eye,
  Pencil,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion"; // <-- Import Variants

import { Button } from "@/components/ui/Button";
import DataPreviewTab from "./_components/DataPreviewTab";
import DesignPreviewTab from "./_components/DesignPreviewTab";

// --- KONFIGURACJA ANIMACJI ---
// Typowanie jako : Variants naprawia błąd TS z `type: string` zamiast `type: "spring"`
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const tabVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
};

function PodsumowanieContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing] = useState(false);
  const [camp, setCamp] = useState<any>(null);
  const [mainTab, setMainTab] = useState<"dane" | "design">("dane");

  useEffect(() => {
    if (!id) {
      toast.error("Brak identyfikatora wyjazdu. Powrót do listy.");
      router.push("/admin/campy");
      return;
    }

    const abortController = new AbortController();

    const fetchCampData = async () => {
      try {
        const response = await fetch(`/api/admin/campy/${id}`, {
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error("Błąd pobierania danych");
        setCamp(await response.json());
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error(error);
        toast.error("Nie udało się załadować podsumowania wyjazdu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampData();

    return () => abortController.abort();
  }, [id, router]);

  const handlePublishCamp = () => {
    router.push("/admin/campy");
  };

  const handlePreview = () => {
    if (id) window.open(`/oboz/${id}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <CircleNotch
          size={48}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium animate-pulse">
          Generowanie podsumowania...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="pb-24 container !px-0 "
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER + AKCJE */}
      <motion.div
        variants={itemVariants}
        className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6  pb-6"
      >
        <div>
          <h2 className="text-3xl font-jakarta font-bold text-[#0B3B4C]">
            Podsumowanie i weryfikacja
          </h2>
          <p className="text-sm text-gray-500 font-montserrat mt-2">
            Krok 3/3. Sprawdź poprawność wszystkich danych przed publikacją.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handlePublishCamp}
            isLoading={isPublishing}
            disabled={isPublishing}
            className="text-sm font-bold shadow-md hover:shadow-lg transition-all"
            rightIcon={<CheckCircle size={18} weight="bold" />}
          >
            Zatwierdź i opublikuj
          </Button>
        </div>
      </motion.div>

      {/* GŁÓWNY KONTENER */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 w-full"
      >
        {/* PRZEŁĄCZNIK ZAKŁADEK */}
        {/* PRZEŁĄCZNIK ZAKŁADEK (Styl minimalistyczny / Vercel-like) */}
        <div className="flex gap-8 border-b border-gray-200 w-full relative mb-2">
          <button
            onClick={() => setMainTab("dane")}
            className={`relative pb-4 flex items-center justify-center gap-2 font-montserrat font-semibold text-sm transition-colors duration-300 ${
              mainTab === "dane"
                ? "text-[#0B3B4C]"
                : "text-gray-500 hover:text-[#0B3B4C]"
            }`}
          >
            <Database
              size={18}
              weight={mainTab === "dane" ? "duotone" : "bold"}
              className={mainTab === "dane" ? "text-[#0B3B4C]" : ""}
            />
            Dane Systemowe
            {/* Animowany podkreślnik */}
            {mainTab === "dane" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#0B3B4C] rounded-t-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setMainTab("design")}
            className={`relative pb-4 flex items-center justify-center gap-2 font-montserrat font-semibold text-sm transition-colors duration-300 ${
              mainTab === "design"
                ? "text-brand-primary"
                : "text-gray-500 hover:text-brand-primary"
            }`}
          >
            <Palette
              size={18}
              weight={mainTab === "design" ? "duotone" : "bold"}
              className={mainTab === "design" ? "text-brand-primary" : ""}
            />
            Design & Treść
            {/* Animowany podkreślnik */}
            {mainTab === "design" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-brand-primary rounded-t-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>
        {/* RENDEROWANIE TREŚCI ZAKŁADKI */}
        <div className="w-full bg-transparent min-h-[500px] overflow-hidden">
          <AnimatePresence mode="wait">
            {mainTab === "dane" ? (
              <motion.div
                key="dane"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <DataPreviewTab camp={camp} />
              </motion.div>
            ) : (
              <motion.div
                key="design"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <DesignPreviewTab
                  id={id as string}
                  camp={camp}
                  isPublishing={isPublishing}
                  onPublish={handlePublishCamp}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PodsumowaniePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[50vh]">
          <CircleNotch size={40} className="animate-spin text-brand-primary" />
        </div>
      }
    >
      <PodsumowanieContent />
    </Suspense>
  );
}
