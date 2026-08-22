"use client";

import React, { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

import { ModalShell } from "../ui/ModalShell";

import type { PromoKind } from "./types";

type TripOption = { id: string; title: string; status: string };

/**
 * Kopiowanie promocji na inne wydarzenia.
 *
 * Promocje są per-wydarzenie, więc „ten sam kod na kolejny turnus" oznacza
 * osobny rekord z własną pulą użyć — kopie startują z licznikiem 0.
 */
export function CopyToTripsModal({
  open,
  kind,
  promoLabel,
  currentTripId,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  kind: PromoKind;
  promoLabel: string;
  currentTripId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (targetTripIds: string[]) => void;
}) {
  const [trips, setTrips] = useState<TripOption[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    setSelected(new Set());
    fetch(`/api/admin/wydarzenia?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: TripOption[]) =>
        setTrips(rows.filter((trip) => trip.id !== currentTripId)),
      )
      .catch(() => setTrips([]));
  }, [open, currentTripId]);

  if (!open) return null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Portal, overlay, blokada scrolla i Escape siedzą w ModalShell.
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      size="sm"
      title="Kopiuj do wydarzeń"
    >
          <p className="mb-4 text-[12px] leading-snug text-brand-secondary/60">
            Kopiujemy <span className="font-bold">{promoLabel}</span>. W każdym
            wskazanym wydarzeniu powstanie osobna promocja z własną, zerową pulą
            użyć.
            {kind === "CODE" && (
              <>
                {" "}
                Wydarzenia, w których taki kod już istnieje, pominiemy.
              </>
            )}
          </p>

          {trips === null ? (
            <div className="flex justify-center py-8">
              <CircleNotch
                size={24}
                weight="bold"
                className="animate-spin text-brand-primary"
              />
            </div>
          ) : trips.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-secondary/15 py-6 text-center text-[12px] text-brand-secondary/40">
              Nie ma innych wydarzeń.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              {trips.map((trip) => (
                <label
                  key={trip.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-secondary/10 bg-white/60 px-3 py-2.5 transition-colors hover:border-brand-primary/30"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(trip.id)}
                    onChange={() => toggle(trip.id)}
                    className="h-4 w-4 accent-[#287d88]"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-brand-secondary">
                    {trip.title}
                  </span>
                  <span className="shrink-0 rounded-md bg-brand-secondary/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40">
                    {trip.status}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-brand-secondary/15 px-4 py-3 text-[13px] font-bold text-brand-secondary/60 transition-colors hover:bg-brand-secondary/5"
            >
              Anuluj
            </button>
            <button
              type="button"
              disabled={saving || selected.size === 0}
              onClick={() => onSubmit([...selected])}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-brand-yellow/30 bg-brand-primary px-4 py-3 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity disabled:opacity-40"
            >
              {saving && (
                <CircleNotch size={15} weight="bold" className="animate-spin" />
              )}
              Kopiuj ({selected.size})
            </button>
          </div>
    </ModalShell>
  );
}
