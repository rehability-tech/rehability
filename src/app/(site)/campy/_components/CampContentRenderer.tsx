import React, { JSX } from "react";
import Image from "next/image";
import {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heart,
  Sun,
  Quotes,
} from "@phosphor-icons/react/dist/ssr";

// ===== TYPES =====
export interface ContentSpan {
  type?: string;
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface ContentBlock {
  id?: string;
  type: string;
  props?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    textAlignment?: "left" | "center" | "right" | "justify";
    url?: string;
    caption?: string;
    src?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  content?: ContentSpan[];
  children?: ContentBlock[];
}

// ===== INLINE TEXT =====
function renderSpans(spans: ContentSpan[] | undefined): React.ReactNode {
  if (!Array.isArray(spans)) return null;
  return spans.map((s, idx) => {
    const classes: string[] = [];
    if (s.styles?.bold) classes.push("font-bold text-brand-secondary");
    if (s.styles?.italic) classes.push("italic");
    if (s.styles?.underline) classes.push("underline underline-offset-4");
    if (s.styles?.textColor === "brand-primary")
      classes.push("text-brand-primary");
    return (
      <span key={idx} className={classes.join(" ")}>
        {s.text}
      </span>
    );
  });
}

function spanText(spans?: ContentSpan[]): string {
  if (!Array.isArray(spans)) return "";
  return spans.map((s) => s.text).join("");
}

// ===== ICON MATCHER (dla list typu "checklist korzyści") =====
function iconForText(text: string): JSX.Element {
  const lower = text.toLowerCase();
  if (lower.match(/nocleg|pokój|łóżk/))
    return <Bed size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/wyżywieni|bufet|posił|śniad|kolacj|lunch/))
    return (
      <ForkKnife size={22} weight="duotone" className="text-brand-primary" />
    );
  if (lower.match(/masaż|zabieg|spa|kobido/))
    return <Sparkle size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/ruch|jog|trening|fizjoter|stretching/))
    return <Person size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/jacuzzi|wellness|natur|las|jezior/))
    return <Leaf size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/warsztat|powitaln|ognisko|niespodzianka/))
    return <Gift size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/medyt|odd|mindful/))
    return <Sun size={22} weight="duotone" className="text-brand-primary" />;
  if (lower.match(/serc|emocj|wspar/))
    return <Heart size={22} weight="duotone" className="text-brand-primary" />;
  return (
    <CheckCircle size={22} weight="duotone" className="text-brand-primary" />
  );
}

// ===== BLOCK RENDERERS =====

function HeadingBlock({ block }: { block: ContentBlock }) {
  const level = block.props?.level ?? 2;
  const text = renderSpans(block.content);
  const align = block.props?.textAlignment ?? "left";
  const alignCls =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  if (level <= 2) {
    return (
      <h2
        className={`font-jakarta font-bold text-[28px] md:text-[36px] text-brand-secondary leading-tight ${alignCls} relative`}
      >
        <span className="relative inline-block">
          {text}
          <span className="absolute -bottom-2 left-0 right-0 mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow" />
        </span>
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3
        className={`font-jakarta font-bold text-[20px] md:text-[24px] text-brand-secondary ${alignCls}`}
      >
        {text}
      </h3>
    );
  }
  return (
    <h4
      className={`font-jakarta font-semibold text-[16px] md:text-[18px] text-brand-secondary ${alignCls}`}
    >
      {text}
    </h4>
  );
}

function ParagraphBlock({ block }: { block: ContentBlock }) {
  const align = block.props?.textAlignment ?? "left";
  const alignCls =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : align === "justify"
          ? "text-justify"
          : "text-left";
  const text = spanText(block.content);
  if (!text.trim()) return <div className="h-2" />;
  return (
    <p
      className={`font-montserrat text-[15px] md:text-[16px] leading-[180%] text-brand-secondary/80 ${alignCls}`}
    >
      {renderSpans(block.content)}
    </p>
  );
}

