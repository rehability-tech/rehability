import "server-only";
import { subMonths, startOfMonth, format } from "date-fns";
import { pl } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import {
  bunnyGuidFromEmbed,
  bunnySignedHlsUrl,
  bunnyThumbnailUrl,
} from "@/lib/bunny";
import type {
  Course,
  CourseBlock,
  CourseFaq,
  CourseModule,
  CourseReview,
} from "@/app/(site)/kursy/_data/courses";

const FALLBACK_IMAGE = "/images/kursy/kurs-1.png";

/** Okładka kursu: własna miniatura albo kadr z głównego wideo (Bunny), z fallbackiem. */
function courseCover(image: string | null, video: string | null): string {
  if (image) return image;
  const guid = bunnyGuidFromEmbed(video);
  return guid ? bunnyThumbnailUrl(guid) : FALLBACK_IMAGE;
}

type DbLesson = {
  id: string;
  title: string;
  description: string | null;
  video: string | null;
  durationSec: number;
};
type DbModule = { id: string; title: string; lessons: DbLesson[] };
type DbCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  rating: number;
  reviews: number;
  views: number;
  durationMin: number;
  price: number;
  image: string | null;
  excerpt: string;
  format: string;
  video: string | null;
  description: unknown;
  content: unknown;
  faq: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  createdAt: Date;
  publishedAt: Date | null;
  sandbox: boolean;
  modules: DbModule[];
};

// ===== SANDBOX (PIASKOWNICA) =====
// Kursy `sandbox` żyją w bazie obok produkcyjnych i mogą mieć status PUBLISHED,
// ale katalog, biblioteka VOD i checkout pokazują je wyłącznie osobom
// uprawnionym. Każda funkcja czytająca kursy „dla klienta" przyjmuje więc
// `includeSandbox` — DOMYŚLNIE `false`, żeby przeoczenie parametru w nowym
// kodzie kończyło się ukryciem treści testowej, a nie jej wyciekiem.

export type SandboxScope = {
  /** `true` = pokaż też kursy sandbox (osoba uprawniona z włączonym podglądem). */
  includeSandbox?: boolean;
};

/** Fragment `where`: bez uprawnień widać wyłącznie kursy produkcyjne. */
function sandboxWhere(opts?: SandboxScope): { sandbox?: false } {
  return opts?.includeSandbox ? {} : { sandbox: false };
}

/**
 * Czy kursowi brakuje nagrań (publikacja dozwolona, ale UI to sygnalizuje).
 * „single" → brak głównego wideo; „sections" → brak lekcji lub którejś lekcji
 * brakuje nagrania.
 */
export function isVideoPending(c: {
  format: string;
  video: string | null;
  modules: { lessons: { video: string | null }[] }[];
}): boolean {
  if (c.format === "single") return !c.video;
  const lessons = c.modules.flatMap((m) => m.lessons);
  if (lessons.length === 0) return true;
  return lessons.some((l) => !l.video);
}

/** Mapuje rekord z bazy na kształt `Course` używany w całym UI. */
function mapCourse(c: DbCourse): Course {
  const curriculum: CourseModule[] | undefined = c.modules.length
    ? c.modules.map((m) => ({
        title: m.title,
        lessons: m.lessons.map((l) => l.title),
      }))
    : undefined;

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    rating: c.rating,
    reviews: c.reviews,
    views: c.views,
    durationMin: c.durationMin,
    price: c.price,
    image: courseCover(c.image, c.video),
    excerpt: c.excerpt,
    format: c.format === "single" ? "single" : "sections",
    // Json z bazy bywa zniekształcony (np. {} zamiast tablicy) — bez tablicy
    // traktujemy jak brak, by UI spadł na bezpieczny fallback (zamiast .map crash).
    description: Array.isArray(c.description)
      ? (c.description as CourseBlock[])
      : undefined,
    content: Array.isArray(c.content)
      ? (c.content as CourseBlock[])
      : undefined,
    curriculum,
    // Opinie NIE pochodzą już z (usuniętej) kolumny testimonials — realne
    // opinie dokładają ścieżki szczegółów (getCourseBySlug / getCourseForPlayer
    // / getAdminCourseDetail) z tabeli CourseReview; w katalogu jest po prostu brak.
    testimonials: undefined,
    faq: Array.isArray(c.faq) ? (c.faq as CourseFaq[]) : undefined,
    videoPending: isVideoPending(c),
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    focusKeyword: c.focusKeyword,
    ogImage: c.ogImage,
    canonicalUrl: c.canonicalUrl,
    noIndex: c.noIndex,
    createdAt: c.createdAt.toISOString(),
    publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
    sandbox: c.sandbox ?? false,
  };
}

