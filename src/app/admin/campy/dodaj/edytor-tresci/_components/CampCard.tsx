"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  CalendarBlank,
  CaretRight,
  Image as ImageIcon,
  DotsSixVertical,
  Star,
  PencilSimple,
  Trash,
  X,
  ArrowsLeftRight,
  Warning,
  CheckCircle,
  FileDashed,
  Archive,
  LockKey,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import { toast } from "sonner";
import { Camp } from "@/generated/prisma";

// ==========================================
// FUNKCJE POMOCNICZE
// ==========================================
const formatDateRange = (start: Date | string, end: Date | string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    return `${format(startDate, "d")} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  } else if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMMM", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  } else {
    return `${format(startDate, "d MMMM yyyy", { locale: pl })} - ${format(endDate, "d MMMM yyyy", { locale: pl })}`;
  }
};

const formatLocation = (location: unknown): string => {
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
};

const getStatusBadge = (status: string) => {
  const baseClasses =
    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm rounded-full rounded-tr-none";

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
};

// ==========================================
// KOMPONENT KARTY
// ==========================================
interface CampCardProps {
  camp: Camp;
  isFeaturedZone?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onUnfeature?: (id: string) => void;
  onChangeStatus?: (id: string, newStatus: string) => void;
  unfeatureTooltipPosition?: "top" | "bottom" | "left" | "right";
}

export function CampCard({
  camp,
  isFeaturedZone,
  onDragStart,
  onUnfeature,
  onChangeStatus,
  unfeatureTooltipPosition = "left",
}: CampCardProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [confirmedStatus, setConfirmedStatus] = useState(camp.status);

  const enrolled = 0; // Docelowo z bazy
  const fillPercentage = (enrolled / camp.capacity) * 100;

  const isDraft = confirmedStatus === "DRAFT";
  const canDrag = !isFeaturedZone && !isDraft;

  // ----------------------------------------------------
  // WALIDACJA GOTOWOŚCI DO PUBLIKACJI (FRONTEND)
  // ----------------------------------------------------
  const missingFields: string[] = [];

  if (!camp.heroImage) missingFields.push("Zdjęcie (Tło)");
  if (!camp.location) missingFields.push("Lokalizacja");
  if (!camp.startDate || !camp.endDate) missingFields.push("Daty");

  let blocksCount = 0;
  let hasMapBlock = false;

  if (camp.blocks) {
    try {
      const parsed =
        typeof camp.blocks === "string" ? JSON.parse(camp.blocks) : camp.blocks;
      if (Array.isArray(parsed)) {
        blocksCount = parsed.length;
        // Sprawdzamy czy istnieje blok typu "map"
        hasMapBlock = parsed.some((block: any) => block.type === "map");
      }
    } catch (e) {}
  }

  if (blocksCount < 3) missingFields.push("Min. 3 bloki treści");

  // Wymagaj mapUrl TYLKO, gdy dodano blok mapy ORAZ w campie faktycznie nie ma stringa mapUrl
  if (hasMapBlock && (!camp.mapUrl || camp.mapUrl.trim() === "")) {
    missingFields.push("Link do mapy Google (wymagany przez blok mapy)");
  }

  const canPublish = missingFields.length === 0;

  useEffect(() => {
    if (!isUpdating) setConfirmedStatus(camp.status);
  }, [camp.status, isUpdating]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChangeClick = async (newStatus: string) => {
    setIsStatusMenuOpen(false);
    setIsUpdating(true);

    const previousStatus = confirmedStatus;

    if (onChangeStatus) {
      onChangeStatus(camp.id, newStatus);
    }

    const statusMessages: Record<string, string> = {
      PUBLISHED: "Wyjazd został pomyślnie opublikowany!",
      ARCHIVED: "Wyjazd został zarchiwizowany (zakończony).",
      DRAFT: "Wyjazd przywrócono do szkiców.",
    };

    try {
      const response = await fetch("/api/admin/campy/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: camp.id, status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Błąd podczas zmiany statusu");
      }

      setConfirmedStatus(newStatus);
      toast.success(statusMessages[newStatus] || "Status zmieniony!");
    } catch (error: any) {
      toast.error(
        error.message || "Wystąpił błąd serwera. Przywracam poprzedni status.",
      );
      if (onChangeStatus) {
        onChangeStatus(camp.id, previousStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable={canDrag}
      onDragStart={(e) =>
        canDrag &&
        onDragStart &&
        onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, camp.id)
      }
      className={cn(
        "bg-white rounded-[20px] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all group relative border",
        isFeaturedZone
          ? "border-transparent shadow-[0_8px_30px_rgba(40,125,136,0.3)]"
          : isDraft
            ? "border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)] opacity-95"
            : "border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(40,125,136,0.36)] hover:border-brand-primary/20 cursor-grab active:cursor-grabbing",
      )}
    >
      {/* CUSTOM SHIMMER */}
      {isUpdating && (
        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] rounded-[20px] overflow-hidden pointer-events-none">
          <motion.div
            className="w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        </div>
      )}

      {/* WYKRZYKNIK - BRAK MOŻLIWOŚCI PUBLIKACJI */}
      {!canPublish && (
        <div
          className={cn(
            "absolute z-10",
            isFeaturedZone && onUnfeature
              ? "-top-3 right-7"
              : "-top-3 -right-3",
          )}
        >
          <Tooltip
            content={
              <div className="flex flex-col gap-1 text-left p-1">
                <span className="font-semibold border-b border-white/20 pb-1 mb-1">
                  Nie można opublikować. Brakuje:
                </span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {missingFields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
            }
            position="left"
          >
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-brand-primary shadow-sm cursor-help hover:bg-gray-50 transition-colors">
              <Warning size={16} weight="bold" />
            </div>
          </Tooltip>
        </div>
      )}

      {/* PRZYCISK "X" Z DYNAMICZNYM TOOLTIPEM */}
      {isFeaturedZone && onUnfeature && (
        <div className="absolute -top-3 -right-3 z-10">
          <Tooltip
            content="Odznacz ze strony głównej"
            position={unfeatureTooltipPosition}
          >
            <button
              onClick={() => onUnfeature(camp.id)}
              disabled={isUpdating}
              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <X size={14} weight="bold" />
            </button>
          </Tooltip>
        </div>
      )}

      <div className="flex-1 flex gap-4 items-center">
        {!isFeaturedZone && (
          <Tooltip
            content={
              isDraft
                ? "Ten camp nie został jeszcze opublikowany. Opublikuj go najpierw, aby ustawić na stronie głównej."
                : "Przeciągnij, aby wyróżnić na stronie głównej"
            }
            position="top"
          >
            <div
              className={cn(
                "hidden sm:flex items-center justify-center transition-colors p-1",
                isDraft
                  ? "text-gray-200 grayscale cursor-not-allowed"
                  : "text-gray-300 hover:text-brand-primary/50 cursor-grab active:cursor-grabbing",
              )}
            >
              <DotsSixVertical size={24} weight="bold" />
            </div>
          </Tooltip>
        )}

        {/* SZTYWNY KONTENER NA ZDJĘCIE */}
        <div className="hidden sm:flex flex-col items-center justify-center w-[80px] min-w-[80px] h-[80px] shrink-0 bg-gray-50 rounded-[14px] border border-gray-100 overflow-hidden relative">
          {camp.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={camp.heroImage}
              alt={camp.title}
              className={cn(
                "w-full h-full object-cover transition-transform",
                canDrag && "group-hover:scale-105",
              )}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <ImageIcon size={26} weight="duotone" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {getStatusBadge(confirmedStatus)}
            {isFeaturedZone && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-1 rounded-full rounded-tr-none">
                <Star size={12} weight="fill" /> Na głównej
              </span>
            )}
          </div>

          <h3 className="font-jakarta font-bold text-[#0B3B4C] text-[17px] group-hover:text-brand-primary transition-colors mb-1.5 line-clamp-2 pr-4">
            {camp.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-sm font-montserrat text-gray-500">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <CalendarBlank size={15} />
              <span>{formatDateRange(camp.startDate, camp.endDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {formatLocation(camp.location)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[200px] flex flex-col justify-center shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Users size={14} /> Miejsca
          </span>
          <span className="text-xs font-bold text-[#0B3B4C]">
            {enrolled} / {camp.capacity}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t border-gray-100 lg:border-t-0 justify-end shrink-0">
        <div className="flex items-center gap-1 mr-2">
          {onChangeStatus && (
            <div className="relative" ref={menuRef}>
              <Tooltip content="Zmień status" position="top">
                <button
                  disabled={isUpdating}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStatusMenuOpen((prev) => !prev);
                  }}
                  className={cn(
                    "p-2 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed",
                    isStatusMenuOpen
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10",
                  )}
                >
                  <ArrowsLeftRight size={18} weight="bold" />
                </button>
              </Tooltip>

              <AnimatePresence>
                {isStatusMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-44 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 flex flex-col overflow-hidden"
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1 mb-1 border-b border-gray-50">
                      Ustaw status
                    </span>

                    <button
                      onClick={() => handleStatusChangeClick("PUBLISHED")}
                      disabled={
                        confirmedStatus === "PUBLISHED" ||
                        isUpdating ||
                        !canPublish
                      }
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
                    >
                      {!canPublish ? (
                        <LockKey size={16} weight="bold" />
                      ) : (
                        <CheckCircle size={16} weight="bold" />
                      )}
                      <span>Opublikowany</span>
                    </button>

                    <button
                      onClick={() => handleStatusChangeClick("DRAFT")}
                      disabled={confirmedStatus === "DRAFT" || isUpdating}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
                    >
                      <FileDashed size={16} weight="bold" />
                      <span>Szkic</span>
                    </button>

                    <button
                      onClick={() => handleStatusChangeClick("ARCHIVED")}
                      disabled={confirmedStatus === "ARCHIVED" || isUpdating}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
                    >
                      <Archive size={16} weight="bold" />
                      <span>Archiwalny</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Tooltip content="Edytuj dane wyjazdu" position="top">
            <Link
              href={`/admin/campy/dodaj/${camp.lastStage}?id=${camp.id}`}
              className={isUpdating ? "pointer-events-none" : ""}
            >
              <button
                disabled={isUpdating}
                className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed"
              >
                <PencilSimple size={18} weight="bold" />
              </button>
            </Link>
          </Tooltip>

          <Tooltip content="Usuń wyjazd z bazy" position="top">
            <button
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed"
            >
              <Trash size={18} weight="bold" />
            </button>
          </Tooltip>
        </div>

        <Link
          href={`/admin/campy/${camp.id}`}
          className={isUpdating ? "pointer-events-none" : ""}
        >
          <button
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-primary text-white hover:bg-[#0B3B4C] font-semibold text-[13px] rounded-full rounded-tr-none transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zarządzaj
            <CaretRight size={14} weight="bold" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
