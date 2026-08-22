"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PORTAL — podstawa KAŻDEGO popupu w panelu
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Panel jest zbudowany z kart i sekcji używających `backdrop-blur`,
 * `transform` i `overflow-hidden`. Każda z tych własności tworzy nowy kontekst
 * nakładania (stacking context), więc `z-index` elementu renderowanego
 * WEWNĄTRZ takiej karty nie ma jak wyjść ponad jej rodzeństwo — popup zostaje
 * przycięty albo schowany pod sąsiednim blokiem.
 *
 * Dlatego modale, dropdowny, popovery i potwierdzenia renderujemy do
 * `document.body`. Warstwy: topbar z-[100], popovery z-[150], modale z-[200].
 */
export function Portal({ children }: { children: React.ReactNode }) {
  // `document` nie istnieje przy renderze na serwerze — montujemy dopiero
  // po hydratacji.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** Blokuje przewijanie strony pod otwartym popupem. */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/** Zamknięcie klawiszem Escape — wspólne dla wszystkich popupów. */
export function useCloseOnEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);
}
