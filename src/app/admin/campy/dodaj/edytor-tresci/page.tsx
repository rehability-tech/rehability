"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

// Importy naszych sub-komponentów
import EditableHero from "@/components/sections/admin/campy/edytor/EditableHero";
import EditorToolbar from "./lib/EditorToolbar";
import BlockAdder from "./lib/BlockAdder";
import BlockEditorCard from "./lib/BlockEditorCard";
import CampBlocksBuilder from "./lib/CampBlockBuilder";

// ============================================================================
// TYPY DANYCH
// ============================================================================
export type BlockType =
  | "heading"
  | "paragraph"
  | "featuresGrid"
  | "pricingList"
  | "highlight"
  | "spacer" // <-- DODANA PRZERWA
  | "bulletList"
  | "faq"; // <-- DODANA PRZERWA

export interface CampBlock {
  id: string;
  type: BlockType;
  content: any; // Tu trzymamy bezpośrednio dane bloku
}

export interface CampContentState {
  subtitle: string;
  tags: string[];
  heroImage: string | null;
  description: string;
  blocks: CampBlock[];
}
// ============================================================================
// GŁÓWNY KOMPONENT KREATORA
// ============================================================================
function ContentEditorFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [campTitle, setCampTitle] = useState("");
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [savingSource, setSavingSource] = useState<
    "auto" | "toolbar" | "bottom" | null
  >(null);

  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);
  const [contentData, setContentData] = useState<CampContentState>({
    subtitle: "",
    tags: [],
    heroImage: null,
    description: "",
    blocks: [],
  });

  const updateField = <K extends keyof CampContentState>(
    field: K,
    value: CampContentState[K],
  ) => {
    setContentData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!editId) {
      toast.error("Brak ID wyjazdu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/campy/dodaj/dane-podstawowe");
      return;
    }

    const fetchCampData = async () => {
      setIsFetchingData(true);
      try {
        const response = await fetch(`/api/admin/campy/${editId}`);
        if (!response.ok) throw new Error("Błąd pobierania danych");
        const data = await response.json();

        setCampTitle(data.title || "");
        setContentData({
          subtitle: data.subtitle || "",
          tags: data.tags || [],
          heroImage: data.heroImage || null,
          description: data.description || "",
          blocks: data.blocks || [],
        });
      } catch (error) {
        toast.error("Nie udało się załadować danych wyjazdu.");
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchCampData();
  }, [editId, router]);

  const performSave = async (source: "auto" | "toolbar" | "bottom") => {
    if (!editId) return;

    setSavingSource(source);
    let loadingToast;

    try {
      const response = await fetch(`/api/admin/campy/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      });

      if (!response.ok) throw new Error();

      // Jeśli autozapis się udał:
      if (source === "auto" || source === "toolbar") {
        setShowAutosaveTooltip(true);
        setTimeout(() => setShowAutosaveTooltip(false), 3000);
      }
      if (source !== "auto") toast.success("Zapisano!", { id: loadingToast });
    } catch (error) {
      if (source !== "auto") toast.error("Błąd zapisu", { id: loadingToast });
    } finally {
      setSavingSource(null);
    }
  };

  // AUTOZAPIS: Uruchamia się co 60 sekund
  useEffect(() => {
    // Nie odpalaj, jeśli jeszcze nie pobrano danych z bazy
    if (!editId || isFetchingData) return;

    const timeoutId = setTimeout(() => {
      if (!savingSource) {
        performSave("auto");
      }
    }, 30000); // 5000 ms = 5 sekund ciszy

    // Z każdą nową literką (zmianą contentData), czyścimy stary timer i liczymy 5s od nowa
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentData]); // Reaguj na zmiany danych

  // MANUALNY ZAPIS I PRZEJŚCIE DALEJ
  const handleSaveAndNext = async () => {
    await performSave("bottom"); // Tutaj chcemy toasta potwierdzającego
    router.push(`/admin/campy/dodaj/podsumowanie?id=${editId}`);
  };
  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie treści wyjazdu...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative pb-24"
    >
      <div className="mb-6">
        <h2 className="text-[22px] md:text-[26px] font-jakarta font-bold text-[#0B3B4C]">
          Kreator: Edytor treści wyjazdu
        </h2>
        <p className="text-[14px] text-gray-500 font-montserrat mt-1">
          Krok 2/3. Opowiedz o wyjeździe i zbuduj stronę z przygotowanych
          modułów.
        </p>
      </div>

      <div className="flex flex-col gap-8 relative z-0">
        <EditableHero
          title={campTitle}
          data={contentData}
          updateField={updateField}
        />

        <div className="relative bg-white rounded-[32px] p-2 md:p-4 min-h-[500px]">
          <div className="absolute top-6 bottom-6 right-6 z-50 pointer-events-none w-10 hidden lg:block">
            <EditorToolbar
              onSave={() => performSave("toolbar")}
              isSaving={savingSource === "auto" || savingSource === "toolbar"}
              showAutosaveTooltip={showAutosaveTooltip}
              onAiClick={() => toast.info("Wkrótce!")}
              onPreviewClick={() => toast.info("Wkrótce!")}
            />
          </div>

          <CampBlocksBuilder
            blocks={contentData.blocks}
            onChange={(newBlocks) => updateField("blocks", newBlocks)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200">
        <Link
          href={`/admin/campy/dodaj/dane-podstawowe${editId ? `?id=${editId}` : ""}`}
        >
          <Button
            variant="secondary"
            rightIcon={<CaretLeft size={18} weight="bold" />}
          >
            Wstecz
          </Button>
        </Link>

        <Button
          onClick={handleSaveAndNext}
          isLoading={savingSource === "bottom"} // <-- ODDZIELNY STAN!
          disabled={savingSource !== null}
          rightIcon={<CaretRight size={18} weight="bold" />}
        >
          Zapisz i kontynuuj
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// GŁÓWNY EKSPORT Z SUSPENSE
// ============================================================================
export default function ContentEditorStepPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch
            size={40}
            weight="bold"
            className="text-brand-primary animate-spin"
          />
        </div>
      }
    >
      <ContentEditorFormContent />
    </Suspense>
  );
}
