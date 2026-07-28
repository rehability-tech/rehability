import React from "react";

import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import FeaturesGridBlock from "./FeaturesGridBlock";
import BulletListBlock from "./BulletListBlock";
import PricingListBlock from "./PricingListBlock";
import HighlightBlock from "./HighlightBlock";
import FaqBlock from "./FaqBlock";
import InlineImageBlock from "./InlineImageBlock";
import VideoEmbedBlock from "./VideoEmbedBlock";
import SpacerBlock from "./SpacerBlock";
import MapBlock from "./MapBlock";
import HeroBlock from "./HeroBlock";
import { TripBlock } from "@/app/admin/wydarzenia/dodaj/edytor-tresci/_components/hooks/useTripAiGenerator";
import BookingOptionsBlock from "./BookingOptionsBlock";

interface BlockRendererProps {
  blocks: TripBlock[];
  mapUrl?: string | null;
}

export default function BlockRenderer({ blocks, mapUrl }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="@container w-full max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col gap-y-4 text-left">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return <HeadingBlock key={block.id} content={block.content} />;
          case "paragraph":
            return <ParagraphBlock key={block.id} content={block.content} />;
          case "spacer":
            return <SpacerBlock key={block.id} content={block.content} />;
          case "featuresGrid":
            return <FeaturesGridBlock key={block.id} content={block.content} />;
          case "bulletList":
            return <BulletListBlock key={block.id} content={block.content} />;
          case "pricingList":
            return <PricingListBlock key={block.id} content={block.content} />;
          case "highlight":
            return <HighlightBlock key={block.id} content={block.content} />;
          case "faq":
            return <FaqBlock key={block.id} content={block.content} />;
          case "inlineImage":
            return <InlineImageBlock key={block.id} content={block.content} />;
          case "videoEmbed":
            return <VideoEmbedBlock key={block.id} content={block.content} />;
          case "map":
            return <MapBlock key={block.id} mapUrl={mapUrl} />;
          case "bookingOptions":
            return (
              <BookingOptionsBlock key={block.id} content={block.content} />
            );
          default:
            console.warn(`Nieznany typ bloku w rendererze: ${block.type}`);
            return null;
        }
      })}
    </div>
  );
}