const includeModules = {
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const } } },
  },
};

// Opinie kursantów (realne, z imieniem autora) — od najnowszej.
const includeReviews = {
  courseReviews: {
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { name: true } } },
  },
};

type DbReview = {
  rating: number;
  text: string;
  user: { name: string | null };
};

/** Mapuje rekordy opinii z bazy na kształt `CourseReview` używany w UI. */
function mapReviews(rows: DbReview[] | undefined): CourseReview[] {
  return (rows ?? []).map((r) => ({
    author: r.user.name?.trim() || "Kursantka",
    rating: r.rating,
    text: r.text,
  }));
}

/** Wszystkie opublikowane kursy (do katalogu). Bez `includeSandbox` — tylko produkcyjne. */
export async function getCourses(opts?: SandboxScope): Promise<Course[]> {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", ...sandboxWhere(opts) },
    orderBy: { createdAt: "asc" },
    include: includeModules,
  });
  return rows.map((r) => mapCourse(r as unknown as DbCourse));
}

/** Kurs z dodatkowym statusem — do list panelu admina (widzi też szkice). */
export type AdminCourseListItem = Course & {
  status: string;
  enrollmentCount: number;
};

/**
 * Kursy do panelu admina — WSZYSTKIE statusy (w tym szkice DRAFT), od ostatnio
 * modyfikowanych. Publiczny katalog dalej używa `getCourses` (tylko PUBLISHED).
 */
export async function getAdminCourses(): Promise<AdminCourseListItem[]> {
  const rows = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      ...includeModules,
      _count: { select: { enrollments: true } },
    },
  });
  return rows.map((r) => ({
    ...mapCourse(r as unknown as DbCourse),
    status: (r as unknown as { status: string }).status,
    enrollmentCount: (r as unknown as { _count: { enrollments: number } })
      ._count.enrollments,
  }));
}

/** Pojedynczy kurs po slug. Kurs sandbox wymaga `includeSandbox` (inaczej null → 404). */
export async function getCourseBySlug(
  slug: string,
  opts?: SandboxScope,
): Promise<Course | null> {
  const row = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED", ...sandboxWhere(opts) },
    include: { ...includeModules, ...includeReviews },
  });
  if (!row) return null;
  const course = mapCourse(row as unknown as DbCourse);
  course.testimonials = mapReviews(
    (row as unknown as { courseReviews: DbReview[] }).courseReviews,
  );
  return course;
}

export type PlayerLesson = {
  id: string;
  title: string;
  video: string | null;
  /** Podpisany HLS do własnego odtwarzacza (null, gdy brak / nie-Bunny). */
  videoHls: string | null;
};
export type PlayerModule = { title: string; lessons: PlayerLesson[] };
export type PlayerCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  rating: number;
  reviews: number;
  durationMin: number;
  image: string;
  format: string;
  video: string | null;
  videoHls: string | null;
  /** Długość głównego filmu w sekundach (format „single") — baza % postępu. */
  videoDurationSec: number;
  modules: PlayerModule[];
  /** Realne opinie kursantów (puste, gdy brak). */
  testimonials: CourseReview[];
};

