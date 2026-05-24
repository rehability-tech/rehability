"use client";

import { Users } from "@phosphor-icons/react/dist/ssr";

interface CapacityBarProps {
  enrolled: number;
  capacity: number;
}

export function CapacityBar({ enrolled, capacity }: CapacityBarProps) {
  const fillPercentage = capacity > 0 ? (enrolled / capacity) * 100 : 0;

  return (
    <div className="w-full lg:w-[200px] flex flex-col justify-center shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Users size={14} /> Miejsca
        </span>
        <span className="text-xs font-bold text-[#0B3B4C]">
          {enrolled} / {capacity}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-primary rounded-full transition-all duration-500"
          style={{ width: `${fillPercentage}%` }}
        />
      </div>
    </div>
  );
}
