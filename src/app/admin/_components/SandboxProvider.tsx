"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { getAdminCourseSlug, getAdminTripId } from "@/lib/admin/nav";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  STAN PIASKOWNICY WYDARZENIA — wspólny dla topbaru i panelu rabatów
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Przełącznik żyje w topbarze, ale panel rabatów pokazuje ten sam stan
 * (baner + karty oznaczone jako testowe). Bez wspólnego kontekstu oba miejsca
 * trzymałyby własną kopię i rozjechałyby się po pierwszym przełączeniu.
 *
 * Semantyka trybu (egzekwowana na serwerze, nie tutaj): przy włączonej
 * piaskownicy KAŻDY zapis promocji dostaje `isSandbox = true` i jest widoczny
 * wyłącznie dla osoby z dostępem do piaskownicy. Trwające promocje działają
 * normalnie — tryb izoluje tylko to, co w nim powstanie.
 */

export type SandboxAction = "enable" | "publish" | "disable";

type SandboxState = {
  /** null = nie jesteśmy w kontekście konkretnego wydarzenia. */
  tripId: string | null;
  enabled: boolean;
  draftCount: number;
  loading: boolean;
  pending: boolean;
  /** Wywołanie akcji; zwraca true przy powodzeniu. */
  run: (action: SandboxAction) => Promise<boolean>;
  refresh: () => Promise<void>;
  /** Rejestracja nasłuchu — panel rabatów odświeża swoje dane po zmianie. */
  subscribe: (listener: () => void) => () => void;
};

const SandboxContext = createContext<SandboxState | null>(null);

export function useSandbox(): SandboxState {
  const ctx = useContext(SandboxContext);
  if (!ctx) {
    throw new Error("useSandbox musi być użyte wewnątrz <SandboxProvider>.");
  }
  return ctx;
}

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Piaskownica działa dla obu produktów. Wydarzenie adresujemy ID, kurs
  // slugiem — `apiBase` ukrywa tę różnicę przed resztą kontekstu.
  const tripId = getAdminTripId(pathname ?? "");
  const courseSlug = getAdminCourseSlug(pathname ?? "");

  const productId = tripId ?? courseSlug;
  const apiBase = tripId
    ? `/api/admin/wydarzenia/${tripId}/rabaty/sandbox`
    : courseSlug
      ? `/api/admin/kursy/${courseSlug}/rabaty/sandbox`
      : null;

  const [enabled, setEnabled] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  // Prosty rejestr nasłuchów — po zmianie trybu panel rabatów przeładowuje
  // swoje dane, bo zmieniła się widoczność rekordów testowych.
  const [listeners] = useState(() => new Set<() => void>());

  const subscribe = useCallback(
    (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    [listeners],
  );

  const refresh = useCallback(async () => {
    if (!apiBase) {
      setEnabled(false);
      setDraftCount(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}?t=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;

      const data = await res.json();
      setEnabled(!!data.enabled);
      setDraftCount(data.draftCount ?? 0);
    } catch {
      // Cicho — brak stanu piaskownicy nie może wywrócić całego panelu.
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (action: SandboxAction) => {
      if (!apiBase) return false;

      setPending(true);
      try {
        const res = await fetch(apiBase, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(body?.error || "Nie udało się zmienić trybu piaskownicy.");
          return false;
        }

        toast.success(body?.message || "Zmieniono tryb piaskownicy.");
        await refresh();
        for (const listener of listeners) listener();
        return true;
      } finally {
        setPending(false);
      }
    },
    [apiBase, refresh, listeners],
  );

  const value = useMemo<SandboxState>(
    () => ({ tripId: productId, enabled, draftCount, loading, pending, run, refresh, subscribe }),
    [productId, enabled, draftCount, loading, pending, run, refresh, subscribe],
  );

  return (
    <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>
  );
}
