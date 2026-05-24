"use client";

import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";

export function DragHandle({ isDraft }: { isDraft: boolean }) {
  return (
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
  );
}
