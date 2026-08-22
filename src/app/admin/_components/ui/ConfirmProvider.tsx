"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Warning } from "@phosphor-icons/react/dist/ssr";

import { ModalShell } from "./ModalShell";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  POTWIERDZENIA — zamiast window.confirm
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `window.confirm` blokuje wątek, wygląda inaczej w każdej przeglądarce
 * i wypada poza design system. Ten provider daje to samo API (obietnica
 * true/false), ale rysuje okno przez portal, tym samym prymitywem co reszta
 * popupów.
 *
 * Użycie:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Usunąć kod?", tone: "danger" }))) return;
 */

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` maluje przycisk na czerwono — dla operacji nieodwracalnych. */
  tone?: "default" | "danger";
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm musi być użyte wewnątrz <ConfirmProvider>.");
  }
  return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <ModalShell
        open={!!options}
        size="sm"
        title={options?.title ?? ""}
        // Zamknięcie krzyżykiem / Escape / kliknięciem w tło = anulowanie.
        onClose={() => settle(false)}
      >
        {options?.description && (
          <div className="mb-5 flex items-start gap-2.5 text-[13px] leading-relaxed text-brand-secondary/60">
            {options.tone === "danger" && (
              <Warning
                size={16}
                weight="fill"
                className="mt-0.5 shrink-0 text-rose-500"
              />
            )}
            <div>{options.description}</div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => settle(false)}
            className="flex-1 rounded-2xl border border-brand-secondary/15 px-4 py-3 text-[13px] font-bold text-brand-secondary/60 transition-colors hover:bg-brand-secondary/5"
          >
            {options?.cancelLabel ?? "Anuluj"}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => settle(true)}
            className={`flex-1 rounded-2xl px-4 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90 ${
              options?.tone === "danger"
                ? "bg-rose-500 shadow-[0_4px_15px_-4px_rgba(244,63,94,0.6)]"
                : "border border-brand-yellow/30 bg-brand-primary shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
            }`}
          >
            {options?.confirmLabel ?? "Potwierdź"}
          </button>
        </div>
      </ModalShell>
    </ConfirmContext.Provider>
  );
}
