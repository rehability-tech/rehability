import React from "react";
import { format, isSameMonth, isSameYear } from "date-fns";
import { pl } from "date-fns/locale";

export const formatDateRange = (start: Date | string, end: Date | string) => {
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

export const formatLocation = (location: unknown): string => {
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

export function StatusBadge({ status }: { status: string }) {
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
}
