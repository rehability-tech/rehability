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
    <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-5 w-full text-left">
      {content.items.map((item: any, idx: number) => {
        const Icon = item.icon && ICONS[item.icon] ? ICONS[item.icon] : Sparkle;
        return (
          <div
            key={item.id || idx}
            className="flex flex-col items-start gap-4 p-5 w-full rounded-[20px] shadow-sm"
            style={{ backgroundColor: "#287D88" }}
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full shrink-0 bg-white/10">
              <Icon size={24} weight="duotone" className="text-white" />
            </div>
            {/* `on-dark-card` (globals.css) bije inline `style="color:#287D88"`,
                którym AI wyróżnia frazy — na morskim kaflu byłyby niewidoczne. */}
            <div
              className="
                on-dark-card
                w-full mt-1 text-white font-montserrat font-medium text-[14px] leading-relaxed
                [&_p]:m-0 [&_p+p]:mt-1
                [&_strong]:font-bold [&_em]:italic
                [&_span]:text-inherit
              "
            >
              {parse(item.text || "")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
