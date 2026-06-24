"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PlayCircle,
  Sparkle,
  Clock,
  MonitorPlay,
  ListChecks,
  MagnifyingGlass,
  ShoppingBag,
  GraduationCap,
  Trophy,
  Lock,
} from "@phosphor-icons/react/dist/ssr";
import { type Course } from "@/app/(site)/kursy/_data/courses";
import {
  buildGamification,
  buildAchievements,
  WEEKLY,
} from "./lib/gamification";
import { PurchaseSuccessFlow } from "./PurchaseSuccessFlow";
import { StatCard, type StatItem } from "./StatCard";
import { ContinueCard } from "./ContinueCard";
import { WeeklyGoalCard } from "./WeeklyGoalCard";
import { AchievementsCard } from "./AchievementsCard";
import { PopularThisWeek } from "./PopularThisWeek";
import { CertificatesCard } from "./CertificatesCard";
import { LibraryCard } from "./LibraryCard";
import { Locked } from "./Locked";

const OWNED_FILTER = "Twoje kursy";

export function VodClient({
  courses,
  catalog,
  locked = false,
  progressByCourse,
  lessonsDone,
}: {
  /** Kursy, do których użytkownik ma dostęp (biblioteka). */
  courses: Course[];
  /** Pełny katalog (wszystkie opublikowane kursy) — do sekcji „do kupienia". */
  catalog: Course[];
  locked?: boolean;
  progressByCourse: Record<string, number>;
  lessonsDone: number;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  // Deep-link z menu: /panel/vod?widok=moje → od razu filtr „Twoje kursy".
  const [category, setCategory] = useState(() =>
    courses.length && searchParams.get("widok") === "moje"
      ? OWNED_FILTER
      : "Wszystkie",
  );

  const ownedIds = useMemo(
    () => new Set(courses.map((c) => c.id)),
    [courses],
  );

  // Kursy posiadane: najpierw nieukończone (sort wg postępu malejąco),
  // potem ukończone na końcu.
  const ownedSorted = useMemo(
    () =>
      [...courses].sort((a, b) => {
        const pa = progressByCourse[a.id] ?? 0;
        const pb = progressByCourse[b.id] ?? 0;
        const aDone = pa >= 100 ? 1 : 0;
        const bDone = pb >= 100 ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone; // nieukończone wyżej
        return pb - pa; // w grupie: wyższy postęp wyżej
      }),
    [courses, progressByCourse],
  );

  // Kursy do kupienia = katalog bez tych już posiadanych.
  const buyable = useMemo(
    () => catalog.filter((c) => !ownedIds.has(c.id)),
    [catalog, ownedIds],
  );

  // Lista biblioteki: posiadane (nieukończone → ukończone), potem do kupienia.
  const libraryItems = useMemo(
    () => [...ownedSorted, ...buyable],
    [ownedSorted, buyable],
  );

  const certificatesCount = courses.filter(
    (c) => (progressByCourse[c.id] ?? 0) >= 100,
  ).length;
  const g = useMemo(
    () => buildGamification(lessonsDone, certificatesCount),
    [lessonsDone, certificatesCount],
  );

  // „Kontynuuj" = pierwszy nieukończony kurs posiadany; w trybie locked
  // pokazujemy pierwszy z katalogu jako teaser pod nakładką.
  const continueCourse =
    ownedSorted.find((c) => (progressByCourse[c.id] ?? 0) < 100) ??
    ownedSorted[0] ??
    (locked ? catalog[0] : undefined);

  // Popularne — ranking z całego katalogu.
  const popular = useMemo(
    () => [...catalog].sort((a, b) => b.reviews - a.reviews).slice(0, 5),
    [catalog],
  );
  const certified =
    courses.find((c) => (progressByCourse[c.id] ?? 0) >= 100) ?? null;

  const categories = useMemo(
    () => [
      "Wszystkie",
      ...(courses.length ? [OWNED_FILTER] : []),
      ...Array.from(new Set(catalog.map((c) => c.category))),
    ],
    [catalog, courses.length],
  );

  // Średni postęp w posiadanej bibliotece (0 gdy brak kursów).
  const avgProgress = courses.length
    ? Math.round(
        courses.reduce((s, c) => s + (progressByCourse[c.id] ?? 0), 0) /
          courses.length,
      )
    : 0;

  const achievements = useMemo(
    () => buildAchievements(g.lessonsDone, certificatesCount, courses.length),
    [g.lessonsDone, certificatesCount, courses.length],
  );

  // Liczniki: wyłącznie realne dane. Pierścień (pct) = 0, gdy brak danych —
  // żadnych sztucznie wypełnionych wartości.
  const statItems: StatItem[] = useMemo(() => {
    const hours = Math.round(
      courses.reduce((s, c) => s + c.durationMin, 0) / 60,
    );
    const xpPct = g.xpToNext ? Math.round((g.xp / g.xpToNext) * 100) : 0;
    return [
      {
        icon: GraduationCap,
        value: courses.length,
        label: "Twoje kursy",
        tint: "primary",
        pct: courses.length ? 100 : 0,
      },
      {
        icon: PlayCircle,
        value: g.lessonsDone,
        label: "Ukończone lekcje",
        tint: "emerald",
        pct: avgProgress,
      },
      {
        icon: Clock,
        value: `${hours} h`,
        label: "Materiału wideo",
        tint: "violet",
        pct: hours ? 100 : 0,
      },
      {
        icon: Trophy,
        value: certificatesCount,
        label: "Ukończone kursy",
        tint: "rose",
        pct: courses.length
          ? Math.round((certificatesCount / courses.length) * 100)
          : 0,
      },
      {
        icon: Sparkle,
        value: g.points,
        label: "Punkty XP",
        tint: "yellow",
        pct: xpPct,
      },
    ];
  }, [courses, g, avgProgress, certificatesCount]);

  const filtered = useMemo(
    () =>
      libraryItems.filter((c) => {
        const matchesCat =
          category === "Wszystkie"
            ? true
            : category === OWNED_FILTER
              ? ownedIds.has(c.id)
              : c.category === category;
        const matchesQuery = `${c.title} ${c.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesCat && matchesQuery;
      }),
    [query, category, libraryItems, ownedIds],
  );

  return (
    <div className="w-full">
      <PurchaseSuccessFlow />

      {/* NAGŁÓWEK */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
          <MonitorPlay size={14} weight="fill" className="text-brand-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
            Platforma VOD
          </span>
        </div>
        <h1 className="font-jakarta font-bold text-3xl md:text-4xl text-brand-secondary tracking-tight">
          Twoja biblioteka treningów
        </h1>
        <p className="text-brand-secondary/50 text-[14px] md:text-[15px] mt-2 font-montserrat max-w-lg leading-relaxed">
          Ucz się, zdobywaj punkty i odznaki. Wszystkie odblokowane programy w
          jednym miejscu — na telefonie, tablecie i komputerze.
        </p>
      </div>

      {/* Baner — brak dostępu (sekcje nauki pod nakładką, biblioteka otwarta) */}
      {locked && (
        <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary p-5 md:p-6 mb-8 shadow-[0_24px_60px_-30px_rgba(3,63,99,0.6)]">
          <div className="absolute inset-0 opacity-[0.14] pointer-events-none bg-[radial-gradient(circle_at_85%_15%,#f2d967_0%,transparent_50%)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-11 shrink-0 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow">
                <Lock size={22} weight="fill" />
              </span>
              <div>
                <h2 className="font-jakarta font-bold text-white text-[18px] leading-tight">
                  Odblokuj platformę VOD
                </h2>
                <p className="font-montserrat text-white/70 text-[13px] mt-0.5 max-w-md">
                  Nie masz jeszcze żadnego kursu. Wybierz program z katalogu
                  poniżej, aby odblokować bibliotekę i oglądanie.
                </p>
              </div>
            </div>
            <Link
              href="/kursy"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] hover:shadow-[0_10px_30px_0px_rgba(242,217,103,0.55)] transition-all"
            >
              <ShoppingBag size={17} weight="duotone" />
              Przeglądaj kursy
            </Link>
          </div>
        </div>
      )}

      {/* STATYSTYKI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
        {statItems.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      {/* KONTYNUUJ + CEL */}
      {continueCourse && (
        <Locked active={locked}>
          <div className="grid lg:grid-cols-[1fr_320px] gap-5 mb-8">
            <div className="flex flex-col gap-3">
              <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary px-1">
                Kontynuuj naukę
              </h2>
              <ContinueCard
                course={continueCourse}
                progress={progressByCourse[continueCourse.id] ?? 0}
              />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary px-1">
                Aktywność
              </h2>
              <WeeklyGoalCard done={g.lessonsDone} goal={WEEKLY.goal} />
            </div>
          </div>
        </Locked>
      )}

      {/* OSIĄGNIĘCIA + POPULARNE */}
      <div className="grid lg:grid-cols-2 gap-5 mb-8 items-stretch">
        <div className="flex flex-col gap-3 h-full">
          <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary px-1">
            Postępy i nagrody
          </h2>
          <div className="flex flex-col gap-5 flex-1 justify-between">
            <AchievementsCard g={g} achievements={achievements} />
            <CertificatesCard certified={certified} count={g.certificates} />
          </div>
        </div>
        <div className="flex flex-col gap-3 h-full">
          <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary px-1">
            Na czasie
          </h2>
          <PopularThisWeek items={popular} />
        </div>
      </div>

      {/* BIBLIOTEKA + KATALOG */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary inline-flex items-center gap-2">
            <ListChecks size={20} weight="duotone" className="text-brand-primary" />
            {locked ? "Dostępne kursy" : "Twoje kursy"}
            <span className="text-brand-secondary/40 font-semibold text-[14px]">
              ({locked ? buyable.length : courses.length})
            </span>
          </h2>
          <div className="relative w-full sm:w-[260px]">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj w kursach…"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white/70 backdrop-blur-md border border-white/60 font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filtr kategorii */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isActive = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`relative shrink-0 px-4 py-1.5 rounded-full font-montserrat font-semibold text-[12.5px] border transition-all overflow-hidden ${
                  isActive
                    ? "bg-brand-primary text-white border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                    : "bg-white/60 text-brand-secondary/60 border-white/60 hover:text-brand-secondary"
                }`}
              >
                {isActive && (
                  <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
                )}
                <span className="relative">{cat}</span>
              </button>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((course) => {
              const owned = ownedIds.has(course.id);
              return (
                <LibraryCard
                  key={course.id}
                  course={course}
                  owned={owned}
                  progress={owned ? (progressByCourse[course.id] ?? 0) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 font-montserrat text-brand-secondary/50">
            Brak kursów pasujących do wybranych filtrów.
          </div>
        )}
      </div>
    </div>
  );
}
