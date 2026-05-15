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
} from "@phosphor-icons/react/dist/ssr";

import { registerLocale } from "react-datepicker";
import { pl } from "date-fns/locale/pl";
import "react-datepicker/dist/react-datepicker.css";
import {
  FormDatePicker,
  FormInput,
  FormLocationInput,
} from "@/components/sections/admin/FormFields";
import AiGeneratorModal, {
  AiGeneratedData,
} from "@/components/sections/admin/AiGeneratorModal";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

registerLocale("pl", pl);

// ============================================================================
// WEWNĘTRZNY KOMPONENT Z LOGIKĄ FORMULARZA
// ============================================================================
function BasicDataFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); // Pobieramy ID z URL

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");

  const [lastAiPrompt, setLastAiPrompt] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // NOWY STAN: do pokazywania loadera podczas pobierania danych do edycji
  const [isFetchingData, setIsFetchingData] = useState(false);

  // --- POBIERANIE DANYCH DO EDYCJI ---
  useEffect(() => {
    if (editId) {
      const fetchCampData = async () => {
        setIsFetchingData(true);
        try {
          // Musimy stworzyć ten endpoint za chwilę!
          const response = await fetch(`/api/admin/campy/${editId}`);
          if (!response.ok) throw new Error("Błąd pobierania danych");

          const data = await response.json();

          // Wypełniamy formularz danymi z bazy
          setTitle(data.title || "");
          setLocation(data.location || "");
          setStartDate(data.startDate ? new Date(data.startDate) : null);
          setEndDate(data.endDate ? new Date(data.endDate) : null);
          setCapacity(data.capacity?.toString() || "");
          setPrice(data.price?.toString() || "");
          setDeposit(data.deposit?.toString() || "");
          setLastAiPrompt(data.lastAiPrompt || "");
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
      setLocation(data.location || "");
      setCapacity(data.capacity || "");
      if (data.price) setPrice(data.price);
      if (data.deposit) setDeposit(data.deposit);
      if (data.startDate) setStartDate(new Date(data.startDate));
      if (data.endDate) setEndDate(new Date(data.endDate));

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
    const loadingMessage = editId
      ? "Aktualizowanie danych..."
      : "Zapisywanie danych wyjazdu...";
    const loadingToast = toast.loading(loadingMessage);

    try {
      const response = await fetch("/api/admin/campy/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId, // WAŻNE: Przekazujemy ID, żeby backend wiedział, że to aktualizacja!
          title,
          location,
          startDate,
          endDate,
          capacity,
          price,
          deposit,
          lastAiPrompt,
          lastStage: "edytor-tresci", // WAŻNE: Aktualizujemy stage na następny krok
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Błąd zapisu");

      toast.success("Dane zapisane!", { id: loadingToast });

      // Przechodzimy do kolejnego kroku przekazując ID zapisanego/zaktualizowanego campa
      router.push(
        `/admin/campy/dodaj/edytor-tresci?id=${result.campId || editId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nie udało się zapisać danych";

      toast.error(errorMessage, {
        id: loadingToast,
      });
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
            : "Wprowadź główne informacje o organizowanym campie lub pozwól, by AI zrobiło to za Ciebie."}
        </p>
      </div>

      <AiPromoBanner onOpenModal={() => setIsAiModalOpen(true)} />

      <form className="flex flex-col gap-8 relative z-0">
        <section>
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Informacje ogólne
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Tytuł Campa"
              required
              icon={<TextAa size={18} />}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Między nami kobietami - Wiosenny Reset"
              name="campTitle"
              autoComplete="off"
              isLoading={isGeneratingData}
              containerClassName="md:col-span-2"
            />

            <FormLocationInput
              label="Lokalizacja"
              required
              icon={<MapPin size={18} />}
              defaultValue={location}
              onPlaceSelected={(place) =>
                setLocation(place.formatted_address || "")
              }
              placeholder="Zacznij wpisywać nazwę hotelu lub adres..."
              isLoading={isGeneratingData}
              containerClassName="md:col-span-2"
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
            />
          </div>
        </section>

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
              helperText="Kwota, którą uczestniczka opłaca przy rezerwacji miejsca w systemie."
            />
          </div>
        </section>

        <div className="flex items-center justify-between pt-6 mt-4 border-t border-gray-100">
          <Link
            href="/admin/campy"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-gray-500 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            <X size={18} weight="bold" />
            Anuluj
          </Link>

          <Button
            onClick={handleSaveAndNext}
            isLoading={isSaving}
            disabled={!title || isSaving}
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
