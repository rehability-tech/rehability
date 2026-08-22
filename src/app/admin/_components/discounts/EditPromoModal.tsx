"use client";

import React, { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

import { calculatePrice } from "@/lib/discounts/calculatePrice";
import { formatGrosze } from "@/lib/discounts/format";
import { deriveDeposit } from "@/lib/discounts/deposit";
import type { DiscountCandidate } from "@/lib/discounts/types";
import { ModalShell } from "../ui/ModalShell";

import { EMPTY_FORM, type PromoFormValues, type PromoKind } from "./types";

/**
 * Jeden modal dla wszystkich trzech typów promocji — różnią się polem
 * identyfikującym (kod vs nazwa), zestawem typów wartości i flagą łączenia.
 * Reszta formularza (cykl życia) jest identyczna.
 *
 * Podgląd „uczestnik zapłaci" liczy CZYSTA funkcja `calculatePrice`, ta sama,
 * która liczy realne obciążenie na serwerze — dzięki temu podgląd nie może
 * skłamać.
 */

const TITLES: Record<PromoKind, { create: string; edit: string }> = {
  CODE: { create: "Nowy kod rabatowy", edit: "Edycja kodu" },
  SALE: { create: "Nowa przecena", edit: "Edycja przeceny" },
  EMAIL: { create: "Nowy rabat mailowy", edit: "Edycja rabatu mailowego" },
};

const VALUE_TYPES: Record<PromoKind, { value: string; label: string }[]> = {
  CODE: [
    { value: "percent", label: "Procent" },
    { value: "amount", label: "Kwota" },
  ],
  SALE: [
    { value: "percent", label: "Procent" },
    { value: "fixed_price", label: "Cena docelowa" },
  ],
  EMAIL: [
    { value: "percent", label: "Procent" },
    { value: "amount", label: "Kwota" },
  ],
};

type Props = {
  kind: PromoKind;
  open: boolean;
  /** null = tworzenie nowej promocji. */
  initial: PromoFormValues | null;
  /** Cena i zadatek wydarzenia (grosze) — do podglądu. */
  priceGrosze: number;
  depositGrosze: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: PromoFormValues) => void;
};

