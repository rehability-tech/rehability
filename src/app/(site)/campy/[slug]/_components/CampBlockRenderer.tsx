"use client";

import React from "react";
import Image from "next/image";
import {
  Bed,
  Campfire,
  CaretDown,
  CheckCircle,
  ForkKnife,
  Heartbeat,
  Leaf,
  MapPin,
  Mountains,
  Person,
  Sparkle,
  Sun,
  Tree,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BookingOptionsCard from "./BookingOptionsCard";

// Blocks saved by the camp editor share this shape:
//   { id?: string; type: string; content: any }
// where the inner `content` differs per block type. The renderer below is
// the source of truth for how that JSON is presented to visitors.

export interface CampBlock {
  id?: string;
  type: string;
  content?: Record<string, unknown>;
}

interface Props {
  blocks: CampBlock[] | unknown;
  mapUrl?: string | null;
  className?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  Heartbeat: <Heartbeat size={22} weight="duotone" />,
  Leaf: <Leaf size={22} weight="duotone" />,
  Sun: <Sun size={22} weight="duotone" />,
  Person: <Person size={22} weight="duotone" />,
  Sparkle: <Sparkle size={22} weight="duotone" />,
  Mountains: <Mountains size={22} weight="duotone" />,
  Tree: <Tree size={22} weight="duotone" />,
  Bed: <Bed size={22} weight="duotone" />,
  Campfire: <Campfire size={22} weight="duotone" />,
  ForkKnife: <ForkKnife size={22} weight="duotone" />,
};

function getYouTubeId(rawUrl: string): string | null {
  return (
    rawUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
    )?.[1] ?? null
  );
}

export default function CampBlockRenderer({ blocks, mapUrl, className }: Props) {
  const list = Array.isArray(blocks) ? (blocks as CampBlock[]) : [];

  if (list.length === 0) {
    return (
      <div
        className={cn(
          "rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 p-10 text-center",
          className,
        )}
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

  return (
    <div className={cn("flex flex-col gap-6 md:gap-8", className)}>
      {list.map((block, i) => (
        <BlockSwitch
          key={block.id ?? `${block.type}-${i}`}
          block={block}
          mapUrl={mapUrl}
        />
      ))}
    </div>
  );
}

function BlockSwitch({
  block,
  mapUrl,
}: {
  block: CampBlock;
  mapUrl?: string | null;
}) {
  const c = (block.content ?? {}) as Record<string, unknown>;

  switch (block.type) {
    case "heading":
      return <HeadingBlock text={(c.text as string) || ""} />;
    case "paragraph":
      return <ParagraphBlock text={(c.text as string) || ""} />;
    case "highlight":
      return <HighlightBlock text={(c.text as string) || ""} />;
    case "spacer":
      return <div aria-hidden="true" className="h-4 md:h-6" />;
    case "bulletList":
      return (
        <BulletList
          items={(c.items as Array<{ id?: string; text?: string }>) || []}
        />
      );
    case "featuresGrid":
      return (
        <FeaturesGrid
          items={
            (c.items as Array<{ id?: string; icon?: string; text?: string }>) ||
            []
          }
        />
      );
    case "pricingList":
      return (
        <PricingList
          items={
            (c.items as Array<{
              id?: string;
              name?: string;
              price?: string | number;
              duration?: string | number;
            }>) || []
          }
        />
      );
    case "faq":
      return (
        <FaqBlock
          items={
            (c.items as Array<{
              id?: string;
              question?: string;
              answer?: string;
            }>) || []
          }
        />
      );
    case "inlineImage":
      return (
        <InlineImage
          url={(c.url as string) || ""}
          alt={(c.alt as string) || ""}
        />
      );
    case "videoEmbed":
      return <VideoEmbed url={(c.url as string) || ""} />;
    case "map":
      return <MapEmbed mapUrl={mapUrl ?? null} />;
    case "bookingOptions":
      return (
        <BookingOptionsCard
          content={c as React.ComponentProps<typeof BookingOptionsCard>["content"]}
        />
      );
    default:
      return null;
  }
}

// ── Atomic blocks ─────────────────────────────────────────────────────────

function HeadingBlock({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <h2 className="font-jakarta font-bold text-brand-secondary text-[26px] md:text-[34px] leading-tight relative">
      <span className="relative inline-block">
        <span dangerouslySetInnerHTML={{ __html: text }} />
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-0 h-1 w-16 rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
        />
      </span>
    </h2>
  );
}

function ParagraphBlock({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div
      className="font-montserrat text-brand-secondary/80 text-[15px] md:text-[16px] leading-[1.85] [&_span]:text-inherit [&_a]:text-brand-primary [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

function HighlightBlock({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <blockquote className="border-l-4 border-brand-primary pl-5 py-3 my-2 bg-brand-primary/[0.04] rounded-r-xl">
      <div
        className="font-jakarta font-semibold text-brand-secondary text-[17px] md:text-[19px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </blockquote>
  );
}

function BulletList({ items }: { items: Array<{ id?: string; text?: string }> }) {
  if (!items.length) return null;
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => (
        <li
          key={item.id || i}
          className="flex items-start gap-3 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_24px_-16px_rgba(3,63,99,0.2)]"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <CheckCircle size={20} weight="duotone" />
          </div>
          <div
            className="font-montserrat text-[14px] md:text-[15px] text-brand-secondary/85 leading-[160%] [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: item.text || "" }}
          />
        </li>
      ))}
    </ul>
  );
}

function FeaturesGrid({
  items,
}: {
  items: Array<{ id?: string; icon?: string; text?: string }>;
}) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div
          key={item.id || i}
          className="flex flex-col gap-3 p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_8px_24px_-16px_rgba(3,63,99,0.2)]"
        >
          <div className="w-11 h-11 rounded-[14px] bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            {ICONS[item.icon || ""] ?? ICONS.Sparkle}
          </div>
          <div
            className="font-montserrat text-[14px] md:text-[15px] text-brand-secondary leading-snug font-medium [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: item.text || "" }}
          />
        </div>
      ))}
    </div>
  );
}

