"use client";

import React, { useState } from "react";
import { ArrowUp, CircleNotch, Flask } from "@phosphor-icons/react/dist/ssr";

import { formatGrosze } from "@/lib/discounts/format";

import type { DiscountPanelPayload } from "./types";

/**
 * Cennik testowy piaskownicy.
 *
 * Sam PRZEŁĄCZNIK trybu (włącz / opublikuj i wyłącz / wyłącz bez publikacji)
 * mieszka w topbarze — jest dostępny z każdej podstrony wydarzenia i jest
 * jedynym miejscem, które nim steruje. Dwa konkurencyjne przełączniki tego
 * samego stanu to gwarantowana pomyłka, więc tutaj zostaje wyłącznie cena
 * obowiązująca w trybie testowym.
 */
export function SandboxPanel({
  trip,
  enabled,
  draftCount,
  saving,
  onSavePrices,
}: {
  trip: DiscountPanelPayload["trip"];
  enabled: boolean;
  draftCount: number;
  saving: boolean;
  onSavePrices: (prices: {
    sandboxPrice: string;
    sandboxDeposit: string;
  }) => void;
}) {
  const [price, setPrice] = useState(
    trip.sandboxPriceGrosze != null ? String(trip.sandboxPriceGrosze / 100) : "",
  );
  const [deposit, setDeposit] = useState(
    trip.sandboxDepositGrosze != null
      ? String(trip.sandboxDepositGrosze / 100)
      : "",
  );

  return (
    <section className="rounded-3xl rounded-tr-none border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl rounded-tr-none ${
            enabled ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"
          }`}
        >
          <Flask size={20} weight="bold" />
        </span>
        <div>
          <h2 className="font-jakarta text-lg font-bold text-brand-secondary">
            Piaskownica
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                enabled
                  ? "bg-amber-500 text-white"
                  : "bg-brand-secondary/10 text-brand-secondary/50"
              }`}
            >
              {enabled ? "włączona" : "wyłączona"}
            </span>
          </h2>
          <p className="text-[12px] text-brand-secondary/50">
            Testuj promocje na żywym wydarzeniu, nie pokazując ich uczestnikom.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-brand-secondary/5 p-4 text-[12px] leading-relaxed text-brand-secondary/60">
        Tryb <span className="font-bold">nie wyłącza</span> trwających promocji —
        izoluje tylko to, co w nim powstanie. Każdy zapis przy włączonej
        piaskownicy (łącznie ze zwykłym przełącznikiem aktywności) oznacza
        promocję jako testową. Uczestnik nadal widzi normalną cenę, a testowy
        kod dostaje odpowiedź „nie znamy takiego kodu".
      </div>

      {/* Sterowanie trybem jest w topbarze — tu tylko wskazujemy gdzie. */}
      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-dashed border-brand-secondary/20 px-4 py-3">
        <ArrowUp
          size={15}
          weight="bold"
          className="mt-0.5 shrink-0 text-brand-primary"
        />
        <p className="text-[12px] leading-snug text-brand-secondary/60">
          Tryb włączasz i wyłączasz{" "}
          <span className="font-bold text-brand-secondary">
            przełącznikiem „Piaskownica" w górnym pasku
          </span>
          . Tam też znajdziesz „Opublikuj i wyłącz" oraz „Wyłącz bez publikacji".
          {enabled && draftCount > 0 && (
            <>
              {" "}
              Szkiców testowych czekających na publikację:{" "}
              <span className="font-bold text-brand-secondary">{draftCount}</span>.
            </>
          )}
        </p>
      </div>

      {/* Cennik testowy */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
            Cena testowa (zł)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={String(trip.priceGrosze / 100)}
            className="w-full rounded-xl border border-brand-secondary/15 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
            Zadatek testowy (zł)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
            placeholder={String(trip.depositGrosze / 100)}
            className="w-full rounded-xl border border-brand-secondary/15 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-brand-primary"
          />
        </label>
      </div>

      <p className="mb-4 text-[11px] text-brand-secondary/40">
        Puste pole = obowiązuje cennik wydarzenia:{" "}
        {formatGrosze(trip.priceGrosze)} · zadatek{" "}
        {formatGrosze(trip.depositGrosze)}. Przy „Opublikuj i wyłącz" cena
        testowa zastąpi cennik.
      </p>

      <button
        type="button"
        disabled={saving}
        onClick={() =>
          onSavePrices({ sandboxPrice: price, sandboxDeposit: deposit })
        }
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-yellow/30 bg-brand-primary px-4 py-3 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity disabled:opacity-50"
      >
        {saving && <CircleNotch size={15} weight="bold" className="animate-spin" />}
        Zapisz cennik testowy
      </button>
    </section>
  );
}
