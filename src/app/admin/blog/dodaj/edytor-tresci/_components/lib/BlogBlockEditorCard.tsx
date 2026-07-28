"use client";

import React, { memo } from "react";
import {
  useDragControls,
  Reorder,
  motion,
  AnimatePresence,
} from "framer-motion";
import { Trash, DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { BlogBlock } from "../hooks/useBlogAiGenerator";
import BlogInlineImageBlock from "../blocks/BlogInlineImageBlock";
import BlogTableBlock from "../blocks/BlogTableBlock";

// Reuse generic trip blocks — they have no camp-specific logic
import HeadingBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HeadingBlock";
import ParagraphBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/ParagraphBlock";
import HighlightBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/HighlightBlock";
import SpacerBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/SpacerBlock";
import BulletListBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/BulletListBlock";
import FaqBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FaqBlock";
import FeaturesGridBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/FeaturesGridBlock";
import VideoEmbedBlock from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/blocks/VideoEmbedBlock";

interface BlogBlockEditorCardProps {
  block: BlogBlock;
  onDelete: () => void;
  onUpdate: (updated: BlogBlock) => void;
}

function BlogBlockEditorCardBase({
  block,
  onDelete,
  onUpdate,
}: BlogBlockEditorCardProps) {
  const dragControls = useDragControls();
  const setContent = (newContent: any) =>
    onUpdate({ ...block, content: newContent });

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return <HeadingBlock content={block.content} onChange={setContent} />;
      case "paragraph":
        return <ParagraphBlock content={block.content} onChange={setContent} />;
      case "highlight":
        return <HighlightBlock content={block.content} onChange={setContent} />;
      case "spacer":
        return <SpacerBlock />;
      case "bulletList":
        return (
          <BulletListBlock content={block.content} onChange={setContent} />
        );
      case "faq":
        return <FaqBlock content={block.content} onChange={setContent} />;
      case "featuresGrid":
        return (
          <FeaturesGridBlock content={block.content} onChange={setContent} />
        );
      case "inlineImage":
        return (
          <BlogInlineImageBlock content={block.content} onChange={setContent} />
        );
      case "videoEmbed":
        return (
          <VideoEmbedBlock content={block.content} onChange={setContent} />
        );
      case "table":
        return <BlogTableBlock content={block.content} onChange={setContent} />;
      default:
        return (
          <div className="text-gray-400 text-sm">
            Nieobsługiwany typ bloku: {block.type}
          </div>
        );
    }
  };

  const shimmerDuration = 2.5;
  const numShimmers = 3;

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
            {[...Array(numShimmers)].map((_, i) => (
              <motion.div
                key={`shimmer-${i}`}
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: shimmerDuration,
                  ease: "linear",
                  delay: i * (shimmerDuration / numShimmers),
                }}
                className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!block.isGenerating && (
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

export default memo(BlogBlockEditorCardBase, (prev, next) => {
  return (
    prev.block.id === next.block.id &&
    prev.block.isGenerating === next.block.isGenerating &&
    JSON.stringify(prev.block.content) === JSON.stringify(next.block.content)
  );
});
