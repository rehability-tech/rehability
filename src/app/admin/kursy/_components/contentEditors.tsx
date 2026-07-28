"use client";

/* ===========================================================================
 *  Edytor treści strony sprzedażowej kursu — wizualnie IDENTYCZNY z edytorem
 *  bloga/wydarzeń: te same bloki (RichTextInput), karty z najechaniowym paskiem
 *  (uchwyt + kosz), przeciąganie kolejności (Framer Motion) i menu „Dodaj blok".
 *  Zestaw bloków jest węższy (tekstowy): nagłówek, akapit, wyróżnik, lista, cytat.
 *
 *  Wewnętrznie pracujemy na modelu bloga `{ _key, type, content }` (content.text
 *  to HTML z RichTextInput), a do/z bazy konwertujemy na `CourseBlock` (text =
 *  HTML). Render publiczny robi `dangerouslySetInnerHTML`, więc front jest 1:1.
 * ========================================================================= */

import React, { memo, useState } from "react";
import {
  Reorder,
  useDragControls,
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Plus,
  Trash,
  DotsSixVertical,
  TextH,
  TextAa,
  ListBullets,
  Star,
  Quotes,
  ArrowsOutLineVertical,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { safeUuid, focusBlockById } from "@/lib/utils";
import {
  type CourseBlock,
  type CourseFaq,
} from "@/app/(site)/kursy/_data/courses";

// Reużywamy gotowych bloków edytora wydarzeń (RichTextInput w środku) — dzięki
// temu wygląd i UX są dokładnie takie jak na blogu.
import HeadingBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HeadingBlock";
import ParagraphBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/ParagraphBlock";
import HighlightBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HighlightBlock";
import BulletListBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/BulletListBlock";
import SpacerBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/SpacerBlock";
import RichTextInput from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/lib/RichTextInput";
import NeonInputGlow from "@/app/admin/blog/dodaj/_components/NeonInputGlow";

// ---- model edytora (jak na blogu: id + type + content z HTML) ----
export type BlockKind =
  | "heading"
  | "paragraph"
  | "highlight"
  | "list"
  | "quote"
  | "spacer";
export type EditorBlock = {
  _key: string;
  type: BlockKind;
  content: any;
  /** Autopilot AI: blok w trakcie generowania — pokazuje neonowy shimmer. */
  isGenerating?: boolean;
};
export type EditFaq = { _key: string; q: string; a: string };

export const genKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Math.random().toString(36).slice(2)}`;

// Czy HTML niesie realny tekst (po wycięciu tagów i &nbsp;).
function htmlHasText(html: string | undefined): boolean {
  if (!html) return false;
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
}

// Czyści HTML z edytora: twarde spacje → zwykłe, usuwa puste akapity (tylko
// spacje/<br>), przycina krańce. Eliminuje „nieusuwalny" whitespace z wklejania.
function cleanHtml(html: string): string {
  return html
    .replace(/ /g, " ")
    .replace(/ /g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<p[^>]*>(?:\s|&nbsp;| |<br\s*\/?>)*<\/p>/gi, "")
    .trim();
}

// CourseBlock (Json bazy) → model edytora. `text`/`items` to HTML.
export function toBuilderBlocks(blocks: CourseBlock[] | null): EditorBlock[] {
  if (!Array.isArray(blocks) || !blocks.length) return [];
  return blocks.map((b) => {
    if (b.type === "list") {
      return {
        _key: genKey(),
        type: "list" as const,
        content: { items: b.items.map((t) => ({ id: safeUuid(), text: t })) },
      };
    }
    if (b.type === "spacer") {
      return { _key: genKey(), type: "spacer" as const, content: {} };
    }
    return { _key: genKey(), type: b.type, content: { text: b.text } };
  });
}

// Model edytora → CourseBlock (puste bloki pomijamy; null = fallback na froncie).
export function fromBuilderBlocks(blocks: EditorBlock[]): CourseBlock[] | null {
  const out = blocks
    .map((b): CourseBlock | null => {
      if (b.type === "spacer") return { type: "spacer" };
      if (b.type === "list") {
        const items = ((b.content?.items as { text?: string }[]) || [])
          .map((i) => cleanHtml(i.text || ""))
          .filter((t) => htmlHasText(t));
        return items.length ? { type: "list", items } : null;
      }
      const text = cleanHtml((b.content?.text as string) || "");
      return htmlHasText(text) ? { type: b.type, text } : null;
    })
    .filter((b): b is CourseBlock => b !== null);
  return out.length ? out : null;
}

export function toEditFaq(faq: CourseFaq[] | null): EditFaq[] {
  if (!Array.isArray(faq)) return [];
  return faq.map((f) => ({ _key: genKey(), q: f.q, a: f.a }));
}
export function fromEditFaq(faq: EditFaq[]): CourseFaq[] | null {
  const out = faq
    .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
    .filter((f) => f.q && f.a);
  return out.length ? out : null;
}

// Domyślna zawartość świeżo dodanego bloku (zgodna z blokami wydarzeń).
function defaultContent(type: BlockKind): any {
  switch (type) {
    case "heading":
      return { text: "" };
    case "list":
      return { items: [{ id: safeUuid(), text: "" }] };
    default:
      return { text: "" };
  }
}

// Cytat — własny mały blok (RichTextInput w ramce z żółtą belką, kursywa).
function QuoteBlock({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  return (
    <div className="w-full border-l-[3px] border-brand-yellow pl-4 py-1">
      <RichTextInput
        value={content?.text || ""}
        onChange={(text) => onChange({ text })}
        className="font-montserrat italic text-lg text-[#0B3B4C] leading-relaxed"
      />
    </div>
  );
}

// Szkielet bloku w trakcie generowania przez AI — animowane „belki" w miejscu
// docelowej treści, by użytkownik widział, że tu coś powstaje (zamiast pustego pola).
function BlockSkeleton({ type }: { type: BlockKind }) {
  const bar = "rounded-full bg-gray-200/80 animate-pulse";
  if (type === "spacer") {
    return <div className="h-6" />;
  }
  if (type === "heading") {
    return (
      <div className="py-1.5">
        <div className={`h-5 w-2/5 ${bar} !bg-brand-primary/20`} />
      </div>
    );
  }
  if (type === "list") {
    return (
      <div className="flex flex-col gap-2.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-3.5 shrink-0 rounded-full bg-brand-primary/20 animate-pulse" />
            <div className={`h-3 ${bar}`} style={{ width: `${78 - i * 12}%` }} />
          </div>
        ))}
      </div>
    );
  }
  if (type === "highlight" || type === "quote") {
    return (
      <div className="border-l-[3px] border-brand-yellow/60 pl-4 py-1.5 flex flex-col gap-2">
        <div className={`h-3.5 w-11/12 ${bar}`} />
        <div className={`h-3.5 w-3/4 ${bar}`} />
      </div>
    );
  }
  // paragraph (domyślnie)
  return (
    <div className="flex flex-col gap-2 py-1.5">
      <div className={`h-3 w-full ${bar}`} />
      <div className={`h-3 w-11/12 ${bar}`} />
      <div className={`h-3 w-2/3 ${bar}`} />
    </div>
  );
}

// ---------------------- Karta bloku (jak na blogu) ----------------------

const CourseBlockCard = memo(
  function CourseBlockCard({
    block,
    onUpdate,
    onDelete,
  }: {
    block: EditorBlock;
    onUpdate: (b: EditorBlock) => void;
    onDelete: () => void;
  }) {
    const dragControls = useDragControls();
    const setContent = (content: any) => onUpdate({ ...block, content });

    const renderContent = () => {
      switch (block.type) {
        case "heading":
          return <HeadingBlock content={block.content} onChange={setContent} />;
        case "paragraph":
          return (
            <ParagraphBlock content={block.content} onChange={setContent} />
          );
        case "highlight":
          return (
            <HighlightBlock content={block.content} onChange={setContent} />
          );
        case "list":
          return (
            <BulletListBlock content={block.content} onChange={setContent} />
          );
        case "quote":
          return <QuoteBlock content={block.content} onChange={setContent} />;
        case "spacer":
          return <SpacerBlock />;
        default:
          return null;
      }
    };

    return (
      <Reorder.Item
        value={block}
        id={block._key}
        dragListener={false}
        dragControls={dragControls}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative group/element flex items-start w-full border border-transparent rounded-[20px] transition-colors bg-white hover:bg-gray-50/80 hover:border-gray-100"
      >
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/element:opacity-100 flex flex-row items-center gap-1 transition-opacity bg-white/95 backdrop-blur-md p-1 rounded-lg shadow-sm border border-gray-200 z-10">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
          >
            <DotsSixVertical size={18} weight="bold" />
          </div>
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>

        <div className="relative w-full lg:pr-16 px-3 py-2">
          {/* Autopilot AI: neonowy shimmer + szkielet na bloku w trakcie generowania
              (zamiast pustego, edytowalnego pola, które wyglądało jak „pusty input"). */}
          <NeonInputGlow isLoading={block.isGenerating} radiusClass="rounded-[16px]" />
          {block.isGenerating ? (
            <BlockSkeleton type={block.type} />
          ) : (
            renderContent()
          )}
        </div>
      </Reorder.Item>
    );
  },
  (prev, next) =>
    prev.block._key === next.block._key &&
    prev.block.isGenerating === next.block.isGenerating &&
    JSON.stringify(prev.block.content) === JSON.stringify(next.block.content),
);

// ---------------------- Menu „Dodaj blok" (jak na blogu) ----------------------

const BLOCK_OPTIONS: {
  type: BlockKind;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { type: "heading", label: "Nagłówek", desc: "Duży tytuł sekcji", icon: <TextH size={20} /> },
  { type: "paragraph", label: "Akapit tekstu", desc: "Zwykły blok tekstowy", icon: <TextAa size={20} /> },
  { type: "highlight", label: "Wyróżnik", desc: "Mocna myśl w ramce", icon: <Star size={20} /> },
  { type: "list", label: "Lista punktowana", desc: "Lista z ikonką ptaszka", icon: <ListBullets size={20} /> },
  { type: "quote", label: "Cytat", desc: "Wypowiedź / cytat", icon: <Quotes size={20} /> },
  { type: "spacer", label: "Przerwa", desc: "Pusty odstęp między blokami", icon: <ArrowsOutLineVertical size={20} /> },
];

function CourseBlockAdder({ onAdd }: { onAdd: (type: BlockKind) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mt-4 py-4 border-2 border-dashed border-gray-200 rounded-[16px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
          <Plus size={18} weight="bold" />
        </div>
        <span className="font-montserrat font-medium text-sm">
          Kliknij, aby dodać element
        </span>
      </button>
    );
  }
  return (
    <div className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-[16px] p-4 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">
          Wybierz rodzaj elementu
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BLOCK_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => {
              onAdd(opt.type);
              setOpen(false);
            }}
            className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-[12px] hover:border-brand-primary hover:shadow-md transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
              {opt.icon}
            </div>
            <div className="flex flex-col">
              <span className="font-montserrat font-semibold text-sm text-[#0B3B4C] mb-0.5">
                {opt.label}
              </span>
              <span className="text-[11px] text-gray-400">{opt.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------- Builder (Reorder + adder) ----------------------

export function CourseBlockBuilder({
  blocks,
  onChange,
}: {
  blocks: EditorBlock[];
  // Forma funkcyjna jest KLUCZOWA: karty są zmemoizowane (komparator pomija
  // callbacki), więc trzymają stary `blocks` w domknięciu. Bez `(prev) => …`
  // edycja jednego bloku nadpisałaby resztę starym stanem (gubienie bloków).
  onChange: (
    b: EditorBlock[] | ((prev: EditorBlock[]) => EditorBlock[]),
  ) => void;
}) {
  const add = (type: BlockKind) => {
    const _key = genKey();
    onChange((prev) => [...prev, { _key, type, content: defaultContent(type) }]);
    focusBlockById(_key);
  };
  const update = (updated: EditorBlock) =>
    onChange((prev) =>
      prev.map((b) => (b._key === updated._key ? updated : b)),
    );
  const remove = (key: string) =>
    onChange((prev) => prev.filter((b) => b._key !== key));

  return (
    <div className="w-full">
      <Reorder.Group
        as="div"
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="flex flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {blocks.map((block) => (
            <CourseBlockCard
              key={block._key}
              block={block}
              onUpdate={update}
              onDelete={() => remove(block._key)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      <CourseBlockAdder onAdd={add} />
    </div>
  );
}

// ------------------------------- FAQ -------------------------------

const inputCls =
  "w-full h-11 px-4 rounded-xl rounded-tr-[3px] bg-white/80 border border-brand-secondary/10 font-montserrat text-[13.5px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all";

export function FaqEditor({
  items,
  onChange,
}: {
  items: EditFaq[];
  onChange: (f: EditFaq[]) => void;
}) {
  const set = (i: number, patch: Partial<EditFaq>) =>
    onChange(items.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="flex flex-col gap-3">
      {items.map((f, i) => (
        <div
          key={f._key}
          className="rounded-2xl rounded-tr-none bg-white/70 border border-brand-secondary/10 p-3"
        >
          <div className="flex items-start gap-1.5">
            <input
              value={f.q}
              onChange={(e) => set(i, { q: e.target.value })}
              placeholder="Pytanie…"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              title="Usuń pytanie"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="inline-flex items-center justify-center size-8 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
          <textarea
            value={f.a}
            onChange={(e) => set(i, { a: e.target.value })}
            rows={2}
            placeholder="Odpowiedź…"
            className={`${inputCls} h-auto py-2.5 mt-2 resize-y leading-relaxed`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { _key: genKey(), q: "", a: "" }])}
        className="self-start inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary font-montserrat font-bold text-[12px] px-3 py-2 rounded-xl rounded-tr-[3px] hover:bg-brand-primary hover:text-white transition-colors"
      >
        <Plus size={13} weight="bold" />
        Dodaj pytanie
      </button>
    </div>
  );
}
