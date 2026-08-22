"use client";

import React, { useMemo, useState } from "react";
import { CircleNotch, MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";

/**
 * Lista adresów objętych rabatem mailowym.
 *
 * Wklejanie masowe przyjmuje dowolny format (Excel, mail, CRM) — rozbicie
 * i walidacja dzieją się po stronie serwera, żeby reguła była jedna.
 */
export function MemberListEditor({
  members,
  saving,
  onAdd,
  onRemove,
}: {
  members: { id: string; email: string }[];
  saving: boolean;
  onAdd: (raw: string) => Promise<void>;
  onRemove: (email: string) => Promise<void>;
}) {
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => member.email.includes(needle));
  }, [members, query]);

  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-brand-secondary/5 pt-4">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
          Dodaj adresy
        </label>
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={3}
          placeholder="Wklej adresy — oddzielone przecinkiem, średnikiem lub nową linią"
          className="w-full resize-y rounded-xl border border-brand-secondary/15 bg-white px-3 py-2.5 text-[12px] text-brand-secondary outline-none transition-colors focus:border-brand-primary"
        />
        <button
          type="button"
          disabled={saving || !raw.trim()}
          onClick={async () => {
            await onAdd(raw);
            setRaw("");
          }}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-yellow/30 bg-brand-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity disabled:opacity-40"
        >
          {saving && <CircleNotch size={13} weight="bold" className="animate-spin" />}
          Dodaj do listy
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
          Na liście: {members.length}
        </span>

        {members.length > 6 && (
          <div className="relative">
            <MagnifyingGlass
              size={13}
              weight="bold"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-secondary/30"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj"
              className="w-40 rounded-lg border border-brand-secondary/15 bg-white py-1.5 pl-7 pr-2 text-[12px] outline-none focus:border-brand-primary"
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-secondary/15 py-4 text-center text-[12px] text-brand-secondary/40">
          {members.length === 0
            ? "Lista jest pusta — rabat nikogo jeszcze nie obejmuje."
            : "Brak adresów pasujących do wyszukiwania."}
        </p>
      ) : (
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
          {filtered.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-secondary/5 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-secondary/70"
            >
              {member.email}
              <button
                type="button"
                disabled={saving}
                onClick={() => onRemove(member.email)}
                title="Usuń z listy"
                className="flex h-4 w-4 items-center justify-center rounded text-brand-secondary/30 transition-colors hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40"
              >
                <X size={10} weight="bold" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
