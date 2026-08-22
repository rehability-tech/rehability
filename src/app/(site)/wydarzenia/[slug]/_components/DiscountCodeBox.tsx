"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  CircleNotch,
  Info,
  Tag,
  X,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Pole na kod rabatowy w podsumowaniu rezerwacji.
 *
 * Podgląd liczy serwer (`/api/bookings/validate-discount`), tą samą funkcją,
 * która policzy realne obciążenie — dzięki temu to, co widzi uczestnik, nie
 * może rozjechać się z kwotą pobraną przez Stripe.
 */
export function DiscountCodeBox({
  appliedCode,
  disabled,
  checking,
  statusMessage,
  statusOk,
  onApply,
  onClear,
}: {
  appliedCode: string | null;
  disabled: boolean;
  checking: boolean;
  /** Komunikat po nieudanej próbie (albo wyjaśnienie, że przecena wygrała). */
  statusMessage: string | null;
  statusOk: boolean;
  onApply: (code: string) => void;
  onClear: () => void;
}) {
  const [value, setValue] = useState("");

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-primary/25 bg-brand-primary/5 px-4 py-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-[13px]">
          <CheckCircle
            size={16}
            weight="fill"
            className="shrink-0 text-brand-primary"
          />
          <span className="truncate">
            Kod{" "}
            <span className="font-mono font-bold uppercase text-brand-secondary">
              {appliedCode}
            </span>{" "}
            <span className="text-brand-secondary/60">został naliczony</span>
          </span>
        </span>

        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-brand-secondary/50 transition-colors hover:text-rose-500 disabled:opacity-40"
        >
          <X size={13} weight="bold" /> Usuń
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag
            size={15}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/30"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (value.trim()) onApply(value.trim());
              }
            }}
            disabled={disabled || checking}
            placeholder="Masz kod rabatowy?"
            className="w-full rounded-2xl border border-white/60 bg-white/60 py-3 pl-9 pr-3 font-mono text-[13px] uppercase tracking-wide text-brand-secondary outline-none transition-colors placeholder:font-montserrat placeholder:normal-case placeholder:tracking-normal placeholder:text-brand-secondary/40 focus:border-brand-primary disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={() => value.trim() && onApply(value.trim())}
          disabled={disabled || checking || !value.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-brand-yellow/30 bg-brand-primary px-5 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity disabled:opacity-40"
        >
          {checking && (
            <CircleNotch size={14} weight="bold" className="animate-spin" />
          )}
          Zastosuj
        </button>
      </div>

      {statusMessage && (
        <p
          className={`inline-flex items-start gap-1.5 text-[12px] ${
            statusOk ? "text-brand-secondary/60" : "text-rose-600"
          }`}
        >
          <Info size={13} weight="bold" className="mt-0.5 shrink-0" />
          {statusMessage}
        </p>
      )}
    </div>
  );
}
