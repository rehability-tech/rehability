"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

import SingleCampHero from "./SingleCampHero";
// Import naszego głównego renderera wszystkich bloków (odzyskanego Pixel-Perfect)
import BlockRenderer from "@/components/block-renderer/BlockRenderer";

interface CampPageClientProps {
  campId: string;
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
  location?: string;
  dateRange?: string;
  price?: string;
  // --- ZMIANA: PUSZCZAMY BLOKI BEZPOŚREDNIO ---
  blocks: any[];
  mapUrl?: string | null;
}

export default function CampPageClient({
  campId,
  title,
  subtitle,
  tags,
  heroImage,
  location,
  dateRange,
  price,
  blocks,
  mapUrl,
}: CampPageClientProps) {
  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-montserrat">
      <SingleCampHero
        title={title}
        subtitle={subtitle}
        tags={tags}
        heroImage={heroImage}
        location={location}
        dateRange={dateRange}
        price={price}
      />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <motion.div
          key="info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] w-full flex flex-col text-left mx-auto"
        >
          {/* RENDERER BLOKÓW ODPALANY LOKALNIE */}
          <BlockRenderer blocks={blocks} mapUrl={mapUrl} />

          <div className="flex justify-center mt-16 pt-8 border-t border-gray-100">
            <Button
              showArrow
              onClick={() => {
                console.log(`Kliknięto zapis na wyjazd: ${campId}`);
                // TODO: Logika przewinięcia / modala
              }}
            >
              Przejdź do formularza zapisu
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
