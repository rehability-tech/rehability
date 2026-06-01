"use client";

import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import { useParams } from "next/navigation";
import {
  MagnifyingGlass,
  CircleNotch,
  WarningCircle,
  CaretLeft,
  CaretRight,
  SortAscending,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { ParticipantCard } from "./_components/ParticipantCard";

type SortOption = "name_asc" | "name_desc" | "spent_desc" | "spent_asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "A-Z (Alfabetycznie)" },
  { value: "name_desc", label: "Z-A (Alfabetycznie)" },
  { value: "spent_desc", label: "Najwięcej wydano" },
  { value: "spent_asc", label: "Najmniej wydano" },
];

const CustomSortDropdown = ({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (val: SortOption) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = useMemo(
    () => SORT_OPTIONS.find((opt) => opt.value === value)?.label,
    [value],
  );

  return (
    <div className="relative w-full sm:w-[200px]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 shadow-sm text-[13px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-[14px] transition-all flex items-center justify-between"
      >
        <div className="absolute left-3 text-slate-400">
          <SortAscending size={16} weight="bold" />
        </div>
        <span className="truncate">{selectedLabel}</span>
        <div
          className={`absolute right-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "-rotate-90" : "rotate-90"
          }`}
        >
          <CaretRight size={12} weight="bold" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-[14px] shadow-lg py-1.5 overflow-hidden"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                  value === option.value
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Zoptymalizowany Hero Pill
interface TripHeroPillProps {
  imageUrl?: string | null;
  className?: string;
  count: number;
}

// Zoptymalizowany i pomniejszony Hero Pill z firmowym gradientem
interface TripHeroPillProps {
  imageUrl?: string | null;
  className?: string;
  count: number;
}

export const TripHeroPill = memo(function TripHeroPill({
  imageUrl,
  className = "",
  count,
}: TripHeroPillProps) {
  const bgStyle = imageUrl ? { backgroundImage: `url('${imageUrl}')` } : {};

  return (
    <div
      // Zmniejszono wysokość (h-[64px] -> h-[80px]) oraz szerokość (w-[200px] -> w-[240px])
      className={`relative flex h-[64px] w-full max-w-[200px] sm:h-[80px] sm:max-w-[240px] shrink-0 items-center justify-between overflow-hidden rounded-full border border-slate-100 bg-slate-100 px-4 sm:px-6 shadow-sm ${className}`}
      style={{
        ...bgStyle,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-hidden="true"
    >
      {/* Firmowy gradient: z prawej (żółty) do lewej (przezroczysty). 
        Użyłem nieco mocniejszego krycia (/70 i /60), aby biały tekst licznika był zawsze widoczny na zdjęciu.
      */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-l from-brand-yellow/80 via-brand-primary/70 to-transparent" />

      {/* Delikatne przyciemnienie całego tła dla wyrównania kontrastu na bardzo jasnych zdjęciach */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/10" />

      {/* Ikona (lewa strona) - Lekko pomniejszona */}
      <div className="relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 drop-shadow-sm shrink-0">
        <UsersThree size={20} weight="duotone" className="sm:h-6 sm:w-6" />
      </div>

      {/* Licznik (prawa strona) - Umiejscowiony na najciemniejszej części gradientu */}
      <div className="relative z-10 flex flex-col items-end drop-shadow-md text-white">
        <span className="text-xl sm:text-2xl font-extrabold leading-none">
          {count}
        </span>
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-90">
          osób
        </span>
      </div>
    </div>
  );
});

export default function ParticipantsListPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [participants, setParticipants] = useState<any[]>([]);
  const [heroImage, setHeroImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!tripId) return;

    setIsLoading(true);
    fetch(`/api/admin/wyjazdy/${tripId}/uczestnicy`)
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać listy uczestników");
        return res.json();
      })
      .then((data) => {
        setParticipants(data.participants || []);
        if (data.heroImage) setHeroImage(data.heroImage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [tripId]);

  const processedParticipants = useMemo(() => {
    const filtered = participants.filter((p) => {
      const term = search.toLowerCase();
      const name = (p.name || p.user?.name || "").toLowerCase();
      const email = (p.email || p.user?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });

    return filtered.sort((a, b) => {
      const nameA = (a.name || a.user?.name || "").toLowerCase();
      const nameB = (b.name || b.user?.name || "").toLowerCase();

      const spentA =
        (a.amountPaid || 0) +
        (a.serviceOrders?.reduce(
          (sum: number, o: any) => sum + (o.price || 0),
          0,
        ) || 0);
      const spentB =
        (b.amountPaid || 0) +
        (b.serviceOrders?.reduce(
          (sum: number, o: any) => sum + (o.price || 0),
          0,
        ) || 0);

      switch (sortBy) {
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
        case "spent_desc":
          return spentB - spentA;
        case "spent_asc":
          return spentA - spentB;
        default:
          return 0;
      }
    });
  }, [participants, search, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedParticipants.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParticipants = processedParticipants.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-primary w-full">
        <CircleNotch
          size={40}
          weight="bold"
          className="animate-spin mb-4 opacity-80"
        />
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 text-center">
          Pobieranie listy uczestników...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] w-full max-w-2xl mx-auto px-4">
        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 md:p-12 text-center shadow-sm w-full">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100 text-rose-500">
            <WarningCircle size={40} weight="duotone" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">
            Błąd synchronizacji
          </h2>
          <p className="font-medium text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* ==========================================
          NAGŁÓWEK STRONY
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        {/* Kontener wycentrowany na mobile (items-center text-center) -> sm:items-start sm:text-left */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-5 w-full sm:w-auto">
          <TripHeroPill
            imageUrl={heroImage}
            count={processedParticipants.length}
          />

          <div className="flex flex-col items-center sm:items-start mt-2 sm:mt-0">
            <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight mb-1">
              Uczestnicy
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-xs sm:max-w-none">
              Panel zarządzania statusem, finansami i rezerwacjami na wyjazd.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          KOMPAKTOWY PASEK NARZĘDZI (Search & Custom Sort)
          ========================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* Wyszukiwarka */}
        <div className="relative w-full sm:w-[260px] group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-primary transition-colors">
            <MagnifyingGlass size={16} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Szukaj po nazwisku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-[14px] transition-all"
          />
        </div>

        {/* CUSTOM DROPDOWN DO SORTOWANIA */}
        <CustomSortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* ==========================================
          LISTA KART (Uczestnicy)
          ========================================== */}
      <div className="flex flex-col gap-4 min-h-[400px]">
        {paginatedParticipants.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-slate-200 border-dashed p-12 text-center shadow-sm">
            <p className="text-slate-400 font-medium">
              Brak wyników wyszukiwania dla obecnych filtrów.
            </p>
          </div>
        ) : (
          paginatedParticipants.map((p: any, i: number) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              tripId={tripId}
              index={i}
            />
          ))
        )}
      </div>

      {/* ==========================================
          KONTROLKI PAGINACJI
          ========================================== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200/80 p-3 sm:px-5 rounded-[20px] shadow-sm gap-4">
          <p className="text-[13px] text-slate-500 font-medium">
            Strona{" "}
            <span className="font-extrabold text-slate-800">{currentPage}</span>{" "}
            z {totalPages}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none flex justify-center items-center p-2.5 rounded-[12px] border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex-1 sm:flex-none flex justify-center items-center p-2.5 rounded-[12px] border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
