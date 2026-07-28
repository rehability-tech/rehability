"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  EnvelopeSimple,
  Phone,
  CurrencyCircleDollar,
  Crown,
  ArrowsClockwise,
  Sparkle,
  Tent,
  HeartStraight,
  MapPin,
  CalendarBlank,
  ForkKnife,
  Pill,
  Bandaids,
  FirstAidKit,
  Warning,
  NotePencil,
  CircleNotch,
  Copy,
  CheckCircle,
  MagicWand,
} from "@phosphor-icons/react/dist/ssr";
import type { Loyalty, ClientProfileData } from "@/lib/crm/types";
import { LOYALTY_META } from "@/lib/crm/loyalty";

interface ClientProfileProps {
  data: ClientProfileData;
}

// ── Mapowania prezentacyjne (DRY) ──────────────────────────────────────────

const LOYALTY_ICON: Record<Loyalty, React.ReactNode> = {
  VIP: <Crown size={16} weight="fill" />,
  RETURNING: <ArrowsClockwise size={16} weight="bold" />,
  NEW: <Sparkle size={16} weight="fill" />,
};

const DIET_LABELS: Record<string, string> = {
  OMNIVORE: "Wszystkożerna",
  VEGETARIAN: "Wegetariańska",
  VEGAN: "Wegańska",
  OTHER: "Inna",
};

const BOOKING_STATUS_LABELS: Record<string, { label: string; className: string }> =
  {
    FULLY_PAID: { label: "Opłacone", className: "bg-emerald-100 text-emerald-700" },
    DEPOSIT_PAID: { label: "Zadatek", className: "bg-amber-100 text-amber-700" },
    PENDING_INVITATION: {
      label: "Zaproszenie",
      className: "bg-blue-100 text-blue-700",
    },
    PENDING: { label: "Oczekuje", className: "bg-gray-100 text-gray-600" },
    EXPIRED: { label: "Wygasłe", className: "bg-rose-100 text-rose-700" },
  };

const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID: "Opłacone",
  PENDING: "Oczekuje",
};

// ── Helpery formatowania ───────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "Termin nieustalony";
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const startStr = s.toLocaleDateString("pl-PL", opts);
  if (!end) return `${startStr} ${s.getFullYear()}`;
  const e = new Date(end);
  return `${startStr} – ${e.toLocaleDateString("pl-PL", {
    ...opts,
    year: "numeric",
  })}`;
}

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Główny Client Component profilu 360°.
 * Layout dwukolumnowy: wizytówka (lewa, sticky) + historia/zdrowie/AI (prawa).
 */
