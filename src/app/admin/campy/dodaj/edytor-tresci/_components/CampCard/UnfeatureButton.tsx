"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { Tooltip } from "@/components/ui/ToolTip";

interface UnfeatureButtonProps {
  onUnfeature: () => void;
  disabled?: boolean;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
}

export function UnfeatureButton({
  onUnfeature,
  disabled,
  tooltipPosition = "left",
}: UnfeatureButtonProps) {
  return (
    <div className="absolute -top-3 -right-3 z-10">
      <Tooltip content="Odznacz ze strony głównej" position={tooltipPosition}>
        <button
          onClick={onUnfeature}
          disabled={disabled}
          className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <X size={14} weight="bold" />
        </button>
      </Tooltip>
    </div>
  );
}
