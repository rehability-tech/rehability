import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TripBlock } from "./useTripAiGenerator";
export interface CampContentState {
  subtitle: string;
  tags: string[];
  heroImage: string | null;
  description: string;
  blocks: TripBlock[];
  mapUrl: string;
}
export function useTripContent(editId: string | null) {
  const router = useRouter();

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [savingSource, setSavingSource] = useState<
    "auto" | "toolbar" | "bottom" | null
  >(null);
  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);

  const [tripTitle, setTripTitle] = useState("");
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
      value:
        | CampContentState[K]
        | ((prev: CampContentState[K]) => CampContentState[K]),
    ) => {
      setContentData((prev) => ({
        ...prev,
        [field]:
          typeof value === "function"
            ? (value as (p: CampContentState[K]) => CampContentState[K])(
                prev[field],
              )
            : value,
      }));
    },
    [],
  );

  // Pobieranie danych
  useEffect(() => {
    if (!editId) {
      toast.error("Brak ID wyjazdu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/wyjazdy/dodaj/dane-podstawowe");
      return;
    }

    const fetchCampData = async () => {
      setIsFetchingData(true);
      try {
        const response = await fetch(`/api/admin/wyjazdy/${editId}`);
        if (!response.ok) throw new Error("Błąd pobierania danych");
        const data = await response.json();
        setCampData(data);
        setTripTitle(data.title || "");
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
        const response = await fetch(`/api/admin/wyjazdy/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentData),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Błąd zapisu");
        }

        if (source === "auto" || source === "toolbar") {
          setShowAutosaveTooltip(true);
          setTimeout(() => setShowAutosaveTooltip(false), 3000);
        }
        if (source !== "auto") toast.success("Zapisano pomyślnie!");
      } catch (error: any) {
        if (source !== "auto")
          toast.error(error?.message || "Błąd zapisu!");
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
    // Krok "E-mail" (zaproszenia) istnieje tylko gdy wyjazd pozwala zabrać osobę
    // towarzyszącą. Inaczej przeskakujemy od razu do SEO — spójnie ze stepperem.
    const nextStep = campData?.allowBringFriend
      ? `/admin/wyjazdy/dodaj/zaproszenia?id=${editId}`
      : `/admin/wyjazdy/dodaj/seo?id=${editId}`;
    router.push(nextStep);
  };

  return {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    tripTitle,
    campData,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  };
}
