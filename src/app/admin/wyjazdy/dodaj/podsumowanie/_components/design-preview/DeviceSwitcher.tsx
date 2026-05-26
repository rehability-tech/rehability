"use client";

import React from "react";
import { Desktop, DeviceMobile } from "@phosphor-icons/react/dist/ssr";

export type ViewModeType = "desktop" | "mobile";

interface DeviceSwitcherProps {
  viewMode: ViewModeType;
  onViewModeChange: (mode: ViewModeType) => void;
}

export default function DeviceSwitcher({
  viewMode,
  onViewModeChange,
}: DeviceSwitcherProps) {
  return (
    <div className="flex justify-center items-center w-full">
      <div className="bg-gray-100/80 p-1 rounded-lg flex items-center gap-1">
        <button
          onClick={() => onViewModeChange("desktop")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200 ${
            viewMode === "desktop"
              ? "bg-white text-[#0B3B4C] shadow-sm"
              : "text-gray-500 hover:text-[#0B3B4C]"
          }`}
        >
          <Desktop
            size={16}
            weight={viewMode === "desktop" ? "fill" : "regular"}
          />
          Desktop
        </button>
        <button
          onClick={() => onViewModeChange("mobile")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200 ${
            viewMode === "mobile"
              ? "bg-white text-[#0B3B4C] shadow-sm"
              : "text-gray-500 hover:text-[#0B3B4C]"
          }`}
        >
          <DeviceMobile
            size={16}
            weight={viewMode === "mobile" ? "fill" : "regular"}
          />
          Mobile
        </button>
      </div>
    </div>
  );
}
