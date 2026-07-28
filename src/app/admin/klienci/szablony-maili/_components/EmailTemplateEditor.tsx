"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeft,
  CircleNotch,
  FloppyDisk,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import Link from "next/link";

import EmailEditor, {
  type EmailEditorHandle,
} from "@/components/email-editor/EmailEditor";
import EmailEditorToolbar from "@/components/email-editor/components/EmailEditorToolbar";
import AIChoiceModal from "@/components/email-editor/components/AIChoiceModal";
import EmailInboxPreviewModal from "@/components/email-editor/components/EmailInboxPreviewModal";
import EmailGeneratingAnimation from "@/components/email-editor/components/EmailGeneratingAnimation";
import {
  type EmailSection,
  aiToSections,
  createDefaultSections,
} from "@/components/email-editor";
import { useAutoSave } from "@/components/email-editor/hooks/useAutoSave";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { value: "general", label: "Ogólny" },
  { value: "invitation", label: "Zaproszenie" },
  { value: "reminder", label: "Przypomnienie" },
  { value: "welcome", label: "Powitalny" },
  { value: "payment", label: "Płatność" },
];

interface Props {
  templateId: string | null;
}

export default function EmailTemplateEditor({ templateId }: Props) {
  const router = useRouter();
  const isEdit = templateId !== null;

  const [isFetching, setIsFetching] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState("DRAFT");
  const [sections, setSections] = useState<EmailSection[]>([]);

  const editorRef = useRef<EmailEditorHandle>(null);

  // ── Load existing template ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isEdit) {
      setSections(createDefaultSections());
      return;
    }
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/email-templates/${templateId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setName(data.name ?? "");
        setSubject(data.subject ?? "");
        setCategory(data.category ?? "general");
        setStatus(data.status ?? "DRAFT");
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections as EmailSection[]);
        } else {
          setSections(createDefaultSections());
        }
      } catch {
        toast.error("Nie udało się załadować szablonu.");
        setSections(createDefaultSections());
      } finally {
        setIsFetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const saveData = useCallback(async () => {
    if (sections.length === 0) return;
    const currentSubject =
      editorRef.current?.getSubjectTemplate() ?? subject;

    const payload = {
      name: name || "Bez nazwy",
      subject: currentSubject,
      sections,
      category,
      status,
    };

    if (isEdit) {
      const res = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
    } else {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu");
      // redirect to edit page after creation
      router.replace(`/admin/klienci/szablony-maili/${result.id}`);
    }
  }, [sections, subject, name, category, status, isEdit, templateId, router]);

  const { schedule: scheduleAutoSave, status: autoSaveStatus } = useAutoSave(
    saveData,
    5_000,
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę szablonu.");
      return;
    }
    setIsSaving(true);
    try {
      await saveData();
      toast.success("Szablon zapisany!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [name, saveData]);

  // ── AI generation ──────────────────────────────────────────────────────────

  const handleModalAI = useCallback(async () => {
    setShowAIModal(false);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateInvitationEmail",
          prompt: `Nazwa szablonu: ${name || "szablon maila"}\nKategoria: ${category}`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd AI");
      setSections(aiToSections(result, ""));
      if (result.subject) setSubject(result.subject);
      toast.success("Treść wygenerowana przez AI!");
    } catch {
      setSections(createDefaultSections());
      toast.error("Nie udało się wygenerować treści AI. Załadowano domyślny szablon.");
    } finally {
      setIsGenerating(false);
    }
  }, [name, category]);

  const handleModalManual = useCallback(() => {
    setShowAIModal(false);
    setSections(createDefaultSections());
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie szablonu...
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative animate-in fade-in duration-500 pb-4">
      <AIChoiceModal
        isOpen={showAIModal}
        onAI={handleModalAI}
        onManual={handleModalManual}
        showWarning={sections.length > 0}
      />
      <EmailInboxPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        sections={sections}
        subject={editorRef.current?.getSubjectTemplate() ?? subject}
        tripContext={{ title: name, description: "", location: "", startDate: "", endDate: "" }}
        previewInviterName="Anna Nowak"
        previewInviteeName="Ania Kowalska"
      />

      <motion.div
        animate={{
          filter: isGenerating ? "blur(6px)" : "blur(0px)",
          opacity: isGenerating ? 0.45 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ pointerEvents: isGenerating ? "none" : undefined }}
      >
        {/* Mobile toolbar */}
        <div className="md:hidden sticky top-[64px] z-40">
          <EmailEditorToolbar
            onSave={handleSave}
            isSaving={isSaving}
            autoSaveStatus={autoSaveStatus}
            onAiClick={() => setShowAIModal(true)}
            onPreviewClick={() => setShowPreview(true)}
          />
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
            {isEdit ? "Edytuj szablon" : "Nowy szablon maila"}
          </h2>
          <p className="text-sm text-gray-400 font-montserrat mt-1">
            Kliknij tekst, aby edytować. Dodawaj i przesuwaj sekcje.
          </p>
        </div>

        {/* Meta fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-3xl rounded-tr-none border border-gray-100">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-400 font-montserrat uppercase tracking-wider mb-1">
              Nazwa szablonu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Zaproszenie na wydarzenie majowe"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-montserrat text-[#033f63] placeholder:text-gray-300 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 font-montserrat uppercase tracking-wider mb-1">
              Kategoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-montserrat text-[#033f63] focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 font-montserrat uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13.5px] font-montserrat text-[#033f63] focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 transition-all bg-white"
            >
              <option value="DRAFT">Szkic</option>
              <option value="ACTIVE">Aktywny</option>
            </select>
          </div>
        </div>

        {/* Editor + desktop toolbar */}
        <div className="relative">
          <div className="md:pr-14">
            <EmailEditor
              ref={editorRef}
              sections={sections}
              onSectionsChange={setSections}
              initialSubject={subject}
              tripContext={{ title: name, description: "", location: "", startDate: "", endDate: "" }}
              onInput={scheduleAutoSave}
            />
          </div>
          <div className="hidden md:block absolute top-0 bottom-0 right-0 w-14 pointer-events-none">
            <EmailEditorToolbar
              onSave={handleSave}
              isSaving={isSaving}
              autoSaveStatus={autoSaveStatus}
              onAiClick={() => setShowAIModal(true)}
              onPreviewClick={() => setShowPreview(true)}
            />
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gray-100">
          <Link
            href="/admin/klienci/szablony-maili"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors w-full sm:w-auto"
          >
            <CaretLeft size={18} weight="bold" />
            Powrót do listy
          </Link>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
            leftIcon={<FloppyDisk size={18} weight="bold" />}
            className="w-full sm:w-auto"
          >
            Zapisz szablon
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="generating-overlay"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 z-30 flex items-start md:pr-14"
          >
            <div className="w-full">
              <EmailGeneratingAnimation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
