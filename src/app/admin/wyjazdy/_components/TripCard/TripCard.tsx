"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import {
  Archive,
  ArrowsLeftRight,
  CalendarBlank,
  CaretRight,
  CheckCircle,
  CircleNotch,
  DotsSixVertical,
  Eye,
  FileDashed,
  Image as ImageIcon,
  LockKey,
  LockKeyOpen,
  MapPin,
  PencilSimple,
  Star,
  Trash,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import { Trip } from "@/generated/prisma";
import { validateTripCompleteness } from "@/lib/trips/validateTripCompleteness";

// ==========================================
// 1. FUNKCJE POMOCNICZE
// ==========================================

function formatDateRange(start: Date | string, end: Date | string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    return `${format(startDate, "d")} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  } else if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMMM", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  }
  return `${format(startDate, "d MMMM yyyy", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
}

function formatLocation(location: unknown): string {
  if (!location) return "Brak lokalizacji";
  if (typeof location !== "string") {
    const obj = location as { city?: string; name?: string };
    return obj.city || obj.name || "Brak lokalizacji";
  }
  try {
    const parsed = JSON.parse(location);
    return parsed.city || parsed.name || "Brak lokalizacji";
  } catch {
    return location || "Brak lokalizacji";
  }
}

function getCapacityBarColor(fillPercentage: number): string {
  if (fillPercentage >= 100) return "bg-red-500";
  if (fillPercentage >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

// ==========================================
// 2. SUB-KOMPONENTY KARTY
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const baseClasses =
    "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-md";

  switch (status) {
    case "PUBLISHED":
      return <span className={`${baseClasses} bg-emerald-500`}>Aktywny</span>;
    case "DRAFT":
      return <span className={`${baseClasses} bg-gray-400`}>Szkic</span>;
    case "ARCHIVED":
      return <span className={`${baseClasses} bg-red-400`}>Zakończony</span>;
    default:
      return <span className={`${baseClasses} bg-gray-400`}>{status}</span>;
  }
}

function CardShimmer() {
  return (
    <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] rounded-[16px] pointer-events-none overflow-hidden">
      <motion.div
        className="w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      />
    </div>
  );
}

function PublishWarning({ missingFields }: { missingFields: string[] }) {
  return (
    <div className="absolute top-2 left-2 z-20">
      <Tooltip
        content={
          <div className="flex flex-col gap-1 text-left p-1">
            <span className="font-semibold border-b border-white/20 pb-1 mb-1">
              Nie można opublikować. Brakuje:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-xs">
              {missingFields.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        }
        position="right"
      >
        <div className="w-6 h-6 bg-white/90 backdrop-blur-sm border border-amber-200 rounded-full flex items-center justify-center text-amber-500 shadow-sm cursor-help">
          <Warning size={14} weight="bold" />
        </div>
      </Tooltip>
    </div>
  );
}

// ==========================================
// 3. GŁÓWNY KOMPONENT KARTY
// ==========================================

interface TripCardProps {
  trip: Trip;
  isFeaturedZone?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onFeature?: (id: string) => void;
  onUnfeature?: (id: string) => void;
  onChangeStatus?: (id: string, newStatus: string) => void;
  onDelete?: (id: string) => void;
  activeBookings?: number;
}

export function TripCard({
  trip,
  isFeaturedZone,
  onDragStart,
  onFeature,
  onUnfeature,
  onChangeStatus,
  onDelete,
  activeBookings = 0,
}: TripCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmedStatus, setConfirmedStatus] = useState(trip.status);
  const [regClosed, setRegClosed] = useState(!!trip.registrationClosed);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const isDraft = confirmedStatus === "DRAFT";
  const canDrag = !isFeaturedZone && !isDraft;
  const enrolled = activeBookings; // Liczba zapisanych uczestniczek (bez anulowanych)
  const hasBookings = activeBookings > 0; // Blokuje usuwanie wyjazdu
  const capacity = trip.capacity || 0;
  const fillPercentage = capacity > 0 ? (enrolled / capacity) * 100 : 0;
  const views = trip.views ?? 0;

  const { isComplete: canPublish, missing: missingFields } =
    validateTripCompleteness(trip);

  useEffect(() => {
    if (!isUpdating) setConfirmedStatus(trip.status);
  }, [trip.status, isUpdating]);

  useEffect(() => {
    if (!isUpdating) setRegClosed(!!trip.registrationClosed);
  }, [trip.registrationClosed, isUpdating]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setIsMenuOpen(false);
    setIsUpdating(true);
    const previousStatus = confirmedStatus;

    if (onChangeStatus) onChangeStatus(trip.id, newStatus);

    try {
      const response = await fetch("/api/admin/wyjazdy/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trip.id, status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setConfirmedStatus(newStatus);
      toast.success("Status zaktualizowany!");
    } catch (error: any) {
      toast.error(error.message || "Błąd serwera. Przywrócono status.");
      if (onChangeStatus) onChangeStatus(trip.id, previousStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleRegistration = async () => {
    setIsMenuOpen(false);
    const next = !regClosed;
    setRegClosed(next); // optymistycznie
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/wyjazdy/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trip.id, registrationClosed: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success(next ? "Zapisy zamknięte." : "Zapisy otwarte.");
    } catch (error: any) {
      setRegClosed(!next); // rollback
      toast.error(error.message || "Nie udało się zmienić stanu zapisów.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/wyjazdy/${trip.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Błąd usuwania");

      toast.success("Wyjazd został usunięty.");
      setShowDeleteConfirm(false);
      // Usunięcie z listy w komponencie nadrzędnym (karta zniknie z animacją).
      onDelete?.(trip.id);
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się usunąć wyjazdu.");
      setIsDeleting(false);
    }
  };

  // Definiujemy przyciski akcji jako stałą, aby użyć ich w dwóch miejscach (mobile/desktop)
  const ActionButtons = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* PRZYCISK GWIAZDKI (Wyróżnij / Odznacz) */}
      <Tooltip
        content={
          isFeaturedZone
            ? "Odznacz ze strony głównej"
            : isDraft
              ? "Opublikuj, aby móc wyróżnić"
              : "Wyróżnij na stronie głównej"
        }
        position="top"
      >
        <button
          onClick={() => {
            if (isFeaturedZone && onUnfeature) {
              onUnfeature(trip.id);
            } else if (!isFeaturedZone && onFeature) {
              onFeature(trip.id);
            }
          }}
          disabled={isUpdating || (!isFeaturedZone && isDraft)}
          className={cn(
            "p-1.5 rounded-md transition-all disabled:opacity-50",
            isFeaturedZone
              ? "text-amber-500 hover:bg-white/80 hover:shadow-sm" // Wyróżniony
              : isDraft
                ? "text-gray-300 cursor-not-allowed" // Nie można wyróżnić szkicu
                : "text-gray-400 hover:text-amber-500 hover:bg-white/80 hover:shadow-sm", // Zwykła karta
          )}
        >
          <Star size={16} weight={isFeaturedZone ? "fill" : "bold"} />
        </button>
      </Tooltip>

      {/* Zmień Status */}
      <div className="relative" ref={isMobile ? undefined : menuRef}>
        <Tooltip content="Zmień status" position="top">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isUpdating}
            className={cn(
              "p-1.5 rounded-md transition-all disabled:cursor-not-allowed",
              isMenuOpen
                ? "bg-white/80 shadow-sm text-brand-primary"
                : "text-gray-400 hover:bg-white/80 hover:text-gray-700 hover:shadow-sm",
            )}
          >
            <ArrowsLeftRight size={16} weight="bold" />
          </button>
        </Tooltip>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className={cn(
                "absolute top-full w-44 bg-white rounded-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 z-50 flex flex-col",
                isMobile ? "right-[-10px] mt-3" : "right-0 mt-2", // Lekka korekta pozycji na mobile
              )}
            >
              <button
                onClick={() => handleStatusChange("PUBLISHED")}
                disabled={
                  confirmedStatus === "PUBLISHED" || !canPublish || isUpdating
                }
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 transition-colors"
              >
                {canPublish ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : (
                  <LockKey size={16} />
                )}{" "}
                Opublikowany
              </button>
              <button
                onClick={() => handleStatusChange("DRAFT")}
                disabled={confirmedStatus === "DRAFT" || isUpdating}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileDashed size={16} className="text-gray-500" /> Szkic
              </button>
              <button
                onClick={() => handleStatusChange("ARCHIVED")}
                disabled={confirmedStatus === "ARCHIVED" || isUpdating}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Archive size={16} className="text-red-500" /> Zakończony
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={handleToggleRegistration}
                disabled={isUpdating}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40 transition-colors"
              >
                {regClosed ? (
                  <>
                    <LockKeyOpen size={16} className="text-amber-500" /> Otwórz
                    zapisy
                  </>
                ) : (
                  <>
                    <LockKey size={16} className="text-amber-500" /> Zamknij
                    zapisy
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Tooltip content="Edytuj" position="top">
        <Link href={`/admin/wyjazdy/dodaj/${trip.lastStage}?id=${trip.id}`}>
          <div className="p-1.5 rounded-md text-gray-400 hover:text-brand-primary hover:bg-white/80 hover:shadow-sm transition-all cursor-pointer">
            <PencilSimple size={16} weight="bold" />
          </div>
        </Link>
      </Tooltip>

      <Tooltip
        content={
          hasBookings
            ? "Nie można usunąć — wyjazd ma zapisane uczestniczki"
            : "Usuń"
        }
        position="top"
      >
        <button
          onClick={() => {
            setIsMenuOpen(false);
            setShowDeleteConfirm(true);
          }}
          disabled={isDeleting || hasBookings}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-white/80 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent disabled:hover:shadow-none"
        >
          <Trash size={16} weight="bold" />
        </button>
      </Tooltip>
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      draggable={canDrag}
      onDragStart={(e) =>
        canDrag &&
        onDragStart &&
        onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, trip.id)
      }
      className={cn(
        "relative bg-white rounded-[16px] p-4 sm:p-5 flex flex-col md:flex-row gap-5 md:gap-6 transition-all border",
        isFeaturedZone
          ? "border-amber-400 border-l-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          : isDraft
            ? "border-gray-200/80 opacity-90 shadow-sm"
            : "border-gray-200/80 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing",
      )}
    >
      {(isUpdating || isDeleting) && <CardShimmer />}

      {!canPublish && <PublishWarning missingFields={missingFields} />}

      {/* LEWA STRONA: ZDJĘCIE (Z PASKIEM OPCJI NA MOBILE) */}
      <div className="relative flex items-center gap-3 shrink-0">
        {!isFeaturedZone && (
          <div
            className={cn(
              "hidden sm:flex items-center justify-center p-1 transition-colors",
              isDraft
                ? "text-gray-200 cursor-not-allowed"
                : "text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing",
            )}
          >
            <DotsSixVertical size={24} weight="bold" />
          </div>
        )}

        {/* ZMIANA: Usunięty overflow-hidden na mobile, żeby dropdown nie był ucięty */}
        <div className="relative w-full sm:w-[220px] h-[140px] shrink-0 rounded-[12px] md:overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
          {trip.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trip.heroImage}
              alt={trip.title}
              // ZMIANA: Zaokrąglenie rogów bezpośrednio na img
              className="absolute inset-0 w-full h-full object-cover rounded-[12px]"
            />
          ) : (
            <ImageIcon size={32} weight="duotone" className="text-gray-300" />
          )}

          {/* --- ZMIANA: PASEK AKCJI DLA MOBILE (W prawym górnym rogu zdjęcia) --- */}
          <div
            className="md:hidden absolute top-2 right-2 z-20 flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-lg p-0.5 border border-white/20 shadow-sm"
            ref={menuRef} // Na mobile przenosimy referencję tutaj
          >
            {ActionButtons({ isMobile: true })}
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: INFORMACJE, STATYSTYKI I AKCJE */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* GÓRNY RZĄD: Tytuł i USŁUGI */}
        <div className="flex items-start justify-between gap-4 w-full">
          {/* Tagi i Tytuł */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={confirmedStatus} />
              {regClosed && confirmedStatus === "PUBLISHED" && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  <LockKey size={12} weight="fill" className="text-amber-500" />{" "}
                  Zapisy zamknięte
                </span>
              )}
              {isFeaturedZone && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  <Star size={12} weight="fill" className="text-amber-500" /> Na
                  głównej
                </span>
              )}
            </div>
            <h3 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#0B3B4C] leading-tight line-clamp-2">
              {trip.title}
            </h3>
          </div>

          {/* AKCJE (Usługi) - UKRYTE NA MOBILE */}
          <div className="hidden md:flex items-center gap-1 shrink-0 bg-gray-50 rounded-lg p-1 border border-gray-100">
            {ActionButtons({})}
          </div>
        </div>

        {/* METADANE: Daty i lokalizacja */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-montserrat text-gray-500 mt-2 mb-4">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <CalendarBlank size={15} className="text-gray-400" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={15} className="text-gray-400 shrink-0" />
            <span className="truncate max-w-[200px]">
              {formatLocation(trip.location)}
            </span>
          </div>
        </div>

        {/* DOLNY RZĄD: Pasek miejsc, odsłony, główny przycisk */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap sm:flex-nowrap items-end justify-between gap-5 w-full">
          <div className="flex items-center gap-6 sm:gap-10 flex-1 min-w-0">
            <div className="flex flex-col w-full sm:w-[160px]">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Users size={12} weight="bold" /> Miejsca
                </span>
                <span className="text-[13px] font-bold text-[#0B3B4C] leading-none tabular-nums">
                  {enrolled}{" "}
                  <span className="text-gray-400 font-semibold text-[11px]">
                    / {capacity}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    getCapacityBarColor(fillPercentage),
                  )}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col justify-end shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Eye size={12} weight="bold" /> Odsłony
              </span>
              <span className="text-[14px] font-bold text-gray-700 leading-none tabular-nums">
                {views.toLocaleString("pl-PL")}
              </span>
            </div>
          </div>

          {/* PRZYCISK: Gradient brand-primary + delikatny akcent żółtego (ten sam co mobile) */}
          <Link href={`/admin/wyjazdy/${trip.id}`} className="w-full sm:w-auto">
            <button className="relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-brand-primary to-[#0f465c] text-white hover:opacity-95 font-semibold text-[13px] rounded-[10px] transition-all shadow-sm border border-brand-primary/20 hover:border-brand-yellow/30 group/btn">
              {/* Delikatny żółty glow w prawym dolnym rogu (błyszczy mocniej na hover) */}
              <span className="absolute -bottom-4 -right-4 w-12 h-12 bg-brand-yellow/40 blur-xl rounded-full group-hover/btn:bg-brand-yellow/60 transition-colors pointer-events-none" />

              <span className="relative flex items-center gap-1.5">
                Zarządzaj
                <CaretRight size={14} weight="bold" />
              </span>
            </button>
          </Link>
        </div>
      </div>

      {/* MODAL POTWIERDZENIA USUNIĘCIA (portal → poza transformowaną kartą) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-white rounded-[24px] rounded-tr-none shadow-[0_30px_60px_-15px_rgba(3,63,99,0.35)] p-6 flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <Trash size={26} weight="bold" className="text-red-500" />
                  </div>
                  <h3 className="font-jakarta font-bold text-lg text-brand-secondary">
                    Usunąć wyjazd?
                  </h3>
                  <p className="text-[13px] text-gray-500 font-montserrat mt-2 leading-relaxed">
                    Tej operacji nie można cofnąć. Usuniesz{" "}
                    <span className="font-semibold text-brand-secondary">
                      „{trip.title}"
                    </span>{" "}
                    wraz z rezerwacjami, harmonogramem i usługami SPA.
                  </p>

                  <div className="w-full flex items-center gap-2.5 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 h-11 rounded-2xl bg-gray-100 text-brand-secondary font-bold text-[13.5px] hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 h-11 rounded-2xl bg-red-500 text-white font-bold text-[13.5px] hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isDeleting ? (
                        <>
                          <CircleNotch
                            size={16}
                            weight="bold"
                            className="animate-spin"
                          />
                          Usuwam...
                        </>
                      ) : (
                        <>
                          <Trash size={16} weight="bold" />
                          Usuń
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </motion.div>
  );
}
