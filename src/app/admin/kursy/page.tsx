import Link from "next/link";
import Image from "next/image";
import {
  MonitorPlay,
  Star,
  Clock,
  Users,
  Coins,
  ChartLineUp,
  Sparkle,
  WarningCircle,
  ArrowRight,
  ArrowUpRight,
  Trophy,
  MagicWand,
  ClosedCaptioning,
  Exam,
  Brain,
  PlayCircle,
  CaretRight,
  LockSimple,
} from "@phosphor-icons/react/dist/ssr";
import { getCourses, getCourseAdminStats } from "@/lib/courses-db";
import type { Course } from "@/app/(site)/kursy/_data/courses";
import { formatCourseDuration } from "@/app/(site)/kursy/_data/courses";

export const metadata = {
  title: "Kursy VOD – Admin",
};

export const revalidate = 60;

const plnFmt = new Intl.NumberFormat("pl-PL");

// Karencja: ile dni od publikacji (proxy: createdAt) musi minąć, zanim niska
// liczba kursantów zacznie być traktowana jako alert. Świeży kurs ma naturalnie
// 0–1 kursantów, więc nie zgłaszamy go od razu.
const ATTENTION_GRACE_DAYS = 14;
const LOW_ENROLLMENT_THRESHOLD = 5;
const LOW_RATING_THRESHOLD = 4.7;

/** Czy minął okres karencji od publikacji kursu. Bierzemy realną datę
 *  publikacji (`publishedAt`); dla starszych kursów sprzed wprowadzenia pola
 *  spadamy na `createdAt`. */
function isPastGrace(c: Course): boolean {
  const dateStr = c.publishedAt ?? c.createdAt;
  if (!dateStr) return false;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  return ageMs >= ATTENTION_GRACE_DAYS * 24 * 60 * 60 * 1000;
}
/** Mało kursantów — alert dopiero po karencji od publikacji. */
function isLowEnrollment(c: Course, enrolled: number): boolean {
  return isPastGrace(c) && enrolled < LOW_ENROLLMENT_THRESHOLD;
}
/** Niska ocena (tylko gdy są realne opinie) — alert niezależnie od wieku. */
function isLowRating(c: Course): boolean {
  return c.reviews > 0 && c.rating < LOW_RATING_THRESHOLD;
}

/** Poprawna polska odmiana: 1 kursant, 2–4 kursanci, reszta kursantów. */
function studentsLabel(n: number): string {
  if (n === 1) return "1 kursant";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return `${n} kursanci`;
  return `${n} kursantów`;
}

// Metryki bento liczone z realnych kursów + zapisów (Enrollment).
function buildStats(
  courses: Course[],
  enrollmentsByCourse: Record<string, number>,
) {
  const coursesCount = courses.length;
  // Łączny czas materiału w MINUTACH (bez zaokrąglania do pełnych godzin — to
  // gubiło minuty, np. 90 min pokazywało się jako „2 h", a 40 min jako „0 h").
  const minutesTotal = courses.reduce((s, c) => s + (c.durationMin || 0), 0);
  // Średnia liczona tylko z kursów, które mają realne opinie (reviews > 0).
  const ratedCourses = courses.filter((c) => c.reviews > 0);
  const avgRating = ratedCourses.length
    ? ratedCourses.reduce((s, c) => s + c.rating, 0) / ratedCourses.length
    : 0;

  const enr = (c: Course) => enrollmentsByCourse[c.id] ?? 0;

  const topByStudents = [...courses].sort((a, b) => enr(b) - enr(a));
  const best = topByStudents[0];

  // Wymaga uwagi:
  // • mała liczba kursantów — ale DOPIERO po okresie karencji od publikacji
  //   (świeży kurs naturalnie ma 0–1 kursantów, więc nie alarmujemy od razu),
  // • lub niższa ocena (tylko gdy są już realne opinie) — niezależnie od wieku.
  const needsAttention = courses
    .filter((c) => isLowEnrollment(c, enr(c)) || isLowRating(c))
    .sort((a, b) => enr(a) - enr(b))
    .slice(0, 3);

  const catMap = new Map<string, number>();
  for (const c of courses) {
    catMap.set(c.category, (catMap.get(c.category) ?? 0) + 1);
  }
  const categories = Array.from(catMap, ([name, count]) => ({
    name,
    count,
  })).sort((a, b) => b.count - a.count);
  const maxCatCount = Math.max(...categories.map((c) => c.count), 1);

  return {
    coursesCount,
    minutesTotal,
    avgRating,
    topByStudents,
    best,
    needsAttention,
    categories,
    maxCatCount,
    enr,
  };
}

