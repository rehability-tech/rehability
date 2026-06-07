"use client";

import { TEMPLATE_TAGS } from "../lib/constants";

interface TemplateTagsBarProps {
  onInsert: (tagName: string) => void;
}

export default function TemplateTagsBar({ onInsert }: TemplateTagsBarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-[12px]">
      <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat mr-1">
        Wstaw
      </span>
      {TEMPLATE_TAGS.map((tag) => (
        <button
          key={tag.name}
          type="button"
          onClick={() => onInsert(tag.name)}
          style={{
            background: tag.bg,
            color: tag.color,
            border: `1.5px solid ${tag.border}`,
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-xs font-bold font-montserrat cursor-pointer hover:opacity-80 active:scale-95 transition-all"
        >
          <span className="text-[10px] opacity-60">ďĽ‹</span>
          {tag.label}
        </button>
      ))}
      <span className="hidden sm:block text-[10px] text-gray-400 font-montserrat ml-1">
        â€” kliknij w pole, potem wstaw zmiennÄ…
      </span>
    </div>
  );
}

