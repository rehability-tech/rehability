import React from "react";
import parse from "html-react-parser";
import {
  Heartbeat,
  Leaf,
  Sun,
  Person,
  Sparkle,
  Mountains,
  Tree,
  Bed,
  Campfire,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

// Mapowanie stringów z AI na prawdziwe ikony
const getIcon = (iconName: string) => {
  const props = {
    size: 28,
    weight: "fill" as const,
    className: "text-brand-primary",
  };
  switch (iconName) {
    case "Heartbeat":
      return <Heartbeat {...props} />;
    case "Leaf":
      return <Leaf {...props} />;
    case "Sun":
      return <Sun {...props} />;
    case "Person":
      return <Person {...props} />;
    case "Sparkle":
      return <Sparkle {...props} />;
    case "Mountains":
      return <Mountains {...props} />;
    case "Tree":
      return <Tree {...props} />;
    case "Bed":
      return <Bed {...props} />;
    case "Campfire":
      return <Campfire {...props} />;
    default:
      return <Sparkle {...props} />; // Fallback
  }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {content.items.map((item: any, idx: number) => (
          <div
            key={item.id || idx}
            className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
              {getIcon(item.icon)}
            </div>
            <div className="font-montserrat text-[#0B3B4C] text-[15px] font-medium leading-relaxed">
              {parse(item.text || "")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