export function EditPromoModal({
  kind,
  open,
  initial,
  priceGrosze,
  depositGrosze,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PromoFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof PromoFormValues>(
    key: K,
    value: PromoFormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // ── Podgląd ceny ────────────────────────────────────────────────────────
  const candidate: DiscountCandidate = {
    kind,
    id: "preview",
    name: form.name || form.code || "Podgląd",
    code: form.code,
    valueType: form.valueType as DiscountCandidate["valueType"],
    percent: form.percent ? Number(form.percent) : null,
    amountGrosze: form.amountZl ? Math.round(Number(form.amountZl) * 100) : null,
    targetPriceGrosze: form.targetPriceZl
      ? Math.round(Number(form.targetPriceZl) * 100)
      : null,
  };

  const preview = calculatePrice(
    kind === "CODE"
      ? { baseAmount: priceGrosze, code: candidate }
      : { baseAmount: priceGrosze, automatic: [candidate] },
  );
  const previewDeposit = deriveDeposit(
    priceGrosze,
    depositGrosze,
    preview.finalAmount,
  );

  const isPercent = form.valueType === "percent";
  const isFixedPrice = form.valueType === "fixed_price";

  // Portal, overlay, blokada scrolla i Escape siedzą w ModalShell — tutaj
  // zostaje sama treść formularza.
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={initial ? TITLES[kind].edit : TITLES[kind].create}
    >
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(form);
            }}
          >
            {/* Identyfikator: kod albo nazwa */}
            {kind === "CODE" ? (
              <Field label="Kod" hint="3–32 znaki: A–Z, 0–9, _ oraz -">
                <input
                  value={form.code}
                  onChange={(event) =>
                    set("code", event.target.value.toUpperCase())
                  }
                  placeholder="LATO10"
                  className={`${INPUT} font-mono uppercase tracking-wide`}
                  required
                />
              </Field>
            ) : (
              <Field label="Nazwa" hint="Widoczna dla uczestnika w koszyku">
                <input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder={
                    kind === "SALE" ? "Wczesna rezerwacja" : "Newsletter"
                  }
                  className={INPUT}
                  required
                />
              </Field>
            )}

            {/* Typ i wartość */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Typ">
                <select
                  value={form.valueType}
                  onChange={(event) => set("valueType", event.target.value)}
                  className={INPUT}
                >
                  {VALUE_TYPES[kind].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={
                  isPercent
                    ? "Rabat (%)"
                    : isFixedPrice
                      ? "Cena docelowa (zł)"
                      : "Rabat (zł)"
                }
              >
                {isPercent ? (
                  <input
                    type="number"
                    min={1}
                    max={95}
                    value={form.percent}
                    onChange={(event) => set("percent", event.target.value)}
                    className={INPUT}
                    required
                  />
                ) : isFixedPrice ? (
                  <input
                    type="number"
                    min={2}
                    step="0.01"
                    value={form.targetPriceZl}
                    onChange={(event) => set("targetPriceZl", event.target.value)}
                    className={INPUT}
                    required
                  />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step="0.01"
                    value={form.amountZl}
                    onChange={(event) => set("amountZl", event.target.value)}
                    className={INPUT}
                    required
                  />
                )}
              </Field>
            </div>

            {/* Podgląd — ta sama funkcja, która liczy realne obciążenie */}
            <div className="rounded-2xl rounded-tr-none border border-brand-primary/15 bg-brand-primary/5 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
                Uczestnik zapłaci
              </p>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-jakarta text-2xl font-bold leading-none text-brand-secondary">
                    {formatGrosze(preview.finalAmount)}
                  </p>
                  {preview.totalDiscount > 0 && (
                    <p className="mt-1 text-[12px] text-brand-secondary/50">
                      zamiast{" "}
                      <span className="line-through">
                        {formatGrosze(preview.baseAmount)}
                      </span>{" "}
                      · oszczędność {formatGrosze(preview.totalDiscount)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40">
                    Zadatek
                  </p>
                  <p className="text-sm font-bold text-brand-secondary">
                    {formatGrosze(previewDeposit)}
                  </p>
                </div>
              </div>
              {preview.clamped && (
                <p className="mt-2 text-[11px] font-semibold text-amber-600">
                  Rabat został przycięty — cena nie może zejść poniżej 2 zł
                  (minimum Stripe).
                </p>
              )}
            </div>

            {kind === "CODE" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-secondary/10 bg-white/60 p-3">
                <input
                  type="checkbox"
                  checked={form.stackableWithSale}
                  onChange={(event) =>
                    set("stackableWithSale", event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-[#287d88]"
                />
                <span className="text-[12px] leading-snug text-brand-secondary/70">
                  <span className="font-bold text-brand-secondary">
                    Łączy się z przeceną
                  </span>
                  <br />
                  Rabat naliczy się od kwoty już obniżonej. Bez tego kod
                  konkuruje z przeceną — wygrywa korzystniejsza opcja.
                </span>
              </label>
            )}

            {/* Cykl życia */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Obowiązuje od">
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(event) => set("validFrom", event.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Obowiązuje do" hint="Włącznie, do 23:59">
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(event) => set("validUntil", event.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="Limit użyć" hint="Puste = bez limitu">
              <input
                type="number"
                min={1}
                max={100000}
                value={form.usageLimit}
                onChange={(event) => set("usageLimit", event.target.value)}
                placeholder="np. 20"
                className={INPUT}
              />
            </Field>

            <Field label="Notatka" hint="Tylko dla administratora">
              <input
                value={form.note}
                onChange={(event) => set("note", event.target.value)}
                placeholder="np. akcja na Instagramie"
                className={INPUT}
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => set("isActive", event.target.checked)}
                className="h-4 w-4 accent-[#287d88]"
              />
              <span className="text-[13px] font-semibold text-brand-secondary">
                Aktywna
              </span>
            </label>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-brand-secondary/15 px-4 py-3 text-[13px] font-bold text-brand-secondary/60 transition-colors hover:bg-brand-secondary/5"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-brand-yellow/30 bg-brand-primary px-4 py-3 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity disabled:opacity-50"
              >
                {saving && (
                  <CircleNotch size={15} weight="bold" className="animate-spin" />
                )}
                Zapisz
              </button>
            </div>
          </form>
    </ModalShell>
  );
}

const INPUT =
  "w-full rounded-xl border border-brand-secondary/15 bg-white px-3 py-2.5 text-[13px] text-brand-secondary outline-none transition-colors focus:border-brand-primary";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-brand-secondary/40">{hint}</span>}
    </label>
  );
}
