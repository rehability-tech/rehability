import React, { JSX, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
} from "@phosphor-icons/react/dist/ssr";

// === TYPY ===
export interface BlockNoteSpanStyle {
  bold?: boolean;
  italic?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

export interface BlockNoteSpan {
  type?: string;
  text: string;
  styles?: BlockNoteSpanStyle;
}

export interface BlockNoteBlockProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  textAlignment?: "left" | "center" | "right" | "justify";
  textColor?: string;
  backgroundColor?: string;
}

export interface BlockNoteBlock {
  id: string;
  type: "heading" | "paragraph" | "bulletListItem" | string;
  props?: BlockNoteBlockProps;
  content?: BlockNoteSpan[];
  children?: BlockNoteBlock[];
}

// === HELPERS ===
const getIconForText = (text: string, iconClass: string = "text-[#287D88]") => {
  const lower = text.toLowerCase();
  if (lower.includes("nocleg"))
    return <Bed size={28} weight="duotone" className={iconClass} />;
  if (lower.match(/wyżywienie|bufet|posiłek/))
    return <ForkKnife size={28} weight="duotone" className={iconClass} />;
  if (lower.match(/masaż|zabieg/))
    return <Sparkle size={28} weight="duotone" className={iconClass} />;
  if (lower.match(/ruch|jog|trening|fizjoterapeut/))
    return <Person size={28} weight="duotone" className={iconClass} />;
  if (lower.match(/jacuzzi|spa|wellness|natur/))
    return <Leaf size={28} weight="duotone" className={iconClass} />;
  if (lower.match(/warsztat|powitaln|ognisko/))
    return <Gift size={28} weight="duotone" className={iconClass} />;

  return <CheckCircle size={28} weight="duotone" className={iconClass} />;
};

const renderBlockNoteContent = (
  content?: BlockNoteSpan[],
  isInverse: boolean = false,
) => {
  if (!Array.isArray(content)) return null;

  return content.map((span, idx) => {
    let classes = "";
    if (span.styles?.bold)
      classes += isInverse
        ? "font-bold text-white "
        : "font-bold text-[#0B3B4C] ";
    if (span.styles?.italic) classes += "italic ";
    if (span.styles?.textColor === "brand-primary")
      classes += isInverse ? "text-white/90 " : "text-[#287D88] ";

    return (
      <span key={idx} className={classes}>
        {span.text}
      </span>
    );
  });
};