/** Kurs z pełnymi lekcjami (z wideo) do odtwarzacza VOD. */
export async function getCourseForPlayer(
  slug: string,
  opts?: SandboxScope,
): Promise<PlayerCourse | null> {
  const c = (await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED", ...sandboxWhere(opts) },
    include: { ...includeModules, ...includeReviews },
  })) as unknown as
    | (DbCourse & {
        format: string;
        video: string | null;
        videoDurationSec: number;
        courseReviews: DbReview[];
      })
    | null;
  if (!c) return null;
  // Embed URL Bunny → podpisany HLS dla własnego playera (null gdy nie-Bunny).
  const toHls = (v: string | null) => {
    const guid = bunnyGuidFromEmbed(v);
    return guid ? bunnySignedHlsUrl(guid) : null;
  };
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    excerpt: c.excerpt,
    rating: c.rating,
    reviews: c.reviews,
    durationMin: c.durationMin,
    image: courseCover(c.image, c.video),
    format: c.format,
    video: c.video,
    videoHls: toHls(c.video),
    videoDurationSec: c.videoDurationSec ?? 0,
    modules: c.modules.map((m) => ({
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        video: l.video,
        videoHls: toHls(l.video),
      })),
    })),
    testimonials: mapReviews(c.courseReviews),
  };
}

// ===== SZCZEGÓŁY KURSU (ADMIN) =====

export type AdminLesson = {
  id: string;
  title: string;
  description: string | null;
  video: string | null;
  hasVideo: boolean;
};
export type AdminModule = { id: string; title: string; lessons: AdminLesson[] };

export type AdminCourseDetail = {
  /** Kurs zmapowany do kształtu UI (treść, opis, opinie, faq…). */
  course: Course;
  status: string;
  format: string;
  video: string | null;
  createdAt: Date;
  updatedAt: Date;
  modulesCount: number;
  lessonsCount: number;
  lessonsWithVideo: number;
  /** Liczba kupionych dostępów (Enrollment). */
  students: number;
  /** Przychód kursu w zł (suma realnych zakupów z CoursePurchase). */
  revenue: number;
  /** Moduły z lekcjami i informacją o wideo (do panelu admina). */
  modules: AdminModule[];
  /** Podpisany URL kadru z nagrania (Bunny) — do ustawienia jako okładka. Pusty, gdy brak wideo. */
  videoThumb: string;
};

/**
 * Pełne dane kursu dla panelu admina — niezależnie od statusu
 * (admin widzi też wersje robocze/archiwalne) + realne statystyki sprzedaży.
 */
export async function getAdminCourseDetail(
  slug: string,
): Promise<AdminCourseDetail | null> {
  const row = (await prisma.course.findUnique({
    where: { slug },
    include: {
      ...includeModules,
      ...includeReviews,
      _count: { select: { enrollments: true } },
    },
  })) as unknown as
    | (DbCourse & {
        status: string;
        format: string;
        video: string | null;
        createdAt: Date;
        updatedAt: Date;
        courseReviews: DbReview[];
        _count: { enrollments: number };
      })
    | null;
  if (!row) return null;

  const course = mapCourse(row);
  course.testimonials = mapReviews(row.courseReviews);
  const modules: AdminModule[] = row.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      video: l.video,
      hasVideo: !!l.video,
    })),
  }));
  const lessonsCount = modules.reduce((s, m) => s + m.lessons.length, 0);
  const lessonsWithVideo = modules.reduce(
    (s, m) => s + m.lessons.filter((l) => l.hasVideo).length,
    0,
  );
  const students = row._count.enrollments;

  // Przychód z realnych zakupów (CoursePurchase, grosze → zł) — nie students×cena,
  // dzięki czemu edycja ceny kursu nie zmienia historycznego przychodu.
  const revenueAgg = await prisma.coursePurchase.aggregate({
    where: { courseId: row.id },
    _sum: { amount: true },
  });
  const revenue = Math.round((revenueAgg._sum.amount ?? 0) / 100);

  // Kadr na okładkę: z głównego wideo lub pierwszej lekcji z nagraniem.
  // Podpisujemy token-auth pull zone (inaczej Bunny zwraca 403).
  const videoUrl =
    row.video ||
    row.modules.flatMap((m) => m.lessons).find((l) => l.video)?.video ||
    null;
  const videoGuid = bunnyGuidFromEmbed(videoUrl);
  const videoThumb = videoGuid ? bunnyThumbnailUrl(videoGuid) : "";

  return {
    course,
    status: row.status,
    format: row.format,
    video: row.video,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    modulesCount: modules.length,
    lessonsCount,
    lessonsWithVideo,
    students,
    revenue,
    modules,
    videoThumb,
  };
}

