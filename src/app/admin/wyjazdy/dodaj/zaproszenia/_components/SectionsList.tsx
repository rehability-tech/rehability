"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DotsSixVertical,
  Trash,
  Plus,
  Image as ImageIcon,
  TextT,
  TextHOne,
  CalendarBlank,
  Star,
  Images,
  Clock,
  CursorClick,
  MinusSquare,
} from "@phosphor-icons/react/dist/ssr";

import type { EmailSection, SectionType } from "../_lib/sections";
import { SECTION_LABELS, addSectionAfter } from "../_lib/sections";
import type { TripContext } from "../_lib/types";

import HeroSection from "./sections/HeroSection";
import TitleSection from "./sections/TitleSection";
import TextSection from "./sections/TextSection";
import DetailsSection from "./sections/DetailsSection";
import HighlightsSection from "./sections/HighlightsSection";
import GallerySection from "./sections/GallerySection";
import ValiditySection from "./sections/ValiditySection";
import CtaSection from "./sections/CtaSection";
import DividerSection from "./sections/DividerSection";

// ─── Add-section picker ───────────────────────────────────────────────────────
const ADD_OPTIONS: { type: SectionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "text",      label: "Akapit",       icon: <TextT size={15} weight="bold" />,       desc: "Tekst z tagami" },
  { type: "title",     label: "Nagłówek",     icon: <TextHOne size={15} weight="bold" />,    desc: "Śródtytuł" },
  { type: "divider",   label: "Linia",        icon: <MinusSquare size={15} weight="bold" />, desc: "Separator" },
  { type: "details",   label: "Kiedy/Gdzie",  icon: <CalendarBlank size={15} weight="bold" />, desc: "Termin i miejsce" },
  { type: "highlights",label: "Highlights",   icon: <Star size={15} weight="bold" />,         desc: "Ikony + etykiety" },
  { type: "gallery",   label: "Galeria",      icon: <Images size={15} weight="bold" />,       desc: "3 zdjęcia" },
  { type: "hero",      label: "Zdjęcie hero", icon: <ImageIcon size={15} weight="bold" />,    desc: "Baner" },
  { type: "validity",  label: "Ważność",      icon: <Clock size={15} weight="bold" />,        desc: "Box 24h" },
  { type: "cta",       label: "Przycisk",     icon: <CursorClick size={15} weight="bold" />,  desc: "Akcja CTA" },
];

