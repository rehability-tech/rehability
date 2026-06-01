import React from "react";
import ServicesClient from "./_components/ServicesClient";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function SklepPage({ params }: Props) {
  const { bookingId } = await params;

  return (
    <div className="relative min-h-[70vh] pt-4 pb-16 font-montserrat">
      {/* Tło z delikatnymi rozmyciami dla całego widoku sklepu */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Luksusowa ikona nagłówka */}
        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-white to-brand-primary/5 flex items-center justify-center border border-white shadow-sm shrink-0">
          <Sparkle size={28} weight="duotone" className="text-brand-primary" />
        </div>

        <div>
          <h1 className="font-jakarta font-bold text-2xl sm:text-[28px] text-brand-secondary leading-tight">
            Zabiegi & Masaże
          </h1>
          <p className="text-[13.5px] font-medium text-brand-secondary/60 mt-1 max-w-lg leading-relaxed">
            Wybierz zabieg i zarezerwuj swój czas na relaks. Płatność
            zrealizujesz wygodnie na miejscu.
          </p>
        </div>
      </div>

      <ServicesClient bookingId={bookingId} />
    </div>
  );
}
