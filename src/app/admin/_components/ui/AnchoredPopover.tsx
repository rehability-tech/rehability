"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Portal, useCloseOnEscape } from "./Portal";

/**
 * Popover „przyklejony" do przycisku, ale renderowany przez portal.
 *
 * Zwykły `absolute` wewnątrz topbaru albo karty daje się przyciąć przez
 * `overflow-hidden` rodzica i chowa się pod sąsiednimi warstwami. Portal to
 * rozwiązuje, ale kosztem pozycjonowania: skoro element wisi w `document.body`,
 * musimy policzyć jego miejsce z prostokąta kotwicy i trzymać je aktualnym
 * przy scrollu i zmianie rozmiaru okna.
 */
export function AnchoredPopover({
  open,
  anchorRef,
  onClose,
  children,
  /** Do której krawędzi kotwicy wyrównać popover. */
  align = "right",
  width = 288,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const GAP = 8;
    const MARGIN = 8;

    // Wyrównanie do wybranej krawędzi, a potem docisk do widocznego obszaru,
    // żeby popover nie wyszedł poza ekran na wąskich widokach.
    const rawLeft = align === "right" ? rect.right - width : rect.left;
    const maxLeft = window.innerWidth - width - MARGIN;
    const left = Math.max(MARGIN, Math.min(rawLeft, maxLeft));

    setPosition({ top: rect.bottom + GAP, left });
  }, [anchorRef, align, width]);

  useEffect(() => {
    if (!open) return;

    reposition();

    // `capture: true` łapie też scroll wewnątrz kontenerów, nie tylko okna.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Klik poza popoverem i poza kotwicą zamyka (kotwica ma własny toggle).
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-anchored-popover]")) return;
      onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, anchorRef, onClose]);

  useCloseOnEscape(open, onClose);

  if (!open || !position) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          data-anchored-popover
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ top: position.top, left: position.left, width }}
          className="fixed z-[150] overflow-hidden rounded-2xl rounded-tr-none border border-white/60 bg-white/95 shadow-xl backdrop-blur-xl"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
