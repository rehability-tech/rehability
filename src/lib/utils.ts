// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Optymalne łączenie klas Tailwinda. Rozwiązuje konflikty (np. p-4 i p-2 nadpiszą się poprawnie).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