// ===== UCZESTNICY KURSU (ADMIN) =====

export type CourseParticipant = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  /** Data zakupu dostępu (Enrollment.createdAt). */
  enrolledAt: Date;
  /** Liczba ukończonych lekcji w tym kursie. */
  lessonsCompleted: number;
  /** Postęp 0–100 (ważony czasem oglądania; fallback: ukończone / wszystkie lekcje). */
  progress: number;
  /** Łączny czas oglądania w sekundach (suma LessonProgress.seconds). */
  watchSeconds: number;
  /** Ostatnia aktywność w kursie (najświeższy LessonProgress.updatedAt). */
  lastActivity: Date | null;
};

export type CourseParticipants = {
  /** Liczba wszystkich lekcji kursu (mianownik postępu). */
  lessonsTotal: number;
  participants: CourseParticipant[];
};

/**
 * Lista uczestników kursu z realnymi statystykami oglądania
 * (zapisy + postęp lekcji). Sortowana: najświeższa aktywność → zapis.
 */
export async function getCourseParticipants(
  courseId: string,
): Promise<CourseParticipants> {
  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    select: { lessons: { select: { id: true, durationSec: true } } },
  });
  const lessons = modules.flatMap((m) => m.lessons);
  const lessonIds = lessons.map((l) => l.id);
  const lessonsTotal = lessonIds.length;
  // Czas trwania per lekcja + łączny czas kursu (mianownik postępu ważonego
  // czasem). Lekcje bez znanej długości (durationSec ≤ 0) są wykluczone —
  // spójnie z lessonsTimeProgress w getVodOverview.
  const durById = new Map(lessons.map((l) => [l.id, l.durationSec]));
  const totalDuration = lessons.reduce(
    (s, l) => s + (l.durationSec > 0 ? l.durationSec : 0),
    0,
  );

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const userIds = enrollments.map((e) => e.userId);
  const progress =
    lessonIds.length && userIds.length
      ? await prisma.lessonProgress.findMany({
          where: { userId: { in: userIds }, lessonId: { in: lessonIds } },
          select: {
            userId: true,
            lessonId: true,
            completed: true,
            seconds: true,
            updatedAt: true,
          },
        })
      : [];

  const byUser = new Map<
    string,
    { completed: number; seconds: number; timeWatched: number; last: Date | null }
  >();
  for (const p of progress) {
    const agg = byUser.get(p.userId) ?? {
      completed: 0,
      seconds: 0,
      timeWatched: 0,
      last: null as Date | null,
    };
    if (p.completed) agg.completed += 1;
    agg.seconds += p.seconds;
    // Wkład czasowy lekcji: ukończona → pełny czas; w trakcie → min(obejrzane, czas).
    // Liczymy tylko lekcje ze znaną długością (spójnie z lessonsTimeProgress).
    const dur = durById.get(p.lessonId) ?? 0;
    if (dur > 0) agg.timeWatched += p.completed ? dur : Math.min(p.seconds, dur);
    if (!agg.last || p.updatedAt > agg.last) agg.last = p.updatedAt;
    byUser.set(p.userId, agg);
  }

  const participants: CourseParticipant[] = enrollments.map((e) => {
    const agg =
      byUser.get(e.userId) ??
      { completed: 0, seconds: 0, timeWatched: 0, last: null };
    // Postęp ważony CZASEM (spójny z widokiem kursanta / lessonsTimeProgress);
    // gdy żadna lekcja nie ma znanej długości → fallback po liczbie lekcji.
    const progress =
      totalDuration > 0
        ? Math.min(100, Math.round((agg.timeWatched / totalDuration) * 100))
        : lessonsTotal
          ? Math.round((agg.completed / lessonsTotal) * 100)
          : 0;
    return {
      userId: e.userId,
      name: e.user.name,
      email: e.user.email,
      image: e.user.image,
      enrolledAt: e.createdAt,
      lessonsCompleted: agg.completed,
      progress,
      watchSeconds: agg.seconds,
      lastActivity: agg.last,
    };
  });

  // Najpierw najbardziej aktywni (ostatnia aktywność), potem wg daty zapisu.
  participants.sort((a, b) => {
    const at = a.lastActivity?.getTime() ?? 0;
    const bt = b.lastActivity?.getTime() ?? 0;
    if (bt !== at) return bt - at;
    return b.enrolledAt.getTime() - a.enrolledAt.getTime();
  });

  return { lessonsTotal, participants };
}

