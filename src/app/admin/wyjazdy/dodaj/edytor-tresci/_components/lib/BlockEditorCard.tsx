"use client";

import React, { memo } from "react";
import {
  useDragControls,
  Reorder,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

import {
  Trash,
  DotsSixVertical,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react/dist/ssr";
import FaqBlock from "../blocks/FaqBlock";
import FeaturesGridBlock from "../blocks/FeaturesGridBlock";
import PricingListBlock from "../blocks/PricingListBlock";
import VideoEmbedBlock from "../blocks/VideoEmbedBlock";
import InlineImageBlock from "../blocks/InlineImageBlock";
import BulletListBlock from "../blocks/BulletListBlock";
import HeadingBlock from "../blocks/HeadingBlock";
import ParagraphBlock from "../blocks/ParagraphBlock";
import HighlightBlock from "../blocks/HighlightBlock";
import SpacerBlock from "../blocks/SpacerBlock";

import { TripBlock } from "../hooks/useTripAiGenerator";
import MapBlock from "../blocks/MapBlock";
import BookingOptionsBlock from "../blocks/BookingOptionsBlock";

// IMPORTY ROZDZIELONYCH BLOKÓW

interface BlockEditorCardProps {
  block: TripBlock;
  onDelete: () => void;
  onUpdate: (updatedBlock: TripBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  tripId: string;
  mapUrl: string;
}

function BlockEditorCardBase({
  block,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
  tripId,
  mapUrl,
}: BlockEditorCardProps) {
  const dragControls = useDragControls();
  const setContent = (newContent: any) =>
    onUpdate({ ...block, content: newContent });

  const renderContent = () => {
    switch (block.type) {
      // --- PODSTAWOWE, KRÓTKIE BLOKI ---
      case "heading":
        return <HeadingBlock content={block.content} onChange={setContent} />;
      case "paragraph":
        return <ParagraphBlock content={block.content} onChange={setContent} />;
      case "highlight":
        return <HighlightBlock content={block.content} onChange={setContent} />;
      case "bookingOptions":
        return (
          <BookingOptionsBlock content={block.content} onChange={setContent} />
        );
      case "spacer":
        return <SpacerBlock />;
      case "map":
        return <MapBlock mapUrl={mapUrl} />;

      // --- WYDZIELONE, SKOMPLIKOWANE BLOKI ---
      case "faq":
        return <FaqBlock content={block.content} onChange={setContent} />;
      case "featuresGrid":
        return (
          <FeaturesGridBlock content={block.content} onChange={setContent} />
        );
      case "pricingList":
        return (
          <PricingListBlock content={block.content} onChange={setContent} />
        );
      case "videoEmbed":
        return (
          <VideoEmbedBlock content={block.content} onChange={setContent} />
        );
      case "inlineImage":
        return (
          <InlineImageBlock
            content={block.content}
            onChange={setContent}
            tripId={tripId}
          />
        );
      case "bulletList":
        return (
          <BulletListBlock content={block.content} onChange={setContent} />
        );

      default:
        return (
          <div className="text-gray-400 text-sm">
            Nieobsługiwany typ bloku: {block.type}
          </div>
        );
    }
  };

  const shimmerDuration = 2.5;
  const numBlocks = 3;

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative group/element flex items-start w-full border border-transparent rounded-[20px] transition-colors",
        block.isGenerating
          ? "bg-white/50"
          : "bg-white hover:bg-gray-50/80 hover:border-gray-100",
      )}
    >
      <AnimatePresence>
        {block.isGenerating && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 rounded-[20px] overflow-hidden pointer-events-auto backdrop-blur-[2px] shadow-[0_0_15px_5px_rgba(40,125,136,0.2)] bg-white/30"
          >
            {/* Animacja Loadera (Shimmer) pozostaje bez zmian */}
            {[...Array(numBlocks)].map((_, i) => (
              <motion.div
                key={`shimmer-${i}`}
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: shimmerDuration,
                  ease: "linear",
                  delay: i * (shimmerDuration / numBlocks),
                }}
                className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!block.isGenerating && (
        <div className="absolute right-2 top-2 -translate-y-0 lg:top-1/2 lg:-translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover/element:opacity-100 flex flex-row items-center gap-1 transition-opacity bg-white/95 backdrop-blur-md p-1 rounded-lg shadow-sm border border-gray-200 z-10">
          <button
            onClick={onMoveUp}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
          >
            <ArrowUp size={16} weight="bold" />
          </button>
          <button
            onClick={onMoveDown}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
          >
            <ArrowDown size={16} weight="bold" />
          </button>
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
          >
            <DotsSixVertical size={18} weight="bold" />
          </div>
          <div className="h-4 w-px bg-gray-200 mx-0.5" />
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "w-full lg:pr-16 mt-1 transition-opacity duration-500",
          block.isGenerating && "opacity-40 pointer-events-none",
        )}
      >
        {renderContent()}
      </div>
    </Reorder.Item>
  );
}
export default memo(BlockEditorCardBase, (prevProps, nextProps) => {
  // Komponent przebuduje się TYLKO wtedy, gdy zmienią się JEGO dane,
  // lub gdy AI zmieni jego status na "isGenerating".
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.isGenerating === nextProps.block.isGenerating &&
    JSON.stringify(prevProps.block.content) ===
      JSON.stringify(nextProps.block.content)
  );
});
