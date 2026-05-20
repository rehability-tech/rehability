import React from "react";
import parse from "html-react-parser";
import {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
} from "@phosphor-icons/react/dist/ssr";

const ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
};

export default function FeaturesGridBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-5xl mx-auto px-4 w-full my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
        {content.items.map((item: any, idx: number) => {
          const Icon =
            item.icon && ICONS[item.icon] ? ICONS[item.icon] : Sparkle;
          return (
            <div
              key={item.id || idx}
              className="flex flex-col items-start gap-4 p-5 w-full bg-[#287D88] rounded-[20px] shadow-sm"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full shrink-0 bg-white/10">
                <Icon size={24} weight="duotone" className="text-white" />
              </div>
              <div className="w-full mt-1 text-white font-montserrat font-medium text-[14px] leading-relaxed">
                {parse(item.text || "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
