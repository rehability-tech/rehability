import { cn } from "@/lib/utils";

/**
 * Pulsująca kropka "wymaga uwagi" — różowy ping + pełna kropka z białą obwódką.
 * Pozycjonowanie podaje rodzic przez `className` (np. "absolute -top-1 -right-1.5").
 * Rodzic musi mieć `position: relative`, bo wewnętrzny ping pozycjonuje się absolutnie.
 */
export default function AttentionDot({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-2.5 w-2.5", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
    </span>
  );
}