function AddSectionPanel({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div style={{ marginTop: 10, paddingLeft: 24 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 font-montserrat transition-colors"
          style={{
            padding: "7px 12px",
            border: "1.5px dashed rgba(40,125,136,0.28)",
            borderRadius: 10,
            background: "rgba(40,125,136,0.02)",
            color: "rgba(40,125,136,0.7)",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Plus size={13} weight="bold" />
          Dodaj sekcję
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingLeft: 24, border: "1.5px solid rgba(40,125,136,0.15)", borderRadius: 12, background: "#fff", padding: 10 }}>
      <p className="font-montserrat" style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>
        Wybierz typ sekcji
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        {ADD_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => { onAdd(opt.type); setOpen(false); }}
            className="font-montserrat"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "7px 4px",
              border: "1px solid rgba(40,125,136,0.1)",
              borderRadius: 8,
              background: "rgba(40,125,136,0.02)",
              cursor: "pointer",
              color: "#287d88",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(40,125,136,0.09)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(40,125,136,0.02)"; }}
          >
            {opt.icon}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#033f63" }}>{opt.label}</span>
            <span style={{ fontSize: 7.5, color: "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>{opt.desc}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full font-montserrat"
        style={{ marginTop: 7, fontSize: 10, fontWeight: 700, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
      >
        Anuluj
      </button>
    </div>
  );
}

// ─── Sortable section wrapper ─────────────────────────────────────────────────
interface SortableSectionProps {
  section: EmailSection;
  children: React.ReactNode;
  onDelete: () => void;
  /** When true: rendered inside DragOverlay — no handle, no controls */
  isOverlay?: boolean;
}

function SortableSection({ section, children, onDelete, isOverlay = false }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  if (isOverlay) {
    return (
      <div
        style={{
          display: "flex",
          opacity: 0.92,
          boxShadow: "0 8px 28px rgba(3,63,99,.16)",
          borderRadius: 6,
          background: "#fff",
        }}
      >
        {/* Handle placeholder in overlay (visual only) */}
        <div style={{ width: 20, flexShrink: 0, background: "rgba(40,125,136,0.15)", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DotsSixVertical size={13} color="#287d88" weight="bold" />
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "2px 0" }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        marginBottom: 1,
      }}
      className="group"
    >
      {/* ── Drag handle column (20px) ── */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center rounded-l-md flex-shrink-0"
        style={{
          width: 20,
          background: "rgba(40,125,136,0.07)",
          alignSelf: "stretch",
        }}
        title="Przeciągnij, aby zmienić kolejność"
      >
        <DotsSixVertical size={13} color="#287d88" weight="bold" />
      </div>

      {/* ── Section content ── */}
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {children}

        {/* Delete + type badge — floats at top-right of content on hover */}
        <div
          className="absolute top-0 right-0 z-10 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
          style={{ gap: 0 }}
        >
          <span
            className="font-montserrat"
            style={{
              fontSize: 7,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: "#94a3b8",
              background: "rgba(255,255,255,0.97)",
              borderLeft: "1px solid rgba(148,163,184,0.18)",
              borderBottom: "1px solid rgba(148,163,184,0.18)",
              padding: "2px 5px 2px 5px",
              borderRadius: "0 0 0 4px",
            }}
          >
            {SECTION_LABELS[section.type]}
          </span>
          <button
            type="button"
            onClick={onDelete}
            style={{
              width: 18,
              height: "100%",
              minHeight: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.97)",
              border: "none",
              borderLeft: "1px solid rgba(239,68,68,0.18)",
              borderBottom: "1px solid rgba(239,68,68,0.18)",
              borderRadius: "0 0 0 0",
              cursor: "pointer",
              padding: 0,
            }}
            title="Usuń sekcję"
          >
            <Trash size={9} color="#ef4444" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SectionsList ────────────────────────────────────────────────────────
interface SectionsListProps {
  sections: EmailSection[];
  onChange: (sections: EmailSection[]) => void;
  tripContext: TripContext;
  previewValues: Record<string, string>;
  onFocusEditor: (el: HTMLElement) => void;
  onInput: () => void;
  onOpenIconPicker: (sectionId: string, iconIdx: number, rect: DOMRect) => void;
  onOpenGalleryPicker: (sectionId: string, slotIdx: number) => void;
  onOpenHeroPicker: (sectionId: string) => void;
}

export default function SectionsList({
  sections,
  onChange,
  tripContext,
  previewValues,
  onFocusEditor,
  onInput,
  onOpenIconPicker,
  onOpenGalleryPicker,
  onOpenHeroPicker,
}: SectionsListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateSection = (id: string, update: Partial<EmailSection>) =>
    onChange(sections.map((s) => (s.id === id ? ({ ...s, ...update } as EmailSection) : s)));

  const deleteSection = (id: string) =>
    onChange(sections.filter((s) => s.id !== id));

  const addSection = (type: SectionType) =>
    onChange(addSectionAfter(sections, sections.length - 1, type));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    onChange(arrayMove(sections, oldIdx, newIdx));
  }

  const activeSection = sections.find((s) => s.id === activeId);

  function renderContent(section: EmailSection) {
    switch (section.type) {
      case "hero":
        return <HeroSection image={section.image} onOpenPicker={() => onOpenHeroPicker(section.id)} />;
      case "title":
        return (
          <TitleSection
            content={section.content}
            previewValues={previewValues}
            onFocusEditor={onFocusEditor}
            onChange={(content) => updateSection(section.id, { content })}
            onInput={onInput}
          />
        );
      case "text":
        return (
          <TextSection
            content={section.content}
            previewValues={previewValues}
            onFocusEditor={onFocusEditor}
            onChange={(content) => updateSection(section.id, { content })}
            onInput={onInput}
          />
        );
      case "details":
        return <DetailsSection tripContext={tripContext} />;
      case "highlights":
        return (
          <HighlightsSection
            icons={section.icons}
            labels={section.labels}
            onChange={(update) => updateSection(section.id, update)}
            onInput={onInput}
            onOpenIconPicker={(iconIdx, rect) => onOpenIconPicker(section.id, iconIdx, rect)}
          />
        );
      case "gallery":
        return <GallerySection images={section.images} onSlotClick={(slotIdx) => onOpenGalleryPicker(section.id, slotIdx)} />;
      case "validity":
        return <ValiditySection />;
      case "cta":
        return (
          <CtaSection
            content={section.content}
            onFocusEditor={onFocusEditor}
            onChange={(content) => updateSection(section.id, { content })}
            onInput={onInput}
          />
        );
      case "divider":
        return <DividerSection />;
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onDelete={() => deleteSection(section.id)}
            >
              {renderContent(section)}
            </SortableSection>
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeSection && (
            <SortableSection section={activeSection} onDelete={() => {}} isOverlay>
              {renderContent(activeSection)}
            </SortableSection>
          )}
        </DragOverlay>
      </DndContext>

      <AddSectionPanel onAdd={addSection} />
    </>
  );
}
