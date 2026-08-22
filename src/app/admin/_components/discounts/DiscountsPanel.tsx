"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChartBar,
  CircleNotch,
  EnvelopeSimple,
  Plus,
  Tag,
  TrendDown,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import { formatGrosze } from "@/lib/discounts/format";

import { CopyToTripsModal } from "./CopyToTripsModal";
import { DiscountStatsBar } from "./DiscountStatsBar";
import { EditPromoModal } from "./EditPromoModal";
import { MemberListEditor } from "./MemberListEditor";
import { PromoCard } from "./PromoCard";
import { SandboxBanner } from "./SandboxBanner";
import { SandboxPanel } from "./SandboxPanel";
import { useSandbox } from "../SandboxProvider";
import { useConfirm } from "../ui/ConfirmProvider";
import { formToPayload, rowToForm, rowValueLabel } from "./formMapping";
import type {
  CodeRow,
  DiscountPanelPayload,
  EmailDiscountRow,
  PromoFormValues,
  PromoKind,
  SaleRow,
} from "./types";

type TabKey = "kody" | "przeceny" | "mailowe" | "statystyki";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "kody", label: "Kody", icon: <Tag size={15} weight="bold" /> },
  { key: "przeceny", label: "Przeceny", icon: <TrendDown size={15} weight="bold" /> },
  {
    key: "mailowe",
    label: "Rabaty mailowe",
    icon: <EnvelopeSimple size={15} weight="bold" />,
  },
  {
    key: "statystyki",
    label: "Statystyki & Piaskownica",
    icon: <ChartBar size={15} weight="bold" />,
  },
];

/** Ścieżka API dla danego typu promocji. */
const SEGMENT: Record<PromoKind, string> = {
  CODE: "kody",
  SALE: "przeceny",
  EMAIL: "mailowe",
};

export type DiscountsPanelProps = {
  /** Baza tras API produktu, np. . */
  apiBase: string;
  /** Dokad prowadzi przycisk powrotu (pulpit produktu). */
  backHref: string;
  /** Etykieta w przycisku powrotu. */
  backLabel: string;
  /** ID produktu — modal kopiowania wyklucza go z listy celow. */
  currentProductId: string;
};

/**
 * Panel rabatow — wspolny dla wydarzen i kursow.
 *
 * Cala roznica miedzy produktami sprowadza sie do bazy tras API i linku
 * powrotu; reguly, komponenty i statystyki sa identyczne, wiec panel istnieje
 * w jednym egzemplarzu, a strony produktow sa jego cienkimi opakowaniami.
 */
