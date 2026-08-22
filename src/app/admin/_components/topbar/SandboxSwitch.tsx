"use client";

import React, { useRef, useState } from "react";
import {
  CircleNotch,
  Flask,
  Rocket,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";

import { useSandbox } from "../SandboxProvider";
import { AnchoredPopover } from "../ui/AnchoredPopover";
import { useConfirm } from "../ui/ConfirmProvider";

/**
 * Przełącznik piaskownicy w topbarze — widoczny na każdej podstronie
 * konkretnego wydarzenia.
 *
 * Włączenie to jedno kliknięcie. Wyjście z trybu MA DWA WARIANTY o zupełnie
 * różnych skutkach, więc celowo nie jest zwykłym toggle'em: pokazujemy menu
 * z „Opublikuj i wyłącz" oraz „Wyłącz bez publikacji". Pomyłka tutaj oznacza
 * albo wypuszczenie testowych promocji na produkcję, albo ich zniknięcie.
 *
 * Menu idzie przez `AnchoredPopover` (portal do body) — topbar ma tło z
 * `backdrop-blur`, więc zwykły `absolute` chowałby się pod treścią strony.
 */
export function SandboxSwitch() {
  const { tripId, enabled, draftCount, loading, pending, run } = useSandbox();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Poza kontekstem wydarzenia piaskownica nie ma czego dotyczyć.
  if (!tripId) return null;

  const busy = pending || loading;

  const handlePublish = async () => {
    const ok = await confirm({
      title: "Opublikować promocje testowe?",
      description: (
        <>
          {draftCount}{" "}
          {draftCount === 1
            ? "promocja testowa zacznie"
            : "promocji testowych zacznie"}{" "}
          działać naprawdę i będzie widoczna dla uczestników. Cena testowa —
          jeśli ją ustawiłeś — zastąpi cennik wydarzenia.
        </>
      ),
      confirmLabel: "Opublikuj i wyłącz",
    });
    if (!ok) return;
    if (await run("publish")) setOpen(false);
  };

  const handleDisable = async () => {
    const ok = await confirm({
      title: "Wyłączyć bez publikacji?",
      description:
        "Promocje testowe zostaną jako szkice — nikt ich nie zobaczy. Cennik wydarzenia pozostaje bez zmian.",
      confirmLabel: "Wyłącz",
    });
    if (!ok) return;
    if (await run("disable")) setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={busy}
        onClick={() => {
          if (enabled) setOpen((prev) => !prev);
          else void run("enable");
        }}
        title={
          enabled
            ? "Piaskownica włączona — kliknij, aby wyjść z trybu"
            : "Włącz piaskownicę: nowe promocje będzie widzieć tylko administrator"
        }
        aria-pressed={enabled}
        aria-expanded={enabled ? open : undefined}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-all disabled:opacity-50 ${
          enabled
            ? "border-amber-300 bg-amber-500 text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.7)]"
            : "border-white/40 bg-white/60 text-brand-secondary/60 hover:text-brand-primary"
        }`}
      >
        {busy ? (
          <CircleNotch size={14} weight="bold" className="animate-spin" />
        ) : (
          <Flask size={14} weight="bold" />
        )}
        <span className="hidden sm:inline">Piaskownica</span>
        {enabled && (
          <span className="rounded-full bg-white/25 px-1.5 text-[10px] leading-4">
            ON
          </span>
        )}
      </button>

      <AnchoredPopover
        open={open && enabled}
        anchorRef={buttonRef}
        onClose={() => setOpen(false)}
        align="right"
      >
        <div className="border-b border-brand-secondary/10 bg-amber-50/80 px-4 py-3">
          <p className="font-jakarta text-[13px] font-bold text-amber-900">
            Tryb piaskownicy jest włączony
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-800/80">
            Wszystko, co teraz utworzysz lub zmienisz, widzi wyłącznie
            administrator.{" "}
            {draftCount > 0
              ? `Szkiców testowych: ${draftCount}.`
              : "Nie masz jeszcze żadnego szkicu testowego."}
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handlePublish}
          className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-brand-primary/5 disabled:opacity-50"
        >
          <Rocket
            size={15}
            weight="bold"
            className="mt-0.5 shrink-0 text-brand-primary"
          />
          <span>
            <span className="block text-[13px] font-bold text-brand-secondary">
              Opublikuj i wyłącz
            </span>
            <span className="block text-[11px] leading-snug text-brand-secondary/50">
              Promocje testowe zaczynają działać dla uczestników.
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handleDisable}
          className="flex w-full items-start gap-2.5 border-t border-brand-secondary/5 px-4 py-3 text-left transition-colors hover:bg-brand-secondary/5 disabled:opacity-50"
        >
          <XCircle
            size={15}
            weight="bold"
            className="mt-0.5 shrink-0 text-brand-secondary/50"
          />
          <span>
            <span className="block text-[13px] font-bold text-brand-secondary">
              Wyłącz bez publikacji
            </span>
            <span className="block text-[11px] leading-snug text-brand-secondary/50">
              Szkice zostają ukryte, cennik bez zmian.
            </span>
          </span>
        </button>
      </AnchoredPopover>
    </>
  );
}
