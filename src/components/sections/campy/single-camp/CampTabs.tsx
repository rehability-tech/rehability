"use client";

import React from "react";

interface SingleCampTabsProps {
  activeTab: "info" | "form";
  setActiveTab: (tab: "info" | "form") => void;
}

export default function SingleCampTabs({
  activeTab,
  setActiveTab,
}: SingleCampTabsProps) {
  return (
    <section className="container mx-auto px-4 max-[1024px]:px-6 pt-12 flex justify-center">
      <div className="flex bg-white rounded-full p-2 shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-8 py-3 rounded-full cursor-pointer rounded-tr-none font-jakarta font-semibold text-[16px] transition-all duration-300 ${
            activeTab === "info"
              ? "bg-[#659F9F] text-white shadow-md hover:bg-[#578b8b]"
              : "text-gray-500 hover:text-[#0B3B4C] hover:bg-gray-50"
          }`}
        >
          Opis wyjazdu
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`px-8 py-3 rounded-full cursor-pointer rounded-tl-none font-jakarta font-semibold text-[16px] transition-all duration-300 ${
            activeTab === "form"
              ? "bg-[#659F9F] text-white shadow-md hover:bg-[#578b8b]"
              : "text-gray-500 hover:text-[#0B3B4C] hover:bg-gray-50"
          }`}
        >
          Formularz zapisowy
        </button>
      </div>
    </section>
  );
}
