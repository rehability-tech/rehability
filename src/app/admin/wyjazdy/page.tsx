"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  CircleNotch,
  Users,
  Ticket,
  CheckCircle,
  PencilSimpleLine,
  ArrowRight,
  ListChecks,
  Suitcase,
  CalendarBlank,
  MapPin,
  Clock,
  Wallet,
  TrendUp,
  Confetti,
  ChartBar,
  Bell,
  Star,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Trip } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type TripListItem = Trip & { _count?: { bookings: number } };
type FinPoint = { name: string; campy: number; vod: number };

// Wspólny styl "kropli" zgodny z systemem designu.
const CARD =
  "rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)]";

const MS_DAY = 86_400_000;

// Liczba dni od dzisiaj (porównanie po dacie, bez godzin).
function daysFromToday(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / MS_DAY);
}

function whenLabel(days: number): string {
  if (days <= 0) return "Dziś";
  if (days === 1) return "Jutro";
  return `za ${days} dni`;
}

// Polska odmiana rzeczownika: [1, 2-4, 5+].
function plForm(n: number, forms: [string, string, string]): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n === 1) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

const plZl = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} zł`;

function shortDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

// Lokalizacja bywa zapisana jako JSON ({city,name}) lub zwykły string.
function formatLocation(location: unknown): string | null {
  if (!location) return null;
  if (typeof location !== "string") {
    const o = location as { city?: string; name?: string };
    return o.city || o.name || null;
  }
  try {
    const p = JSON.parse(location);
    return p.city || p.name || location;
  } catch {
    return location;
  }
}

// Miniatura zdjęcia wyjazdu (heroImage) z fallbackiem na ikonę.
function TripThumb({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-brand-primary/10 flex items-center justify-center",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <Suitcase size={18} weight="duotone" className="text-brand-primary/40" />
      )}
    </div>
  );
}

type PanelIcon = React.ComponentType<{
  size?: number;
  weight?: "duotone" | "fill" | "bold";
  className?: string;
}>;

// Wspólna karta rankingu (zapełnienie / popularność) — różni się tylko
// danymi: szerokością paska i wartością po prawej.
function RankingCard({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: PanelIcon;
  items: { t: TripListItem; barPct: number; value: React.ReactNode }[];
  empty: string;
}) {
  return (
    <div className={cn(CARD, "p-5")}>
      <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2 mb-3">
        <Icon size={18} weight="duotone" className="text-brand-primary" />
        {title}
      </h3>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-8 text-brand-secondary/40">
          <Icon size={32} weight="duotone" className="mb-2" />
          <p className="font-montserrat text-[13px]">{empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map(({ t, barPct, value }, i) => (
            <Link
              key={t.id}
              href={`/admin/wyjazdy/${t.id}`}
              className="group flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-white/60 transition-colors"
            >
              <div className="relative shrink-0">
                <TripThumb
                  src={t.heroImage}
                  alt={t.title}
                  className="size-10 rounded-xl rounded-tr-none"
                />
                <span
                  className={cn(
                    "absolute -top-1.5 -left-1.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold font-jakarta shadow-sm",
                    i === 0
                      ? "bg-brand-yellow text-brand-secondary"
                      : "bg-brand-primary text-white",
                  )}
                >
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-montserrat font-semibold text-[12.5px] text-brand-secondary truncate">
                    {t.title}
                  </p>
                  <span className="shrink-0 text-[11px] font-bold text-brand-secondary/50">
                    {value}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type AlertTone = "amber" | "rose" | "brand";
type AlertItem = {
  key: string;
  tone: AlertTone;
  icon: React.ComponentType<{
    size?: number;
    weight?: "duotone" | "fill" | "bold";
    className?: string;
  }>;
  title: string;
  href: string;
};

const TONE: Record<AlertTone, string> = {
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  brand: "bg-brand-primary/10 text-brand-primary",
};

// Mini-tooltip dla wykresu przychodów.
const MiniTip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) =>
  active && payload && payload.length ? (
    <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_10px_24px_-8px_rgba(3,63,99,0.15)] rounded-xl px-3 py-2">
      <p className="font-jakarta font-bold text-[12px] text-brand-secondary">
        {label}
      </p>
      <p className="font-montserrat font-semibold text-[12px] text-brand-primary">
        {plZl(payload[0].value)}
      </p>
    </div>
  ) : null;

// Kafelek statystyki finansowej (ikona + wartość + etykieta). `accent` =
// wyróżniony, morski kafel z żółtą poświatą (np. suma).
function FinStat({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: PanelIcon;
  label: string;
  value: string;
  sub?: string | null;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl rounded-tr-none border p-3",
        accent
          ? "bg-gradient-to-br from-brand-primary to-brand-secondary border-brand-yellow/30 shadow-[0_10px_24px_-12px_rgba(40,125,136,0.7)]"
          : "bg-gradient-to-br from-white/75 to-white/40 backdrop-blur-2xl border-white/70",
      )}
    >
      {accent && (
        <div className="absolute -bottom-3 -right-2 w-12 h-12 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
      )}
      <span
        className={cn(
          "flex items-center justify-center size-7 rounded-lg rounded-tr-none mb-2",
          accent
            ? "bg-white/20 text-white"
            : "bg-gradient-to-br from-[#287d88] to-[#1a5c66] text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
        )}
      >
        <Icon size={15} weight="duotone" />
      </span>
      <p
        className={cn(
          "relative z-10 font-jakarta font-bold text-[17px] leading-none truncate",
          accent ? "text-white" : "text-brand-secondary",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "relative z-10 font-montserrat text-[10.5px] mt-1 truncate",
          accent ? "text-white/70" : "text-brand-secondary/45",
        )}
      >
        {label}
        {sub ? ` · ${sub}` : ""}
      </p>
    </div>
  );
}

export default function AdminWyjazdyPanel() {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fin, setFin] = useState<FinPoint[] | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/admin/wyjazdy?t=${Date.now()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Błąd pobierania");
        setTrips(await res.json());
      } catch (error) {
        if (!ctrl.signal.aborted) console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/admin/financials?range=six_months`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        setFin(await res.json());
      } catch (error) {
        if (!ctrl.signal.aborted) console.error(error);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const d = useMemo(() => {
    const activeTrips = trips.filter((t) => t.status === "PUBLISHED");
    const drafts = trips.filter((t) => t.status === "DRAFT");
    const archived = trips.filter((t) => t.status === "ARCHIVED");
    const bookingsTotal = trips.reduce(
      (a, t) => a + (t._count?.bookings ?? 0),
      0,
    );
    const totalCapacity = trips.reduce((a, t) => a + (t.capacity || 0), 0);
    const fillRate = totalCapacity
      ? Math.round((bookingsTotal / totalCapacity) * 100)
      : 0;

    // Nadchodzące wyjazdy: start dziś lub w przyszłości, nie archiwalne.
    const upcoming = trips
      .map((t) => ({ t, days: daysFromToday(t.startDate) }))
      .filter(
        (x): x is { t: TripListItem; days: number } =>
          x.days != null && x.days >= 0 && x.t.status !== "ARCHIVED",
      )
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);

    // Ranking zapełnienia (tylko z pojemnością).
    const rankingFill = trips
      .filter((t) => (t.capacity || 0) > 0)
      .map((t) => ({
        t,
        booked: t._count?.bookings ?? 0,
        pct: Math.min(
          100,
          Math.round(((t._count?.bookings ?? 0) / (t.capacity || 1)) * 100),
        ),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    // Ranking popularności (wyświetlenia). Pasek liczony względem lidera.
    const maxViews = trips.reduce((m, t) => Math.max(m, t.views || 0), 0);
    const rankingViews = trips
      .filter((t) => (t.views || 0) > 0)
      .map((t) => ({
        t,
        views: t.views || 0,
        pct: maxViews ? Math.round(((t.views || 0) / maxViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Alerty / wymaga uwagi.
    const alerts: AlertItem[] = [];
    if (drafts.length > 0) {
      alerts.push({
        key: "drafts",
        tone: "amber",
        icon: PencilSimpleLine,
        title: `${drafts.length} ${plForm(drafts.length, ["szkic", "szkice", "szkiców"])} do dokończenia i publikacji`,
        href: "/admin/wyjazdy/lista?status=DRAFT",
      });
    }
    for (const { t, days } of upcoming) {
      const cap = t.capacity || 0;
      const free = cap - (t._count?.bookings ?? 0);
      if (t.status === "PUBLISHED" && days <= 14 && cap > 0 && free > 0) {
        alerts.push({
          key: `soon-${t.id}`,
          tone: days <= 7 ? "rose" : "amber",
          icon: Clock,
          title: `„${t.title}” — start ${whenLabel(days).toLowerCase()}, jeszcze ${free} ${plForm(free, ["miejsce", "miejsca", "miejsc"])} wolne`,
          href: `/admin/wyjazdy/${t.id}/uczestnicy`,
        });
      }
    }
    for (const { t } of upcoming) {
      if (t.status === "PUBLISHED" && (t._count?.bookings ?? 0) === 0) {
        alerts.push({
          key: `zero-${t.id}`,
          tone: "brand",
          icon: Users,
          title: `„${t.title}” nie ma jeszcze żadnych zapisów`,
          href: `/admin/wyjazdy/${t.id}`,
        });
      }
    }

    return {
      activeTrips,
      drafts,
      archived,
      bookingsTotal,
      totalCapacity,
      fillRate,
      upcoming,
      restUpcoming: upcoming.slice(1),
      rankingFill,
      rankingViews,
      alerts: alerts.slice(0, 6),
    };
  }, [trips]);

  const revenue = useMemo(() => {
    if (!fin)
      return {
        ready: false,
        series: [] as FinPoint[],
        total: 0,
        best: null as FinPoint | null,
        avg: 0,
        activeMonths: 0,
        maxVal: 0,
      };
    const total = fin.reduce((a, p) => a + (p.campy || 0), 0);
    const best = fin.reduce<FinPoint | null>(
      (b, p) => (!b || p.campy > b.campy ? p : b),
      null,
    );
    return {
      ready: true,
      series: fin,
      total,
      best,
      avg: fin.length ? total / fin.length : 0,
      activeMonths: fin.filter((p) => (p.campy || 0) > 0).length,
      maxVal: best?.campy ?? 0,
    };
  }, [fin]);

  const kpis = [
    {
      icon: CheckCircle,
      label: "Aktywne wyjazdy",
      value: String(d.activeTrips.length),
      gradient: "from-[#287d88] to-[#1a5c66]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
      href: "/admin/wyjazdy/lista?status=PUBLISHED",
    },
    {
      icon: Users,
      label: "Zapisani uczestnicy",
      value: String(d.bookingsTotal),
      gradient: "from-[#7c3aed] to-[#5b21b6]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)]",
      href: "/admin/wyjazdy/lista",
    },
    {
      icon: Ticket,
      label: "Zapełnienie miejsc",
      value: `${d.fillRate}%`,
      gradient: "from-[#10b981] to-[#059669]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]",
      href: "/admin/wyjazdy/lista",
    },
    {
      icon: PencilSimpleLine,
      label: "Szkice",
      value: String(d.drafts.length),
      gradient: "from-[#c9993a] to-[#a87928]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
      href: "/admin/wyjazdy/lista?status=DRAFT",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* --- BRANDOWE ROZMYTE AKCENTY W TLE --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8"
      >
        {/* HERO */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
                <Suitcase size={14} weight="fill" className="text-brand-yellow" />
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  Centrum wyjazdów
                </span>
              </div>
              <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
                Panel wyjazdów
              </h1>
              <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
                Twój kokpit: nadchodzące wyjazdy, sprawy wymagające uwagi i
                kondycja finansowa w jednym miejscu.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/admin/wyjazdy/lista"
                className="group relative inline-flex items-center justify-center gap-2 px-5 h-12 rounded-[16px] bg-white/15 backdrop-blur-md text-white font-bold text-[13.5px] border border-white/25 hover:bg-white/25 transition-all duration-300 shrink-0"
              >
                <ListChecks size={18} weight="bold" />
                Wszystkie wyjazdy
              </Link>
              <Link
                href="/admin/wyjazdy/dodaj/dane-podstawowe"
                className="group relative inline-flex items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-white text-brand-secondary font-bold text-[13.5px] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shrink-0 border border-white/40"
              >
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2">
                  <Plus size={18} weight="bold" className="text-brand-primary" />
                  Dodaj wyjazd
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* ŁADOWANIE */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <CircleNotch
              size={36}
              weight="bold"
              className="text-brand-primary animate-spin mb-3"
            />
            <p className="text-[12px] font-bold uppercase tracking-widest text-brand-primary/60">
              Wczytywanie panelu...
            </p>
          </div>
        )}

        {/* PUSTY STAN */}
        {!isLoading && trips.length === 0 && (
          <div className="rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-12 text-center flex flex-col items-center">
            <span className="flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary mb-4">
              <Suitcase size={28} weight="duotone" />
            </span>
            <h2 className="font-jakarta font-bold text-[22px] text-brand-secondary">
              Brak wyjazdów
            </h2>
            <p className="font-montserrat text-[14px] text-brand-secondary/50 mt-1 mb-5 max-w-sm">
              Nie masz jeszcze żadnego wyjazdu. Dodaj pierwszy — statystyki
              pojawią się tutaj automatycznie.
            </p>
            <Link
              href="/admin/wyjazdy/dodaj/dane-podstawowe"
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)]"
            >
              <Plus size={16} weight="bold" />
              Dodaj wyjazd
            </Link>
          </div>
        )}

        {!isLoading && trips.length > 0 && (
          <>
            {/* KPI (klikalne) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => {
                const Icon = k.icon;
                return (
                  <Link
                    key={k.label}
                    href={k.href}
                    className="group relative overflow-hidden rounded-[24px] rounded-tr-none bg-gradient-to-br from-white/75 to-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-30px_rgba(3,63,99,0.4)]"
                  >
                    <div
                      className={cn(
                        "absolute -left-5 -top-5 w-24 h-24 rounded-full bg-gradient-to-br opacity-15 blur-2xl pointer-events-none",
                        k.gradient,
                      )}
                    />
                    <div className="relative flex items-start justify-between">
                      <span
                        className={cn(
                          "flex items-center justify-center size-10 rounded-2xl rounded-tr-none bg-gradient-to-br text-white mb-3",
                          k.gradient,
                          k.iconShadow,
                        )}
                      >
                        <Icon size={20} weight="duotone" />
                      </span>
                      <ArrowRight
                        size={15}
                        weight="bold"
                        className="text-brand-secondary/20 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="relative font-jakarta font-bold text-[24px] text-brand-secondary leading-none">
                      {k.value}
                    </p>
                    <p className="relative font-montserrat text-[12px] text-brand-secondary/45 mt-1">
                      {k.label}
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* NAJBLIŻSZY WYJAZD — wizualny centerpiece ze zdjęciem */}
            {d.upcoming.length > 0 &&
              (() => {
                const { t, days } = d.upcoming[0];
                const cap = t.capacity || 0;
                const booked = t._count?.bookings ?? 0;
                const pct = cap
                  ? Math.min(100, Math.round((booked / cap) * 100))
                  : 0;
                const loc = formatLocation(t.location);
                const start = new Date(t.startDate as string | Date);
                return (
                  <Link
                    href={`/admin/wyjazdy/${t.id}`}
                    className="group relative block overflow-hidden rounded-[28px] rounded-tr-none border border-white/30 shadow-[0_24px_60px_-28px_rgba(3,63,99,0.6)] min-h-[230px]"
                  >
                    {/* ZDJĘCIE / fallback */}
                    {t.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.heroImage}
                        alt={t.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary" />
                    )}
                    {/* OVERLAY brandowy + poświata */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-secondary/95 via-brand-secondary/70 to-brand-primary/20" />
                    <div className="absolute -top-10 -right-8 w-56 h-56 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />

                    <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[230px]">
                      {/* GÓRA: badge + odliczanie */}
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] uppercase tracking-widest text-white font-bold">
                          <Star
                            size={12}
                            weight="fill"
                            className="text-brand-yellow"
                          />
                          Najbliższy wyjazd
                        </span>
                        <div className="text-right shrink-0 rounded-2xl rounded-tr-none bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2">
                          {days <= 0 ? (
                            <span className="font-jakarta font-bold text-white text-[20px] leading-none">
                              Dziś!
                            </span>
                          ) : days === 1 ? (
                            <span className="font-jakarta font-bold text-white text-[20px] leading-none">
                              Jutro
                            </span>
                          ) : (
                            <>
                              <span className="font-jakarta font-bold text-white text-[28px] leading-none">
                                {days}
                              </span>
                              <span className="block text-[10px] uppercase tracking-widest text-white/70 font-bold mt-0.5">
                                dni do startu
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* DÓŁ: tytuł, meta, zapełnienie + CTA */}
                      <div>
                        <h2 className="font-jakarta font-bold text-white text-[22px] sm:text-[28px] leading-tight drop-shadow-sm line-clamp-2">
                          {t.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/75 text-[12.5px] font-montserrat mt-2">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarBlank size={14} weight="fill" />
                            {start.toLocaleDateString("pl-PL", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                          {loc && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} weight="fill" />
                              {loc}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex-1 max-w-[280px]">
                            <div className="flex items-center justify-between text-[11px] font-bold text-white/80 mb-1">
                              <span className="inline-flex items-center gap-1">
                                <Users size={12} weight="fill" /> Zapełnienie
                              </span>
                              <span>
                                {booked}/{cap || "—"} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-white"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <span className="ml-auto inline-flex items-center gap-2 px-4 h-10 rounded-[14px] bg-white text-brand-secondary font-bold text-[13px] shadow-lg group-hover:-translate-y-0.5 transition-transform shrink-0">
                            Zarządzaj
                            <ArrowRight
                              size={15}
                              weight="bold"
                              className="text-brand-primary"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}

            {/* NADCHODZĄCE + ALERTY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Nadchodzące wyjazdy */}
              <div className={cn(CARD, "lg:col-span-2 p-5")}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2">
                    <CalendarBlank
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                    Nadchodzące wyjazdy
                  </h3>
                  <Link
                    href="/admin/wyjazdy/lista"
                    className="text-[12px] font-bold text-brand-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    Wszystkie <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>

                {d.restUpcoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-brand-secondary/40">
                    <CalendarBlank size={32} weight="duotone" className="mb-2" />
                    <p className="font-montserrat text-[13px]">
                      {d.upcoming.length === 0
                        ? "Brak zaplanowanych wyjazdów w przyszłości."
                        : "To na razie jedyny zaplanowany wyjazd."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {d.restUpcoming.map(({ t, days }) => {
                      const cap = t.capacity || 0;
                      const booked = t._count?.bookings ?? 0;
                      const pct = cap
                        ? Math.min(100, Math.round((booked / cap) * 100))
                        : 0;
                      const loc = formatLocation(t.location);
                      const pill =
                        days <= 3
                          ? "bg-rose-100 text-rose-600"
                          : days <= 7
                            ? "bg-amber-100 text-amber-600"
                            : "bg-brand-primary/10 text-brand-primary";
                      return (
                        <Link
                          key={t.id}
                          href={`/admin/wyjazdy/${t.id}`}
                          className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/60 transition-colors"
                        >
                          <TripThumb
                            src={t.heroImage}
                            alt={t.title}
                            className="w-14 h-14 rounded-2xl rounded-tr-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-jakarta font-bold text-[14px] text-brand-secondary truncate">
                                {t.title}
                              </p>
                              <span
                                className={cn(
                                  "shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full",
                                  pill,
                                )}
                              >
                                {whenLabel(days)}
                              </span>
                            </div>
                            <p className="flex items-center gap-1 text-[11.5px] text-brand-secondary/45 mt-0.5 truncate">
                              <CalendarBlank size={12} weight="fill" />
                              {shortDate(t.startDate)}
                              {loc ? ` · ${loc}` : ""}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-brand-secondary/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-brand-secondary/50 shrink-0">
                                {booked}/{cap || "—"}
                              </span>
                            </div>
                          </div>
                          <ArrowRight
                            size={16}
                            weight="bold"
                            className="shrink-0 text-brand-secondary/25 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all"
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Alerty */}
              <div className={cn(CARD, "p-5 flex flex-col")}>
                <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2 mb-3">
                  <Bell size={18} weight="duotone" className="text-amber-500" />
                  Wymaga uwagi
                  {d.alerts.length > 0 && (
                    <span className="ml-auto text-[11px] font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">
                      {d.alerts.length}
                    </span>
                  )}
                </h3>

                {d.alerts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-brand-secondary/45">
                    <Confetti
                      size={32}
                      weight="duotone"
                      className="text-brand-primary mb-2"
                    />
                    <p className="font-montserrat text-[13px] font-medium">
                      Wszystko gra — nic nie wymaga teraz uwagi.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {d.alerts.map((a) => {
                      const Icon = a.icon;
                      return (
                        <Link
                          key={a.key}
                          href={a.href}
                          className="group flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/60 transition-colors"
                        >
                          <span
                            className={cn(
                              "shrink-0 size-9 rounded-xl rounded-tr-none flex items-center justify-center",
                              TONE[a.tone],
                            )}
                          >
                            <Icon size={18} weight="duotone" />
                          </span>
                          <p className="flex-1 text-[12.5px] font-medium text-brand-secondary/75 leading-snug self-center">
                            {a.title}
                          </p>
                          <ArrowRight
                            size={14}
                            weight="bold"
                            className="shrink-0 self-center text-brand-secondary/25 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all"
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PRZYCHÓD (pełna szerokość, podział na miesiące) */}
            <div className={cn(CARD, "p-5 flex flex-col")}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2">
                    <Wallet
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                    Przychód z wyjazdów
                  </h3>
                  <p className="font-montserrat text-[11px] text-brand-secondary/45 mt-0.5">
                    Podział na miesiące · ostatnie pół roku
                  </p>
                </div>
                <span className="flex items-center justify-center size-9 rounded-xl rounded-tr-none bg-brand-yellow/20 text-amber-600">
                  <TrendUp size={18} weight="bold" />
                </span>
              </div>

              {/* Mini-statystyki (kafelki) */}
              {revenue.ready && revenue.total > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <FinStat
                    accent
                    icon={Wallet}
                    label="Łącznie · 6 mies."
                    value={plZl(revenue.total)}
                  />
                  <FinStat
                    icon={Star}
                    label="Najlepszy"
                    sub={revenue.best?.name}
                    value={revenue.best ? plZl(revenue.best.campy) : "—"}
                  />
                  <FinStat
                    icon={ChartBar}
                    label="Średnio / mies."
                    value={plZl(revenue.avg)}
                  />
                  <FinStat
                    icon={CalendarBlank}
                    label="Aktywne mies."
                    value={`${revenue.activeMonths}/${revenue.series.length}`}
                  />
                </div>
              ) : (
                <p className="font-jakarta font-bold text-[28px] text-brand-secondary leading-none mt-4">
                  {revenue.ready ? plZl(revenue.total) : "…"}
                </p>
              )}

              {/* Wykres słupkowy wg miesięcy */}
              <div className="h-[185px] mt-5 -mx-1">
                {revenue.ready && revenue.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenue.series}
                      margin={{ top: 18, right: 6, left: 6, bottom: 0 }}
                      barCategoryGap="22%"
                    >
                      <defs>
                        <linearGradient id="barCamp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3a9aa6" />
                          <stop offset="100%" stopColor="#287D88" />
                        </linearGradient>
                        <linearGradient id="barBest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f8e69a" />
                          <stop offset="100%" stopColor="#F2D967" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(3,63,99,0.06)"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "rgba(3,63,99,0.4)",
                          fontSize: 11,
                          fontFamily: "Montserrat",
                          fontWeight: 600,
                        }}
                        dy={6}
                      />
                      <Tooltip
                        content={<MiniTip />}
                        cursor={{ fill: "rgba(40,125,136,0.06)" }}
                      />
                      <Bar dataKey="campy" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        <LabelList
                          dataKey="campy"
                          position="top"
                          formatter={(v) => {
                            const n = Number(v);
                            if (!n) return "";
                            return n >= 1000
                              ? `${(n / 1000).toFixed(1)}k`
                              : `${Math.round(n)}`;
                          }}
                          fill="rgba(3,63,99,0.5)"
                          fontSize={10}
                          fontFamily="Montserrat"
                          fontWeight={700}
                        />
                        {revenue.series.map((p, i) => (
                          <Cell
                            key={i}
                            fill={
                              p.campy === revenue.maxVal && revenue.maxVal > 0
                                ? "url(#barBest)"
                                : "url(#barCamp)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[12px] text-brand-secondary/40 font-montserrat">
                    {revenue.ready
                      ? "Brak płatności w tym okresie."
                      : "Wczytywanie..."}
                  </div>
                )}
              </div>
            </div>

            {/* RANKINGI: zapełnienie + popularność */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RankingCard
                title="Ranking zapełnienia"
                icon={ChartBar}
                empty="Brak wyjazdów z ustaloną liczbą miejsc."
                items={d.rankingFill.map(({ t, booked, pct }) => ({
                  t,
                  barPct: pct,
                  value: (
                    <>
                      {pct}%{" "}
                      <span className="text-brand-secondary/30">
                        ({booked}/{t.capacity})
                      </span>
                    </>
                  ),
                }))}
              />
              <RankingCard
                title="Ranking wyświetleń"
                icon={Eye}
                empty="Brak danych o wyświetleniach."
                items={d.rankingViews.map(({ t, views, pct }) => ({
                  t,
                  barPct: pct,
                  value: (
                    <>
                      {views.toLocaleString("pl-PL")}{" "}
                      <span className="text-brand-secondary/30">wyśw.</span>
                    </>
                  ),
                }))}
              />
            </div>

            {/* CTA do pełnej listy */}
            <Link
              href="/admin/wyjazdy/lista"
              className="group inline-flex items-center justify-center gap-2 self-start mt-1 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all"
            >
              <ListChecks size={16} weight="bold" />
              Zarządzaj wszystkimi wyjazdami
              <ArrowRight
                size={15}
                weight="bold"
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
