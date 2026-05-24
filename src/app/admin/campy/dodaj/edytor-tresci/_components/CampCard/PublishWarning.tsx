"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";

interface PublishWarningProps {
  missingFields: string[];
  isFeaturedZone?: boolean;
  hasUnfeatureButton?: boolean;
}

export function PublishWarning({
  missingFields,
  isFeaturedZone,
  hasUnfeatureButton,
}: PublishWarningProps) {
  return (
    <div
      className={cn(
        "absolute z-10",
        isFeaturedZone && hasUnfeatureButton
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
  );
}
