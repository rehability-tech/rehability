"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  MagnifyingGlass,
  ListChecks,
  CheckCircle,
  Spinner,
  ShoppingBag,
  Sparkle,
  Storefront,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { type Course } from "@/app/(site)/kursy/_data/courses";
import { LibraryCard } from "../../_components/LibraryCard";

type StatusFilter = "all" | "inprogress" | "done";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Wszystkie" },
  { id: "inprogress", label: "W trakcie" },
  { id: "done", label: "Ukończone" },
];

export function MyCoursesClient({
  courses,
  progressByCourse,
  buyable = [],
}: {
  courses: Course[];
  progressByCourse: Record<string, number>;
  /** Kursy z katalogu, których użytkownik jeszcze nie posiada (do kupienia). */
  buyable?: Course[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("Wszystkie");

  const pct = (c: Course) => progressByCourse[c.id] ?? 0;

  // Liczniki do nagłówka i zakładek statusu.
  const doneCount = courses.filter((c) => pct(c) >= 100).length;
  const inProgressCount = courses.filter(
    (c) => pct(c) > 0 && pct(c) < 100,
  ).length;

  const categories = useMemo(
    () => ["Wszystkie", ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses],
  );

  // Sortowanie: najpierw w trakcie (wyższy postęp wyżej), potem nierozpoczęte,
  // na końcu ukończone — żeby „co dokończyć” było na górze.
  const sorted = useMemo(() => {
    const rank = (c: Course) => {
      const p = pct(c);
      if (p >= 100) return 2; // ukończone na koniec
      if (p > 0) return 0; // w trakcie najwyżej
      return 1; // nierozpoczęte w środku
    };
    return [...courses].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return pct(b) - pct(a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, progressByCourse]);

  const filtered = useMemo(
    () =>
      sorted.filter((c) => {
        const p = pct(c);
        const matchesStatus =
          status === "all"
            ? true
            : status === "done"
              ? p >= 100
              : p < 100; // „w trakcie” = wszystko nieukończone (też nierozpoczęte)
        const matchesCategory =
          category === "Wszystkie" || c.category === category;
        const matchesQuery = `${c.title} ${c.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesStatus && matchesCategory && matchesQuery;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorted, status, category, query, progressByCourse],
  );

  // „Do kupienia" — filtrowane tą samą szukajką i kategorią (status pomijamy,
  // bo dotyczy postępu w posiadanych kursach).
  const filteredBuyable = useMemo(
    () =>
      buyable.filter((c) => {
        const matchesCategory =
          category === "Wszystkie" || c.category === category;
        const matchesQuery = `${c.title} ${c.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [buyable, category, query],
  );

  // Pusta biblioteka — zachęta do katalogu.
  if (courses.length === 0) {
    return (
      <div className="w-full">
        <Header count={0} />
        <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary p-8 md:p-10 text-center shadow-[0_24px_60px_-30px_rgba(3,63,99,0.6)]">
          <div className="absolute inset-0 opacity-[0.14] pointer-events-none bg-[radial-gradient(circle_at_80%_20%,#f2d967_0%,transparent_55%)]" />
          <div className="relative flex flex-col items-center gap-4">
            <span className="flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow">
              <GraduationCap size={28} weight="fill" />
            </span>
            <div>
              <h2 className="font-jakarta font-bold text-white text-[20px]">
                Nie masz jeszcze żadnego kursu
              </h2>
              <p className="font-montserrat text-white/70 text-[14px] mt-1 max-w-md mx-auto">
                Wybierz program z katalogu, aby odblokować go tutaj i zacząć
                ćwiczyć we własnym tempie.
              </p>
            </div>
            <Link
              href="/kursy"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] hover:shadow-[0_10px_30px_0px_rgba(242,217,103,0.55)] transition-all"
            >
              <ShoppingBag size={17} weight="duotone" />
              Przeglądaj kursy
            </Link>
          </div>
        </div>

        {/* Kursy do kupienia — także gdy biblioteka jest pusta */}
        <BuyableSection courses={buyable} className="mt-10" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Header count={courses.length} />

      {/* PODSUMOWANIE — kafelki z pierścieniem postępu */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <SummaryChip
          icon={GraduationCap}
          value={courses.length}
          total={courses.length + buyable.length}
          label="Kursy"
          tint="primary"
        />
        <SummaryChip
          icon={Spinner}
          value={inProgressCount}
          total={courses.length}
          label="W trakcie"
          tint="yellow"
        />
        <SummaryChip
          icon={CheckCircle}
          value={doneCount}
          total={courses.length}
          label="Ukończone"
          tint="emerald"
        />
      </div>

      {/* PASEK FILTRÓW: status + szukajka */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-1 self-start p-1 rounded-full bg-white/60 border border-white/60 shadow-sm">
          {STATUS_TABS.map((tab) => {
            const isActive = tab.id === status;
            const tabCount =
              tab.id === "all"
                ? courses.length
                : tab.id === "done"
                  ? doneCount
                  : courses.length - doneCount;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatus(tab.id)}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-montserrat font-semibold text-[12.5px] transition-all overflow-hidden ${
                  isActive
                    ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                    : "text-brand-secondary/60 hover:text-brand-secondary"
                }`}
              >
                {isActive && (
                  <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
                )}
                <span className="relative">{tab.label}</span>
                <span
                  className={`relative text-[11px] font-bold ${
                    isActive ? "text-white/70" : "text-brand-secondary/35"
                  }`}
                >
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-[260px]">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w moich kursach…"
            className="w-full h-11 pl-10 pr-4 rounded-full bg-white/70 backdrop-blur-md border border-white/60 font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* FILTR KATEGORII — tylko gdy jest z czego wybierać */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      )}

      {/* SIATKA KURSÓW */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <LibraryCard
              key={course.id}
              course={course}
              owned
              progress={pct(course)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 rounded-2xl rounded-tr-none bg-white/50 border border-white/60 py-14">
          <Sparkle size={26} weight="fill" className="text-brand-yellow" />
          <p className="font-montserrat text-brand-secondary/60 text-[14px]">
            Brak kursów dla wybranych filtrów.
          </p>
        </div>
      )}

      {/* DO KUPIENIA — pod posiadanymi kursami */}
      <BuyableSection courses={filteredBuyable} className="mt-12" />
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
        <ListChecks size={14} weight="fill" className="text-brand-primary" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
          Twoja biblioteka
        </span>
      </div>
      <h1 className="font-jakarta font-bold text-3xl md:text-4xl text-brand-secondary tracking-tight">
        Moje kursy
        {count > 0 && (
          <span className="text-brand-secondary/30 font-semibold text-[24px] ml-2">
            {count}
          </span>
        )}
      </h1>
      <p className="text-brand-secondary/50 text-[14px] md:text-[15px] mt-2 font-montserrat max-w-lg leading-relaxed">
        Wszystkie odblokowane programy w jednym miejscu — kontynuuj naukę tam,
        gdzie ostatnio skończyłeś.
      </p>
    </div>
  );
}

// Sekcja „Powiększ swoją bibliotekę" — kursy z katalogu do kupienia.
function BuyableSection({
  courses,
  className = "",
}: {
  courses: Course[];
  className?: string;
}) {
  if (courses.length === 0) return null;
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-[3px] bg-brand-yellow/20 text-amber-600">
            <Storefront size={18} weight="fill" />
          </span>
          <div>
            <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary leading-tight">
              Powiększ swoją bibliotekę
            </h2>
            <p className="font-montserrat text-[12.5px] text-brand-secondary/50">
              Programy z katalogu, których jeszcze nie masz.
            </p>
          </div>
        </div>
        <Link
          href="/kursy"
          className="group hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary hover:gap-2.5 transition-all shrink-0"
        >
          Cały katalog
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((course) => (
          <LibraryCard key={course.id} course={course} owned={false} />
        ))}
      </div>
    </section>
  );
}

const TINTS = {
  primary: { text: "text-brand-primary", ring: "#287d88" },
  yellow: { text: "text-amber-600", ring: "#f2d967" },
  emerald: { text: "text-emerald-600", ring: "#10b981" },
} as const;

function SummaryChip({
  icon: Icon,
  value,
  total,
  label,
  tint,
}: {
  icon: React.ElementType;
  value: number;
  /** Mianownik — gdy podany, ikonę otacza pierścień postępu value/total. */
  total?: number;
  label: string;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  const pct =
    total && total > 0 ? Math.min(100, Math.round((value / total) * 100)) : null;
  return (
    <div className="relative overflow-hidden flex items-center gap-3 rounded-2xl rounded-tr-none bg-white/60 backdrop-blur-xl border border-white/50 px-3.5 sm:px-4 py-3.5 shadow-[0_14px_40px_-30px_rgba(3,63,99,0.4)]">
      {/* Słoneczna poświata w rogu (znak rozpoznawczy) */}
      <span className="pointer-events-none absolute -right-3 -bottom-4 size-16 rounded-full bg-brand-yellow/15 blur-[22px]" />

      {/* Ikona w pierścieniu postępu (lub kafelek, gdy brak total) */}
      {pct !== null ? (
        <div
          className="relative size-11 shrink-0 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(${t.ring} ${pct * 3.6}deg, rgba(3,63,99,0.08) 0deg)`,
          }}
        >
          <div
            className={`size-[34px] rounded-full bg-white grid place-items-center ${t.text}`}
          >
            <Icon size={17} weight="fill" />
          </div>
        </div>
      ) : (
        <span
          className={`relative flex items-center justify-center size-10 shrink-0 rounded-xl rounded-tr-[3px] bg-brand-primary/10 ${t.text}`}
        >
          <Icon size={18} weight="fill" />
        </span>
      )}

      <div className="relative min-w-0">
        <p className="font-jakarta font-bold text-[19px] text-brand-secondary leading-none">
          {value}
          {total !== undefined && (
            <span className="text-brand-secondary/30 text-[13px] font-semibold">
              /{total}
            </span>
          )}
        </p>
        <p className="font-montserrat text-[11.5px] text-brand-secondary/50 truncate mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}