/** Kategorie wyliczone z bazy (+ „Wszystkie" na początku). */
export async function getCourseCategories(
  opts?: SandboxScope,
): Promise<string[]> {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", ...sandboxWhere(opts) },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return ["Wszystkie", ...rows.map((r) => r.category)];
}

// ===== ZAKUPY / DOSTĘP =====

/** Tworzy zapis (Enrollment) — idempotentnie. */
export async function enrollUserInCourse(userId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

/**
 * Utrwala rekord zakupu kursu (do faktur i realnego przychodu). Idempotentne
 * po paymentIntentId — ponowne dostarczenie webhooka nie nadpisuje pierwotnego
 * snapshotu kwoty/danych. Enrollment nadaje dostęp osobno; to jest tylko ślad
 * finansowy, dzięki któremu edycja ceny kursu nie zmienia historycznego przychodu.
 */
export async function recordCoursePurchase(input: {
  userId: string;
  courseId: string;
  paymentIntentId: string;
  amount: number; // grosze (kwota realnie zapłacona)
  currency?: string | null;
  buyerType?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  company?: string | null;
  nip?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}) {
  return prisma.coursePurchase.upsert({
    where: { paymentIntentId: input.paymentIntentId },
    update: {},
    create: {
      userId: input.userId,
      courseId: input.courseId,
      paymentIntentId: input.paymentIntentId,
      amount: input.amount,
      currency: input.currency ?? "pln",
      buyerType: input.buyerType ?? null,
      buyerName: input.buyerName ?? null,
      buyerEmail: input.buyerEmail ?? null,
      company: input.company ?? null,
      nip: input.nip ?? null,
      address: input.address ?? null,
      postalCode: input.postalCode ?? null,
      city: input.city ?? null,
    },
  });
}

/**
 * Zapis zakupu na podstawie PaymentIntenta Stripe — wspólne dla webhooka i
 * fallbacku na /panel/vod. Czyta userId/courseId oraz snapshot rozliczeniowy
 * z metadata. Zwraca null, gdy brak kluczowych metadanych (kurs darmowy nie ma PI).
 */
export async function recordCoursePurchaseFromStripe(pi: {
  id: string;
  amount_received?: number | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
}) {
  const meta = pi.metadata ?? {};
  if (!meta.userId || !meta.courseId) return null;
  return recordCoursePurchase({
    userId: meta.userId,
    courseId: meta.courseId,
    paymentIntentId: pi.id,
    amount: pi.amount_received ?? pi.amount ?? 0,
    currency: pi.currency ?? "pln",
    buyerType: meta.buyerType ?? null,
    buyerName: meta.buyerName ?? null,
    buyerEmail: meta.buyerEmail ?? null,
    company: meta.company ?? null,
    nip: meta.nip ?? null,
    address: meta.address ?? null,
    postalCode: meta.postalCode ?? null,
    city: meta.city ?? null,
  });
}

/** Czy użytkownik ma dostęp do kursu (po slug). */
export async function isUserEnrolled(
  userId: string,
  slug: string,
): Promise<boolean> {
  const c = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!c) return false;
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: c.id } },
    select: { id: true },
  });
  return !!e;
}

/** Stan oglądania kursu „single”: obejrzane sekundy + czy ukończony.
 *  Służy do wznowienia odtwarzania od ostatniej pozycji. */
export async function getCourseWatchState(
  userId: string,
  courseId: string,
): Promise<{ watchedSec: number; completed: boolean }> {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { watchedSec: true, completedAt: true },
  });
  return {
    watchedSec: e?.watchedSec ?? 0,
    completed: !!e?.completedAt,
  };
}

/** Czy użytkownik ukończył kurs (Enrollment.completedAt ustawione). */
export async function isCourseCompleted(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { completedAt: true },
  });
  return !!e?.completedAt;
}

