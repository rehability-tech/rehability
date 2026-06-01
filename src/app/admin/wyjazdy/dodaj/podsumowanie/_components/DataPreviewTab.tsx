"use client";

import React from "react";
import {
  CalendarBlank,
  MapPin,
  Users,
  Money,
  Tag,
  Note,
  Heart,
} from "@phosphor-icons/react/dist/ssr";

const formatPrice = (value: any) => {
  const num = parseFloat(value);
  return isNaN(num)
    ? "0.00"
    : num.toLocaleString("pl-PL", { minimumFractionDigits: 2 });
};

const formatReadableDate = (dateString: any) => {
  if (!dateString) return "---";
  return new Date(dateString).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

interface DataPreviewTabProps {
  trip: any;
}

export default function DataPreviewTab({ trip }: DataPreviewTabProps) {
  // Bezpieczne parsowanie lokalizacji (wsparcie dla nowego JSON-a i starych stringów)
  let locName = trip?.location || "Brak zdefiniowanej lokalizacji";
  let locCity = "";

  if (trip?.location) {
    try {
      const parsed =
        typeof trip.location === "string"
          ? JSON.parse(trip.location)
          : trip.location;
      locName = parsed.name || "Brak nazwy obiektu";
      locCity = parsed.city || "";
    } catch (e) {
      // Fallback dla starych wyjazdów zapisanych jako zwykły tekst
      locName = trip.location;
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-gray-100 shadow-sm">
        <h3 className="font-jakarta font-bold text-base text-[#0B3B4C] mb-5 flex items-center gap-2">
          <Note size={20} weight="duotone" className="text-brand-primary" />
          Główne informacje
        </h3>
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Tytuł wyjazdu
            </span>
            <p className="font-montserrat font-bold text-xl text-[#0B3B4C] mt-1">
              {trip?.title}
            </p>
          </div>
          {trip?.subtitle && (
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Podtytuł (AI)
              </span>
              <p className="font-montserrat text-sm text-gray-600 mt-1 leading-relaxed max-w-4xl">
                {trip?.subtitle}
              </p>
            </div>
          )}
          {trip?.tags && trip.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 mb-2">
                <Tag size={14} /> Tagi marketingowe
              </span>
              <div className="flex flex-wrap gap-2">
                {trip.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 text-xs font-semibold rounded-full bg-brand-primary/5 text-brand-primary border border-brand-primary/10 font-montserrat"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <CalendarBlank size={24} weight="duotone" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Czas trwania wyjazdu
            </span>
            <p className="font-montserrat font-bold text-[16px] text-[#0B3B4C] mt-1">
              {formatReadableDate(trip?.startDate)}
            </p>
            <p className="font-montserrat text-xs text-gray-400 mt-0.5">
              do {formatReadableDate(trip?.endDate)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <Users size={24} weight="duotone" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Dostępność
            </span>
            <p className="font-montserrat font-bold text-[18px] text-[#0B3B4C] mt-1">
              {trip?.capacity} miejsc
            </p>
            <p className="font-montserrat text-xs text-green-600 font-semibold mt-0.5">
              0 rezerwacji w systemie
            </p>
          </div>
        </div>

        <div
          className={`bg-white rounded-[24px] p-6 border shadow-sm flex items-start gap-4 md:col-span-2 ${
            trip?.allowBringFriend
              ? "border-brand-primary/20 bg-brand-primary/[0.02]"
              : "border-gray-100"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              trip?.allowBringFriend
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <Heart size={24} weight="duotone" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Opcja "Zabierz osobę towarzyszącą"
            </span>
            <p
              className={`font-montserrat font-bold text-[16px] mt-1 ${
                trip?.allowBringFriend ? "text-brand-primary" : "text-gray-500"
              }`}
            >
              {trip?.allowBringFriend ? "Aktywna" : "Nieaktywna"}
            </p>
            <p className="font-montserrat text-xs text-gray-400 mt-0.5">
              {trip?.allowBringFriend
                ? "Uczestnicy mogą rezerwować 2 miejsca z gwarantowanym wspólnym pokojem."
                : "Rezerwacja tylko dla jednej osoby."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-start gap-4 md:col-span-2">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            <MapPin size={24} weight="duotone" />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Docelowa lokalizacja
            </span>
            {/* Zaktualizowane renderowanie zdekodowanej lokalizacji */}
            <p className="font-montserrat font-bold text-[16px] text-[#0B3B4C] mt-1">
              {locName}
            </p>
            {locCity && (
              <p className="font-montserrat text-[14px] font-medium text-gray-500 mt-0.5">
                {locCity}
              </p>
            )}

            {trip?.mapUrl && (
              <p className="font-montserrat text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                ✓ Zweryfikowano w Google Maps
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-gray-100 shadow-sm">
        <h3 className="font-jakarta font-bold text-base text-[#0B3B4C] mb-5 flex items-center gap-2">
          <Money size={20} weight="duotone" className="text-brand-primary" />{" "}
          Finanse i Rozliczenia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Koszt całkowity wyjazdu
            </span>
            <p className="font-montserrat font-bold text-2xl text-[#0B3B4C] mt-2">
              {formatPrice(trip?.price)}{" "}
              <span className="text-sm font-medium">PLN</span>
            </p>
          </div>
          <div className="p-6 bg-brand-primary/[0.02] border border-brand-primary/10 rounded-2xl">
            <span className="text-xs text-brand-primary/60 font-semibold uppercase tracking-wider">
              Zadatek płatny natychmiast
            </span>
            <p className="font-montserrat font-bold text-2xl text-brand-primary mt-2">
              {formatPrice(trip?.deposit)}{" "}
              <span className="text-sm font-medium">PLN</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
