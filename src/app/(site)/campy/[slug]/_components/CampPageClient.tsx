"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

import SingleCampHero from "./SingleCampHero";
import SingleCampTabs from "./CampTabs";
import SingleCampBlockNoteRenderer, {
  BlockNoteBlock,
} from "./SingleCampBlockNoteRenderer";
import SingleCampForm from "./SingleCampForm";

interface CampPageClientProps {
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
  blocks: BlockNoteBlock[];
}

export default function CampPageClient({
  title,
  subtitle,
  tags,
  heroImage,
  blocks,
}: CampPageClientProps) {
  const [activeTab, setActiveTab] = useState<"info" | "form">("info");

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-montserrat">
      <SingleCampHero
        title={title}
        subtitle={subtitle}
        tags={tags}
        heroImage={heroImage}
      />

      <SingleCampTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        {activeTab === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[1200px] w-full flex flex-col text-left"
          >
            <SingleCampBlockNoteRenderer blocks={blocks} />

            <div className="flex justify-center mt-16 pt-8 border-t border-gray-100">
              <Button showArrow onClick={() => setActiveTab("form")}>
                Przejdź do formularza zapisu
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === "form" && <SingleCampForm />}
      </section>
    </main>
  );
}