/** Zbiór slugów kursów, do których użytkownik ma dostęp (oznaczanie „odblokowane”
 *  w katalogu/na stronie sprzedażowej bez pobierania pełnych danych kursów). */
export async function getEnrolledSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    select: { course: { select: { slug: true } } },
  });
  return rows.map((r) => r.course.slug);
}

/** Kursy, do których użytkownik ma dostęp (biblioteka VOD). */
export async function getEnrolledCourses(userId: string): Promise<Course[]> {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { course: { include: includeModules } },
  });
  return rows.map((r) => mapCourse(r.course as unknown as DbCourse));
}

// ===== POSTĘPY =====

/** Zbiór id ukończonych lekcji użytkownika (opcjonalnie w obrębie kursu). */
export async function getCompletedLessonIds(
  userId: string,
  courseId?: string,
): Promise<string[]> {
  const rows = await prisma.lessonProgress.findMany({
    where: {
      userId,
      completed: true,
      ...(courseId
        ? { lesson: { module: { courseId } } }
        : {}),
    },
    select: { lessonId: true },
  });
  return rows.map((r) => r.lessonId);
}

/** Obejrzane sekundy per lekcja w danym kursie — do wznawiania odtwarzania od
 *  ostatniej pozycji (mapa lessonId → seconds; tylko lekcje z postępem > 0). */
export async function getCourseLessonSeconds(
  userId: string,
  courseId: string,
): Promise<Record<string, number>> {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, seconds: { gt: 0 }, lesson: { module: { courseId } } },
    select: { lessonId: true, seconds: true },
  });
  return Object.fromEntries(rows.map((r) => [r.lessonId, r.seconds]));
}

// ===== STATYSTYKI ADMINA (realne dane z Enrollment) =====

export type CourseAdminStats = {
  /** Liczba kupionych dostępów (Enrollment) per courseId. */
  enrollmentsByCourse: Record<string, number>;
  /** Łączna liczba kursantów (wszystkie zapisy). */
  studentsTotal: number;
  /** Łączny przychód VOD w zł (suma realnych zakupów z CoursePurchase). */
  revenueTotal: number;
  /** Przychód VOD w ostatnich 6 miesiącach (do sparkline'a). */
  revenueSeries: { name: string; value: number }[];
};

/** Realne statystyki sprzedaży kursów liczone z tabeli Enrollment. */
export async function getCourseAdminStats(): Promise<CourseAdminStats> {
  const [enrollments, purchases] = await Promise.all([
    prisma.enrollment.findMany({ select: { courseId: true } }),
    prisma.coursePurchase.findMany({
      select: { amount: true, createdAt: true },
    }),
  ]);

  const enrollmentsByCourse: Record<string, number> = {};
  for (const e of enrollments) {
    enrollmentsByCourse[e.courseId] = (enrollmentsByCourse[e.courseId] ?? 0) + 1;
  }

  // Przychód z realnych zakupów (grosze → zł) — nie liczba_kursantów × AKTUALNA
  // cena, więc edycja ceny kursu nie zmienia historycznego przychodu.
  const revenueTotal = Math.round(
    purchases.reduce((s, p) => s + p.amount, 0) / 100,
  );

  // Seria 6 miesięcy — przychód wg miesiąca zakupu.
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, idx) => {
    const d = startOfMonth(subMonths(now, 5 - idx));
    const label = format(d, "LLL", { locale: pl });
    return {
      key: format(d, "yyyy-MM"),
      name: label.charAt(0).toUpperCase() + label.slice(1),
      grosze: 0,
    };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const p of purchases) {
    const b = byKey.get(format(p.createdAt, "yyyy-MM"));
    if (b) b.grosze += p.amount;
  }

  return {
    enrollmentsByCourse,
    studentsTotal: enrollments.length,
    revenueTotal,
    revenueSeries: buckets.map(({ name, grosze }) => ({
      name,
      value: Math.round(grosze / 100),
    })),
  };
}

/** Kurs do „Kontynuuj" — ostatnio oglądany, a gdy brak postępu: ostatnio kupiony. */
export async function getContinueCourse(
  userId: string,
): Promise<{ title: string; slug: string; cover: string } | null> {
  const last = await getLastWatchedCourse(userId);
  if (last) return last;
  const enr = await prisma.enrollment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      course: { select: { title: true, slug: true, image: true, video: true } },
    },
  });
  return enr?.course
    ? {
        title: enr.course.title,
        slug: enr.course.slug,
        cover: courseCover(enr.course.image, enr.course.video),
      }
    : null;
}

