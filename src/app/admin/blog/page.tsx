"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  CircleNotch,
  NewspaperClipping,
  CheckCircle,
  PencilSimpleLine,
  Clock,
  ArrowRight,
  ListChecks,
  CalendarBlank,
  Bell,
  Confetti,
  ChartBar,
  MagnifyingGlass,
  FolderSimple,
  ArticleMedium,
  Star,
  TrendUp,
  Sparkle,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BlogPostData } from "./_components/BlogPostCard";

// Wpis z harmonogramu (zaplanowana publikacja).
type ScheduleEntry = {
  id: string;
  scheduledDate: string | null;
  title: string;
  topic: string;
  category: string;
  keywords: string[];
  status: string; // PLANNED | IN_PROGRESS | PUBLISHED | SKIPPED
  postId: string | null;
};

// Wspólny styl "kropli" zgodny z systemem designu (identyczny jak w wydarzeniach).
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

function shortDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

// Komplet SEO wpisu (gotowość do publikacji) — te same pola co na karcie wpisu.
function isSeoComplete(p: BlogPostData): boolean {
  return Boolean(
    p.metaTitle &&
      p.metaDescription &&
      p.focusKeyword &&
      p.coverImage &&
      p.excerpt,
  );
}

type PanelIcon = React.ComponentType<{
  size?: number;
  weight?: "duotone" | "fill" | "bold";
  className?: string;
}>;

// Miniatura okładki wpisu (coverImage) z fallbackiem na ikonę.
function PostThumb({
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
        <ArticleMedium
          size={18}
          weight="duotone"
          className="text-brand-primary/40"
        />
      )}
    </div>
  );
}

// Wspólna karta rankingu (czas czytania / kategorie) — różni się tylko
// danymi: szerokością paska i wartością po prawej.
type RankingItem = {
  key: string;
  href?: string;
  thumb: React.ReactNode;
  title: string;
  barPct: number;
  value: React.ReactNode;
};

