"use client";

import React from "react";
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
  PaperPlaneRight,
} from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import { Camp } from "@/lib/generated/prisma"; // Twój typ z Prismy

// ==========================================
// FUNKCJE POMOCNICZE
// ==========================================
// POPRAWKA: Akceptujemy 'Date' (z Prismy) lub 'string' (np. z JSON-a)
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
  onPublish?: (id: string) => void;
  unfeatureTooltipPosition?: "top" | "bottom" | "left" | "right";
}

export function CampCard({
  camp,
  isFeaturedZone,
  onDragStart,
  onUnfeature,
  onPublish,
  unfeatureTooltipPosition = "left",
}: CampCardProps) {
  const enrolled = 0; // Docelowo pewnie wyciągniesz to z relacji w Prismie
  const fillPercentage = (enrolled / camp.capacity) * 100;

  const isDraft = camp.status === "DRAFT";
  const canDrag = !isFeaturedZone && !isDraft;

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
      {/* PRZYCISK "X" Z DYNAMICZNYM TOOLTIPEM */}
      {isFeaturedZone && onUnfeature && (
        <div className="absolute -top-3 -right-3 z-10">
          <Tooltip
            content="Odznacz ze strony głównej"
            position={unfeatureTooltipPosition}
          >
            <button
              onClick={() => onUnfeature(camp.id)}
              className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all cursor-pointer"
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

        <div className="hidden sm:flex flex-col items-center justify-center min-w-[80px] h-[80px] bg-gray-50 rounded-[14px] border border-gray-100 overflow-hidden relative shrink-0">
          {/* POPRAWKA: Zmiana imageUrl na heroImage (zgodnie ze schematem z bazy) */}
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
            {getStatusBadge(camp.status)}
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
                {camp.location || "Brak lokalizacji"}
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
          {isDraft && onPublish && (
            <Tooltip content="Opublikuj wyjazd" position="top">
              <button
                onClick={() => onPublish(camp.id)}
                className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-[10px] transition-colors cursor-pointer block"
              >
                <PaperPlaneRight size={18} weight="bold" />
              </button>
            </Tooltip>
          )}

          <Tooltip content="Edytuj dane wyjazdu" position="top">
            <Link href={`/admin/campy/dodaj/${camp.lastStage}?id=${camp.id}`}>
              <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-[10px] transition-colors cursor-pointer block">
                <PencilSimple size={18} weight="bold" />
              </button>
            </Link>
          </Tooltip>

          <Tooltip content="Usuń wyjazd z bazy" position="top">
            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-colors cursor-pointer block">
              <Trash size={18} weight="bold" />
            </button>
          </Tooltip>
        </div>

        <Link href={`/admin/campy/${camp.id}`}>
          <button className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-primary text-white hover:bg-[#0B3B4C] font-semibold text-[13px] rounded-full rounded-tr-none transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg">
            Zarządzaj
            <CaretRight size={14} weight="bold" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