/** Ostatnio oglądany kurs — do skrótu w menu. Bierze pod uwagę zarówno postęp
 *  lekcji (kursy z modułami), jak i oglądanie głównego filmu (kursy „single”,
 *  postęp na Enrollment) i wybiera świeższy z dwóch. */
export async function getLastWatchedCourse(
  userId: string,
): Promise<{ slug: string; title: string; cover: string } | null> {
  const [lastLesson, lastSingle] = await Promise.all([
    prisma.lessonProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
        lesson: {
          select: {
            module: {
              select: {
                course: {
                  select: {
                    slug: true,
                    title: true,
                    image: true,
                    video: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.enrollment.findFirst({
      where: { userId, watchedSec: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
        course: {
          select: { slug: true, title: true, image: true, video: true },
        },
      },
    }),
  ]);

  const lessonCourse = lastLesson?.lesson?.module?.course;
  const lessonAt = lessonCourse ? lastLesson!.updatedAt.getTime() : -1;
  const singleAt = lastSingle ? lastSingle.updatedAt.getTime() : -1;
  if (lessonAt < 0 && singleAt < 0) return null;

  const course = singleAt > lessonAt ? lastSingle!.course : lessonCourse!;
  return {
    slug: course.slug,
    title: course.title,
    cover: courseCover(course.image, course.video),
  };
}

/** Procent postępu kursu „single" (jeden film): ukończony → 100, w trakcie →
 *  watchedSec / videoDurationSec zaokrąglone i ograniczone do 99% (pełne 100%
 *  daje dopiero realne ukończenie odtwarzania). */
export function singleProgress(
  completedAt: Date | null,
  watchedSec: number,
  videoDurationSec: number,
): number {
  if (completedAt) return 100;
  if (!videoDurationSec || videoDurationSec <= 0) return 0;
  const pct = Math.round(((watchedSec || 0) / videoDurationSec) * 100);
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(99, pct));
}

/** Procent postępu kursu z modułami liczony po obejrzanym CZASIE.
 *  Lekcja `completed` = pełny czas; w trakcie = min(obejrzane, długość lekcji).
 *  Lekcje bez długości (brak nagrania) są pomijane w mianowniku. Gdy żadna
 *  lekcja nie ma `durationSec`, wracamy do liczenia po ukończonych lekcjach. */
export function lessonsTimeProgress(
  lessons: { id: string; durationSec: number }[],
  progressByLesson: Map<string, { completed: boolean; seconds: number }>,
  completedAt: Date | null,
): number {
  if (completedAt) return 100;

  let totalSec = 0;
  let watchedSec = 0;
  for (const l of lessons) {
    const dur = l.durationSec ?? 0;
    if (dur <= 0) continue;
    totalSec += dur;
    const lp = progressByLesson.get(l.id);
    watchedSec += lp?.completed ? dur : Math.min(lp?.seconds ?? 0, dur);
  }

  if (totalSec > 0) {
    return Math.max(0, Math.min(100, Math.round((watchedSec / totalSec) * 100)));
  }

  // Fallback: brak danych o długości lekcji → liczymy po ukończonych lekcjach.
  if (lessons.length === 0) return 0;
  const done = lessons.filter(
    (l) => progressByLesson.get(l.id)?.completed,
  ).length;
  return Math.round((done / lessons.length) * 100);
}

export type VodOverview = {
  courses: Course[];
  progressByCourse: Record<string, number>;
  lessonsDone: number;
  /** Łączna liczba lekcji w posiadanych kursach (mianownik „ukończone lekcje”). */
  lessonsTotal: number;
  hoursTotal: number;
};

/** Pełny przegląd VOD użytkownika: kursy + postęp + liczby do statystyk. */
export async function getVodOverview(userId: string): Promise<VodOverview> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { course: { include: includeModules } },
  });
  const courses = enrollments.map((e) =>
    mapCourse(e.course as unknown as DbCourse),
  );

  // Pełny postęp lekcji (completed + obejrzane sekundy) — baza % po CZASIE.
  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, completed: true, seconds: true },
  });
  const progressByLesson = new Map(
    progressRows.map((r) => [
      r.lessonId,
      { completed: r.completed, seconds: r.seconds },
    ]),
  );
  const doneSet = new Set(
    progressRows.filter((r) => r.completed).map((r) => r.lessonId),
  );

  // Jednostki nauki (baza XP i „ukończonych lekcji"): lekcja = 1 jednostka,
  // a kurs „single" (jeden film) liczymy jako 1 jednostkę (ukończony film = 1).
  // POSTĘP % liczymy po obejrzanym CZASIE (nie liczbie lekcji): lekcja
  // ukończona = pełny czas, w trakcie = min(obejrzane, długość). XP zostaje na
  // ukończonych jednostkach (nagroda za zrobione, nie za minuty).
  const progressByCourse: Record<string, number> = {};
  let lessonsTotal = 0;
  let lessonsDone = 0;
  for (const e of enrollments) {
    const c = e.course as unknown as DbCourse & {
      format: string;
      video: string | null;
      videoDurationSec: number;
    };
    const lessons = c.modules.flatMap((m) => m.lessons) as {
      id: string;
      durationSec: number;
      video: string | null;
    }[];
    // Kurs „single" (jeden film, brak lekcji): postęp z Enrollment —
    // ukończony → 100%, w trakcie → watchedSec / videoDurationSec (cap 99%).
    if (c.format === "single" || lessons.length === 0) {
      lessonsTotal += 1;
      if (e.completedAt) lessonsDone += 1;
      progressByCourse[c.id] = singleProgress(
        e.completedAt,
        e.watchedSec,
        c.videoDurationSec,
      );
      continue;
    }

    lessonsTotal += lessons.length;
    lessonsDone += lessons.filter((l) => doneSet.has(l.id)).length;
    progressByCourse[c.id] = lessonsTimeProgress(
      lessons,
      progressByLesson,
      e.completedAt,
    );
  }

  const hoursTotal = Math.round(
    courses.reduce((s, c) => s + c.durationMin, 0) / 60,
  );

  return {
    courses,
    progressByCourse,
    lessonsDone,
    lessonsTotal,
    hoursTotal,
  };
}