function Sparkline({ data }: { data: number[] }) {
  const w = 100;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-12"
    >
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#287d88" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#287d88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkfill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#287d88"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Wykres słupkowy przychodu z widocznymi etykietami miesięcy (pełna szerokość).
function RevenueBars({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 sm:gap-4 h-44">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div
            key={d.name}
            className="group/bar flex-1 flex flex-col items-center justify-end gap-2 h-full"
          >
            <span className="font-jakarta font-bold text-[11px] sm:text-[12px] text-brand-secondary/70 tabular-nums">
              {d.value > 0 ? `${plnFmt.format(d.value)} zł` : "—"}
            </span>
            <div className="relative w-full flex-1 flex items-end justify-center">
              <div
                className="w-full max-w-[52px] rounded-t-xl rounded-tr-[3px] bg-gradient-to-t from-brand-primary to-brand-primary/55 shadow-[0_6px_16px_-8px_rgba(40,125,136,0.6)] transition-all duration-300 group-hover/bar:from-brand-primary group-hover/bar:to-brand-yellow"
                style={{ height: `${Math.max(pct, d.value > 0 ? 6 : 2)}%` }}
              />
            </div>
            <span className="font-montserrat text-[12px] font-medium text-brand-secondary/55">
              {d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Proponowane funkcje AI ---
const AI_FEATURES = [
  {
    icon: MagicWand,
    title: "Generator kursu z briefu",
    desc: "Tytuł, opis, kategoria i pełny program z jednego zdania.",
    href: "/admin/kursy/dodaj",
    status: "ready" as const,
  },
  {
    icon: ClosedCaptioning,
    title: "Transkrypcje i napisy",
    desc: "Auto-napisy i rozdziały do wideo z każdej lekcji.",
    status: "soon" as const,
  },
  {
    icon: Exam,
    title: "Generator quizów",
    desc: "Pytania sprawdzające wiedzę na podstawie treści lekcji.",
    status: "soon" as const,
  },
  {
    icon: Brain,
    title: "Rekomendacje dla kursantek",
    desc: "Podpowiada następny kurs na bazie postępów i kategorii.",
    status: "soon" as const,
  },
];

function Tile({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  /** Opóźnienie wejścia (ms) do efektu kaskadowego. */
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`relative overflow-hidden rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] animate-in fade-in slide-in-from-bottom-3 [animation-fill-mode:both] duration-500 ${className}`}
    >
      {children}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  gradient,
  iconShadow,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  gradient: string;
  iconShadow: string;
  delay?: number;
}) {
  return (
    <Tile
      className="group p-4 hover:-translate-y-0.5 transition-transform duration-300"
      delay={delay}
    >
      <div
        className={`absolute -left-5 -top-5 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-15 blur-2xl pointer-events-none`}
      />
      <div className="relative flex items-center justify-between mb-3">
        <span
          className={`flex items-center justify-center size-10 rounded-2xl rounded-tr-none bg-gradient-to-br text-white transition-transform duration-300 group-hover:scale-110 ${gradient} ${iconShadow}`}
        >
          <Icon size={20} weight="duotone" />
        </span>
      </div>
      <p className="relative font-jakarta font-bold text-[24px] text-brand-secondary leading-none">
        {value}
      </p>
      <p className="relative font-montserrat text-[12px] text-brand-secondary/45 mt-1">
        {label}
      </p>
    </Tile>
  );
}

// Nakładka na bloki z danymi poglądowymi (mock) w pustym stanie:
// rozmycie "za szkłem" + komunikat, że realne dane pojawią się po dodaniu kursów.
function MockOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center gap-2.5 px-5 bg-white/45">
      <span className="flex items-center justify-center size-10 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary border border-brand-primary/10 shadow-[0_4px_14px_-4px_rgba(40,125,136,0.35)]">
        <LockSimple size={20} weight="duotone" />
      </span>
      <p className="font-montserrat text-[12px] font-semibold text-brand-secondary/80 max-w-[190px] leading-snug">
        Dane pojawią się po dodaniu kursów
      </p>
    </div>
  );
}

// Blok narzędzi AI — statyczny (niezależny od danych kursów), więc renderujemy
// go tak samo w pełnym dashboardzie i w pustym stanie.
function AiStudio({ delay = 0 }: { delay?: number }) {
  return (
    <Tile
      delay={delay}
      className="p-6 bg-gradient-to-br from-[#0B3B4C] via-brand-primary to-[#0B3B4C] text-white border-0"
    >
      <div className="absolute inset-0 opacity-[0.14] pointer-events-none bg-[radial-gradient(circle_at_88%_12%,#f2d967_0%,transparent_55%)]" />
      <div className="relative flex items-center justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-1.5">
            <Sparkle size={13} weight="fill" />
            AI Studio
          </span>
          <h3 className="font-jakarta font-bold text-[20px] leading-tight">
            Narzędzia AI dla Twojej platformy
          </h3>
        </div>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {AI_FEATURES.map((f) => {
          const Icon = f.icon;
          const inner = (
            <div
              className={`relative overflow-hidden h-full flex flex-col rounded-2xl rounded-tr-none bg-white/10 backdrop-blur-md border border-white/15 p-4 transition-colors ${
                f.status === "ready" ? "hover:bg-white/15" : "opacity-50"
              }`}
            >
              {/* Żółta poświata w prawym dolnym rogu (znak rozpoznawczy) */}
              <span className="pointer-events-none absolute -right-3 -bottom-3 size-16 rounded-full bg-brand-yellow/50 blur-[18px]" />
              <div className="relative flex items-center justify-between mb-3">
                <span className="flex items-center justify-center size-10 rounded-xl rounded-tr-none bg-white/15 text-white">
                  <Icon size={22} weight="fill" />
                </span>
                {f.status === "ready" ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-400/15 rounded-full px-2 py-0.5">
                    Gotowe
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 bg-white/10 rounded-full px-2 py-0.5">
                    Wkrótce
                  </span>
                )}
              </div>
              <p className="relative font-jakarta font-bold text-[14px] leading-snug">
                {f.title}
              </p>
              <p className="relative font-montserrat text-[12px] text-white/65 leading-snug mt-1 flex-1">
                {f.desc}
              </p>
              {f.status === "ready" && (
                <span className="relative inline-flex items-center gap-1 text-[12px] font-bold text-brand-yellow mt-3">
                  Otwórz
                  <ArrowUpRight size={13} weight="bold" />
                </span>
              )}
            </div>
          );
          return f.href ? (
            <Link key={f.title} href={f.href} className="block h-full">
              {inner}
            </Link>
          ) : (
            <div key={f.title}>{inner}</div>
          );
        })}
      </div>
    </Tile>
  );
}

