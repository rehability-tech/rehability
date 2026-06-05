"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, CircleNotch, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";

import { useAutoSave } from "./_hooks/useAutoSave";
import type { TripContext } from "./_lib/types";
import { TEMPLATE_TAGS } from "./_lib/constants";
import { pillStyle, templateToHtml, htmlToTemplate, parseLocation } from "./_lib/templateHelpers";
import type { EmailSection } from "./_lib/sections";
import {
  createDefaultSections, migrateToSections, aiToSections, sectionsToLegacy,
} from "./_lib/sections";

import EmailComposerHeader from "./_components/EmailComposerHeader";
import TemplateTagsBar from "./_components/TemplateTagsBar";
import EmailPreview from "./_components/EmailPreview";
import IconPickerPopover from "./_components/IconPickerPopover";

// ─────────────────────────────────────────────────────────────────────────────

type GalleryPickerState = { sectionId: string; slotIdx: number } | null;
type IconPickerState = { sectionId: string; iconIdx: number; pos: { x: number; y: number } } | null;

function ZaproszeniaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get("id");

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [previewInviterName, setPreviewInviterName] = useState("Anna Nowak");
  const [previewInviteeName, setPreviewInviteeName] = useState("Ania Kowalska");

  // Sections = the entire email structure
  const [sections, setSections] = useState<EmailSection[]>([]);

  // Email subject (metadata, not a section)
  const subjectRef = useRef<HTMLDivElement>(null);
  const lastFocusedEditorRef = useRef<HTMLElement | null>(null);

  const [galleryPicker, setGalleryPicker] = useState<GalleryPickerState>(null);
  const [iconPicker, setIconPicker] = useState<IconPickerState>(null);
  const [heroPicker, setHeroPicker] = useState<string | null>(null);

  const tripContextRef = useRef<TripContext>({
    title: "", description: "", location: "", startDate: "", endDate: "",
  });

  const loadedSubjectRef = useRef("Zaproszenie na wspólny wyjazd Rehability ✈️");
  const heroImageRef = useRef(""); // used for AI generation → new sections

  const getPreviewValues = useCallback(
    (): Record<string, string> => ({
      inviterName: previewInviterName,
      campName: tripContextRef.current.title || "Nazwa wyjazdu",
      inviteeName: previewInviteeName,
    }),
    [previewInviterName, previewInviteeName],
  );

  // ── SECTION UPDATE ─────────────────────────────────────────────────────────

  const updateSection = useCallback((id: string, update: Partial<EmailSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...update } as EmailSection) : s)),
    );
  }, []);

  // ── FETCH ──────────────────────────────────────────────────────────────────

  const runAiGeneration = useCallback(async (tripData: TripContext, heroImage: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateInvitationEmail",
          prompt: `Tytuł wyjazdu: ${tripData.title}\nOpis: ${tripData.description || "brak"}\nLokalizacja: ${tripData.location || "brak"}\nDaty: ${tripData.startDate || "do ustalenia"}`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd AI");
      setSections(aiToSections(result, heroImage));
      if (result.subject && subjectRef.current) {
        subjectRef.current.innerHTML = templateToHtml(result.subject, getPreviewValues());
      }
      toast.success("Treść e-maila wygenerowana przez AI!");
    } catch {
      // Fallback to defaults on AI error
      setSections(createDefaultSections());
      toast.error("Nie udało się wygenerować treści AI. Załadowano domyślny szablon.");
    } finally {
      setIsGenerating(false);
    }
  }, [getPreviewValues]);

  useEffect(() => {
    if (!tripId) {
      toast.error("Brak ID wyjazdu. Najpierw wypełnij dane podstawowe.");
      router.push("/admin/wyjazdy/dodaj/dane-podstawowe");
      return;
    }
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/wyjazdy/${tripId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        tripContextRef.current = {
          title: data.title ?? "",
          description: data.description ?? "",
          location: parseLocation(data.location),
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? "",
        };

        const heroImage: string = data.invitationEmailHeroImage ?? data.heroImage ?? "";
        heroImageRef.current = heroImage;

        // 1) Existing sections JSON → use directly
        if (Array.isArray(data.invitationEmailSections) && data.invitationEmailSections.length > 0) {
          setSections(data.invitationEmailSections as EmailSection[]);

        // 2) Old flat fields exist → migrate to sections
        } else if (data.invitationEmailBody || data.invitationEmailTitle) {
          setSections(migrateToSections({
            invitationEmailTitle: data.invitationEmailTitle,
            invitationEmailBody: data.invitationEmailBody,
            invitationEmailButtonText: data.invitationEmailButtonText,
            invitationEmailHeroImage: heroImage,
            invitationEmailHighlights: Array.isArray(data.invitationEmailHighlights)
              ? data.invitationEmailHighlights
              : null,
            invitationEmailGallery: Array.isArray(data.invitationEmailGallery)
              ? data.invitationEmailGallery
              : null,
          }));

        // 3) No existing content → auto-generate with Gemini
        } else {
          setIsFetching(false);
          await runAiGeneration(tripContextRef.current, heroImage);
          return;
        }

        // Initialize subject contentEditable
        const subject = data.invitationEmailSubject ?? loadedSubjectRef.current;
        loadedSubjectRef.current = subject;
        if (subjectRef.current) {
          subjectRef.current.innerHTML = templateToHtml(subject, getPreviewValues());
        }
      } catch {
        toast.error("Nie udało się załadować ustawień e-maila.");
        setSections(createDefaultSections());
      } finally {
        setIsFetching(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, router]);

  // Subject init after isFetching resolves (subjectRef might not be mounted during fetch)
  useEffect(() => {
    if (!isFetching && subjectRef.current && !subjectRef.current.innerHTML) {
      subjectRef.current.innerHTML = templateToHtml(loadedSubjectRef.current, getPreviewValues());
    }
  }, [isFetching, getPreviewValues]);

  // ── PILL SYNC for subject ──────────────────────────────────────────────────

  useEffect(() => {
    subjectRef.current?.querySelectorAll<HTMLElement>('[data-tag="inviterName"]').forEach((span) => {
      span.textContent = previewInviterName;
    });
  }, [previewInviterName]);

  useEffect(() => {
    subjectRef.current?.querySelectorAll<HTMLElement>('[data-tag="inviteeName"]').forEach((span) => {
      span.textContent = previewInviteeName;
    });
  }, [previewInviteeName]);

  // ── SAVE (data only, no redirect) ─────────────────────────────────────────

  const saveData = useCallback(async () => {
    if (!tripId || sections.length === 0) return;
    const subject = subjectRef.current ? htmlToTemplate(subjectRef.current) : loadedSubjectRef.current;
    const payload = sectionsToLegacy(sections, subject);

    const res = await fetch(`/api/admin/wyjazdy/${tripId}/invitation-email`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Błąd zapisu");
  }, [tripId, sections]);

  const { schedule: scheduleAutoSave, status: autoSaveStatus } = useAutoSave(saveData);

  const save = useCallback(async () => {
    if (!tripId) return;
    setIsSaving(true);
    try {
      await saveData();
      toast.success("E-mail zaproszenia zapisany!");
      router.push(`/admin/wyjazdy/dodaj/seo?id=${tripId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd serwera.");
    } finally {
      setIsSaving(false);
    }
  }, [tripId, saveData, router]);

  // ── MANUAL AI GENERATION ──────────────────────────────────────────────────

  const generateWithAI = useCallback(async () => {
    const { title } = tripContextRef.current;
    if (!title) {
      toast.error("Brak danych wyjazdu. Najpierw zapisz dane podstawowe.");
      return;
    }
    await runAiGeneration(tripContextRef.current, heroImageRef.current);
  }, [runAiGeneration]);

  // ── TAG INSERTION ─────────────────────────────────────────────────────────

  const insertTag = useCallback(
    (tagName: string) => {
      const el = lastFocusedEditorRef.current;
      if (!el) {
        toast.info("Kliknij najpierw w pole, do którego chcesz wstawić zmienną.");
        return;
      }
      const tagDef = TEMPLATE_TAGS.find((t) => t.name === tagName);
      if (!tagDef) return;

      const values = getPreviewValues();
      const pill = document.createElement("span");
      pill.setAttribute("contenteditable", "false");
      pill.setAttribute("data-tag", tagName);
      pill.textContent = values[tagName] ?? tagName;
      pill.style.cssText = pillStyle(tagDef);

      el.focus();
      const sel = window.getSelection();
      if (sel?.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(pill);
        range.setStartAfter(pill);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        el.appendChild(pill);
      }
      scheduleAutoSave();
    },
    [getPreviewValues, scheduleAutoSave],
  );

  // ── PICKER CALLBACKS ──────────────────────────────────────────────────────

  const handleGalleryPickerSelect = useCallback(
    (url: string) => {
      if (!galleryPicker) return;
      const { sectionId, slotIdx } = galleryPicker;
      const section = sections.find((s) => s.id === sectionId);
      if (!section || section.type !== "gallery") return;
      const images = section.images.map((img, i) => (i === slotIdx ? url : img));
      updateSection(sectionId, { images });
      setGalleryPicker(null);
      scheduleAutoSave();
    },
    [galleryPicker, sections, updateSection, scheduleAutoSave],
  );

  const handleHeroPickerSelect = useCallback(
    (url: string) => {
      if (!heroPicker) return;
      updateSection(heroPicker, { image: url });
      setHeroPicker(null);
      scheduleAutoSave();
    },
    [heroPicker, updateSection, scheduleAutoSave],
  );

  const handleIconPickerSelect = useCallback(
    (name: string) => {
      if (!iconPicker) return;
      const { sectionId, iconIdx } = iconPicker;
      const section = sections.find((s) => s.id === sectionId);
      if (!section || section.type !== "highlights") return;
      const icons = section.icons.map((icon, i) => (i === iconIdx ? name : icon));
      updateSection(sectionId, { icons });
      setIconPicker(null);
      scheduleAutoSave();
    },
    [iconPicker, sections, updateSection, scheduleAutoSave],
  );

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin mb-4" />
        <p className="text-gray-500 font-montserrat font-medium">Ładowanie szablonu e-maila...</p>
      </div>
    );
  }

  if (isGenerating && sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Sparkle size={36} weight="fill" className="text-[#287d88] mb-4 animate-pulse" />
        <p className="text-gray-600 font-montserrat font-semibold">Gemini analizuje wyjazd i generuje treść e-maila...</p>
        <p className="text-gray-400 font-montserrat text-sm mt-1">Chwila cierpliwości</p>
      </div>
    );
  }

  const currentIconSection = iconPicker
    ? (sections.find((s) => s.id === iconPicker.sectionId) as Extract<EmailSection, { type: "highlights" }> | undefined)
    : undefined;

  return (
    <div className="animate-in fade-in duration-500">

      {/* ── NAGŁÓWEK ── */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">E-mail zaproszenia</h2>
          <p className="text-sm text-gray-400 font-montserrat mt-1">
            Kliknij tekst, aby edytować. Przeciągaj sekcje ⠿, dodawaj nowe na dole.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {autoSaveStatus !== "idle" && (
            <span className="text-[11px] font-montserrat font-semibold text-gray-400 flex items-center gap-1">
              {autoSaveStatus === "pending" && "⟳ autozapis…"}
              {autoSaveStatus === "saving" && (
                <>
                  <CircleNotch size={11} weight="bold" className="animate-spin" />
                  Zapisuję…
                </>
              )}
              {autoSaveStatus === "saved" && "✓ Autozapisano"}
            </span>
          )}
          <button
            type="button"
            onClick={generateWithAI}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-semibold text-sm border border-[#287d88]/30 text-[#287d88] bg-[#287d88]/5 hover:bg-[#287d88]/10 transition-colors disabled:opacity-50"
          >
            {isGenerating
              ? <CircleNotch size={16} weight="bold" className="animate-spin" />
              : <Sparkle size={16} weight="fill" />}
            Generuj treść AI
          </button>
        </div>
      </div>

      {/* ── EMAIL COMPOSER HEADER ── */}
      <EmailComposerHeader
        subjectRef={subjectRef}
        previewInviterName={previewInviterName}
        setPreviewInviterName={setPreviewInviterName}
        previewInviteeName={previewInviteeName}
        setPreviewInviteeName={setPreviewInviteeName}
        onFocusEditor={(el) => { lastFocusedEditorRef.current = el; }}
        onInput={scheduleAutoSave}
      />

      {/* ── PASEK ZMIENNYCH ── */}
      <TemplateTagsBar onInsert={insertTag} />

      {/* ── EMAIL INLINE PREVIEW / EDITOR ── */}
      <EmailPreview
        sections={sections}
        onSectionsChange={(updated) => { setSections(updated); scheduleAutoSave(); }}
        tripContext={tripContextRef.current}
        previewValues={getPreviewValues()}
        previewInviterName={previewInviterName}
        onFocusEditor={(el) => { lastFocusedEditorRef.current = el; }}
        onInput={scheduleAutoSave}
        onOpenIconPicker={(sectionId, iconIdx, rect) => {
          setIconPicker({
            sectionId,
            iconIdx,
            pos: {
              x: Math.max(8, Math.min(rect.left - 60, window.innerWidth - 320)),
              y: rect.bottom + 8,
            },
          });
        }}
        onOpenGalleryPicker={(sectionId, slotIdx) => setGalleryPicker({ sectionId, slotIdx })}
        onOpenHeroPicker={(sectionId) => setHeroPicker(sectionId)}
      />

      {/* ── NAWIGACJA ── */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-6 border-t border-gray-100">
        <Link
          href={`/admin/wyjazdy/dodaj/edytor-tresci${tripId ? `?id=${tripId}` : ""}`}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors w-full sm:w-auto"
        >
          <CaretLeft size={18} weight="bold" />
          Wstecz
        </Link>
        <Button
          onClick={save}
          isLoading={isSaving}
          disabled={isSaving}
          rightIcon={<CaretRight size={18} weight="bold" />}
          className="w-full sm:w-auto"
        >
          Zapisz i przejdź dalej
        </Button>
      </div>

      {/* ── PICKERS ── */}

      {/* Gallery image picker */}
      <BlogCoverPicker
        isOpen={galleryPicker !== null}
        onClose={() => setGalleryPicker(null)}
        onSelect={handleGalleryPickerSelect}
        defaultQuery={tripContextRef.current.title}
        heading={`Klimat wyjazdu — zdjęcie ${galleryPicker ? galleryPicker.slotIdx + 1 : ""}`}
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne."
        uploadEndpoint="/api/admin/blog/upload"
      />

      {/* Hero image picker */}
      <BlogCoverPicker
        isOpen={heroPicker !== null}
        onClose={() => setHeroPicker(null)}
        onSelect={handleHeroPickerSelect}
        defaultQuery={tripContextRef.current.title}
        heading="Zdjęcie hero e-maila"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne."
        uploadEndpoint="/api/admin/blog/upload"
      />

      {/* Icon picker */}
      {iconPicker !== null && currentIconSection && (
        <IconPickerPopover
          selectedIcon={currentIconSection.icons[iconPicker.iconIdx] ?? "Sparkle"}
          position={iconPicker.pos}
          onSelect={handleIconPickerSelect}
          onClose={() => setIconPicker(null)}
        />
      )}
    </div>
  );
}

export default function ZaproszeniaCampPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch size={40} weight="bold" className="text-brand-primary animate-spin" />
        </div>
      }
    >
      <ZaproszeniaContent />
    </Suspense>
  );
}
