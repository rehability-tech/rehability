"use client";

import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";

const STORAGE_KEY = "rehability_consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "all");
    setVisible(false);
  };

  const essential = () => {
    localStorage.setItem(STORAGE_KEY, "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[9999] p-4 md:p-6">
      <div className="w-[340px] md:w-[400px] bg-white/95 backdrop-blur-md border border-gray-100 text-[#0B3B4C] rounded-[20px] rounded-tr-none shadow-xl px-6 py-5 flex flex-col gap-4">

        {/* Nagłówek */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-jakarta font-semibold text-[15px] leading-tight">
            Twoja prywatność
          </p>
          <button
            onClick={essential}
            aria-label="Zamknij"
            className="p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0 -mt-0.5"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Tekst */}
        <p className="font-montserrat text-[12px] text-gray-500 leading-[170%]">
          Używamy plików cookie do analizy ruchu i personalizacji treści
          marketingowych.{" "}
          <a
            href="/polityka-prywatnosci"
            className="text-[#287D88] underline underline-offset-2 hover:text-[#1f666f] transition-colors"
          >
            Polityka prywatności
          </a>
          .
        </p>

        {/* Przyciski */}
        <div className="flex flex-col gap-2">
          <button
            onClick={accept}
            className="w-full py-2.5 rounded-[12px] rounded-tr-none bg-[#287D88] hover:bg-[#1f666f] font-montserrat font-semibold text-[13px] text-white transition-all shadow-sm"
          >
            Akceptuję wszystkie
          </button>
          <button
            onClick={essential}
            className="w-full py-2.5 rounded-[12px] rounded-tr-none border border-gray-200 font-montserrat font-medium text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
          >
            Tylko niezbędne
          </button>
        </div>
      </div>
    </div>
  );
}
