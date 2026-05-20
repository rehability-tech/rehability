"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

// Importy komponentów SingleCamp
import { CAMP_DATA } from "./campdata";
import SingleCampHero from "./_components/SingleCampHero";
import SingleCampTabs from "./_components/CampTabs";
import SingleCampBlockNoteRenderer from "./_components/SingleCampBlockNoteRenderer";
import SingleCampForm from "./_components/SingleCampForm";

// === TYPY ===
interface BlockNoteSpan {
  type?: string;
  text: string;
  styles?: Record<string, unknown>;
}

interface BlockNoteBlock {
  id: string;
  type: string;
  props?: {
    level?: number;
    textAlignment?: string;
    textColor?: string;
    backgroundColor?: string;
    [key: string]: unknown;
  };
  content?: BlockNoteSpan[];
  children?: BlockNoteBlock[];
}

interface CampCMSData {
  title?: string;
  subtitle?: string;
  heroImage?: string;
  tags?: string[];
  blocks?: BlockNoteBlock[];
  content?: BlockNoteBlock[];
}

export default function SingleCampPage() {
  const [activeTab, setActiveTab] = useState<"info" | "form">("info");

  const data = CAMP_DATA as BlockNoteBlock[] | CampCMSData;
  const blocksArray: BlockNoteBlock[] = Array.isArray(data)
    ? data
    : data.blocks || data.content || [];

  const cmsData: CampCMSData = Array.isArray(data) ? {} : data;

  const titleBlock = blocksArray.find(
    (b: BlockNoteBlock) => b.type === "heading" && b.props?.level === 1,
  );

  const extractedTitle = titleBlock?.content
    ?.map((span: BlockNoteSpan) => span.text)
    .join("");

  const pageTitle = extractedTitle || cmsData.title || "WYDARZENIE";
  const heroImage = cmsData.heroImage || "/images/static/camp.png";
  const subtitle =
    cmsData.subtitle || "Zanurz się w holistycznym świecie odpoczynku";
  const tags = cmsData.tags || [
    "Świadomy ruch",
    "Masaże",
    "Wellness",
    "Góry",
    "Warsztaty",
    "Czas dla siebie",
  ];

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-montserrat">
      <SingleCampHero
        title={pageTitle}
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
            // POPRAWKA: max-w-[1200px] zamiast max-w-[850px], responsywne paddingi
            className="max-w-[1200px] w-full flex flex-col text-left"
          >
            <SingleCampBlockNoteRenderer blocks={blocksArray} />

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
