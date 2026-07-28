"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MagnifyingGlass,
  Users,
  ArrowsClockwise,
  PaperPlaneTilt,
} from "@phosphor-icons/react/dist/ssr";
import type { CrmContact } from "@/lib/crm/types";
import {
  accentVars,
  ALL_SOURCES,
  DEFAULT_CRM_STYLE,
  type CrmStyle,
} from "./crmShared";
import CrmDebugBar from "./CrmDebugBar";
import VariantPro from "./variants/VariantPro";
import VariantTable from "./variants/VariantTable";
import VariantCards from "./variants/VariantCards";
import VariantColumns from "./variants/VariantColumns";
import VariantCompact from "./variants/VariantCompact";

const STORAGE_KEY = "crm-style-debug";
const SOURCE_FILTERS = ["Wszystkie", ...ALL_SOURCES];

/**
 * Kontener panelu „Baza Kontaktów" z debug barem do podglądu wyglądów.
 * Posiada wspólny pasek (wyszukiwarka, filtry źródeł, sync, kampanie) i renderuje
 * wybrany wariant prezentacji. Wybór stylu zapamiętujemy w localStorage.
 */
export default function CrmExplorer({
  contacts,
}: {
  contacts: CrmContact[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("Wszystkie");
  const [onlySubscribed, setOnlySubscribed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [style, setStyle] = useState<CrmStyle>(DEFAULT_CRM_STYLE);

  // Odczyt zapamiętanego stylu (po mount — unikamy niezgodności SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStyle({ ...DEFAULT_CRM_STYLE, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const updateStyle = (next: CrmStyle) => {
    setStyle(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (sourceFilter !== "Wszystkie" && !c.sources.includes(sourceFilter))
        return false;
      if (onlySubscribed && c.status !== "SUBSCRIBED") return false;
      if (!term) return true;
      return (
        (c.name || "").toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    });
  }, [contacts, search, sourceFilter, onlySubscribed]);

  const stats = useMemo(() => {
    const subscribed = contacts.filter((c) => c.status === "SUBSCRIBED").length;
    const bySource = (s: string) =>
      contacts.filter((c) => c.sources.includes(s)).length;
    return {
      subscribed,
      trips: bySource("Wydarzenia"),
      vod: bySource("VOD"),
      newsletter: bySource("Newsletter"),
    };
  }, [contacts]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/kontakty/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd synchronizacji");
      toast.success(`Zsynchronizowano kontakty (${data.total}).`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd synchronizacji.");
    } finally {
      setSyncing(false);
    }
  };

  const Variant =
    style.variant === "pro"
      ? VariantPro
      : style.variant === "cards"
        ? VariantCards
        : style.variant === "columns"
          ? VariantColumns
          : style.variant === "compact"
            ? VariantCompact
            : VariantTable;

  return (
    <div
      style={accentVars(style)}
      className="flex flex-col gap-6 max-w-7xl mx-auto pb-28"
    >
      {/* NAGŁÓWEK */}
      <div className="flex flex-col gap-5 bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-[28px] rounded-tr-none shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-jakarta font-bold text-2xl text-brand-secondary flex items-center gap-3 flex-wrap">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Users size={24} weight="fill" />
              </div>
              Baza Kontaktów
              <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-sm text-brand-primary shadow-sm">
                {contacts.length}
              </span>
            </h1>
            <p className="text-sm text-brand-secondary/60 mt-2 font-medium">
              {stats.subscribed} subskrybuje · {stats.trips} z wydarzeń ·{" "}
              {stats.vod} z VOD · {stats.newsletter} z newslettera
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/klienci/kampanie"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:opacity-90 transition-opacity"
            >
              <PaperPlaneTilt size={16} weight="fill" />
              Kampanie
            </Link>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-brand-secondary text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowsClockwise
                size={16}
                weight="bold"
                className={syncing ? "animate-spin" : ""}
              />
              {syncing ? "Synchronizuję..." : "Synchronizuj"}
            </button>
          </div>
        </div>

        {/* FILTRY */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative w-full lg:w-80 group">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40 group-focus-within:text-brand-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Szukaj po nazwisku lub e-mailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-4 focus:ring-brand-primary/15 focus:border-brand-primary/30 shadow-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SOURCE_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  sourceFilter === s
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-secondary/60 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setOnlySubscribed((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                onlySubscribed
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-brand-secondary/60 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Tylko subskrybujący
            </button>
          </div>
        </div>
      </div>

      {/* WYBRANY WARIANT */}
      <Variant contacts={filtered} style={style} />

      {/* DEBUG BAR */}
      <CrmDebugBar style={style} onChange={updateStyle} />
    </div>
  );
}
