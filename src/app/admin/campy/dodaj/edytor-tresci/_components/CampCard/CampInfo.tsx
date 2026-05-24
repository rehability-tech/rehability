"use client";

import {
  MapPin,
  CalendarBlank,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import { Camp } from "@/generated/prisma";
import { formatDateRange, formatLocation, StatusBadge } from "./helpers";

interface CampInfoProps {
  camp: Camp;
  confirmedStatus: string;
  isFeaturedZone?: boolean;
}

export function CampInfo({ camp, confirmedStatus, isFeaturedZone }: CampInfoProps) {
  return (
    <div className="flex flex-col justify-center">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <StatusBadge status={confirmedStatus} />
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
  );
}
