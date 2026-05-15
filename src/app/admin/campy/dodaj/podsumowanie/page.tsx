"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

function PodsumowanieContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 mt-8">
      <h1 className="text-2xl font-jakarta font-bold text-[#0B3B4C] mb-4">
        Krok 3: Podsumowanie wyjazdu
      </h1>
      <p className="text-gray-600 font-montserrat">
        Pomyślnie przeszliśmy do ostatniego kroku!
      </p>
      <div className="mt-4 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
        <span className="font-bold text-brand-primary">
          ID edytowanego wyjazdu:{" "}
        </span>
        <span className="text-gray-700">{id || "Brak ID"}</span>
      </div>
    </div>
  );
}

// Główny eksport z Suspense (wymagane w Next.js przy używaniu useSearchParams)
export default function PodsumowaniePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-12">
          <CircleNotch size={32} className="animate-spin text-brand-primary" />
        </div>
      }
    >
      <PodsumowanieContent />
    </Suspense>
  );
}
