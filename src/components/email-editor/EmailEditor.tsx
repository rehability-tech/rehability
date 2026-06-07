"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";
import { TEMPLATE_TAGS } from "./lib/constants";
import { htmlToTemplate, pillStyle, templateToHtml } from "./lib/templateHelpers";
import type { EmailSection } from "./lib/sections";
import type { TripContext } from "./lib/types";

import EmailComposerHeader from "./components/EmailComposerHeader";
import EmailPreview from "./components/EmailPreview";
import IconPickerPopover from "./components/IconPickerPopover";
import TemplateTagsBar from "./components/TemplateTagsBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type GalleryPickerState = { sectionId: string; slotIdx: number } | null;
type IconPickerState = { sectionId: string; iconIdx: number; pos: { x: number; y: number } } | null;

export interface EmailEditorHandle {
  /** Returns the subject as a template string, e.g. "Zaproszenie na {campName}" */
  getSubjectTemplate(): string;
}

export interface EmailEditorProps {
  sections: EmailSection[];
  onSectionsChange: (sections: EmailSection[]) => void;
  /** Subject template string (e.g. "Zaproszenie na {campName}"). Used only for initial render. */
  initialSubject: string;
  tripContext: TripContext;
  uploadEndpoint?: string;
  /** Called on any user edit — use to trigger auto-save. */
  onInput?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EmailEditor = forwardRef<EmailEditorHandle, EmailEditorProps>(function EmailEditor(
  {
    sections,
    onSectionsChange,
    initialSubject,
    tripContext,
    uploadEndpoint = "/api/admin/blog/upload",
    onInput,
  },
  ref,
) {
  const [previewInviterName, setPreviewInviterName] = useState("Anna Nowak");
  const [previewInviteeName, setPreviewInviteeName] = useState("Ania Kowalska");

  const subjectRef = useRef<HTMLDivElement>(null);
  const lastFocusedEditorRef = useRef<HTMLElement | null>(null);
  const subjectInitializedRef = useRef(false);

  const [galleryPicker, setGalleryPicker] = useState<GalleryPickerState>(null);
  const [iconPicker, setIconPicker] = useState<IconPickerState>(null);
  const [heroPicker, setHeroPicker] = useState<string | null>(null);

  const getPreviewValues = useCallback(
    (): Record<string, string> => ({
      inviterName: previewInviterName,
      campName: tripContext.title || "Nazwa wyjazdu",
      inviteeName: previewInviteeName,
    }),
    [previewInviterName, previewInviteeName, tripContext.title],
  );

  // Initialize subject contentEditable on first load
  useEffect(() => {
    if (initialSubject && !subjectInitializedRef.current && subjectRef.current) {
      subjectRef.current.innerHTML = templateToHtml(initialSubject, getPreviewValues());
      subjectInitializedRef.current = true;
    }
  }, [initialSubject, getPreviewValues]);

  // Pill sync — update preview name pills in subject field
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

  // Expose imperative API so parent can read current subject template on save
  useImperativeHandle(ref, () => ({
    getSubjectTemplate: () =>
      subjectRef.current ? htmlToTemplate(subjectRef.current) : initialSubject,
  }));

  // ── Section update utility ──────────────────────────────────────────────────

  const updateSection = useCallback(
    (id: string, update: Partial<EmailSection>) => {
      onSectionsChange(
        sections.map((s) => (s.id === id ? ({ ...s, ...update } as EmailSection) : s)),
      );
    },
    [sections, onSectionsChange],
  );

  // ── Tag insertion ───────────────────────────────────────────────────────────

  const insertTag = useCallback(
    (tagName: string) => {
      const el = lastFocusedEditorRef.current;
      if (!el) return;
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
      onInput?.();
    },
    [getPreviewValues, onInput],
  );

  // ── Picker callbacks ────────────────────────────────────────────────────────

  const handleGalleryPickerSelect = useCallback(
    (url: string) => {
      if (!galleryPicker) return;
      const { sectionId, slotIdx } = galleryPicker;
      const section = sections.find((s) => s.id === sectionId);
      if (!section || section.type !== "gallery") return;
      const images = section.images.map((img, i) => (i === slotIdx ? url : img));
      updateSection(sectionId, { images });
      setGalleryPicker(null);
      onInput?.();
    },
    [galleryPicker, sections, updateSection, onInput],
  );

  const handleHeroPickerSelect = useCallback(
    (url: string) => {
      if (!heroPicker) return;
      updateSection(heroPicker, { image: url });
      setHeroPicker(null);
      onInput?.();
    },
    [heroPicker, updateSection, onInput],
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
      onInput?.();
    },
    [iconPicker, sections, updateSection, onInput],
  );

  const currentIconSection = iconPicker
    ? (sections.find((s) => s.id === iconPicker.sectionId) as
        | Extract<EmailSection, { type: "highlights" }>
        | undefined)
    : undefined;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Email header — subject + preview names */}
      <EmailComposerHeader
        subjectRef={subjectRef}
        previewInviterName={previewInviterName}
        setPreviewInviterName={setPreviewInviterName}
        previewInviteeName={previewInviteeName}
        setPreviewInviteeName={setPreviewInviteeName}
        onFocusEditor={(el) => { lastFocusedEditorRef.current = el; }}
        onInput={() => onInput?.()}
      />

      {/* Template variable tag bar */}
      <TemplateTagsBar onInsert={insertTag} />

      {/* Inline email preview + editor */}
      <EmailPreview
        sections={sections}
        onSectionsChange={(updated) => { onSectionsChange(updated); onInput?.(); }}
        tripContext={tripContext}
        previewValues={getPreviewValues()}
        previewInviterName={previewInviterName}
        onFocusEditor={(el) => { lastFocusedEditorRef.current = el; }}
        onInput={() => onInput?.()}
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

      {/* Gallery image picker */}
      <BlogCoverPicker
        isOpen={galleryPicker !== null}
        onClose={() => setGalleryPicker(null)}
        onSelect={handleGalleryPickerSelect}
        defaultQuery={tripContext.title}
        heading={`Klimat wyjazdu — zdjęcie ${galleryPicker ? galleryPicker.slotIdx + 1 : ""}`}
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne."
        uploadEndpoint={uploadEndpoint}
      />

      {/* Hero image picker */}
      <BlogCoverPicker
        isOpen={heroPicker !== null}
        onClose={() => setHeroPicker(null)}
        onSelect={handleHeroPickerSelect}
        defaultQuery={tripContext.title}
        heading="Zdjęcie hero e-maila"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne."
        uploadEndpoint={uploadEndpoint}
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
});

export default EmailEditor;