export default function ClientProfile({ data }: ClientProfileProps) {
  const name = data.name || "Brak danych";
  const loyaltyMeta = LOYALTY_META[data.loyalty];

  // Agregacja "ulubionych" usług SPA — zliczamy wystąpienia po nazwie usługi.
  const favoriteServices = useMemo(() => {
    const counter = new Map<string, number>();
    for (const b of data.bookings) {
      for (const o of b.serviceOrders) {
        counter.set(o.serviceName, (counter.get(o.serviceName) ?? 0) + 1);
      }
    }
    return [...counter.entries()]
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count);
  }, [data.bookings]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* POWRÓT */}
      <Link
        href="/admin/klienci"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary/60 hover:text-brand-primary transition-colors w-fit"
      >
        <ArrowLeft size={16} weight="bold" />
        Wróć do bazy klientów
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ════════════════ LEWA KOLUMNA: WIZYTÓWKA ════════════════ */}
        <aside className="lg:col-span-1 lg:sticky lg:top-6 flex flex-col gap-6">
          <div className="relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-7 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="flex flex-col items-center text-center z-10 relative">
              <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-brand-primary to-brand-yellow text-white flex items-center justify-center font-bold text-3xl shadow-lg overflow-hidden border-4 border-white">
                {data.image ? (
                  <img
                    src={data.image}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(name)
                )}
              </div>

              <h1 className="font-jakarta font-bold text-2xl text-brand-secondary mt-4">
                {name}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border ${loyaltyMeta.className}`}
              >
                {LOYALTY_ICON[data.loyalty]}
                {loyaltyMeta.label}
              </span>
            </div>

            {/* Kontakt */}
            <div className="flex flex-col gap-2.5 mt-6 z-10 relative">
              <div className="flex items-center gap-3 p-3 bg-white/70 rounded-2xl border border-white text-sm font-medium text-brand-secondary/80">
                <EnvelopeSimple
                  size={18}
                  className="text-brand-primary shrink-0"
                />
                <span className="truncate">{data.email || "Brak e-maila"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/70 rounded-2xl border border-white text-sm font-medium text-brand-secondary/80">
                <Phone size={18} className="text-brand-primary shrink-0" />
                <span>{data.phone || "Brak telefonu"}</span>
              </div>
            </div>

            {/* LTV */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-brand-primary to-[#1f646d] text-white relative overflow-hidden z-10">
              <span className="absolute -bottom-2 -right-2 w-16 h-16 bg-brand-yellow/30 blur-[20px] rounded-full" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                Łączna wartość klienta (LTV)
              </p>
              <p className="text-3xl font-bold mt-1 tabular-nums">
                {data.totalSpent.toLocaleString("pl-PL")} zł
              </p>
              <div className="flex items-center gap-4 mt-3 text-[12px] font-medium text-white/80">
                <span className="flex items-center gap-1.5">
                  <Tent size={15} weight="fill" />
                  {data.tripsCount} wydarzeń
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkle size={15} weight="fill" />
                  {data.spaCount} zabiegów
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ════════════════ PRAWA KOLUMNA: HISTORIA + ZDROWIE + AI ════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* AI LTV BOOST — moduł zarabiania */}
          <AiLtvBoost data={data} favoriteService={favoriteServices[0]?.serviceName} />

          {/* HISTORIA WYDARZEŃ */}
          <section className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Tent size={24} weight="fill" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
                Historia wydarzeń
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[12px] font-bold">
                {data.bookings.length}
              </span>
            </div>

            {data.bookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.bookings.map((b) => {
                  const status =
                    BOOKING_STATUS_LABELS[b.status] ??
                    BOOKING_STATUS_LABELS.PENDING;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-4 p-4 bg-white/70 rounded-2xl border border-white shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-primary/10 shrink-0 flex items-center justify-center">
                        {b.trip?.heroImage ? (
                          <img
                            src={b.trip.heroImage}
                            alt={b.trip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tent
                            size={22}
                            weight="duotone"
                            className="text-brand-primary/50"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-brand-secondary text-[15px] truncate">
                          {b.trip?.title ?? "Wydarzenie usunięte"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12px] font-medium text-brand-secondary/60">
                          {b.trip?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} weight="fill" />
                              {b.trip.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CalendarBlank size={13} weight="fill" />
                            {formatDateRange(
                              b.trip?.startDate ?? null,
                              b.trip?.endDate ?? null,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-[13px] font-bold text-brand-secondary tabular-nums">
                          {b.amountPaid.toLocaleString("pl-PL")} zł
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="Brak historii wydarzeń." />
            )}
          </section>

          {/* ULUBIONE USŁUGI SPA */}
          <section className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Sparkle size={24} weight="fill" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
                Ulubione usługi SPA
              </h2>
            </div>

            {favoriteServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteServices.map((s) => (
                  <div
                    key={s.serviceName}
                    className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-white shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Sparkle size={20} weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-brand-secondary text-[14px] truncate">
                        {s.serviceName}
                      </p>
                      <p className="text-[12px] font-medium text-brand-secondary/60">
                        Zarezerwowano {s.count}×
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Klient nie korzystał jeszcze z usług SPA." />
            )}
          </section>

          {/* PROFIL ZDROWOTNY */}
          <section className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <HeartStraight size={24} weight="fill" />
              </div>
              <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
                Profil zdrowotny
              </h2>
            </div>

            {data.health ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <HealthRow
                  icon={<ForkKnife size={18} weight="duotone" />}
                  label="Dieta"
                  value={
                    DIET_LABELS[data.health.dietType] || data.health.dietType
                  }
                />
                <HealthRow
                  icon={<ForkKnife size={18} weight="duotone" />}
                  label="Nietolerancje"
                  value={
                    data.health.foodIntolerances.length
                      ? data.health.foodIntolerances.join(", ")
                      : null
                  }
                />
                <HealthRow
                  icon={<Warning size={18} weight="duotone" />}
                  label="Alergie"
                  value={data.health.allergies}
                />
                <HealthRow
                  icon={<FirstAidKit size={18} weight="duotone" />}
                  label="Choroby przewlekłe"
                  value={data.health.chronicConditions}
                />
                <HealthRow
                  icon={<Pill size={18} weight="duotone" />}
                  label="Leki"
                  value={data.health.medications}
                />
                <HealthRow
                  icon={<Bandaids size={18} weight="duotone" />}
                  label="Kontuzje / urazy"
                  value={data.health.injuries}
                />
                {data.health.foodNotes && (
                  <HealthRow
                    icon={<NotePencil size={18} weight="duotone" />}
                    label="Uwagi żywieniowe"
                    value={data.health.foodNotes}
                    fullWidth
                  />
                )}
                {(data.health.emergencyName || data.health.emergencyPhone) && (
                  <div className="sm:col-span-2 p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-500/80 uppercase tracking-wider mb-1">
                      Kontakt alarmowy
                    </p>
                    <p className="text-sm font-bold text-brand-secondary">
                      {data.health.emergencyName || "—"}
                      {data.health.emergencyPhone && (
                        <span className="font-medium text-brand-secondary/70">
                          {" "}
                          · {data.health.emergencyPhone}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState text="Klient nie wypełnił karty zdrowia." />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODUŁ AI LTV BOOST (Hiper-personalizacja)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generator spersonalizowanej oferty marketingowej.
 * Buduje kontekst klienta, woła `/api/admin/gemini` (action: "copywriting")
 * i prezentuje edytowalny wynik z opcją kopiowania.
 */
function AiLtvBoost({
  data,
  favoriteService,
}: {
  data: ClientProfileData;
  favoriteService?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  /** Składa zwięzły kontekst klienta wstrzykiwany do promptu LLM. */
  function buildContext(): string {
    const parts = [
      `Imię klienta: ${data.name || "Klient"}`,
      `Status lojalnościowy: ${LOYALTY_META[data.loyalty].label}`,
      `Łączna wartość (LTV): ${data.totalSpent.toLocaleString("pl-PL")} zł`,
      `Liczba odbytych wydarzeń: ${data.tripsCount}`,
    ];
    if (favoriteService) {
      parts.push(`Ulubiona usługa SPA: ${favoriteService}`);
    }
    if (data.health?.allergies) {
      parts.push(`Alergie (uwaga przy ofercie gastro/SPA): ${data.health.allergies}`);
    }
    if (data.health?.dietType) {
      parts.push(`Dieta: ${DIET_LABELS[data.health.dietType] ?? data.health.dietType}`);
    }
    const lastTrip = data.bookings[0]?.trip?.title;
    if (lastTrip) parts.push(`Ostatnie wydarzenie: ${lastTrip}`);
    return parts.join("\n");
  }

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    const context = buildContext();
    const prompt = `Na podstawie poniższych danych klienta napisz ultra-spersonalizowane, ciepłe i angażujące zaproszenie (w formie wiadomości e-mail/SMS) na kolejne wydarzenie holistyczne Rehability.