// ===== OPINIE KURSANTÓW (realne, pisane przez kursantki) =====

/** Przelicza zagregowaną ocenę kursu (rating = średnia, reviews = liczba). */
async function recomputeCourseRating(
  tx: Prisma.TransactionClient,
  courseId: string,
): Promise<void> {
  const agg = await tx.courseReview.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const count = agg._count._all;
  const avg = agg._avg.rating ?? 0;
  await tx.course.update({
    where: { id: courseId },
    data: {
      reviews: count,
      // Zaokrąglenie do 1 miejsca; brak opinii → 0 (UI pokazuje „Nowość").
      rating: count > 0 ? Math.round(avg * 10) / 10 : 0,
    },
  });
}

/** Opinia danej kursantki o kursie (do prefillu formularza). */
export async function getUserCourseReview(
  userId: string,
  courseId: string,
): Promise<{ rating: number; text: string } | null> {
  return prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { rating: true, text: true },
  });
}

/** Dodaje lub aktualizuje opinię kursantki i odświeża ocenę kursu. */
export async function upsertCourseReview(input: {
  userId: string;
  courseId: string;
  rating: number;
  text: string;
}): Promise<void> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const text = input.text.trim();
  await prisma.$transaction(async (tx) => {
    await tx.courseReview.upsert({
      where: {
        courseId_userId: { courseId: input.courseId, userId: input.userId },
      },
      update: { rating, text },
      create: {
        courseId: input.courseId,
        userId: input.userId,
        rating,
        text,
      },
    });
    await recomputeCourseRating(tx, input.courseId);
  });
}

/** Usuwa opinię kursantki i odświeża ocenę kursu. */
export async function deleteCourseReview(
  userId: string,
  courseId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.courseReview.deleteMany({ where: { userId, courseId } });
    await recomputeCourseRating(tx, courseId);
  });
}
