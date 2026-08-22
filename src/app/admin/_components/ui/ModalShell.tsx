"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react/dist/ssr";

import { Portal, useCloseOnEscape, useLockBodyScroll } from "./Portal";

/**
 * Wspólna skorupa modala: portal + overlay + wyśrodkowany panel.
 *
 * Każdy modal w panelu ma iść przez ten komponent — dzięki temu portal,
 * blokada scrolla, Escape i warstwa z-index są rozwiązane raz, a nie
 * kopiowane (i zapominane) przy każdym nowym oknie.
 */
export function ModalShell({
  open,
  title,
  onClose,
  children,
  /** `md` dla formularzy, `sm` dla krótkich okien wyboru. */
  size = "md",
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  useLockBodyScroll(open);
  useCloseOnEscape(open, onClose);

  if (!open) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
          className="fixed inset-0 z-[200] flex items-end justify-center overflow-y-auto bg-brand-secondary/40 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:rounded-tr-none ${
              size === "sm" ? "max-w-md" : "max-w-lg"
            }`}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 className="font-jakarta text-xl font-bold text-brand-secondary">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Zamknij"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-brand-secondary/40 transition-colors hover:bg-brand-secondary/5 hover:text-brand-secondary"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