export default function DiscountsPanel({
  apiBase,
  backHref,
  backLabel,
  currentProductId,
}: DiscountsPanelProps) {
  const router = useRouter();

  const [data, setData] = useState<DiscountPanelPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("kody");
  const [saving, setSaving] = useState(false);

  const [editor, setEditor] = useState<{
    kind: PromoKind;
    id: string | null;
    initial: PromoFormValues | null;
  } | null>(null);

  const [copySource, setCopySource] = useState<{
    kind: PromoKind;
    id: string;
    label: string;
  } | null>(null);

  const [expandedList, setExpandedList] = useState<string | null>(null);

  // Potwierdzenia idą przez portalowany dialog, nie window.confirm.
  const confirm = useConfirm();

  // Stan piaskownicy jest wspólny z topbarem — panel go tylko czyta.
  const {
    enabled: sandboxEnabled,
    pending: sandboxPending,
    run: runSandbox,
    subscribe: subscribeSandbox,
  } = useSandbox();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiBase}?t=${Date.now()}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Błąd pobierania danych");
      setData(await res.json());
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się wczytać panelu rabatów.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Przełącznik piaskownicy siedzi w topbarze, poza tym drzewem. Po zmianie
  // trybu zmienia się widoczność rekordów testowych, więc przeładowujemy dane.
  useEffect(() => subscribeSandbox(fetchData), [subscribeSandbox, fetchData]);

  /** Wspólna obsługa mutacji: błąd → toast, sukces → toast + odświeżenie. */
  const mutate = async (
    url: string,
    init: RequestInit,
    successMessage: string,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error || "Nie udało się zapisać zmian.");
        return false;
      }

      const body = await res.json().catch(() => null);
      toast.success(body?.message || successMessage);
      await fetchData();
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (form: PromoFormValues) => {
    if (!editor) return;

    const base = `${apiBase}/${SEGMENT[editor.kind]}`;
    const ok = await mutate(
      editor.id ? `${base}/${editor.id}` : base,
      {
        method: editor.id ? "PATCH" : "POST",
        body: JSON.stringify(formToPayload(editor.kind, form)),
      },
      editor.id ? "Zapisano zmiany." : "Promocja utworzona.",
    );

    if (ok) setEditor(null);
  };

  const handleToggle = (kind: PromoKind, promoId: string, isActive: boolean) =>
    mutate(
      `${apiBase}/${SEGMENT[kind]}/${promoId}`,
      { method: "PATCH", body: JSON.stringify({ isActive: !isActive }) },
      isActive ? "Promocja wyłączona." : "Promocja włączona.",
    );

  const handleDelete = async (
    kind: PromoKind,
    promoId: string,
    label: string,
  ) => {
    const ok = await confirm({
      title: `Usunąć „${label}"?`,
      description:
        "Tej operacji nie można cofnąć. Historia zamówień pozostanie nienaruszona — snapshot rabatu jest zapisany na rezerwacji.",
      confirmLabel: "Usuń",
      tone: "danger",
    });
    if (!ok) return;

    void mutate(
      `${apiBase}/${SEGMENT[kind]}/${promoId}`,
      { method: "DELETE" },
      "Promocja usunięta.",
    );
  };

  const handleCopy = async (targetTripIds: string[]) => {
    if (!copySource) return;

    const ok = await mutate(
      `${apiBase}/kopiuj`,
      {
        method: "POST",
        body: JSON.stringify({
          kind: copySource.kind,
          id: copySource.id,
          targetTripIds,
        }),
      },
      "Promocja skopiowana.",
    );

    if (ok) setCopySource(null);
  };

  /**
   * Sam cennik testowy. Włączanie i wyłączanie trybu obsługuje przełącznik
   * w topbarze (wspólny kontekst), żeby nie było dwóch źródeł prawdy.
   */
  const handleSavePrices = (prices: {
    sandboxPrice: string;
    sandboxDeposit: string;
  }) =>
    mutate(
      `${apiBase}/sandbox`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action: "prices",
          sandboxPrice: prices.sandboxPrice ? Number(prices.sandboxPrice) : null,
          sandboxDeposit: prices.sandboxDeposit
            ? Number(prices.sandboxDeposit)
            : null,
        }),
      },
      "Zapisano cennik testowy.",
    );

  const handleAddMembers = async (edId: string, raw: string) => {
    setSaving(true);
    try {
      const res = await fetch(
        `${apiBase}/mailowe/${edId}/czlonkowie`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        },
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error || "Nie udało się dodać adresów.");
        return;
      }

      const parts = [`Dodano ${body.added}`];
      if (body.duplicates > 0) parts.push(`${body.duplicates} już było na liście`);
      if (body.invalid?.length > 0) {
        parts.push(`${body.invalid.length} pominięto jako błędne`);
      }
      toast.success(`${parts.join(" · ")}.`);

      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (edId: string, email: string) => {
    await mutate(
      `${apiBase}/mailowe/${edId}/czlonkowie?email=${encodeURIComponent(email)}`,
      { method: "DELETE" },
      "Adres usunięty z listy.",
    );
  };

  // ── Stany renderu ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50">
        <CircleNotch
          size={40}
          weight="bold"
          className="mb-4 animate-spin text-brand-primary"
        />
        <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-brand-secondary/50">
          Wczytywanie panelu rabatów...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <WarningCircle size={48} weight="duotone" className="mb-3 text-rose-500" />
        <h2 className="mb-2 font-jakarta text-2xl font-bold text-brand-secondary">
          Nie można wczytać rabatów
        </h2>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mt-2 text-sm font-bold text-brand-primary hover:underline"
        >
          Wróć do pulpitu
        </button>
      </div>
    );
  }

  const { trip, preview, summary } = data;

  const promoCardHandlers = (kind: PromoKind, promoId: string, label: string) => ({
    onEdit: () => {
      const row =
        kind === "CODE"
          ? data.codes.find((r) => r.id === promoId)
          : kind === "SALE"
            ? data.sales.find((r) => r.id === promoId)
            : data.emailDiscounts.find((r) => r.id === promoId);
      if (row) setEditor({ kind, id: promoId, initial: rowToForm(row) });
    },
    onCopy: () => setCopySource({ kind, id: promoId, label }),
    onDelete: () => handleDelete(kind, promoId, label),
  });

  return (
    <div className="relative min-h-screen bg-gray-50/30 font-montserrat">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute bottom-20 right-10 h-[400px] w-[400px] rounded-full bg-brand-yellow/5 blur-[100px]" />
      </div>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* HERO */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none border border-white/20 p-6 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 rounded-full bg-brand-yellow/30 blur-[90px]" />

          <div className="relative z-10 flex flex-col gap-5">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/70 backdrop-blur-md transition-colors hover:text-white"
            >
              <ArrowLeft size={14} weight="bold" /> {backLabel}
            </button>

            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl rounded-tr-none border border-white/10 bg-white/15 text-white shadow-inner backdrop-blur-md sm:h-14 sm:w-14">
                <Tag size={26} weight="bold" />
              </span>
              <div>
                <h1 className="font-jakarta text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-[32px]">
                  Rabaty
                </h1>
                <p className="mt-1 text-[13px] font-medium text-white/70">
                  Kody, przeceny i rabaty mailowe dla „{trip.title}".
                </p>
              </div>
            </div>

            {/* Co widzi dziś uczestnik */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Uczestnik zapłaci dziś
                </p>
                <p className="font-jakarta text-lg font-bold text-white">
                  {formatGrosze(preview.finalAmount)}
                  {preview.totalDiscount > 0 && (
                    <span className="ml-2 text-[13px] font-medium text-white/50 line-through">
                      {formatGrosze(preview.baseAmount)}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Zadatek
                </p>
                <p className="font-jakarta text-lg font-bold text-white">
                  {formatGrosze(preview.depositGrosze)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {sandboxEnabled && (
          <SandboxBanner onOpenSandbox={() => setTab("statystyki")} />
        )}

        <DiscountStatsBar summary={summary} />

        {/* Przełącznik zakładek */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-bold transition-all ${
                tab === item.key
                  ? "border border-brand-yellow/30 bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                  : "text-brand-secondary/60 hover:text-brand-secondary"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            {/* ── KODY ────────────────────────────────────────────────── */}
            {tab === "kody" && (
              <>
                <SectionHeader
                  title="Kody rabatowe"
                  count={data.codes.length}
                  onAdd={() => setEditor({ kind: "CODE", id: null, initial: null })}
                  addLabel="Nowy kod"
                />

                {data.codes.length === 0 ? (
                  <EmptyState text="Nie ma jeszcze żadnego kodu. Utwórz pierwszy, żeby uczestnicy mogli go wpisać w koszyku." />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {data.codes.map((row: CodeRow) => (
                      <PromoCard
                        key={row.id}
                        kind="CODE"
                        title={row.code}
                        valueLabel={rowValueLabel("CODE", row)}
                        note={row.note}
                        isActive={row.isActive}
                        eligible={row.eligible}
                        isSandbox={row.isSandbox}
                        validFrom={row.validFrom}
                        validUntil={row.validUntil}
                        usageLimit={row.usageLimit}
                        usedCount={row.usedCount}
                        stats={row.stats}
                        busy={saving}
                        badges={
                          row.stackableWithSale ? (
                            <span className="rounded-lg bg-brand-yellow/25 px-2 py-1 text-[11px] font-bold text-brand-secondary/70">
                              Łączy się z przeceną
                            </span>
                          ) : null
                        }
                        onToggle={() => handleToggle("CODE", row.id, row.isActive)}
                        {...promoCardHandlers("CODE", row.id, row.code)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── PRZECENY ────────────────────────────────────────────── */}
            {tab === "przeceny" && (
              <>
                <SectionHeader
                  title="Przeceny"
                  count={data.sales.length}
                  onAdd={() => setEditor({ kind: "SALE", id: null, initial: null })}
                  addLabel="Nowa przecena"
                />

                {/* Przeceny nie sumują się — przy dwóch aktywnych admin musi
                    wiedzieć, która realnie wygrywa. */}
                {preview.competingSales >= 2 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[12px] leading-snug text-amber-800">
                    <span className="font-bold">
                      Przeceny nie sumują się — konkurują.
                    </span>{" "}
                    Aktywne są {preview.competingSales}. Przy cenie{" "}
                    {formatGrosze(preview.baseAmount)} wygrywa „
                    {data.sales.find((s) => s.id === preview.winningSaleId)?.name ??
                      "—"}
                    " ({formatGrosze(preview.finalAmount)}).
                  </div>
                )}

                {data.sales.length === 0 ? (
                  <EmptyState text="Brak przecen. Przecena działa automatycznie — uczestnik nie musi nic wpisywać." />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {data.sales.map((row: SaleRow) => (
                      <PromoCard
                        key={row.id}
                        kind="SALE"
                        title={row.name}
                        valueLabel={rowValueLabel("SALE", row)}
                        note={row.note}
                        isActive={row.isActive}
                        eligible={row.eligible}
                        isSandbox={row.isSandbox}
                        validFrom={row.validFrom}
                        validUntil={row.validUntil}
                        usageLimit={row.usageLimit}
                        usedCount={row.usedCount}
                        stats={row.stats}
                        busy={saving}
                        badges={
                          preview.winningSaleId === row.id ? (
                            <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                              Obowiązuje teraz
                            </span>
                          ) : null
                        }
                        onToggle={() => handleToggle("SALE", row.id, row.isActive)}
                        {...promoCardHandlers("SALE", row.id, row.name)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── RABATY MAILOWE ──────────────────────────────────────── */}
            {tab === "mailowe" && (
              <>
                <SectionHeader
                  title="Rabaty mailowe"
                  count={data.emailDiscounts.length}
                  onAdd={() => setEditor({ kind: "EMAIL", id: null, initial: null })}
                  addLabel="Nowy rabat"
                />

                {data.emailDiscounts.length === 0 ? (
                  <EmptyState text="Brak rabatów mailowych. Działają automatycznie dla osób z listy — po zalogowaniu, bez wpisywania kodu." />
                ) : (
                  <div className="grid gap-4">
                    {data.emailDiscounts.map((row: EmailDiscountRow) => (
                      <PromoCard
                        key={row.id}
                        kind="EMAIL"
                        title={row.name}
                        valueLabel={rowValueLabel("EMAIL", row)}
                        note={row.note}
                        isActive={row.isActive}
                        eligible={row.eligible}
                        isSandbox={row.isSandbox}
                        validFrom={row.validFrom}
                        validUntil={row.validUntil}
                        usageLimit={row.usageLimit}
                        usedCount={row.usedCount}
                        stats={row.stats}
                        busy={saving}
                        badges={
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedList(
                                expandedList === row.id ? null : row.id,
                              )
                            }
                            className="rounded-lg bg-brand-secondary/5 px-2 py-1 text-[11px] font-bold text-brand-secondary/60 transition-colors hover:bg-brand-secondary/10"
                          >
                            {row.memberCount}{" "}
                            {row.memberCount === 1 ? "adres" : "adresów"}
                            {expandedList === row.id ? " ▲" : " ▼"}
                          </button>
                        }
                        onToggle={() => handleToggle("EMAIL", row.id, row.isActive)}
                        {...promoCardHandlers("EMAIL", row.id, row.name)}
                      >
                        {expandedList === row.id && (
                          <MemberListEditor
                            members={row.members}
                            saving={saving}
                            onAdd={(raw) => handleAddMembers(row.id, raw)}
                            onRemove={(email) => handleRemoveMember(row.id, email)}
                          />
                        )}
                      </PromoCard>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── STATYSTYKI I PIASKOWNICA ────────────────────────────── */}
            {tab === "statystyki" && (
              <div className="flex flex-col gap-6">
                <PromoStatsTable data={data} />
                <SandboxPanel
                  trip={trip}
                  enabled={sandboxEnabled}
                  draftCount={summary.sandboxDrafts}
                  saving={saving || sandboxPending}
                  onSavePrices={handleSavePrices}
                />
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      <EditPromoModal
        kind={editor?.kind ?? "CODE"}
        open={!!editor}
        initial={editor?.initial ?? null}
        priceGrosze={trip.priceGrosze}
        depositGrosze={trip.depositGrosze}
        saving={saving}
        onClose={() => setEditor(null)}
        onSubmit={handleSubmit}
      />

      <CopyToTripsModal
        open={!!copySource}
        kind={copySource?.kind ?? "CODE"}
        promoLabel={copySource?.label ?? ""}
        currentTripId={currentProductId}
        saving={saving}
        onClose={() => setCopySource(null)}
        onSubmit={handleCopy}
      />
    </div>
  );
}

// ── Drobne elementy współdzielone przez zakładki ──────────────────────────

function SectionHeader({
  title,
  count,
  addLabel,
  onAdd,
}: {
  title: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-brand-primary to-brand-yellow" />
        <h2 className="font-jakarta text-lg font-bold text-brand-secondary">
          {title}
          <span className="ml-2 text-sm font-semibold text-brand-secondary/40">
            ({count})
          </span>
        </h2>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl border border-brand-yellow/30 bg-brand-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] transition-opacity hover:opacity-90"
      >
        <Plus size={15} weight="bold" /> {addLabel}
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl rounded-tr-none border-2 border-dashed border-brand-secondary/15 px-6 py-12 text-center">
      <p className="mx-auto max-w-md text-[13px] leading-relaxed text-brand-secondary/40">
        {text}
      </p>
    </div>
  );
}

/** Tabela wykorzystania per promocja — joinowana po ID, nie po nazwie. */
function PromoStatsTable({ data }: { data: DiscountPanelPayload }) {
  const rows = [
    ...data.codes.map((row) => ({
      id: row.id,
      label: row.code,
      kind: "Kod",
      stats: row.stats,
      deleted: false,
    })),
    ...data.sales.map((row) => ({
      id: row.id,
      label: row.name,
      kind: "Przecena",
      stats: row.stats,
      deleted: false,
    })),
    ...data.emailDiscounts.map((row) => ({
      id: row.id,
      label: row.name,
      kind: "Rabat mailowy",
      stats: row.stats,
      deleted: false,
    })),
    ...data.orphans.map((row) => ({
      id: row.id,
      label: row.name,
      kind:
        row.kind === "CODE"
          ? "Kod"
          : row.kind === "SALE"
            ? "Przecena"
            : "Rabat mailowy",
      stats: { uses: row.uses, discountGrosze: row.discountGrosze },
      deleted: true,
    })),
  ]
    .filter((row) => row.stats.uses > 0)
    .sort((a, b) => b.stats.discountGrosze - a.stats.discountGrosze);

  return (
    <section className="rounded-3xl rounded-tr-none border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
      <h2 className="mb-1 font-jakarta text-lg font-bold text-brand-secondary">
        Wykorzystanie promocji
      </h2>
      <p className="mb-5 text-[12px] text-brand-secondary/50">
        Tylko opłacone rezerwacje spoza piaskownicy.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-secondary/15 py-8 text-center text-[13px] text-brand-secondary/40">
          Żadna promocja nie została jeszcze wykorzystana.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-brand-secondary/10">
                {["Promocja", "Typ", "Zakupy", "Udzielony rabat"].map((head, i) => (
                  <th
                    key={head}
                    className={`pb-2 text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 ${
                      i >= 2 ? "text-right" : ""
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-brand-secondary/5 last:border-0"
                >
                  <td className="py-2.5 text-[13px] font-semibold text-brand-secondary">
                    {row.label}
                    {row.deleted && (
                      <span className="ml-2 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                        usunięta
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-[12px] text-brand-secondary/50">
                    {row.kind}
                  </td>
                  <td className="py-2.5 text-right text-[13px] tabular-nums text-brand-secondary/70">
                    {row.stats.uses}
                  </td>
                  <td className="py-2.5 text-right text-[13px] font-bold tabular-nums text-brand-secondary">
                    {formatGrosze(row.stats.discountGrosze)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
