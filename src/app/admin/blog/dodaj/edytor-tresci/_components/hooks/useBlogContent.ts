import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BlogBlock } from "./useBlogAiGenerator";

export interface BlogContentState {
  blocks: BlogBlock[];
}

export function useBlogContent(postId: string | null) {
  const router = useRouter();

  const [isFetchingData, setIsFetchingData] = useState(false);
  const [savingSource, setSavingSource] = useState<"auto" | "toolbar" | "bottom" | null>(null);
  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [contentData, setContentData] = useState<BlogContentState>({ blocks: [] });

  const updateField = useCallback(<K extends keyof BlogContentState>(field: K, value: BlogContentState[K]) => {
    setContentData((prev) => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (!postId) {
      toast.error("Brak ID artykułu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/blog/dodaj/dane-podstawowe");
      return;
    }

    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error("Błąd pobierania danych");
        const data = await res.json();
        setPostTitle(data.title || "");
        const blocks = Array.isArray(data.content) ? data.content : [];
        setContentData({ blocks });
      } catch {
        toast.error("Nie udało się załadować treści artykułu.");
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [postId, router]);

  const performSave = useCallback(
    async (source: "auto" | "toolbar" | "bottom") => {
      if (!postId) return;
      setSavingSource(source);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "content", content: contentData.blocks }),
        });
        // Post zniknął z bazy (usunięty / reset bazy). Ostrzeż ZAWSZE — także przy
        // autosave — żeby użytkownik nie edytował „w próżnię" i nie tracił zmian.
        if (res.status === 404) {
          toast.error(
            "Ten artykuł już nie istnieje w bazie (mógł zostać usunięty lub baza została zresetowana). Zapis jest niemożliwy.",
          );
          return;
        }
        if (!res.ok) throw new Error();
        if (source === "auto" || source === "toolbar") {
          setShowAutosaveTooltip(true);
          setTimeout(() => setShowAutosaveTooltip(false), 3000);
        }
        if (source !== "auto") toast.success("Zapisano pomyślnie!");
      } catch {
        if (source !== "auto") toast.error("Błąd zapisu!");
      } finally {
        setSavingSource(null);
      }
    },
    [postId, contentData],
  );

  useEffect(() => {
    if (!postId || isFetchingData) return;
    const id = setTimeout(() => {
      if (!savingSource) performSave("auto");
    }, 30000);
    return () => clearTimeout(id);
  }, [contentData, postId, isFetchingData, savingSource, performSave]);

  const handleSaveAndNext = async () => {
    await performSave("bottom");
    router.push(`/admin/blog/dodaj/seo?id=${postId}`);
  };

  return {
    isFetchingData,
    savingSource,
    showAutosaveTooltip,
    postTitle,
    contentData,
    updateField,
    performSave,
    handleSaveAndNext,
  };
}