export default function SingleCampBlockNoteRenderer({
  blocks,
}: {
  blocks: BlockNoteBlock[];
}) {
  const groupedBlocks = useMemo(() => {
    if (!blocks || !Array.isArray(blocks)) return [];

    const result: any[] = [];
    let currentListGroup: any = null;

    blocks.forEach((block) => {
      const fullText = block.content?.map((s) => s.text).join("") || "";

      // Ignorowane bloki
      if (block.type === "heading" && block.props?.level === 1) return;
      if (
        fullText.includes("Świadomy ruch - Masaże") ||
        fullText.includes("Pod opieką fizjoterapeuty")
      )
        return;

      if (block.type === "bulletListItem") {
        if (!currentListGroup) {
          currentListGroup = {
            type: "bulletListGroup",
            id: `${block.id}_group`,
            items: [],
          };
          result.push(currentListGroup);
        }
        currentListGroup.items.push(block);
      } else {
        currentListGroup = null;
        result.push(block);
      }
    });

    return result;
  }, [blocks]);

  if (!groupedBlocks.length) return null;

  return (
    <div className="w-full font-montserrat z-10 pb-12">
      <div className="flex flex-col w-full mx-auto">
        {groupedBlocks.map((block, index) => {
          // --- LISTY ---
          if (block.type === "bulletListGroup") {
            const prevBlockText =
              index > 0 && groupedBlocks[index - 1].type === "heading"
                ? groupedBlocks[index - 1].content
                    ?.map((s: any) => s.text)
                    .join("")
                    .toLowerCase() || ""
                : "";

            const isFeaturesGrid =
              prevBlockText.includes("czeka") ||
              prevBlockText.includes("skład");
            const isPricingList = block.items.some((item: any) => {
              const t = item.content?.map((s: any) => s.text).join("") || "";
              return t.includes("zł") && t.includes("|");
            });

            if (isFeaturesGrid) {
              return (
                <div
                  key={block.id}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-12 w-full"
                >
                  {block.items.map((item: any, idx: number) => {
                    const text =
                      item.content?.map((s: any) => s.text).join("") || "";
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-start gap-4 p-8 w-full bg-[#287D88] rounded-[24px] shadow-lg transition-transform hover:-translate-y-1"
                      >
                        <div className="w-12 h-12 flex items-center justify-start">
                          {getIconForText(text, "text-white")}
                        </div>
                        <span className="font-montserrat font-medium text-[16px] leading-relaxed text-white">
                          {renderBlockNoteContent(item.content, true)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (isPricingList) {
              return (
                <div
                  key={block.id}
                  className="flex flex-col gap-2 mb-12 w-full"
                >
                  {block.items.map((item: any, idx: number) => {
                    const fullText =
                      item.content?.map((s: any) => s.text).join("") || "";
                    const parts = fullText
                      .split("|")
                      .map((s: string) => s.trim());
                    const name = parts[0] || "";
                    const price =
                      parts.find((p: string) => p.includes("zł")) || "";
                    const duration =
                      parts.find(
                        (p: string) =>
                          p.includes("minut") || p.includes("h dla"),
                      ) || "";

                    return (
                      <div
                        key={idx}
                        className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 mb-3 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88] overflow-hidden group transition-colors duration-300 w-full"
                      >
                        {/* Tło hover - sprzętowo akcelerowane */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        <div className="relative z-10 flex flex-col gap-1.5">
                          <span className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C]">
                            {name}
                          </span>
                          {duration && (
                            <span className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
                              <Clock
                                size={16}
                                weight="duotone"
                                className="text-[#287D88]"
                              />
                              {duration}
                            </span>
                          )}
                        </div>
                        <div className="relative z-10 mt-4 sm:mt-0 flex items-center">
                          <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88] whitespace-nowrap">
                            {price}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // POPRAWKA: Zmiana z grid na flex-col, wyrównanie stylów typografii z akapitami
            return (
              <div
                key={block.id}
                className="flex flex-col gap-5 mb-10 mt-2 w-full"
              >
                {block.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 w-full group"
                  >
                    <CheckCircle
                      size={24}
                      className="text-[#287D88] shrink-0 mt-[2px] transition-transform duration-300 group-hover:scale-110"
                      weight="fill"
                    />
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed font-light">
                      {renderBlockNoteContent(item.content)}
                    </p>
                  </div>
                ))}
              </div>
            );
          }

          // --- NAGŁÓWKI ---
          if (block.type === "heading") {
            const headingLevel = block.props?.level || 2;
            const Tag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

            return (
              <Tag
                key={block.id}
                className={`font-jakarta font-bold text-[#0B3B4C] w-full tracking-tight ${
                  headingLevel === 2
                    ? "text-3xl md:text-4xl lg:text-5xl leading-tight mt-12 mb-6 first:mt-0"
                    : "text-2xl md:text-3xl mt-8 mb-4"
                }`}
              >
                {renderBlockNoteContent(block.content)}
              </Tag>
            );
          }

          // --- AKAPITY ---
          if (block.type === "paragraph") {
            const fullText = block.content?.map((s) => s.text).join("") || "";
            if (!fullText.trim()) return null;

            if (fullText.includes("Góry Opawskie") && fullText.includes("|")) {
              return (
                <div key={block.id} className="w-full mb-6">
                  <span className="inline-block text-[#287D88] font-bold text-sm uppercase tracking-widest border border-[#287D88] px-4 py-2 rounded-full">
                    {fullText}
                  </span>
                </div>
              );
            }

            const isFullyBold = block.content?.every((s) => s.styles?.bold);
            if (isFullyBold) {
              return (
                <div
                  key={block.id}
                  className="py-4 border-l-4 border-[#287D88] pl-6 w-full mb-8"
                >
                  <p className="font-jakarta font-medium text-[#0B3B4C] text-lg md:text-xl leading-relaxed">
                    {renderBlockNoteContent(block.content)}
                  </p>
                </div>
              );
            }

            const alignClass =
              block.props?.textAlignment === "center"
                ? "text-center mx-auto"
                : block.props?.textAlignment === "right"
                  ? "text-right ml-auto"
                  : "text-left";

            return (
              <p
                key={block.id}
                className={`text-gray-600 text-base md:text-lg leading-loose font-light w-full mb-6 last:mb-0 ${alignClass}`}
              >
                {renderBlockNoteContent(block.content)}
              </p>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
