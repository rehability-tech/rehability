"use client";

import React from "react";
import { Flask } from "@phosphor-icons/react/dist/ssr";

/**
 * Widoczny na KAŻDEJ zakładce, gdy piaskownica jest włączona. Bez tego łatwo
 * utworzyć promocję „na produkcji", która w rzeczywistości jest niewidoczna
 * dla uczestników — i odwrotnie.
 */
export function SandboxBanner({ onOpenSandbox }: { onOpenSandbox: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl rounded-tr-none border-2 border-dashed border-amber-300 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/60 text-amber-700">
          <Flask size={18} weight="bold" />
        </span>
        <div>
          <p className="font-jakarta text-[14px] font-bold text-amber-900">
            Tryb piaskownicy jest włączony
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-amber-800/80">
            Wszystko, co teraz utworzysz lub zmienisz, widzi wyłącznie
            administrator. Trwające promocje działają normalnie.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSandbox}
        className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
      >
        Zarządzaj piaskownicą
      </button>
    </div>
  );
}
