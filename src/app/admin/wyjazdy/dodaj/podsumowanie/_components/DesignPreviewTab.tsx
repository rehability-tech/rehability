"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PreviewUpcomingTrip from "./PreviewUpcomingTrip";

// Importy z naszego nowego folderu design-preview
import TabSelector, { TabType } from "./design-preview/TabSelector";
import DeviceSwitcher, { ViewModeType } from "./design-preview/DeviceSwitcher";
import CardPreviewTab from "./design-preview/CardPreviewTab";
import DescriptionPreviewTab from "./design-preview/DescriptionPreviewTab";

interface DesignPreviewTabProps {
  id: string;
  trip: any;
  isPublishing: boolean;
  onPublish: () => void;
}

export default function DesignPreviewTab({
  id,
  trip,
  isPublishing,
  onPublish,
}: DesignPreviewTabProps) {
  const [designTab, setDesignTab] = useState<TabType>("strona_glowna");
  const [viewMode, setViewMode] = useState<ViewModeType>("desktop");

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. SEKCJA: Zakładki */}
      <TabSelector activeTab={designTab} onTabChange={setDesignTab} />

      {/* 2. SEKCJA: Wybór urządzenia */}
      <DeviceSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 3. SEKCJA: Obszar podglądu */}
      <div className="w-full rounded-[24px] relative min-h-[600px]  flex flex-col items-center p-6 px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${designTab}-${viewMode}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`flex flex-col relative transition-all duration-500  overflow-hidden ${
              viewMode === "mobile"
                ? "w-full max-w-[420px] rounded-[32px] "
                : "w-full max-w-5xl rounded-[12px] "
            }`}
          >
            {/* Renderowanie wybranej zakładki */}
            {designTab === "strona_glowna" && (
              <div className="w-full flex flex-col">
                <PreviewUpcomingTrip trip={trip} viewMode={viewMode} />
              </div>
            )}

            {designTab === "karta" && (
              <CardPreviewTab trip={trip} viewMode={viewMode} />
            )}

            {designTab === "opis" && (
              <DescriptionPreviewTab trip={trip} viewMode={viewMode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