function RankingCard({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: PanelIcon;
  items: RankingItem[];
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
          {items.map((item, i) => {
            const inner = (
              <>
                <div className="relative shrink-0">
                  {item.thumb}
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
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[11px] font-bold text-brand-secondary/50">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                      style={{ width: `${item.barPct}%` }}
                    />
                  </div>
                </div>
              </>
            );
            return item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className="group flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-white/60 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={item.key}
                className="flex items-center gap-3 py-2 px-1 rounded-xl"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type AlertTone = "amber" | "rose" | "brand";
type AlertItem = {
  key: string;
  tone: AlertTone;
  icon: PanelIcon;
  title: string;
  href: string;
};

const TONE: Record<AlertTone, string> = {
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  brand: "bg-brand-primary/10 text-brand-primary",
};

// Mini-tooltip dla wykresu publikacji.
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
        {payload[0].value}{" "}
        {plForm(payload[0].value, ["publikacja", "publikacje", "publikacji"])}
      </p>
    </div>
  ) : null;

// Kafelek statystyki (ikona + wartość + etykieta). `accent` = wyróżniony,
// morski kafel z żółtą poświatą.
function StatTile({
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
          ? "bg-brand-primary border-brand-yellow/30 shadow-[0_10px_24px_-12px_rgba(40,125,136,0.7)]"
          : "bg-white/60 border-white/70",
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
            : "bg-brand-primary/10 text-brand-primary",
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

export default function AdminBlogPanel() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/admin/blog?t=${Date.now()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Błąd pobierania");
        setPosts(await res.json());
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
        const res = await fetch(`/api/admin/blog/schedule/upcoming`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        setSchedule(await res.json());
      } catch (error) {
        if (!ctrl.signal.aborted) console.error(error);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const d = useMemo(() => {
    const published = posts.filter((p) => p.status === "PUBLISHED");
    const drafts = posts.filter((p) => p.status === "DRAFT");
    const archived = posts.filter((p) => p.status === "ARCHIVED");

    const avgRead = posts.length
      ? Math.round(
          posts.reduce((a, p) => a + (p.readTime ?? 0), 0) / posts.length,
        )
      : 0;

    // Luki SEO (brak frazy lub meta opisu) oraz szkice gotowe do publikacji.
    const seoGaps = posts.filter(
      (p) => !p.focusKeyword || !p.metaDescription,
    ).length;
    const readyDrafts = drafts.filter(isSeoComplete);

    // Nadchodzące, zaplanowane publikacje (z harmonogramu) — tylko realne plany.
    const upcoming = schedule
      .filter((e) => e.status !== "SKIPPED" && e.status !== "PUBLISHED")
      .map((e) => ({ e, days: daysFromToday(e.scheduledDate) }))
      .filter(
        (x): x is { e: ScheduleEntry; days: number } =>
          x.days != null && x.days >= 0,
      )
      .sort((a, b) => a.days - b.days);

    // Kategorie wg liczby wpisów.
    const catMap = posts.reduce((map, p) => {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
    const maxCat = Math.max(...Array.from(catMap.values()), 1);
    const rankingCats = Array.from(catMap)
      .map(([name, count]) => ({ name, count, pct: (count / maxCat) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Ranking wyświetleń (popularność). Pasek liczony względem lidera.
    const maxViews = posts.reduce((m, p) => Math.max(m, p.views ?? 0), 0);
    const rankingViews = posts
      .filter((p) => (p.views ?? 0) > 0)
      .map((p) => ({
        p,
        views: p.views ?? 0,
        pct: maxViews ? Math.round(((p.views ?? 0) / maxViews) * 100) : 0,
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
        href: "/admin/blog/lista?status=DRAFT",
      });
    }
    if (readyDrafts.length > 0) {
      alerts.push({
        key: "ready",
        tone: "brand",
        icon: Sparkle,
        title: `${readyDrafts.length} ${plForm(readyDrafts.length, ["szkic gotowy", "szkice gotowe", "szkiców gotowych"])} do publikacji (SEO komplet)`,
        href: "/admin/blog/lista?status=DRAFT",
      });
    }
    if (seoGaps > 0) {
      alerts.push({
        key: "seo",
        tone: "rose",
        icon: MagnifyingGlass,
        title: `${seoGaps} ${plForm(seoGaps, ["wpis nie ma", "wpisy nie mają", "wpisów nie ma"])} ustawionej frazy lub meta opisu`,
        href: "/admin/blog/lista",
      });
    }
    if (published.length === 0 && posts.length > 0) {
      alerts.push({
        key: "none-published",
        tone: "brand",
        icon: NewspaperClipping,
        title: "Żaden wpis nie jest jeszcze opublikowany",
        href: "/admin/blog/lista?status=DRAFT",
      });
    }

    // Najczęściej czytany opublikowany wpis (wg wyświetleń) — bohater panelu.
    // Remis rozstrzyga nowszy publishedAt.
    const mostRead =
      [...published].sort((a, b) => {
        const dv = (b.views ?? 0) - (a.views ?? 0);
        if (dv !== 0) return dv;
        const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bt - at;
      })[0] ?? null;

    return {
      published,
      mostRead,
      drafts,
      archived,
      avgRead,
      upcoming,
      rankingCats,
      rankingViews,
      alerts: alerts.slice(0, 6),
    };
  }, [posts, schedule]);

  // Wykres: publikacje wg miesięcy — ostatnie pół roku (liczone z publishedAt).
  const pub = useMemo(() => {
    const buckets = Array.from({ length: 6 }).map((_, i) => {
      const date = startOfMonth(subMonths(new Date(), 5 - i));
      const label = format(date, "MMM", { locale: pl });
      return {
        key: format(date, "yyyy-MM"),
        name: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });
    const series = buckets.map((b) => ({
      name: b.name,
      count: d.published.filter(
        (p) =>
          p.publishedAt && format(new Date(p.publishedAt), "yyyy-MM") === b.key,
      ).length,
    }));
    const total = series.reduce((a, s) => a + s.count, 0);
    const best = series.reduce<{ name: string; count: number } | null>(
      (b, s) => (!b || s.count > b.count ? s : b),
      null,
    );
    return {
      series,
      total,
      best,
      avg: total / series.length,
      activeMonths: series.filter((s) => s.count > 0).length,
      maxVal: best?.count ?? 0,
    };
  }, [d.published]);

  const kpis = [
    {
      icon: NewspaperClipping,
      label: "Wszystkie wpisy",
      value: String(posts.length),
      gradient: "from-[#287d88] to-[#1a5c66]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
      href: "/admin/blog/lista",
    },
    {
      icon: CheckCircle,
      label: "Opublikowane",
      value: String(d.published.length),
      gradient: "from-[#10b981] to-[#059669]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]",
      href: "/admin/blog/lista?status=PUBLISHED",
    },
    {
      icon: PencilSimpleLine,
      label: "Szkice",
      value: String(d.drafts.length),
      gradient: "from-[#7c3aed] to-[#5b21b6]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)]",
      href: "/admin/blog/lista?status=DRAFT",
    },
    {
      icon: CalendarBlank,
      label: "Zaplanowane",
      value: String(d.upcoming.length),
      gradient: "from-[#c9993a] to-[#a87928]",
      iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
      href: "/admin/blog/harmonogram",
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
        className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 pb-28 md:pb-8"
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
                <NewspaperClipping
                  size={14}
                  weight="fill"
                  className="text-brand-yellow"
                />
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  Centrum treści
                </span>
              </div>
              <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
                Panel bloga
              </h1>
              <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
                Twój kokpit: zaplanowane publikacje, sprawy wymagające uwagi i
                kondycja treści w jednym miejscu.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/admin/blog/lista"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 h-12 rounded-[16px] bg-white/15 backdrop-blur-md text-white font-bold text-[13.5px] border border-white/25 hover:bg-white/25 transition-all duration-300 shrink-0"
              >
                <ListChecks size={18} weight="bold" />
                Wszystkie wpisy
              </Link>
              <Link
                href="/admin/blog/dodaj/dane-podstawowe"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-white text-brand-secondary font-bold text-[13.5px] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shrink-0 border border-white/40"
              >
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2">
                  <Plus size={18} weight="bold" className="text-brand-primary" />
                  Nowy artykuł
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
        {!isLoading && posts.length === 0 && (
          <div className="rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-12 text-center flex flex-col items-center">
            <span className="flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary mb-4">
              <NewspaperClipping size={28} weight="duotone" />
            </span>
            <h2 className="font-jakarta font-bold text-[22px] text-brand-secondary">
              Brak wpisów
            </h2>
            <p className="font-montserrat text-[14px] text-brand-secondary/50 mt-1 mb-5 max-w-sm">
              Nie masz jeszcze żadnego artykułu. Dodaj pierwszy — statystyki
              pojawią się tutaj automatycznie.
            </p>
            <Link
              href="/admin/blog/dodaj/dane-podstawowe"
              className="inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)]"
            >
              <Plus size={16} weight="bold" />
              Nowy artykuł
            </Link>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
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

            {/* NAJCZĘŚCIEJ CZYTANY — wizualny bohater ze zdjęciem okładki */}
            {d.mostRead &&
              (() => {
                const p = d.mostRead;
                const views = p.views ?? 0;
                return (
                  <Link
                    href={`/admin/blog/dodaj/${p.lastStage}?id=${p.id}`}
                    className="group relative block overflow-hidden rounded-[28px] rounded-tr-none border border-white/30 shadow-[0_24px_60px_-28px_rgba(3,63,99,0.6)] min-h-[230px]"
                  >
                    {/* ZDJĘCIE / fallback */}
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary" />
                    )}
                    {/* OVERLAY brandowy + poświata */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-secondary/95 via-brand-secondary/70 to-brand-primary/20" />
                    <div className="absolute -top-10 -right-8 w-56 h-56 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />

                    <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[230px]">
                      {/* GÓRA: badge + wyświetlenia */}
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] uppercase tracking-widest text-white font-bold">
                          <Star
                            size={12}
                            weight="fill"
                            className="text-brand-yellow"
                          />
                          Najczęściej czytany
                        </span>
                        <div className="text-right shrink-0 rounded-2xl rounded-tr-none bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2">
                          <span className="font-jakarta font-bold text-white text-[28px] leading-none inline-flex items-center gap-1.5">
                            <Eye
                              size={20}
                              weight="fill"
                              className="text-brand-yellow"
                            />
                            {views.toLocaleString("pl-PL")}
                          </span>
                          <span className="block text-[10px] uppercase tracking-widest text-white/70 font-bold mt-0.5">
                            {plForm(views, [
                              "wyświetlenie",
                              "wyświetlenia",
                              "wyświetleń",
                            ])}
                          </span>
                        </div>
                      </div>

                      {/* DÓŁ: kategoria, tytuł, meta + CTA */}
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-yellow font-montserrat mb-1.5">
                          <FolderSimple size={13} weight="fill" />
                          {p.category}
                        </span>
                        <h2 className="font-jakarta font-bold text-white text-[22px] sm:text-[28px] leading-tight drop-shadow-sm line-clamp-2">
                          {p.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/75 text-[12.5px] font-montserrat mt-2">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarBlank size={14} weight="fill" />
                            {p.publishedAt
                              ? new Date(p.publishedAt).toLocaleDateString(
                                  "pl-PL",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                          {p.readTime ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={14} weight="fill" />
                              {p.readTime} min czytania
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <NewspaperClipping size={14} weight="fill" />
                            /{p.slug}
                          </span>
                        </div>

                        <div className="flex items-center mt-4">
                          <span className="ml-auto inline-flex items-center gap-2 px-4 h-10 rounded-[14px] bg-white text-brand-secondary font-bold text-[13px] shadow-lg group-hover:-translate-y-0.5 transition-transform shrink-0">
                            Otwórz wpis
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

            {/* ZAPLANOWANE + ALERTY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Zaplanowane publikacje */}
              <div className={cn(CARD, "lg:col-span-2 p-5")}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2">
                    <CalendarBlank
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                    Zaplanowane publikacje
                  </h3>
                  <Link
                    href="/admin/blog/harmonogram"
                    className="text-[12px] font-bold text-brand-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    Harmonogram <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>

                {d.upcoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-brand-secondary/40">
                    <CalendarBlank size={32} weight="duotone" className="mb-2" />
                    <p className="font-montserrat text-[13px]">
                      Brak zaplanowanych publikacji w harmonogramie.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {d.upcoming.map(({ e, days }) => {
                      const pill =
                        days <= 3
                          ? "bg-rose-100 text-rose-600"
                          : days <= 7
                            ? "bg-amber-100 text-amber-600"
                            : "bg-brand-primary/10 text-brand-primary";
                      return (
                        <Link
                          key={e.id}
                          href={`/admin/blog/harmonogram?highlight=${e.id}&date=${encodeURIComponent(e.scheduledDate ?? "")}`}
                          className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/60 transition-colors"
                        >
                          <span className="relative w-14 h-14 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                            <div className="absolute -bottom-2 -right-1 w-8 h-8 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                            <NewspaperClipping
                              size={22}
                              weight="duotone"
                              className="relative z-10 text-brand-primary"
                            />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-jakarta font-bold text-[14px] text-brand-secondary truncate">
                                {e.title}
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
                              {shortDate(e.scheduledDate)}
                              {e.category ? ` · ${e.category}` : ""}
                            </p>
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

            {/* PUBLIKACJE W CZASIE (pełna szerokość, podział na miesiące) */}
            <div className={cn(CARD, "p-5 flex flex-col")}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary inline-flex items-center gap-2">
                    <TrendUp
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                    Publikacje w czasie
                  </h3>
                  <p className="font-montserrat text-[11px] text-brand-secondary/45 mt-0.5">
                    Podział na miesiące · ostatnie pół roku
                  </p>
                </div>
                <span className="flex items-center justify-center size-9 rounded-xl rounded-tr-none bg-brand-yellow/20 text-amber-600">
                  <ChartBar size={18} weight="bold" />
                </span>
              </div>

              {/* Mini-statystyki (kafelki) */}
              {pub.total > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <StatTile
                    accent
                    icon={NewspaperClipping}
                    label="Łącznie · 6 mies."
                    value={`${pub.total}`}
                  />
                  <StatTile
                    icon={Star}
                    label="Najlepszy"
                    sub={pub.best?.name}
                    value={pub.best ? `${pub.best.count}` : "—"}
                  />
                  <StatTile
                    icon={ChartBar}
                    label="Średnio / mies."
                    value={pub.avg.toFixed(1)}
                  />
                  <StatTile
                    icon={Clock}
                    label="Śr. czas czytania"
                    value={`${d.avgRead} min`}
                  />
                </div>
              ) : null}

              {/* Wykres słupkowy wg miesięcy */}
              <div className="h-[170px] mt-4 -mx-1">
                {pub.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pub.series}
                      margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
                    >
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
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {pub.series.map((p, i) => (
                          <Cell
                            key={i}
                            fill={
                              p.count === pub.maxVal && pub.maxVal > 0
                                ? "#F2D967"
                                : "#287D88"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[12px] text-brand-secondary/40 font-montserrat">
                    Brak publikacji w tym okresie.
                  </div>
                )}
              </div>
            </div>

            {/* RANKINGI: wyświetlenia + kategorie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RankingCard
                title="Ranking wyświetleń"
                icon={Eye}
                empty="Brak danych o wyświetleniach."
                items={d.rankingViews.map(({ p, views, pct }) => ({
                  key: p.id,
                  href: `/admin/blog/dodaj/${p.lastStage}?id=${p.id}`,
                  thumb: (
                    <PostThumb
                      src={p.coverImage}
                      alt={p.title}
                      className="size-10 rounded-xl rounded-tr-none"
                    />
                  ),
                  title: p.title,
                  barPct: pct,
                  value: (
                    <>
                      {views.toLocaleString("pl-PL")}{" "}
                      <span className="text-brand-secondary/30">wyśw.</span>
                    </>
                  ),
                }))}
              />
              <RankingCard
                title="Najczęstsze kategorie"
                icon={FolderSimple}
                empty="Brak kategorii."
                items={d.rankingCats.map((c) => ({
                  key: c.name,
                  href: undefined,
                  thumb: (
                    <span className="size-10 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <FolderSimple size={18} weight="duotone" />
                    </span>
                  ),
                  title: c.name,
                  barPct: c.pct,
                  value: (
                    <>
                      {c.count}{" "}
                      <span className="text-brand-secondary/30">
                        {plForm(c.count, ["wpis", "wpisy", "wpisów"])}
                      </span>
                    </>
                  ),
                }))}
              />
            </div>

            {/* CTA do pełnej listy */}
            <Link
              href="/admin/blog/lista"
              className="group inline-flex items-center justify-center gap-2 self-start mt-1 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all"
            >
              <ListChecks size={16} weight="bold" />
              Zarządzaj wszystkimi wpisami
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
