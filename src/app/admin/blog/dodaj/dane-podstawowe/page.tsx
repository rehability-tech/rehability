"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import {
  TextAa, X, CaretRight, CircleNotch, Plus, Sparkle, Tag,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FormInput, FormTextarea } from "@/app/admin/campy/dodaj/_components/FormFields";
import AiGeneratorModal from "@/app/admin/campy/dodaj/_components/AiGeneratorModal";
import AutoGenerateOverlay, {
  type AutoGenStep,
  type StepStatus,
} from "../_components/AutoGenerateOverlay";

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/ą/g, "a").replace(/ę/g, "e")
    .replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z")
    .replace(/ż/g, "z").replace(/ć/g, "c").replace(/ń/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

const DEFAULT_CATEGORIES = [
  "Fizjoterapia", "Mindfulness", "Żywienie", "Ruch", "Camp Stories", "Terapia", "Ogólne",
];

// ─── autogenerate steps ──────────────────────────────────────────────────────

const STEPS_DEF: AutoGenStep[] = [
  { id: "fetch",      label: "Pobieranie tematu z harmonogramu",  detail: "Ładowanie sugestii z bazy danych..." },
  { id: "basic",      label: "Generowanie danych podstawowych",   detail: "AI tworzy tytuł, opis i tagi artykułu..." },
  { id: "save-basic", label: "Zapisywanie danych podstawowych",   detail: "Artykuł rejestrowany w bazie..." },
  { id: "blueprint",  label: "Planowanie struktury artykułu",     detail: "AI projektuje układ sekcji i bloków..." },
  { id: "content",    label: "Pisanie treści artykułu",           detail: "AI wypełnia każdy blok treścią..." },
  { id: "seo",        label: "Generowanie metadanych SEO",        detail: "AI optymalizuje tytuł i opis dla Google..." },
  { id: "finalize",   label: "Finalizacja i zapis",               detail: "Wszystko gotowe!" },
];

type LiveStep = AutoGenStep & { status: StepStatus };

function makeSteps(): LiveStep[] {
  return STEPS_DEF.map((s) => ({ ...s, status: "pending" }));
}

// ─── main form ───────────────────────────────────────────────────────────────

function BasicDataFormContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("id");

  const [title, setTitle]       = useState("");
  const [excerpt, setExcerpt]   = useState("");
  const [category, setCategory] = useState("Ogólne");
  const [tags, setTags]         = useState<string[]>([]);

  const [categories, setCategories]                       = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput]           = useState("");
  const [aiCategorySuggestions, setAiCategorySuggestions] = useState<string[]>([]);

  const [isAiModalOpen, setIsAiModalOpen]   = useState(false);
  const [aiPrompt, setAiPrompt]             = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [isSaving, setIsSaving]     = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // ── autogenerate state ──
  const [autoSteps, setAutoSteps]     = useState<LiveStep[]>(makeSteps());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoStarted = useRef(false);

  // ─── helpers ──

  const updateStep = useCallback((id: string, status: StepStatus, detail?: string) => {
    setAutoSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status, ...(detail ? { detail } : {}) } : s,
      ),
    );
  }, []);

  // ─── full autogenerate sequence ──────────────────────────────────────────

  const runAutoGenerate = useCallback(
    async (scheduleId: string) => {
      try {
        // 1 – fetch schedule entry
        updateStep("fetch", "active");
        const entryRes = await fetch(`/api/admin/blog/schedule/${scheduleId}`);
        if (!entryRes.ok) throw new Error("Nie udało się pobrać tematu z harmonogramu.");
        const entry = await entryRes.json();
        updateStep("fetch", "done");

        // 2 – generate basic data
        updateStep("basic", "active");
        const basicPrompt = [
          entry.title,
          entry.topic,
          `Kategoria: ${entry.category}`,
          `Słowa kluczowe: ${(entry.keywords as string[]).join(", ")}`,
        ].join("\n");
        const basicRes = await fetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: basicPrompt, action: "generateBlogBasicData" }),
        });
        if (!basicRes.ok) throw new Error("Błąd generowania danych podstawowych.");
        const basicData = await basicRes.json();
        updateStep("basic", "done");

        // 3 – save basic data
        updateStep("save-basic", "active");
        const finalTitle = basicData.title || entry.title;
        const slug       = slugify(finalTitle);
        const saveRes = await fetch("/api/admin/blog/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:     finalTitle,
            slug,
            excerpt:   basicData.excerpt || "",
            category:  entry.category,
            tags:      basicData.tags || entry.keywords || [],
            lastStage: "edytor-tresci",
          }),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json();
          throw new Error(err.error || "Błąd zapisu danych podstawowych.");
        }
        const { postId } = await saveRes.json();
        updateStep("save-basic", "done");

        // 4 – generate blog blueprint
        updateStep("blueprint", "active");
        const overallContext = [
          `Tytuł: ${finalTitle}`,
          `Kategoria: ${entry.category}`,
          `Opis: ${basicData.excerpt || ""}`,
          `Temat: ${entry.topic}`,
          `Słowa kluczowe: ${(entry.keywords as string[]).join(", ")}`,
        ].join("\n");
        const bpRes = await fetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: overallContext, action: "generateBlogBlueprint" }),
        });
        if (!bpRes.ok) throw new Error("Błąd planowania struktury artykułu.");
        const { blueprint } = await bpRes.json();
        updateStep("blueprint", "done");

        // 5 – generate each block, then save
        updateStep("content", "active", `AI pisze bloki artykułu (0 / ${blueprint.length})...`);
        const blocks: any[] = blueprint.map((step: any) => ({
          id: crypto.randomUUID(),
          type: step.type,
          content: {},
          isGenerating: true,
        }));

        for (let i = 0; i < blueprint.length; i++) {
          const step = blueprint[i];
          updateStep("content", "active", `AI pisze bloki artykułu (${i + 1} / ${blueprint.length})...`);
          try {
            const blockRes = await fetch("/api/admin/gemini", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "generateSingleBlock",
                prompt: overallContext,
                overallContext,
                blockType: step.type,
                topic: step.topic,
              }),
            });
            if (!blockRes.ok) throw new Error();
            let blockContent = await blockRes.json();

            // Normalize nested response
            if (blockContent.content && typeof blockContent.content === "object" && !Array.isArray(blockContent.content))
              blockContent = blockContent.content;
            if (blockContent[step.type] && typeof blockContent[step.type] === "object" && !Array.isArray(blockContent[step.type]))
              blockContent = blockContent[step.type];
            if (blockContent.type) delete blockContent.type;
            if (["bulletList", "featuresGrid", "faq"].includes(step.type) && !blockContent.items)
              blockContent.items = [];
            if (["heading", "paragraph", "highlight"].includes(step.type) && !blockContent.text)
              blockContent.text = "";

            blocks[i] = { ...blocks[i], content: blockContent, isGenerating: false };
          } catch {
            blocks[i] = { ...blocks[i], content: { text: "" }, isGenerating: false };
          }
        }

        const cSaveRes = await fetch(`/api/admin/blog/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "content", content: blocks }),
        });
        if (!cSaveRes.ok) throw new Error("Błąd zapisu treści.");
        updateStep("content", "done");

        // 6 – generate SEO
        updateStep("seo", "active");
        const seoPrompt = [
          `Tytuł: ${finalTitle}`,
          `Opis: ${basicData.excerpt || ""}`,
          `Słowa kluczowe: ${(entry.keywords as string[]).join(", ")}`,
        ].join("\n");
        const seoRes = await fetch("/api/admin/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: seoPrompt, action: "generateBlogSeo" }),
        });
        if (!seoRes.ok) throw new Error("Błąd generowania SEO.");
        const seoData = await seoRes.json();
        updateStep("seo", "done");

        // 7 – save SEO + finalize
        updateStep("finalize", "active");
        const seoSaveRes = await fetch(`/api/admin/blog/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:          "seo",
            metaTitle:       seoData.metaTitle        || finalTitle,
            metaDescription: seoData.metaDescription  || basicData.excerpt || "",
            focusKeyword:    seoData.focusKeyword      || "",
            noIndex:         false,
          }),
        });
        if (!seoSaveRes.ok) throw new Error("Błąd zapisu SEO.");
        updateStep("finalize", "done");

        // 🎉 redirect after short celebration
        setTimeout(() => router.push("/admin/blog"), 1800);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Nieznany błąd generowania.";
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

  useEffect(() => {
    if (autoStarted.current) return;
    const autoGenParam = searchParams.get("autogenerate");
    const scheduleId   = searchParams.get("scheduleId");
    if (autoGenParam !== "true" || !scheduleId) return;

    autoStarted.current = true;
    router.replace(`/admin/blog/dodaj/dane-podstawowe?scheduleId=${scheduleId}`);
    setAutoSteps(makeSteps());
    setIsAutoRunning(true);
    runAutoGenerate(scheduleId);
  }, [searchParams, router, runAutoGenerate]);

  // ─── edit mode: load existing post ───────────────────────────────────────

  useEffect(() => {
    if (!editId) return;
    const fetchPost = async () => {
      setIsFetching(true);
      try {
        const res  = await fetch(`/api/admin/blog/${editId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTitle(data.title || "");
        setExcerpt(data.excerpt || "");
        setCategory(data.category || "Ogólne");
        setTags(data.tags || []);
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
    if (!categories.includes(trimmed)) setCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setNewCategoryInput("");
  };

  // ─── AI quick-fill modal ──────────────────────────────────────────────────

  const handleAiSubmit = async (prompt: string, modelType: string) => {
    setIsAiModalOpen(false);
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: modelType, action: "generateBlogBasicData" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.title)   setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (Array.isArray(data.tags) && data.tags.length)  setTags(data.tags);
      if (Array.isArray(data.categorySuggestions) && data.categorySuggestions.length) {
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
    if (!title.trim()) { toast.error("Tytuł jest wymagany."); return; }
    const slug = slugify(title);
    if (!slug)  { toast.error("Nie udało się wygenerować sluga z tytułu."); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/blog/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, title, slug, excerpt, category, tags, lastStage: "edytor-tresci" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
      router.push(`/admin/blog/dodaj/edytor-tresci?id=${result.postId || editId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać artykułu.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin mb-4" />
        <p className="text-gray-500 font-montserrat font-medium">Ładowanie artykułu...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── autogenerate overlay ── */}
      <AnimatePresence>
        {isAutoRunning && (
          <AutoGenerateOverlay
            steps={autoSteps}
            onAbort={() => router.push("/admin/blog")}
          />
        )}
      </AnimatePresence>

      <div className="animate-in fade-in duration-500">
        {/* ── header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
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
            disabled={isAiGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-sm font-semibold rounded-[12px] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAiGenerating
              ? <CircleNotch size={16} weight="bold" className="animate-spin" />
              : <Sparkle size={16} weight="fill" />
            }
            {isAiGenerating ? "Generuję..." : "Generuj z AI"}
          </button>
        </div>

        <form className="flex flex-col gap-10">
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
              />
              <FormTextarea
                label="Krótki opis (excerpt)"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="1–2 zdania zachęcające do przeczytania. Pojawi się na liście blogów i w SEO."
                rows={3}
              />
            </div>
          </section>

          {/* ── kategoria ── */}
          <section>
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Kategoria
            </h3>
            <div className="flex flex-col gap-2 max-w-xs">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="flex gap-2">
                <input
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                  placeholder="Nowa kategoria..."
                  className="flex-1 bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[10px] px-3 py-2 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-[10px] transition-colors"
                >
                  <Plus size={16} weight="bold" />
                </button>
              </div>

              {aiCategorySuggestions.length > 0 && (
                <div className="mt-1">
                  <p className="text-[11px] text-gray-400 font-montserrat font-semibold uppercase tracking-wide mb-1.5">Sugestie AI</p>
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

          {/* ── tagi (z AI) ── */}
          {tags.length > 0 && (
            <section>
              <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Tagi <span className="normal-case font-normal ml-1">(generowane przez AI)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary text-sm font-semibold font-montserrat px-3 py-1 rounded-full"
                  >
                    <Tag size={12} weight="bold" />
                    {tag}
                  </span>
                ))}
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
              disabled={!title || isSaving}
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
      </div>
    </>
  );
}

export default function BlogBasicDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin" />
        </div>
      }
    >
      <BasicDataFormContent />
    </Suspense>
  );
}