function BenefitsList({ items }: { items: ContentBlock[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const text = spanText(item.content);
        return (
          <li
            key={item.id ?? i}
            className="flex items-start gap-3 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_24px_-16px_rgba(3,63,99,0.2)]"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              {iconForText(text)}
            </div>
            <div className="font-montserrat text-[14px] md:text-[15px] text-brand-secondary/85 leading-[160%]">
              {renderSpans(item.content)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NumberedList({ items }: { items: ContentBlock[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li
          key={item.id ?? i}
          className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 border border-white/40"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-bold flex items-center justify-center shrink-0 text-[13px]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="font-montserrat text-[14px] md:text-[15px] text-brand-secondary/85 leading-[160%]">
            {renderSpans(item.content)}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ImageBlock({ block }: { block: ContentBlock }) {
  const url = block.props?.src || block.props?.url;
  if (!url) return null;
  return (
    <figure className="relative w-full overflow-hidden rounded-3xl shadow-[0_20px_60px_-25px_rgba(3,63,99,0.4)] border border-white/40">
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={url}
          alt={block.props?.caption || "Camp"}
          fill
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="object-cover"
        />
      </div>
      {block.props?.caption && (
        <figcaption className="px-4 py-3 bg-white/70 backdrop-blur-md text-[12px] text-brand-secondary/60 text-center italic">
          {block.props.caption}
        </figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ block }: { block: ContentBlock }) {
  return (
    <blockquote className="relative rounded-3xl bg-gradient-to-br from-brand-secondary to-brand-primary text-white p-8 md:p-10 overflow-hidden">
      <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <Quotes
        size={36}
        weight="fill"
        className="text-brand-yellow/80 mb-4 relative"
      />
      <p className="relative font-jakarta text-[18px] md:text-[22px] leading-relaxed font-medium">
        {renderSpans(block.content)}
      </p>
    </blockquote>
  );
}

// ===== GROUPER + MAIN RENDERER =====

type GroupedItem =
  | { kind: "block"; block: ContentBlock }
  | { kind: "bulletList"; items: ContentBlock[] }
  | { kind: "numberedList"; items: ContentBlock[] };

function groupBlocks(blocks: ContentBlock[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let bullet: ContentBlock[] | null = null;
  let numbered: ContentBlock[] | null = null;

  const flush = () => {
    if (bullet && bullet.length) {
      result.push({ kind: "bulletList", items: bullet });
      bullet = null;
    }
    if (numbered && numbered.length) {
      result.push({ kind: "numberedList", items: numbered });
      numbered = null;
    }
  };

  for (const block of blocks) {
    if (block.type === "bulletListItem") {
      if (numbered) flush();
      bullet = bullet ?? [];
      bullet.push(block);
      continue;
    }
    if (block.type === "numberedListItem") {
      if (bullet) flush();
      numbered = numbered ?? [];
      numbered.push(block);
      continue;
    }
    flush();
    // skip h1 (oddany w hero)
    if (block.type === "heading" && block.props?.level === 1) continue;
    result.push({ kind: "block", block });
  }
  flush();
  return result;
}

interface Props {
  blocks: ContentBlock[] | unknown;
  className?: string;
}

export default function CampContentRenderer({ blocks, className }: Props) {
  const normalized = Array.isArray(blocks) ? (blocks as ContentBlock[]) : [];
  if (normalized.length === 0) {
    return (
      <div
        className={`rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 p-10 text-center ${className ?? ""}`}
      >
        <Sparkle
          size={32}
          weight="duotone"
          className="text-brand-primary mx-auto mb-3"
        />
        <p className="font-jakarta text-[18px] font-bold text-brand-secondary">
          Wkrótce opublikujemy szczegóły
        </p>
        <p className="text-[13px] text-brand-secondary/60 mt-1.5 max-w-md mx-auto">
          Pracujemy nad pełnym programem wyjazdu. Wróć tu wkrótce.
        </p>
      </div>
    );
  }

  const grouped = groupBlocks(normalized);

  return (
    <div className={`flex flex-col gap-7 md:gap-10 ${className ?? ""}`}>
      {grouped.map((g, i) => {
        if (g.kind === "bulletList") {
          return <BenefitsList key={i} items={g.items} />;
        }
        if (g.kind === "numberedList") {
          return <NumberedList key={i} items={g.items} />;
        }
        const b = g.block;
        switch (b.type) {
          case "heading":
            return <HeadingBlock key={b.id ?? i} block={b} />;
          case "paragraph":
            return <ParagraphBlock key={b.id ?? i} block={b} />;
          case "image":
            return <ImageBlock key={b.id ?? i} block={b} />;
          case "quote":
            return <QuoteBlock key={b.id ?? i} block={b} />;
          case "map":
            return null;
          default:
            return <ParagraphBlock key={b.id ?? i} block={b} />;
        }
      })}
    </div>
  );
}
