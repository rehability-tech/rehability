"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
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
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react/dist/ssr";

import type { EmailSection, SectionType } from "../lib/sections";
import { addSectionAfter } from "../lib/sections";
import type { TripContext } from "../lib/types";

import HeroSection from "./sections/HeroSection";
import InlineImageSection from "./sections/InlineImageSection";
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
  { type: "text",       label: "Akapit",       icon: <TextT size={15} weight="bold" />,          desc: "Tekst z tagami" },
  { type: "title",      label: "Nagłówek",     icon: <TextHOne size={15} weight="bold" />,       desc: "Śródtytuł" },
  { type: "divider",    label: "Linia",        icon: <MinusSquare size={15} weight="bold" />,    desc: "Separator" },
  { type: "details",    label: "Kiedy/Gdzie",  icon: <CalendarBlank size={15} weight="bold" />,  desc: "Termin i miejsce" },
  { type: "highlights", label: "Highlights",   icon: <Star size={15} weight="bold" />,           desc: "Ikony + etykiety" },
  { type: "image",      label: "Zdjęcie",      icon: <ImageIcon size={15} weight="bold" />,      desc: "1 zdjęcie" },
  { type: "gallery",    label: "Galeria",      icon: <Images size={15} weight="bold" />,         desc: "3 zdjęcia" },
  { type: "hero",       label: "Zdjęcie hero", icon: <ImageIcon size={15} weight="bold" />,      desc: "Baner" },
  { type: "validity",   label: "Ważność",      icon: <Clock size={15} weight="bold" />,          desc: "Box 24h" },
  { type: "cta",        label: "Przycisk",     icon: <CursorClick size={15} weight="bold" />,    desc: "Akcja CTA" },
];

function AddSectionPanel({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div style={{ marginTop: 10 }}>
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
    <div style={{ marginTop: 10, border: "1.5px solid rgba(40,125,136,0.15)", borderRadius: 12, background: "#fff", padding: 10 }}>
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

// ─── Shared toolbar buttons ───────────────────────────────────────────────────

function ToolbarButtons({
  onMoveUp, onMoveDown, onDelete, isFirst, isLast, divider,
}: {
  onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void;
  isFirst: boolean; isLast: boolean;
  divider: "h" | "v"; // horizontal (mobile) or vertical (desktop) separator
}) {
  return (
    <>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        className="p-1 text-gray-400 hover:text-[#287d88] hover:bg-gray-100 rounded transition-colors flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none"
        title="Przenieś wyżej"
      >
        <ArrowUp size={13} weight="bold" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        className="p-1 text-gray-400 hover:text-[#287d88] hover:bg-gray-100 rounded transition-colors flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none"
        title="Przenieś niżej"
      >
        <ArrowDown size={13} weight="bold" />
      </button>
      {divider === "v"
        ? <div className="w-3 h-px bg-gray-200 my-0.5" />
        : <div className="h-3 w-px bg-gray-200 mx-0.5" />}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex items-center justify-center"
        title="Usuń sekcję"
      >
        <Trash size={13} weight="bold" />
      </button>
    </>
  );
}

// ─── Section row ──────────────────────────────────────────────────────────────

const TOOLBAR_STYLE = {
  background: "rgba(255,255,255,0.97)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(229,231,235,1)",
  borderRadius: 10,
  boxShadow: "0 2px 12px rgba(3,63,99,.10)",
} as const;

interface SectionRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function SectionRow({
  children,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SectionRowProps) {
  const [show, setShow] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const btnProps = { onMoveUp, onMoveDown, onDelete, isFirst, isLast };

  // Close on outside click / tap
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [show]);

  return (
    <motion.div
      ref={rowRef}
      layout
      transition={{ duration: 0.18, ease: "easeInOut" }}
      onClick={() => setShow(true)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={(e) => {
        // Only hide on mouse leave if the relatedTarget is outside this row
        if (!rowRef.current?.contains(e.relatedTarget as Node)) {
          setShow(false);
        }
      }}
      className="relative rounded-[12px] transition-colors cursor-default"
      style={{
        marginBottom: 2,
        border: `1px solid ${show ? "rgba(229,231,235,1)" : "transparent"}`,
        backgroundColor: show ? "rgba(249,250,251,0.6)" : "transparent",
      }}
    >
      {/* ── Mobile: toolbar above, centered ── */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="toolbar-mobile"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="md:hidden absolute z-20 flex flex-row items-center gap-0.5 px-1.5 py-1"
            style={{
              ...TOOLBAR_STYLE,
              top: 0,
              left: "50%",
              transform: "translateX(-50%) translateY(calc(-100% - 4px))",
            }}
            onMouseEnter={() => setShow(true)}
          >
            <ToolbarButtons {...btnProps} divider="h" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop: toolbar to the right, outside element ── */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="toolbar-desktop"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="hidden md:flex flex-col items-center gap-0.5 absolute z-20 p-1"
            style={{
              ...TOOLBAR_STYLE,
              right: 0,
              top: "50%",
              transform: "translateX(calc(100% + 4px)) translateY(-50%)",
            }}
            onMouseEnter={() => setShow(true)}
          >
            <ToolbarButtons {...btnProps} divider="v" />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </motion.div>
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
  readonly?: boolean;
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
  readonly = false,
}: SectionsListProps) {
  const updateSection = (id: string, update: Partial<EmailSection>) =>
    onChange(sections.map((s) => (s.id === id ? ({ ...s, ...update } as EmailSection) : s)));

  const deleteSection = (id: string) =>
    onChange(sections.filter((s) => s.id !== id));

  const addSection = (type: SectionType) =>
    onChange(addSectionAfter(sections, sections.length - 1, type));

  const moveSection = (id: string, direction: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const next = [...sections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  };

  function renderContent(section: EmailSection) {
    switch (section.type) {
      case "hero":
        return <HeroSection image={section.image} onOpenPicker={() => onOpenHeroPicker(section.id)} readonly={readonly} />;
      case "image":
        return <InlineImageSection image={section.image} onOpenPicker={() => onOpenHeroPicker(section.id)} readonly={readonly} />;
      case "title":
        return (
          <TitleSection
            content={section.content}
            previewValues={previewValues}
            onFocusEditor={onFocusEditor}
            onChange={(content) => updateSection(section.id, { content })}
            onInput={onInput}
            readonly={readonly}
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
            readonly={readonly}
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
            readonly={readonly}
          />
        );
      case "gallery":
        return <GallerySection images={section.images} onSlotClick={(slotIdx) => onOpenGalleryPicker(section.id, slotIdx)} readonly={readonly} />;
      case "validity":
        return <ValiditySection />;
      case "cta":
        return (
          <CtaSection
            content={section.content}
            onFocusEditor={onFocusEditor}
            onChange={(content) => updateSection(section.id, { content })}
            onInput={onInput}
            readonly={readonly}
          />
        );
      case "divider":
        return <DividerSection />;
    }
  }

  // Tryb podglądu — bez toolbarów, bez przycisku dodawania, identyczny wygląd treści.
  if (readonly) {
    return (
      <>
        {sections.map((section) => (
          <div key={section.id} style={{ marginBottom: 2 }}>
            {renderContent(section)}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {sections.map((section, idx) => (
          <SectionRow
            key={section.id}
            onDelete={() => deleteSection(section.id)}
            onMoveUp={() => moveSection(section.id, -1)}
            onMoveDown={() => moveSection(section.id, 1)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
          >
            {renderContent(section)}
          </SectionRow>
        ))}
      </AnimatePresence>

      <AddSectionPanel onAdd={addSection} />
    </>
  );
}