function PricingList({
  items,
}: {
  items: Array<{
    id?: string;
    name?: string;
    price?: string | number;
    duration?: string | number;
  }>;
}) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const priceStr =
          typeof item.price === "number"
            ? `${item.price.toLocaleString("pl-PL")} zł`
            : item.price
              ? `${item.price} zł`
              : "—";
        return (
          <li
            key={item.id || i}
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex flex-col">
              <span className="font-jakarta font-bold text-brand-secondary text-[15px]">
                {item.name || "Usługa"}
              </span>
              {item.duration && (
                <span className="text-[12px] text-brand-secondary/55 mt-0.5">
                  {item.duration} min
                </span>
              )}
            </div>
            <span className="font-jakarta font-bold text-brand-primary text-[16px] shrink-0">
              {priceStr}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function FaqBlock({
  items,
}: {
  items: Array<{ id?: string; question?: string; answer?: string }>;
}) {
  const [open, setOpen] = React.useState<number | null>(null);
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.id || i}
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-jakarta font-semibold text-brand-secondary text-[15px] pr-4">
                {item.question || "Pytanie"}
              </span>
              <CaretDown
                size={18}
                weight="bold"
                className={cn(
                  "text-brand-primary shrink-0 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 font-montserrat text-[14px] text-brand-secondary/75 leading-relaxed border-t border-gray-100 pt-3">
                    {item.answer || ""}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function InlineImage({ url, alt }: { url: string; alt: string }) {
  if (!url) return null;
  return (
    <figure className="my-2">
      <div className="relative w-full overflow-hidden rounded-3xl shadow-[0_20px_60px_-25px_rgba(3,63,99,0.4)] border border-white/40 bg-gray-100">
        <Image
          src={url}
          alt={alt}
          width={1600}
          height={900}
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="w-full h-auto object-cover max-h-[520px]"
          loading="lazy"
        />
      </div>
      {alt && (
        <figcaption className="px-4 py-2 text-[12px] text-brand-secondary/55 text-center italic">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const videoId = getYouTubeId(url);
  if (!videoId) return null;
  return (
    <div className="aspect-video w-full rounded-3xl overflow-hidden bg-gray-100 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.4)] border border-white/40">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="Wideo"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function MapEmbed({ mapUrl }: { mapUrl: string | null }) {
  if (!mapUrl) {
    return (
      <div className="rounded-3xl bg-white/60 border border-white/40 p-6 flex items-center gap-3 text-brand-secondary/60">
        <MapPin size={20} weight="duotone" className="text-brand-primary" />
        <span className="text-[13px]">Mapa lokalizacji pojawi się wkrótce.</span>
      </div>
    );
  }
  return (
    <div className="aspect-[16/10] w-full rounded-3xl overflow-hidden bg-gray-100 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.4)] border border-white/40">
      <iframe
        src={mapUrl}
        title="Mapa lokalizacji"
        loading="lazy"
        className="w-full h-full"
      />
    </div>
  );
}