export default async function AdminKursyPage() {
  // Bez `includeSandbox` — kursy testowe świadomie NIE wchodzą do statystyk
  // biznesowych (przychód, liczba kursantów, oceny). Pełną listę wraz
  // z sandboxem widać na /admin/kursy/lista i /admin/sandbox.
  const [courses, salesStats] = await Promise.all([
    getCourses(),
    getCourseAdminStats(),
  ]);
  const { enrollmentsByCourse, studentsTotal, revenueTotal, revenueSeries } =
    salesStats;
  const {
    coursesCount,
    minutesTotal,
    avgRating,
    topByStudents,
    best,
    needsAttention,
    categories,
    maxCatCount,
    enr,
  } = buildStats(courses, enrollmentsByCourse);

  const revenue6m = revenueSeries.reduce((a, b) => a + b.value, 0);
  const avgOrder = studentsTotal ? Math.round(revenueTotal / studentsTotal) : 0;
  const avgPerCourse = coursesCount
    ? Math.round(studentsTotal / coursesCount)
    : 0;

  // Pusty stan — brak kursów w bazie. Pokazujemy szkielet dashboardu
  // (wygaszone placeholdery) + jasny komunikat "nic tu jeszcze nie ma".
  if (coursesCount === 0) {
    const kpiPlaceholders = [
      { icon: MonitorPlay, label: "Aktywne kursy", tint: "bg-brand-primary/10 text-brand-primary" },
      { icon: Users, label: "Kursanci łącznie", tint: "bg-violet-100 text-violet-600" },
      { icon: Coins, label: "Przychód VOD", tint: "bg-emerald-100 text-emerald-600" },
      { icon: Star, label: "Średnia ocena", tint: "bg-brand-yellow/20 text-amber-600" },
    ];
    // Dane poglądowe (mock) pokazywane pod nakładką z rozmyciem.
    const mockRevenue = [820, 1180, 980, 1640, 1980, 2480];
    const mockCategories = [
      { name: "Kręgosłup", count: 4 },
      { name: "Mobilność", count: 3 },
      { name: "Twarz / Kobido", count: 2 },
      { name: "Regeneracja", count: 2 },
    ];
    const mockMaxCat = Math.max(...mockCategories.map((c) => c.count));
    const mockTop = [
      { title: "Zdrowy i silny kręgosłup", students: 128 },
      { title: "Mobilność na co dzień", students: 96 },
      { title: "Naturalny lifting twarzy", students: 74 },
      { title: "Wieczorny reset", students: 51 },
    ];
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        {/* Nagłówek */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
            <MonitorPlay size={14} weight="fill" className="text-brand-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
              Platforma VOD
            </span>
          </div>
          <h1 className="font-jakarta font-bold text-[24px] md:text-[28px] text-brand-secondary">
            Przegląd kursów
          </h1>
          <p className="font-montserrat text-[14px] text-brand-secondary/50 mt-1">
            Tu pojawią się statystyki i wyniki Twoich kursów VOD.
          </p>
        </div>

        {/* KPI — placeholdery */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {kpiPlaceholders.map(({ icon: Icon, label, tint }) => (
            <div
              key={label}
              className="rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-4"
            >
              <span
                className={`flex items-center justify-center size-10 rounded-2xl rounded-tr-none mb-3 ${tint}`}
              >
                <Icon size={20} weight="duotone" />
              </span>
              <p className="font-jakarta font-bold text-[24px] text-brand-secondary/20 leading-none">
                —
              </p>
              <p className="font-montserrat text-[12px] text-brand-secondary/35 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* BENTO GŁÓWNE — placeholdery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Hero: komunikat "nic tu jeszcze nie ma" w miejscu najlepszego kursu */}
          <div className="relative overflow-hidden rounded-[24px] rounded-tr-none bg-gradient-to-br from-brand-primary/[0.06] via-white/60 to-brand-yellow/[0.06] border border-dashed border-brand-primary/20 lg:col-span-2 lg:row-span-2 min-h-[300px] flex flex-col items-center justify-center text-center p-12">
            <span className="pointer-events-none absolute -right-6 -bottom-6 size-32 rounded-full bg-brand-yellow/20 blur-[40px]" />
            <span className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-brand-primary/10 blur-[44px]" />
            <span className="relative flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] border border-brand-yellow/30 mb-4">
              <MonitorPlay size={28} weight="duotone" />
            </span>
            <h2 className="relative font-jakarta font-bold text-[22px] text-brand-secondary">
              Nic tu jeszcze nie ma
            </h2>
            <p className="relative font-montserrat text-[14px] text-brand-secondary/50 mt-1 mb-5 max-w-sm">
              Nie masz jeszcze żadnego kursu VOD. Utwórz pierwszy w kreatorze —
              statystyki, wykresy i listy pojawią się tutaj automatycznie.
            </p>
            <Link
              href="/admin/kursy/dodaj"
              className="group relative inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
              <span className="relative inline-flex items-center gap-2">
                <Sparkle size={16} weight="fill" />
                Utwórz pierwszy kurs
              </span>
            </Link>
          </div>

          {/* Przychód 6 mies — dane poglądowe pod nakładką */}
          <div className="relative overflow-hidden rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-5">
            <div className="blur-[2.5px] pointer-events-none select-none" aria-hidden>
              <span className="font-montserrat font-semibold text-[13px] text-brand-secondary/50 inline-flex items-center gap-1.5 mb-1">
                <ChartLineUp size={16} weight="duotone" className="text-brand-primary" />
                Przychód VOD · 6 mies.
              </span>
              <p className="font-jakarta font-bold text-[24px] text-brand-secondary leading-none">
                {plnFmt.format(mockRevenue.reduce((a, b) => a + b, 0))} zł
              </p>
              <div className="mt-2">
                <Sparkline data={mockRevenue} />
              </div>
            </div>
            <MockOverlay />
          </div>

          {/* Kategorie — dane poglądowe pod nakładką */}
          <div className="relative overflow-hidden rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-5">
            <div className="blur-[2.5px] pointer-events-none select-none" aria-hidden>
            <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary mb-3">
              Kursy wg kategorii
            </h3>
            <div className="flex flex-col gap-2.5">
              {mockCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-[12px] font-montserrat mb-1">
                    <span className="text-brand-secondary/70 font-medium truncate">
                      {cat.name}
                    </span>
                    <span className="text-brand-secondary/40 shrink-0 ml-2">
                      {cat.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                      style={{ width: `${(cat.count / mockMaxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            </div>
            <MockOverlay />
          </div>
        </div>

        {/* BENTO DRUGI RZĄD — placeholdery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Najczęściej kupowane — dane poglądowe pod nakładką */}
          <div className="relative overflow-hidden rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-5">
            <div className="blur-[2.5px] pointer-events-none select-none" aria-hidden>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary">
                Najczęściej kupowane
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/25">
                Top 4
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {mockTop.map((c, i) => (
                <div key={c.title} className="flex items-center gap-3 rounded-xl p-2">
                  <span
                    className={`flex items-center justify-center size-6 shrink-0 rounded-full font-jakarta font-bold text-[12px] ${
                      i === 0
                        ? "bg-brand-yellow/30 text-amber-600"
                        : "bg-brand-primary/10 text-brand-primary/70"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="size-9 shrink-0 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-yellow/20" />
                  <span className="flex-1 min-w-0 font-montserrat font-semibold text-[12.5px] text-brand-secondary line-clamp-1">
                    {c.title}
                  </span>
                  <span className="shrink-0 font-montserrat text-[12px] font-bold text-brand-primary">
                    {c.students}
                  </span>
                </div>
              ))}
            </div>
            </div>
            <MockOverlay />
          </div>

          {/* Wymaga uwagi — placeholder */}
          <div className="rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-5">
            <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary/80 inline-flex items-center gap-2 mb-4">
              <WarningCircle size={16} weight="fill" className="text-amber-500" />
              Wymaga uwagi
            </h3>
            <p className="font-montserrat text-[13px] text-amber-700/70 bg-amber-50/70 border border-amber-100 rounded-xl rounded-tr-none px-3 py-2.5 text-center">
              Brak alertów — pojawią się, gdy dodasz kursy.
            </p>
          </div>

          {/* W pigułce — placeholder */}
          <div className="rounded-[24px] rounded-tr-none bg-white/60 border border-dashed border-brand-secondary/15 p-5 flex flex-col">
            <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary/80 mb-4">
              W pigułce
            </h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[
                { icon: Clock, label: "Materiału wideo", tint: "text-brand-primary", bg: "bg-brand-primary/[0.05] border-brand-primary/10" },
                { icon: PlayCircle, label: "Kategorie", tint: "text-brand-primary", bg: "bg-brand-primary/[0.05] border-brand-primary/10" },
                { icon: Coins, label: "Śr. wartość", tint: "text-emerald-600", bg: "bg-emerald-500/[0.06] border-emerald-500/10" },
                { icon: Users, label: "Śr. na kurs", tint: "text-violet-600", bg: "bg-violet-500/[0.06] border-violet-500/10" },
              ].map(({ icon: Icon, label, tint, bg }) => (
                <div
                  key={label}
                  className={`rounded-xl rounded-tr-none border p-3 ${bg}`}
                >
                  <Icon size={18} weight="duotone" className={`${tint} mb-1.5`} />
                  <p className="font-jakarta font-bold text-[18px] text-brand-secondary/25 leading-none">
                    —
                  </p>
                  <p className="font-montserrat text-[11px] text-brand-secondary/40 mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI STUDIO — realny, niezależny od danych */}
        <AiStudio />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Nagłówek */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
            <MonitorPlay size={14} weight="fill" className="text-brand-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
              Platforma VOD
            </span>
          </div>
          <h1 className="font-jakarta font-bold text-[24px] md:text-[28px] text-brand-secondary">
            Przegląd kursów
          </h1>
          <p className="font-montserrat text-[14px] text-brand-secondary/50 mt-1">
            Statystyki, wyniki i narzędzia AI Twojej platformy treningowej.
          </p>
        </div>
        <Link
          href="/admin/kursy/dodaj"
          className="group relative inline-flex items-center gap-2 self-start bg-brand-primary text-white font-montserrat font-bold text-[14px] px-5 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
        >
          <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
          <span className="relative inline-flex items-center gap-2">
            <Sparkle size={16} weight="fill" />
            Nowy kurs z AI
          </span>
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi
          icon={MonitorPlay}
          label="Aktywne kursy"
          value={String(coursesCount)}
          gradient="from-[#287d88] to-[#1a5c66]"
          iconShadow="shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]"
        />
        <Kpi
          icon={Users}
          label="Kursanci łącznie"
          value={plnFmt.format(studentsTotal)}
          gradient="from-[#7c3aed] to-[#5b21b6]"
          iconShadow="shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)]"
          delay={70}
        />
        <Kpi
          icon={Coins}
          label="Przychód VOD (łącznie)"
          value={`${plnFmt.format(revenueTotal)} zł`}
          gradient="from-[#10b981] to-[#059669]"
          iconShadow="shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]"
          delay={140}
        />
        <Kpi
          icon={Star}
          label="Średnia ocena"
          value={avgRating > 0 ? avgRating.toFixed(2) : "—"}
          gradient="from-[#c9993a] to-[#a87928]"
          iconShadow="shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]"
          delay={210}
        />
      </div>

      {/* BENTO GŁÓWNE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Najlepszy kurs */}
        <Tile
          delay={280}
          className="group lg:row-span-2 min-h-[300px] flex flex-col justify-end text-white"
        >
          <Image
            src={best.image}
            alt={best.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B3B4C] via-[#0B3B4C]/70 to-[#0B3B4C]/10" />
          <div className="relative p-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow bg-white/10 backdrop-blur-md rounded-full px-3 py-1 mb-3">
              <Trophy size={13} weight="fill" />
              Najpopularniejszy kurs
            </span>
            <h2 className="font-jakarta font-bold text-[22px] md:text-[26px] leading-tight max-w-md">
              {best.title}
            </h2>
            <div className="flex flex-wrap items-center gap-5 mt-4">
              <div>
                <p className="font-jakarta font-bold text-[20px] leading-none">
                  {enr(best)}
                </p>
                <p className="font-montserrat text-[11px] text-white/60 mt-0.5">
                  kursantów
                </p>
              </div>
              <div>
                <p className="font-jakarta font-bold text-[20px] leading-none">
                  {plnFmt.format(best.price * enr(best))} zł
                </p>
                <p className="font-montserrat text-[11px] text-white/60 mt-0.5">
                  przychód
                </p>
              </div>
              <div>
                <p className="font-jakarta font-bold text-[20px] leading-none inline-flex items-center gap-1">
                  <Star size={16} weight="fill" className="text-brand-yellow" />
                  {best.reviews > 0 ? best.rating.toFixed(1) : "—"}
                </p>
                <p className="font-montserrat text-[11px] text-white/60 mt-0.5">
                  ocena
                </p>
              </div>
              <Link
                href={`/kursy/${best.slug}`}
                className="ml-auto inline-flex items-center gap-1.5 bg-white text-brand-secondary font-montserrat font-bold text-[13px] px-4 py-2 rounded-xl rounded-tr-[3px] hover:gap-2.5 transition-all"
              >
                Otwórz
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        </Tile>

        {/* Rozkład kategorii */}
        <Tile className="p-5" delay={360}>
          <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary mb-3">
            Kursy wg kategorii
          </h3>
          <div className="flex flex-col gap-2.5">
            {categories.slice(0, 4).map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-[12px] font-montserrat mb-1">
                  <span className="text-brand-secondary/70 font-medium truncate">
                    {cat.name}
                  </span>
                  <span className="text-brand-secondary/40 shrink-0 ml-2">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                    style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Tile>

        {/* Wymaga uwagi */}
        <Tile className="p-5" delay={420}>
          <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary inline-flex items-center gap-2 mb-4">
            <WarningCircle size={16} weight="fill" className="text-amber-500" />
            Wymaga uwagi
          </h3>
          {needsAttention.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {needsAttention.map((c) => (
                <Link
                  key={c.id}
                  href={`/kursy/${c.slug}`}
                  className="group flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-amber-50/60 transition-colors"
                >
                  <div className="relative size-9 shrink-0 rounded-lg overflow-hidden">
                    <Image src={c.image} alt="" fill sizes="36px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-montserrat font-semibold text-[12.5px] text-brand-secondary line-clamp-1">
                      {c.title}
                    </p>
                    <p className="font-montserrat text-[11px] text-amber-600">
                      {isLowRating(c)
                        ? `Ocena ${c.rating.toFixed(1)} — do poprawy`
                        : `Tylko ${studentsLabel(enr(c))}`}
                    </p>
                  </div>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="text-brand-secondary/25 group-hover:text-amber-500 transition-colors"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-montserrat text-[13px] text-brand-secondary/50">
              Wszystkie kursy radzą sobie świetnie — brak alertów.
            </p>
          )}
        </Tile>
      </div>

      {/* PRZYCHÓD VOD — pełna szerokość, widoczne miesiące */}
      <Tile className="p-5 sm:p-6 mb-4" delay={480}>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <span className="font-montserrat font-semibold text-[13px] text-brand-secondary/50 inline-flex items-center gap-1.5">
              <ChartLineUp size={16} weight="duotone" className="text-brand-primary" />
              Przychód VOD · 6 mies.
            </span>
            <p className="font-jakarta font-bold text-[26px] text-brand-secondary leading-none mt-1.5">
              {plnFmt.format(revenue6m)} zł
            </p>
          </div>
          <span className="font-montserrat text-[12px] text-brand-secondary/40">
            Łącznie: {plnFmt.format(revenueTotal)} zł
          </span>
        </div>
        <RevenueBars data={revenueSeries} />
      </Tile>

      {/* BENTO DRUGI RZĄD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top kursy */}
        <Tile className="p-5" delay={540}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary">
              Najczęściej kupowane
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/25">
              Top 4
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {topByStudents.slice(0, 4).map((c, i) => (
              <Link
                key={c.id}
                href={`/kursy/${c.slug}`}
                className="group flex items-center gap-3 rounded-xl p-2 hover:bg-brand-primary/[0.04] transition-colors"
              >
                <span
                  className={`flex items-center justify-center size-6 shrink-0 rounded-full font-jakarta font-bold text-[12px] ${
                    i === 0
                      ? "bg-brand-yellow/30 text-amber-600"
                      : "bg-brand-primary/10 text-brand-primary/70"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="relative size-9 shrink-0 rounded-lg overflow-hidden">
                  <Image src={c.image} alt="" fill sizes="36px" className="object-cover" />
                </div>
                <span className="flex-1 min-w-0 font-montserrat font-semibold text-[12.5px] text-brand-secondary line-clamp-1">
                  {c.title}
                </span>
                <span className="shrink-0 font-montserrat text-[12px] font-bold text-brand-primary">
                  {enr(c)}
                </span>
              </Link>
            ))}
          </div>
        </Tile>

        {/* Skróty / kondycja */}
        <Tile className="p-5 flex flex-col" delay={600}>
          <h3 className="font-jakarta font-bold text-[14px] text-brand-secondary mb-4">
            W pigułce
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="rounded-xl rounded-tr-none bg-brand-primary/[0.04] border border-brand-primary/5 p-3">
              <Clock size={18} weight="duotone" className="text-brand-primary mb-1.5" />
              <p className="font-jakarta font-bold text-[18px] text-brand-secondary leading-none">
                {minutesTotal > 0 ? formatCourseDuration(minutesTotal) : "0 min"}
              </p>
              <p className="font-montserrat text-[11px] text-brand-secondary/40 mt-1">
                Materiału wideo
              </p>
            </div>
            <div className="rounded-xl rounded-tr-none bg-brand-primary/[0.04] border border-brand-primary/5 p-3">
              <PlayCircle size={18} weight="duotone" className="text-brand-primary mb-1.5" />
              <p className="font-jakarta font-bold text-[18px] text-brand-secondary leading-none">
                {categories.length}
              </p>
              <p className="font-montserrat text-[11px] text-brand-secondary/40 mt-1">
                Kategorie
              </p>
            </div>
            <div className="rounded-xl rounded-tr-none bg-brand-primary/[0.04] border border-brand-primary/5 p-3">
              <Coins size={18} weight="duotone" className="text-emerald-600 mb-1.5" />
              <p className="font-jakarta font-bold text-[18px] text-brand-secondary leading-none">
                {avgOrder} zł
              </p>
              <p className="font-montserrat text-[11px] text-brand-secondary/40 mt-1">
                Śr. wartość
              </p>
            </div>
            <div className="rounded-xl rounded-tr-none bg-brand-primary/[0.04] border border-brand-primary/5 p-3">
              <Users size={18} weight="duotone" className="text-violet-600 mb-1.5" />
              <p className="font-jakarta font-bold text-[18px] text-brand-secondary leading-none">
                {avgPerCourse}
              </p>
              <p className="font-montserrat text-[11px] text-brand-secondary/40 mt-1">
                Śr. na kurs
              </p>
            </div>
          </div>
        </Tile>
      </div>

      {/* AI STUDIO */}
      <AiStudio delay={660} />
    </div>
  );
}
