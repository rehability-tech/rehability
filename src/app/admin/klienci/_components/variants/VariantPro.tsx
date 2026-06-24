"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  TrendUp,
  TrendDown,
  CaretRight,
  Trash,
  PaperPlaneTilt,
  X,
} from "@phosphor-icons/react/dist/ssr";
import {
  Avatar,
  SourceChips,
  ScoreBars,
  computeScore,
  ACCENT,
  STATUS_META,
  glowClass,
  type CrmContact,
  type CrmStyle,
} from "../crmShared";

/**
 * Wariant „Pro" — czysty, dashboardowy CRM w stylu SaaS (KPI + sparkline + tabela
 * ze SCORE, pillami statusu, zaznaczaniem wierszy i pływającym paskiem akcji).
 */
export default function VariantPro({
  contacts,
  style,
}: {
  contacts: CrmContact[];
  style: CrmStyle;
}) {
  const router = useRouter();
  const accent = ACCENT[style.accent].main;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const rowPad = style.density === "compact" ? "py-2.5" : "py-3.5";

  const kpis = useMemo(() => {
    const sub = contacts.filter((c) => c.status === "SUBSCRIBED");
    const trips = contacts.filter((c) => c.sources.includes("Wyjazdy"));
    const news = contacts.filter((c) => c.sources.includes("Newsletter"));
    return [
      { label: "Wszystkie kontakty", list: contacts },
      { label: "Subskrybują", list: sub },
      { label: "Z wyjazdów", list: trips },
      { label: "Newsletter", list: news },
    ];
  }, [contacts]);

  const allChecked = contacts.length > 0 && selected.size === contacts.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(contacts.map((c) => c.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDelete = async () => {
    if (
      !confirm(
        `Usunąć ${selected.size} kontakt(ów)? Tej operacji nie można cofnąć.`,
      )
    )
      return;
    setBusy(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/admin/kontakty/${id}`, { method: "DELETE" }),
        ),
      );
      toast.success(`Usunięto ${selected.size} kontakt(ów).`);
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Nie udało się usunąć kontaktów.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const b = buckets(k.list);
          const t = trendPct(b);
          return (
            <div
              key={k.label}
              className={`bg-white border border-gray-100 rounded-2xl rounded-tr-none p-4 ${glowClass(
                style,
              )}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/40">
                {k.label}
              </p>
              <div className="flex items-end justify-between gap-2 mt-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-brand-secondary tabular-nums leading-none">
                    {k.list.length}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                      t >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {t >= 0 ? (
                      <TrendUp size={12} weight="bold" />
                    ) : (
                      <TrendDown size={12} weight="bold" />
                    )}
                    {Math.abs(t)}%
                  </span>
                </div>
                <Sparkline data={b} color={accent} />
              </div>
            </div>
          );
        })}
      </div>

      {/* TABELA */}
      <div
        className={`bg-white border border-gray-100 rounded-[24px] rounded-tr-none ${glowClass(
          style,
        )} overflow-hidden`}
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-widest text-brand-secondary/45 font-bold">
                <th className="pl-5 pr-2 py-3 w-10">
                  <CheckBox checked={allChecked} onClick={toggleAll} accent={accent} />
                </th>
                <th className="px-3 py-3 font-bold">Kontakt</th>
                <th className="px-3 py-3 font-bold">Źródło</th>
                <th className="px-3 py-3 font-bold hidden lg:table-cell">Email</th>
                <th className="px-3 py-3 font-bold">Score</th>
                <th className="px-3 py-3 font-bold text-center">Status</th>
                <th className="px-3 py-3 font-bold hidden md:table-cell whitespace-nowrap">
                  Dołączył
                </th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-gray-400 font-medium"
                  >
                    Brak wyników. Kliknij „Synchronizuj", aby zaciągnąć kontakty.
                  </td>
                </tr>
              ) : (
                contacts.map((c, i) => {
                  const name = c.name || "Brak nazwy";
                  const checked = selected.has(c.id);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.012, 0.2) }}
                      className={`border-b border-gray-50 transition-colors ${
                        checked ? "bg-[var(--crm-accent-soft)]" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className={`pl-5 pr-2 ${rowPad}`}>
                        <CheckBox
                          checked={checked}
                          onClick={() => toggle(c.id)}
                          accent={accent}
                        />
                      </td>
                      <td className={`px-3 ${rowPad}`}>
                        <div className="flex items-center gap-3">
                          <Avatar contact={c} size={36} />
                          <span className="font-bold text-brand-secondary text-[14px] whitespace-nowrap">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className={`px-3 ${rowPad}`}>
                        <SourceChips contact={c} max={2} />
                      </td>
                      <td
                        className={`px-3 ${rowPad} hidden lg:table-cell text-[13px] font-medium text-brand-secondary/60`}
                      >
                        <span className="truncate block max-w-[200px]">
                          {c.email}
                        </span>
                      </td>
                      <td className={`px-3 ${rowPad}`}>
                        <ScoreBars score={computeScore(c)} />
                      </td>
                      <td className={`px-3 ${rowPad} text-center`}>
                        <StatusPill status={c.status} />
                      </td>
                      <td
                        className={`px-3 ${rowPad} hidden md:table-cell text-[12.5px] font-medium text-brand-secondary/55 whitespace-nowrap`}
                      >
                        {formatDate(c.createdAt)}
                      </td>
                      <td className={`px-3 ${rowPad} text-right`}>
                        {c.userId && (
                          <a
                            href={`/admin/klienci/${c.userId}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-[var(--crm-accent)] hover:bg-gray-100 transition-colors"
                            aria-label={`Profil: ${name}`}
                          >
                            <CaretRight size={16} weight="bold" />
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PASEK AKCJI MASOWYCH */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 30, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 30, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-1.5 bg-brand-secondary text-white rounded-2xl rounded-tr-none shadow-[0_18px_40px_-10px_rgba(3,63,99,0.5)] pl-4 pr-2 py-2"
          >
            <span className="text-sm font-bold whitespace-nowrap mr-1">
              Zaznaczono: {selected.size}
            </span>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              onClick={() => router.push("/admin/klienci/kampanie/dodaj")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <PaperPlaneTilt size={16} weight="bold" />
              Kampania
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/15 transition-colors disabled:opacity-50"
            >
              <Trash size={16} weight="bold" />
              Usuń
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={15} weight="bold" />
              Odznacz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pomocnicze ────────────────────────────────────────────────────────────────

function CheckBox({
  checked,
  onClick,
  accent,
}: {
  checked: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-colors"
      style={{
        background: checked ? accent : "transparent",
        borderColor: checked ? accent : "#d1d5db",
      }}
      aria-pressed={checked}
    >
      {checked && <Check size={12} weight="bold" className="text-white" />}
    </button>
  );
}

function StatusPill({ status }: { status: CrmContact["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function buckets(list: CrmContact[], n = 10): number[] {
  const now = Date.now();
  const span = 1000 * 60 * 60 * 24 * 7 * n; // ostatnie n tygodni
  const start = now - span;
  const arr = new Array(n).fill(0);
  for (const c of list) {
    const t = new Date(c.createdAt).getTime();
    if (Number.isNaN(t) || t < start) continue;
    const idx = Math.min(n - 1, Math.max(0, Math.floor((t - start) / (span / n))));
    arr[idx]++;
  }
  return arr;
}

function trendPct(b: number[]): number {
  const half = Math.floor(b.length / 2);
  const first = b.slice(0, half).reduce((a, x) => a + x, 0);
  const last = b.slice(half).reduce((a, x) => a + x, 0);
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 84;
  const h = 28;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