Wymagania:
- Zwróć się do klienta po imieniu, nawiąż do jego historii i statusu lojalnościowego.
- Zaproponuj DARMOWY dodatek powiązany z jego ulubioną usługą SPA (jeśli podana).
- Uwzględnij ewentualne alergie/dietę przy wzmiankach o jedzeniu lub zabiegach.
- Ton: osobisty, premium, bez nachalnej sprzedaży. Maksymalnie ~1200 znaków.
- Zakończ jasnym wezwaniem do działania (CTA).

--- DANE KLIENTA ---
${context}`;

    try {
      const res = await fetch("/api/admin/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copywriting", prompt, context }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Nie udało się wygenerować oferty.");
      }
      setResult(json.text ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nie udało się skopiować treści do schowka.");
    }
  }

  return (
    <section className="relative rounded-[28px] rounded-tr-none p-[1.5px] bg-gradient-to-br from-brand-primary to-brand-yellow shadow-[0_8px_30px_-12px_rgba(40,125,136,0.4)]">
      <div className="relative bg-white/80 backdrop-blur-xl rounded-[27px] rounded-tr-none p-6 sm:p-7 overflow-hidden">
        <div className="absolute -top-10 -right-8 w-40 h-40 bg-brand-yellow/20 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl rounded-tr-none bg-gradient-to-br from-brand-primary to-brand-yellow text-white flex items-center justify-center shadow-[0_4px_15px_0px_rgba(242,217,103,0.45)] shrink-0">
            <MagicWand size={24} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
              AI LTV Boost
            </h2>
            <p className="text-sm text-brand-secondary/60 font-medium mt-0.5">
              Wygeneruj hiper-spersonalizowaną ofertę powrotu, aby zwiększyć
              wartość tego klienta.
            </p>
          </div>
        </div>

        {/* Akcja */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-sm shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:bg-brand-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all relative z-10"
        >
          {isLoading ? (
            <>
              <Sparkle size={18} weight="fill" className="animate-spin" />
              Generuję ofertę...
            </>
          ) : (
            <>
              <Sparkle size={18} weight="fill" />
              Wygeneruj spersonalizowaną ofertę (AI)
            </>
          )}
        </button>

        {/* Błąd */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium relative z-10">
            <Warning size={18} weight="fill" className="shrink-0" />
            {error}
          </div>
        )}

        {/* Wynik */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 relative z-10"
          >
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={10}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm leading-relaxed text-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-primary/15 focus:border-brand-primary/30 transition-all resize-y custom-scrollbar"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-brand-secondary font-bold text-sm hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} weight="fill" />
                    Skopiowano!
                  </>
                ) : (
                  <>
                    <Copy size={18} weight="bold" />
                    Skopiuj treść
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// KOMPONENTY POMOCNICZE
// ════════════════════════════════════════════════════════════════════════════

/** Wiersz danych karty zdrowia. */
function HealthRow({
  icon,
  label,
  value,
  fullWidth = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white/60 rounded-2xl border border-white ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <div className="text-brand-primary/70 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-brand-secondary/50 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-brand-secondary break-words">
          {value || (
            <span className="text-brand-secondary/40">Brak zgłoszonych</span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Pusty stan sekcji. */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 bg-white/30 rounded-2xl border border-dashed border-gray-200">
      <p className="text-sm font-medium text-brand-secondary/60">{text}</p>
    </div>
  );
}
