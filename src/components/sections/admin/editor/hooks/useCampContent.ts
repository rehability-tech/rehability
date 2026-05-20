import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CampBlock } from "./useCampAiGenerator";
export interface CampContentState {
  subtitle: string;
  tags: string[];
  heroImage: string | null;
  description: string;
  blocks: CampBlock[];
  mapUrl: string;
}
export function useCampContent(editId: string | null) {
  const router = useRouter();

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [savingSource, setSavingSource] = useState<
    "auto" | "toolbar" | "bottom" | null
  >(null);
  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);

  const [campTitle, setCampTitle] = useState("");
  const [campData, setCampData] = useState<any>(null);
  const [contentData, setContentData] = useState<CampContentState>({
    subtitle: "",
    tags: [],
    heroImage: null,
    description: "",
    blocks: [],
    mapUrl: "",
  });

  const updateField = useCallback(
    <K extends keyof CampContentState>(
      field: K,
      value: CampContentState[K],
    ) => {
      setContentData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Pobieranie danych
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
        setCampData(data);
        setCampTitle(data.title || "");
        setContentData({
          subtitle: data.subtitle || "",
          tags: data.tags || [],
          heroImage: data.heroImage || null,
          description: data.description || "",
          blocks: data.blocks || [],
          mapUrl: data.mapUrl || "",
        });
      } catch (error) {
        toast.error("Nie udało się załadować danych wyjazdu.");
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchCampData();
  }, [editId, router]);

  // Zapisywanie danych
  const performSave = useCallback(
    async (source: "auto" | "toolbar" | "bottom") => {
      if (!editId) return;
      setSavingSource(source);

      try {
        const response = await fetch(`/api/admin/campy/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentData),
        });

        if (!response.ok) throw new Error();

        if (source === "auto" || source === "toolbar") {
          setShowAutosaveTooltip(true);
          setTimeout(() => setShowAutosaveTooltip(false), 3000);
        }
        if (source !== "auto") toast.success("Zapisano pomyślnie!");
      } catch (error) {
        if (source !== "auto") toast.error("Błąd zapisu!");
      } finally {
        setSavingSource(null);
      }
    },
    [editId, contentData],
  );

  // Autozapis co 30 sekund
  useEffect(() => {
    if (!editId || isFetchingData) return;
    const timeoutId = setTimeout(() => {
      if (!savingSource) performSave("auto");
    }, 30000);
    return () => clearTimeout(timeoutId);
  }, [contentData, editId, isFetchingData, savingSource, performSave]);

  const handleSaveAndNext = async () => {
    await performSave("bottom");
    router.push(`/admin/campy/dodaj/podsumowanie?id=${editId}`);
  };

  return {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    campTitle,
    campData,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  };
}
