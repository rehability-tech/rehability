"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import {
  TextAa,
  X,
  CaretRight,
  CircleNotch,
  Plus,
  Sparkle,
  Tag,
  ImageSquare,
  UploadSimple,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  FormInput,
  FormTextarea,
  FormSelect,
} from "@/app/admin/wyjazdy/dodaj/_components/FormFields";
import { useBlogUploadImage } from "../edytor-tresci/_components/lib/useBlogUploadImage";
import BlogCoverPicker from "../_components/BlogCoverPicker";
import AiGeneratorModal from "@/app/admin/wyjazdy/dodaj/_components/AiGeneratorModal";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "../_components/NeonAiPanel";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/ą/g, "a")
    .replace(/ę/g, "e")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/ć/g, "c")
    .replace(/ń/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

const DEFAULT_CATEGORIES = [
  "Fizjoterapia",
  "Mindfulness",
  "Żywienie",
  "Ruch",
  "Camp Stories",
  "Terapia",
  "Ogólne",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── autogenerate steps (only basic-data scope) ─────────────────────────────

const STEPS_DEF: NeonStep[] = [
  {
    id: "fetch",
    label: "Pobieranie tematu",
    detail: "Ładuję wpis z harmonogramu...",
  },
  {
    id: "ai",
    label: "Generowanie tytułu",
    detail: "AI projektuje tytuł artykułu...",
  },
  {
    id: "excerpt",
    label: "Pisanie opisu",
    detail: "AI tworzy chwytliwy opis...",
  },
  { id: "tags", label: "Dobór tagów", detail: "AI dobiera słowa kluczowe..." },
  {
    id: "save",
    label: "Zapis i przekierowanie",
    detail: "Zapisuję i otwieram edytor treści...",
  },
];

type LiveStep = NeonStep & { status: StepStatus };
const makeSteps = (): LiveStep[] =>
  STEPS_DEF.map((s) => ({ ...s, status: "pending" }));

type LoadingField = "title" | "excerpt" | "tags" | "category" | null;

// ─── main form ───────────────────────────────────────────────────────────────

function BasicDataFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Ogólne");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  // Upload okładki — ta sama logika co w edytorze (Vercel Blob).
  const { upload: uploadCover, isUploading: isUploadingCover } =
    useBlogUploadImage((url) => setCoverImage(url));

  // Picker okładki (Pexels / własne). pendingScheduleId !== null oznacza,
  // że picker jest pierwszym krokiem auto-generacji i po wyborze ruszamy dalej.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(
    null,
  );

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [aiCategorySuggestions, setAiCategorySuggestions] = useState<string[]>(
    [],
  );

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // ── autogenerate state ──
  const [autoSteps, setAutoSteps] = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [loadingField, setLoadingField] = useState<LoadingField>(null);
  const [autoLiveMsg, setAutoLiveMsg] = useState<string | undefined>();
  const autoStarted = useRef(false);

  const buildRateStatus = (resumeMsg: string) => (status: RateStatus) => {
    if (status.kind === "waiting") {
      const prefix =
        status.reason === "ratelimit"
          ? "⏸ Limit Gemini — wznowię za"
          : `⚠ Błąd Gemini — ponawiam (${status.attempt}/${status.maxAttempts}) za`;
      setAutoLiveMsg(`${prefix} ${status.countdown}s`);
    } else {
      setAutoLiveMsg(resumeMsg);
    }
  };

  const updateStep = useCallback(
    (id: string, status: StepStatus, detail?: string) => {
      setAutoSteps((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, ...(detail ? { detail } : {}) } : s,
        ),
      );
    },
    [],
  );

  // ─── autogenerate (basic data only) ──────────────────────────────────────

  const runAutoGenerate = useCallback(
    async (scheduleId: string, coverUrl: string) => {
      try {
        // 1 – fetch schedule entry
        updateStep("fetch", "active");
        const entryRes = await fetch(`/api/admin/blog/schedule/${scheduleId}`);
        if (!entryRes.ok)
          throw new Error("Nie udało się pobrać tematu z harmonogramu.");
        const entry = await entryRes.json();
        updateStep("fetch", "done");

        // ensure category list contains the schedule one
        if (entry.category && !DEFAULT_CATEGORIES.includes(entry.category)) {
          setCategories((prev) =>
            prev.includes(entry.category) ? prev : [...prev, entry.category],
          );
        }

        // 2 – call AI for basic data once
        const basicPrompt = [
          entry.title,
          entry.topic,
          `Kategoria: ${entry.category}`,
          `Słowa kluczowe: ${(entry.keywords as string[]).join(", ")}`,
        ].join("\n");

        updateStep("ai", "active");
        setLoadingField("title");
        const basicRes = await geminiFetch(
          "/api/admin/gemini",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: basicPrompt,
              action: "generateBlogBasicData",
            }),
          },
          {
            onStatus: buildRateStatus(
              "AI generuje dane podstawowe artykułu...",
            ),
          },
        );
        if (!basicRes.ok)
          throw new Error("Błąd generowania danych podstawowych.");
        const basicData = await basicRes.json();

        // reveal title with a short neon flash
        const finalTitle = basicData.title || entry.title;
        setTitle(finalTitle);
        await sleep(450);
        setLoadingField(null);
        updateStep("ai", "done");

        // 3 – excerpt
        updateStep("excerpt", "active");
        setLoadingField("excerpt");
        await sleep(450);
        setExcerpt(basicData.excerpt || "");
        await sleep(450);
        setLoadingField(null);
        updateStep("excerpt", "done");

        // 4 – tags + category
        updateStep("tags", "active");
        setLoadingField("tags");
        await sleep(450);
        const finalTags: string[] =
          Array.isArray(basicData.tags) && basicData.tags.length
            ? basicData.tags
            : entry.keywords || [];
        setTags(finalTags);
        if (
          Array.isArray(basicData.categorySuggestions) &&
          basicData.categorySuggestions.length
        ) {
          setAiCategorySuggestions(basicData.categorySuggestions);
        }
        setCategory(entry.category || "Ogólne");
        await sleep(500);
        setLoadingField(null);
        updateStep("tags", "done");

        // 5 – save & redirect to editor with autogenerate flag
        updateStep("save", "active");
        const slug = slugify(finalTitle);
        const saveRes = await fetch("/api/admin/blog/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: finalTitle,
            slug,
            excerpt: basicData.excerpt || "",
            coverImage: coverUrl,
            category: entry.category,
            tags: finalTags,
            lastStage: "edytor-tresci",
            scheduleId,
          }),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json();
          throw new Error(err.error || "Błąd zapisu danych podstawowych.");
        }
        const { postId } = await saveRes.json();
        updateStep("save", "done");

        await sleep(700);
        router.push(
          `/admin/blog/dodaj/edytor-tresci?id=${postId}&autogenerate=true&scheduleId=${scheduleId}`,
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Nieznany błąd generowania.";
        setLoadingField(null);
        setAutoSteps((prev) =>
          prev.map((s) =>
            s.status === "active" ? { ...s, status: "error", detail: msg } : s,
          ),
        );
      }
    },
    [router, updateStep],
  );

  // ─── detect autogenerate param on mount ──────────────────────────────────
  // Krok 0 auto-generacji: zamiast od razu lecieć przez AI, najpierw otwieramy
  // picker okładki. Po wyborze zdjęcia (Pexels lub własne) startuje reszta.

  useEffect(() => {
    if (autoStarted.current) return;
    const autoGenParam = searchParams.get("autogenerate");
    const scheduleId = searchParams.get("scheduleId");
    if (autoGenParam !== "true" || !scheduleId) return;

    autoStarted.current = true;
    // strip query so a refresh doesn't restart the flow
    router.replace(
      `/admin/blog/dodaj/dane-podstawowe?scheduleId=${scheduleId}`,
    );
    setPendingScheduleId(scheduleId);

    // Pobieramy temat, żeby zaproponować trafną frazę dla wyszukiwarki Pexels.
    (async () => {
      try {
        const res = await fetch(`/api/admin/blog/schedule/${scheduleId}`);
        if (res.ok) {
          const entry = await res.json();
          const seed =
            (Array.isArray(entry.keywords) && entry.keywords[0]) ||
            entry.category ||
            entry.title ||
            "";
          setPickerQuery(String(seed));
        }
      } catch {
        /* brak frazy — user wpisze sam */
      } finally {
        setPickerOpen(true);
      }
    })();
  }, [searchParams, router]);

  // ─── cover picker handlers ───────────────────────────────────────────────

  const handleCoverSelected = (url: string) => {
    setCoverImage(url);
    setPickerOpen(false);
    // Tryb auto-generacji: po wyborze okładki ruszamy z resztą sekwencji.
    if (pendingScheduleId) {
      const sid = pendingScheduleId;
      setPendingScheduleId(null);
      setAutoSteps(makeSteps());
      setIsAutoRunning(true);
      runAutoGenerate(sid, url);
    }
  };

  const handlePickerClose = () => {
    // W auto-generacji okładka jest obowiązkowa — wyjście wraca do listy.
    if (pendingScheduleId) {
      router.push("/admin/blog");
      return;
    }
    setPickerOpen(false);
  };

  // ─── edit mode: load existing post ───────────────────────────────────────

  useEffect(() => {
    if (!editId) return;
    const fetchPost = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/blog/${editId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTitle(data.title || "");
        setExcerpt(data.excerpt || "");
        setCategory(data.category || "Ogólne");
        setTags(data.tags || []);
        setCoverImage(data.coverImage || "");
        if (data.category && !DEFAULT_CATEGORIES.includes(data.category)) {
          setCategories((prev) => [...prev, data.category]);
        }
      } catch {
        toast.error("Nie udało się załadować artykułu.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchPost();
  }, [editId]);

  // ─── category helpers ─────────────────────────────────────────────────────

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed))
      setCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setNewCategoryInput("");
  };

  // ─── AI quick-fill modal ──────────────────────────────────────────────────

  const handleAiSubmit = async (prompt: string, modelType: string) => {
    setIsAiModalOpen(false);
    setIsAiGenerating(true);
    try {
      const res = await geminiFetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: modelType,
          action: "generateBlogBasicData",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (Array.isArray(data.tags) && data.tags.length) setTags(data.tags);
      if (
        Array.isArray(data.categorySuggestions) &&
        data.categorySuggestions.length
      ) {
        setAiCategorySuggestions(data.categorySuggestions);
      }
      toast.success("AI wypełniło dane artykułu.");
    } catch {
      toast.error("Nie udało się wygenerować danych przez AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ─── save & next ─────────────────────────────────────────────────────────

  const handleSaveAndNext = async () => {
    if (!title.trim()) {
      toast.error("Tytuł jest wymagany.");
      return;
    }
    if (!coverImage) {
      toast.error("Dodaj okładkę artykułu — jest wymagana.");
      return;
    }
    const slug = slugify(title);
    if (!slug) {
      toast.error("Nie udało się wygenerować sluga z tytułu.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/blog/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title,
          slug,
          excerpt,
          coverImage,
          category,
          tags,
          lastStage: "edytor-tresci",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
      router.push(
        `/admin/blog/dodaj/edytor-tresci?id=${result.postId || editId}`,
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się zapisać artykułu.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie artykułu...
        </p>
      </div>
    );
  }

  // Manualne „Generuj z AI" to jeden request bez sekwencyjnego loadingField,
  // więc OR-ujemy isAiGenerating — wtedy wszystkie pola skanują się przez całą generację.
  // Autogeneracja z harmonogramu nadal odsłania pola po kolei (loadingField).
  const titleLoading = loadingField === "title" || isAiGenerating;
  const excerptLoading = loadingField === "excerpt" || isAiGenerating;
  const tagsLoading = loadingField === "tags" || isAiGenerating;
  const categoryLoading =
    loadingField === "category" || loadingField === "tags" || isAiGenerating;

  return (
    <>
      {/* ── floating neon AI panel ── */}
      <AnimatePresence>
        {isAutoRunning && (
          <NeonAiPanel
            title="Agent AI · Dane podstawowe"
            steps={autoSteps}
            onAbort={() => router.push("/admin/blog")}
            liveMessage={autoLiveMsg}
          />
        )}
      </AnimatePresence>

      <div className="animate-in fade-in duration-500">
        {/* ── header ── */}
        <div className="mb-6 flex items-start justify-between gap-4 max-[495px]:flex-col  max-[495px]:text-center  max-[495px]:items-center  max-[495px]:mb-3 ">
          <div>
            <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
              {editId ? "Edytuj dane podstawowe" : "Dane podstawowe artykułu"}
            </h2>
            <p className="text-sm text-gray-500 font-montserrat mt-1">
              Tytuł, krótki opis i klasyfikacja artykułu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            disabled={isAiGenerating || isAutoRunning}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold rounded-[12px] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed  max-[495px]:text-md"
          >
            {isAiGenerating ? (
              <CircleNotch size={16} weight="bold" className="animate-spin" />
            ) : (
              <Sparkle size={16} weight="fill" />
            )}
            {isAiGenerating ? "Generuję..." : "Generuj z AI"}
          </button>
        </div>

        <form className="flex flex-col gap-10">
          {/* ── okładka (wymagana, przed tytułem) ── */}
          <section>
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Okładka <span className="text-brand-primary">*</span>
            </h3>

            {coverImage ? (
              <div className="relative group w-full overflow-hidden rounded-2xl rounded-tr-none border border-gray-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Okładka artykułu"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerQuery(title || "");
                      setPickerOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md text-brand-primary text-[12px] font-semibold rounded-full shadow-sm hover:bg-white transition-colors"
                  >
                    <MagnifyingGlass size={15} weight="bold" />
                    Pexels
                  </button>
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md text-brand-secondary text-[12px] font-semibold rounded-full shadow-sm hover:bg-white transition-colors">
                    <UploadSimple size={15} weight="bold" />
                    Zmień
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={isUploadingCover}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="flex items-center justify-center w-9 h-9 bg-white/90 backdrop-blur-md text-red-500 rounded-full shadow-sm hover:bg-white transition-colors"
                    title="Usuń okładkę"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
              <label className="relative flex flex-col items-center justify-center gap-3 w-full min-h-[180px] rounded-2xl rounded-tr-none border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 cursor-pointer hover:border-brand-primary/60 hover:bg-brand-primary/[0.08] transition-colors text-center px-4 py-8">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isUploadingCover}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCover(f);
                    e.currentTarget.value = "";
                  }}
                />
                {isUploadingCover ? (
                  <>
                    <CircleNotch
                      size={28}
                      weight="bold"
                      className="text-brand-primary animate-spin"
                    />
                    <span className="text-sm font-montserrat font-semibold text-brand-primary">
                      Przesyłanie okładki...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl rounded-tr-none bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <ImageSquare size={26} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-sm font-montserrat font-bold text-brand-secondary">
                        Dodaj okładkę artykułu
                      </p>
                      <p className="text-[12px] font-montserrat text-brand-secondary/50 mt-0.5">
                        Kliknij, aby wybrać zdjęcie · JPG/PNG · wymagane
                      </p>
                    </div>
                  </>
                )}
              </label>
              <button
                type="button"
                onClick={() => {
                  setPickerQuery(title || "");
                  setPickerOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold transition-colors"
              >
                <MagnifyingGlass size={16} weight="bold" />
                lub wybierz z biblioteki Pexels
              </button>
              </div>
            )}
          </section>

          {/* ── identyfikacja ── */}
          <section>
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Identyfikacja
            </h3>
            <div className="flex flex-col gap-5">
              <FormInput
                label="Tytuł artykułu"
                required
                icon={<TextAa size={18} />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. 5 ćwiczeń na zdrowy kręgosłup"
                isLoading={titleLoading}
              />
              <FormTextarea
                label="Krótki opis (excerpt)"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="1–2 zdania zachęcające do przeczytania. Pojawi się na liście blogów i w SEO."
                rows={3}
                isLoading={excerptLoading}
              />
            </div>
          </section>

          {/* ── kategoria ── */}
          <section>
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Kategoria
            </h3>
            <div className="flex flex-col gap-2.5 w-full sm:max-w-sm">
              <FormSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                isLoading={categoryLoading}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FormSelect>

              <div className="flex gap-2">
                <input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="Dodaj własną kategorię..."
                  className="flex-1 min-w-0 bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[14px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryInput.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-primary text-white rounded-[14px] font-semibold text-sm shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)] hover:bg-[#1E6068] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} weight="bold" />
                  <span>Dodaj</span>
                </button>
              </div>

              {aiCategorySuggestions.length > 0 && (
                <div className="mt-1">
                  <p className="text-[11px] text-gray-400 font-montserrat font-semibold uppercase tracking-wide mb-1.5">
                    Sugestie AI
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiCategorySuggestions.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`text-xs font-semibold font-montserrat px-2.5 py-1 rounded-full transition-colors ${
                          category === cat
                            ? "bg-brand-primary text-white"
                            : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── tagi ── */}
          {(tags.length > 0 || tagsLoading) && (
            <section>
              <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Tagi{" "}
                <span className="normal-case font-normal ml-1">
                  (generowane przez AI)
                </span>
              </h3>
              <div className="relative z-0 inline-block w-full">
                <div
                  className={cn(
                    "flex flex-wrap gap-2 min-h-[40px] rounded-[12px] transition-all",
                    tagsLoading && "p-2 bg-gray-50/50",
                  )}
                >
                  {tags.length === 0 && tagsLoading && (
                    <span className="text-[11px] text-gray-400 font-montserrat italic px-2 py-1">
                      AI dobiera tagi...
                    </span>
                  )}
                  {tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-sm font-semibold font-montserrat px-3 py-1 rounded-full"
                    >
                      <Tag size={12} weight="bold" />
                      {tag}
                    </motion.span>
                  ))}
                </div>
                <AnimatePresence>
                  {tagsLoading && (
                    <motion.div
                      key="tags-glow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-20 rounded-[12px] overflow-hidden shadow-[0_0_12px_7px_rgba(40,125,136,0.3)] pointer-events-none"
                    >
                      <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "linear",
                        }}
                        className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* ── zapis ── */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100">
            <Link
              href="/admin/blog"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              <X size={18} weight="bold" />
              Anuluj
            </Link>
            <Button
              onClick={handleSaveAndNext}
              isLoading={isSaving}
              disabled={
                !title ||
                !coverImage ||
                isUploadingCover ||
                isSaving ||
                isAutoRunning
              }
              rightIcon={<CaretRight size={18} weight="bold" />}
            >
              Dalej: Edytor treści
            </Button>
          </div>
        </form>

        <AiGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onSubmit={handleAiSubmit}
          prompt={aiPrompt}
          setPrompt={setAiPrompt}
          description="Opisz temat artykułu. AI wygeneruje tytuł, krótki opis, zaproponuje kategorie i doda tagi."
          placeholder="np. Artykuł o ćwiczeniach rozciągających dla osób pracujących przy biurku..."
        />

        <BlogCoverPicker
          isOpen={pickerOpen}
          onClose={handlePickerClose}
          onSelect={handleCoverSelected}
          defaultQuery={pickerQuery}
          mandatory={!!pendingScheduleId}
        />
      </div>
    </>
  );
}

export default function BlogBasicDataPage() {
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
      <BasicDataFormContent />
    </Suspense>
  );
}
