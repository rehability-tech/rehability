"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Money,
  TextAa,
  CaretRight,
  X,
  Sparkle,
  CircleNotch,
  Warning,
} from "@phosphor-icons/react/dist/ssr";

import { registerLocale } from "react-datepicker";
import { pl } from "date-fns/locale/pl";
import "react-datepicker/dist/react-datepicker.css";
import {
  FormDatePicker,
  FormInput,
  FormLocationInput,
  FormTextarea,
} from "../_components/FormFields";
import AiGeneratorModal, {
  AiGeneratedData,
} from "../_components/AiGeneratorModal";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Buildings, MapTrifold } from "@phosphor-icons/react";

registerLocale("pl", pl);

// ============================================================================
// WEWNĘTRZNY KOMPONENT Z LOGIKĄ FORMULARZA
// ============================================================================
function BasicDataFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [title, setTitle] = useState("");
  // --- NOWE STANY DLA LOKALIZACJI ---
  const [locationName, setLocationName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [allowBringFriend, setAllowBringFriend] = useState(false);
  const [hasBookingOptionsBlock, setHasBookingOptionsBlock] = useState(false);

  const [description, setDescription] = useState("");
  const [lastAiPrompt, setLastAiPrompt] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // --- POBIERANIE DANYCH DO EDYCJI ---
  useEffect(() => {
    if (editId) {
      const fetchCampData = async () => {
        setIsFetchingData(true);
        try {
          const response = await fetch(`/api/admin/wyjazdy/${editId}`);
          if (!response.ok) throw new Error("Błąd pobierania danych");

          const data = await response.json();

          setTitle(data.title || "");
          setStartDate(data.startDate ? new Date(data.startDate) : null);
          setEndDate(data.endDate ? new Date(data.endDate) : null);
          setCapacity(data.capacity?.toString() || "");
          setPrice(data.price?.toString() || "");
          setDeposit(data.deposit?.toString() || "");
          setDescription(data.description || "");
          setLastAiPrompt(data.lastAiPrompt || "");
          setMapUrl(data.mapUrl || "");
          setAllowBringFriend(data.allowBringFriend || false);

          // Sprawdzamy, czy w blokach treści jest blok opcji rezerwacji
          try {
            const parsedBlocks =
              typeof data.blocks === "string"
                ? JSON.parse(data.blocks)
                : data.blocks;
            setHasBookingOptionsBlock(
              Array.isArray(parsedBlocks) &&
                parsedBlocks.some(
                  (b: any) => b?.type === "bookingOptions",
                ),
            );
          } catch {
            setHasBookingOptionsBlock(false);
          }

          // Dekodowanie lokalizacji zapisanego jako JSON String
          if (data.location) {
            try {
              const parsedLocation = JSON.parse(data.location);
              setLocationName(parsedLocation.name || "");
              setLocationCity(parsedLocation.city || "");
            } catch (e) {
              // Fallback, jeśli wcześniej było to zapisane jako zwykły string
              setLocationName(data.location);
            }
          }
        } catch (error) {
          console.error(error);
          toast.error("Nie udało się załadować danych wyjazdu.");
        } finally {
          setIsFetchingData(false);
        }
      };

      fetchCampData();
    }
  }, [editId]);

  // --- AI GENERATOR ---
  const handleAiSubmit = async (prompt: string, modelType: string) => {
    setIsAiModalOpen(false);
    setIsGeneratingData(true);
    setLastAiPrompt(prompt);

    try {
      const response = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          action: "generateBasicInfo",
          model: modelType,
        }),
      });

      if (!response.ok) throw new Error("Błąd API");

      const data: AiGeneratedData = await response.json();

      setTitle(data.title || "");
      if (data.description) setDescription(data.description);
      setCapacity(data.capacity || "");
      if (data.price) setPrice(data.price);
      if (data.deposit) setDeposit(data.deposit);
      if (data.startDate) setStartDate(new Date(data.startDate));
      if (data.endDate) setEndDate(new Date(data.endDate));

      // Nowy kod na froncie
      if (data.locationName) setLocationName(data.locationName);
      if (data.locationCity) setLocationCity(data.locationCity);
      if (data.allowBringFriend !== undefined)
        setAllowBringFriend(data.allowBringFriend);
      toast.success("Dane zostały pomyślnie wygenerowane!");
    } catch (error) {
      console.error("Błąd podczas generowania z AI:", error);
      toast.error(
        "Ten model AI jest obciążony. Wybierz zapasowy i spróbuj ponownie",
      );
      setIsAiModalOpen(true);
    } finally {
      setIsGeneratingData(false);
    }
  };

  // --- ZAPISYWANIE DANYCH ---
  const handleSaveAndNext = async () => {
    setIsSaving(true);

    // Pakujemy nazwę i miasto do jednego stringa JSON (aby pasowało do schematu Prisma)
    const locationObjectString = JSON.stringify({
      name: locationName,
      city: locationCity,
    });

    try {
      const response = await fetch("/api/admin/wyjazdy/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title,
          description,
          location: locationObjectString,
          mapUrl,
          startDate,
          endDate,
          capacity,
          price,
          deposit,
          lastAiPrompt,
          lastStage: "edytor-tresci",
          allowBringFriend,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Błąd zapisu");

      router.push(
        `/admin/wyjazdy/dodaj/edytor-tresci?id=${result.tripId || editId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nie udało się zapisać danych";

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-gray-500 font-montserrat font-medium">
          Ładowanie danych wyjazdu...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="mb-6">
        <h2 className="text-xl font-jakarta font-bold text-[#0B3B4C]">
          {editId ? "Edytuj dane podstawowe" : "Dane podstawowe wyjazdu"}
        </h2>
        <p className="text-sm text-gray-500 font-montserrat mt-1">
          {editId
            ? "Zaktualizuj główne informacje o wyjeździe."
            : "Wprowadź główne informacje o organizowanym wyjeździe lub pozwól, by AI zrobiło to za Ciebie."}
        </p>
      </div>

      <AiPromoBanner onOpenModal={() => setIsAiModalOpen(true)} />

      <form className="flex flex-col gap-10 relative z-0">
        {/* SEKCJA 1: INFORMACJE OGÓLNE */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Informacje ogólne
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Tytuł Wyjazdu"
              required
              icon={<TextAa size={18} />}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Wiosenny Reset w Bieszczadach"
              name="tripTitle"
              autoComplete="off"
              isLoading={isGeneratingData}
              containerClassName="md:col-span-2"
            />

            <FormTextarea
              label="Krótki opis wyjazdu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz w kilku zdaniach czego uczestnicy mogą się spodziewać — klimat, aktywności, wyjątkowe momenty..."
              name="campDescription"
              isLoading={isGeneratingData}
              containerClassName="md:col-span-2"
              rows={4}
            />

            <FormDatePicker
              label="Data rozpoczęcia"
              required
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Wybierz datę..."
              name="campStartDate"
              isLoading={isGeneratingData}
            />

            <FormDatePicker
              label="Data zakończenia"
              required
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              placeholderText="Wybierz datę..."
              name="campEndDate"
              isLoading={isGeneratingData}
            />

            <FormInput
              label="Liczba dostępnych miejsc"
              required
              type="number"
              min="1"
              icon={<Users size={18} />}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="np. 10"
              name="campCapacity"
              autoComplete="off"
              isLoading={isGeneratingData}
              containerClassName="md:col-span-2"
            />
          </div>
        </section>

        {/* SEKCJA 2: LOKALIZACJA WYJAZDU (NOWA) */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Lokalizacja wyjazdu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <FormInput
              label="Nazwa Obiektu (Marketingowa)"
              required
              icon={<Buildings size={18} />}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="np. Holiday Sky Park"
              name="campLocationName"
              autoComplete="off"
              isLoading={isGeneratingData}
              helperText="Ta nazwa będzie wielką czcionką na kartach wyjazdu."
            />

            <FormInput
              label="Miejscowość"
              required
              icon={<MapPin size={18} />}
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              placeholder="np. Jarnołtówek"
              name="campLocationCity"
              autoComplete="off"
              isLoading={isGeneratingData}
            />
          </div>

          <div className="bg-brand-primary/[0.03] border border-brand-primary/10 rounded-[16px] p-5">
            <FormLocationInput
              label="Podepnij interaktywną mapę (Google Maps)"
              icon={<MapTrifold size={18} />}
              placeholder="Wyszukaj dokładny adres / obiekt w Google..."
              onPlaceSelected={(place) => {
                // 1. ZABEZPIECZENIE: Zapobiega crashom, gdy user wciśnie Enter bez wyboru opcji z listy
                if (!place) return;

                const placeId = place.place_id;

                if (placeId) {
                  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

                  // 2. POPRAWKA URL: Oficjalny endpoint Google Maps Embed API
                  const embedIframeUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`;

                  setMapUrl(embedIframeUrl);

                  // Magia: Inteligentne wyciąganie nazwy miejscowości z wyników Google!
                  if (!locationCity && place.address_components) {
                    const cityComponent = place.address_components.find(
                      (c: any) =>
                        c.types.includes("locality") ||
                        c.types.includes("administrative_area_level_2"),
                    );
                    if (cityComponent) setLocationCity(cityComponent.long_name);
                  }

                  // Magia 2: Wyciąganie nazwy obiektu, jeśli go brakuje
                  if (!locationName && place.name) {
                    setLocationName(place.name);
                  }
                }
              }}
              helperText={
                mapUrl
                  ? "✅ Interaktywna mapa Google została pomyślnie powiązana."
                  : "Wyszukaj to miejsce, aby klienci widzieli precyzyjną mapę w szczegółach wyjazdu."
              }
            />
          </div>
        </section>

        {/* SEKCJA 3: CENY I PŁATNOŚCI */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Ceny i płatności
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Cena całkowita wyjazdu (PLN)"
              required
              type="number"
              min="0"
              step="0.01"
              icon={<Money size={18} />}
              placeholder="np. 2500"
              name="campPrice"
              autoComplete="off"
              value={price}
              isLoading={isGeneratingData}
              onChange={(e) => setPrice(e.target.value)}
            />

            <FormInput
              label="Wymagany zadatek (PLN)"
              required
              type="number"
              value={deposit}
              min="0"
              onChange={(e) => setDeposit(e.target.value)}
              step="0.01"
              icon={<Money size={18} />}
              placeholder="np. 500"
              name="campDeposit"
              autoComplete="off"
              isLoading={isGeneratingData}
              helperText="Kwota, którą uczestnik opłaca przy rezerwacji miejsca."
            />
          </div>
          {/* PAKIET WYJAZD WE DWOJE */}
          {/* OPCJA WYJAZD WE DWOJE */}
          <div
            className={`border rounded-[16px] mt-6 p-5 md:p-6 transition-all duration-300 ${
              allowBringFriend && editId && !hasBookingOptionsBlock
                ? "bg-amber-50/60 border-amber-300 shadow-sm"
                : allowBringFriend
                  ? "bg-brand-primary/[0.03] border-brand-primary/20 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
            }`}
          >
            <label className="flex items-start gap-4 cursor-pointer group">
              {/* Nowoczesny Przełącznik (Toggle Switch) */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out mt-0.5 ${
                  allowBringFriend
                    ? "bg-brand-primary"
                    : "bg-gray-300 group-hover:bg-gray-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
                    allowBringFriend ? "translate-x-6" : "translate-x-1"
                  }`}
                />
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={allowBringFriend}
                  onChange={(e) => setAllowBringFriend(e.target.checked)}
                />
              </div>

              {/* Teksty */}
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#0B3B4C] font-jakarta transition-colors group-hover:text-brand-primary">
                  Włącz opcję "Zabierz osobę towarzyszącą"
                </span>
                <p className="text-[13px] text-gray-500 font-montserrat mt-1 leading-relaxed max-w-2xl">
                  Pozwala uczestnikowi zarezerwować 2 miejsca jednocześnie (cena
                  i zadatek ulegają podwojeniu) i wysłać automatyczne
                  zaproszenie e-mail do drugiej osoby z prośbą o uzupełnienie
                  danych.
                </p>
              </div>
            </label>

            {allowBringFriend && editId && !hasBookingOptionsBlock && (
              <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-amber-300 bg-amber-100/60 px-3.5 py-3 text-[12.5px] text-amber-800 font-montserrat leading-relaxed">
                <Warning
                  size={18}
                  weight="fill"
                  className="shrink-0 text-amber-600 mt-0.5"
                />
                <span>
                  Opcja jest włączona, ale w Edytorze Treści brakuje bloku{" "}
                  <strong>„Opcje rezerwacji"</strong>. Dodaj go, w przeciwnym
                  razie publikacja wyjazdu będzie zablokowana.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ZAPIS */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100">
          <Link
            href="/admin/wyjazdy"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            <X size={18} weight="bold" />
            Anuluj
          </Link>

          <Button
            onClick={handleSaveAndNext}
            isLoading={isSaving}
            disabled={!title || !locationName || isSaving}
            rightIcon={<CaretRight size={18} weight="bold" />}
          >
            Dalej: Edytor nakładek
          </Button>
        </div>
      </form>

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSubmit={handleAiSubmit}
        prompt={lastAiPrompt}
        setPrompt={setLastAiPrompt}
      />
    </div>
  );
}

// ============================================================================
// BANER AI
// ============================================================================
function AiPromoBanner({ onOpenModal }: { onOpenModal: () => void }) {
  // (kod banera bez zmian - dla czytelności nie duplikuję tu całej zawartości)
  return (
    <div className="mb-8 p-5 rounded-[20px] bg-white border border-brand-primary/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/[0.03] to-transparent pointer-events-none"></div>
      <Sparkle
        size={140}
        weight="fill"
        className="absolute -right-6 -top-8 text-brand-primary/[0.04] pointer-events-none"
      />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(40,125,136,0.4)] relative overflow-hidden">
          <Sparkle
            size={24}
            weight="fill"
            className="text-brand-primary animate-pulse"
          />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#0B3B4C] font-montserrat flex items-center gap-2">
            Inteligentny Asystent Kreatora
            <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-wider font-bold">
              AI
            </span>
          </h3>
          <p className="text-[13px] text-gray-500 font-montserrat mt-0.5 max-w-md leading-relaxed">
            Wklej gotowy opis, a nasz silnik przeanalizuje go i automatycznie
            uzupełni kluczowe dane wyjazdu.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenModal}
        className="group flex cursor-pointer items-center gap-2.5 px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-[12px] hover:bg-[#1E6068] transition-all duration-300 w-full md:w-auto justify-center shrink-0 relative z-10 shadow-[0_4px_20px_rgba(40,125,136,0.3)] hover:shadow-[0_6px_25px_rgba(40,125,136,0.4)] hover:-translate-y-0.5 active:translate-y-0"
      >
        <Sparkle
          size={18}
          weight="fill"
          className="text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
        />
        Wygeneruj z AI
      </button>
    </div>
  );
}

// ============================================================================
// GŁÓWNY EKSPORT Z SUSPENSE (Wymagane przez useSearchParams w Next.js)
// ============================================================================
export default function BasicDataStepPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch
            size={40}
            weight="bold"
            className="text-brand-primary animate-spin"
          />
        </div>
      }
    >
      <BasicDataFormContent />
    </Suspense>
  );
}
