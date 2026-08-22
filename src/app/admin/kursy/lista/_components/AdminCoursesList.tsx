"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  MagnifyingGlass,
  Star,
  Clock,
  GraduationCap,
  PlayCircle,
  ArrowSquareOut,
  CheckCircle,
  SquaresFour,
  Rows,
  Eye,
  VideoCamera,
  PencilSimpleLine,
  Archive,
  Flask,
  Trash,
  CaretLeft,
  CaretDown,
  DotsThree,
  X,
  ImageBroken,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import Portal from "@/components/ui/Portal";
import {
  formatCourseDuration,
  type Course,
} from "@/app/(site)/kursy/_data/courses";

const plnFmt = new Intl.NumberFormat("pl-PL");

/** Placeholder okładki dla kursów bez zdjęcia — przekreślona ikona zdjęcia
 *  na firmowym, stonowanym tle. Wypełnia kontener (absolute inset-0). */
function CoverPlaceholder({ compact }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-primary/15 via-brand-secondary/10 to-brand-primary/[0.06]">
      <ImageBroken
        size={compact ? 22 : 38}
        weight="duotone"
        className="text-brand-secondary/30"
      />
    </div>
  );
}

type ViewMode = "grid" | "list";
type StatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Kurs z listy admina — niesie też status (szkic/opublikowany/archiwum). */
type AdminCourse = Course & { status?: string; enrollmentCount?: number };

const isDraft = (c: AdminCourse) => c.status === "DRAFT";
/** Liczba lekcji kursu (z programu). */
const lessonCount = (c: AdminCourse) =>
  (c.curriculum ?? []).reduce((s, m) => s + m.lessons.length, 0);
/** Etykieta na karcie: „jeden film" → czas; „lekcje" → „N lekcji · czas". */
function durationLabel(c: AdminCourse): string {
  const time = formatCourseDuration(c.durationMin);
  if (c.format === "single") return time;
  const n = lessonCount(c);
  const lekcje = `${n} ${n === 1 ? "lekcja" : n >= 2 && n <= 4 ? "lekcje" : "lekcji"}`;
  return c.durationMin > 0 ? `${lekcje} · ${time}` : lekcje;
}
/** Link karty: szkic → dokończ w kreatorze; reszta → dashboard kursu. */
const cardHref = (c: AdminCourse) =>
  isDraft(c)
    ? `/admin/kursy/dodaj?step=1&draft=${c.id}`
    : `/admin/kursy/${c.slug}`;
/** Edycja danych zawsze przez kreator (szkic z ?draft=, kurs przez trasę /edytuj). */
const editHref = (c: AdminCourse) =>
  isDraft(c)
    ? `/admin/kursy/dodaj?step=1&draft=${c.id}`
    : `/admin/kursy/${c.slug}/edytuj`;

/** Definicje statusów — etykieta, czasownik akcji, ikona i kolory. */
const STATUS_DEFS: Record<
  StatusValue,
  {
    label: string;
    verb: string;
    Icon: typeof CheckCircle;
    text: string;
    soft: string;
  }
> = {
  PUBLISHED: {
    label: "Opublikowany",
    verb: "Opublikuj",
    Icon: CheckCircle,
    text: "text-emerald-600",
    soft: "bg-emerald-500/10",
  },
  DRAFT: {
    label: "Szkic",
    verb: "Cofnij do szkicu",
    Icon: PencilSimpleLine,
    text: "text-amber-600",
    soft: "bg-amber-400/15",
  },
  ARCHIVED: {
    label: "Archiwum",
    verb: "Archiwizuj",
    Icon: Archive,
    text: "text-gray-500",
    soft: "bg-gray-400/15",
  },
};

const STATUS_ORDER: StatusValue[] = ["PUBLISHED", "DRAFT", "ARCHIVED"];

/** Znacznik statusu (ikona + etykieta + klasy) dla nakładki na okładce. */
function StatusBadge({ status }: { status?: string }) {
  if (status === "DRAFT") {
    return (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm">
        <PencilSimpleLine size={11} weight="fill" />
        Szkic
      </span>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-gray-200/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm">
        <Archive size={11} weight="fill" />
        Archiwum
      </span>
    );
  }
  return (
    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-400/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm">
      <CheckCircle size={11} weight="fill" />
      Opublikowany
    </span>
  );
}

/** Znacznik statusu w wersji „pigułki" dla widoku listy. */
function StatusPill({ status }: { status?: string }) {
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-400/15 rounded-full px-2 py-0.5">
        <PencilSimpleLine size={11} weight="fill" />
        Szkic
      </span>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-400/15 rounded-full px-2 py-0.5">
        <Archive size={11} weight="fill" />
        Archiwum
      </span>
    );
  }
  return (
    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 rounded-full px-2 py-0.5">
      <CheckCircle size={11} weight="fill" />
      Opublikowany
    </span>
  );
}

export function AdminCoursesList({ courses }: { courses: AdminCourse[] }) {
  const [items, setItems] = useState<AdminCourse[]>(courses);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Wszystkie");
  const [view, setView] = useState<ViewMode>("grid");
  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Które menu statusu jest otwarte (tylko jedno naraz). Trzymane w rodzicu,
  // żeby klik w „⋯" innej karty przełączał, a klik w pustkę — zamykał.
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  const toggleStatusMenu = (id: string) =>
    setOpenStatusId((prev) => (prev === id ? null : id));
  const closeStatusMenu = () => setOpenStatusId(null);

  // Sync ze świeżymi danymi z serwera (np. po revalidate / nawigacji wstecz).
  useEffect(() => setItems(courses), [courses]);

  // Zamknij menu statusu po kliknięciu poza menu/przyciskiem „⋯".
  // Elementy menu są oznaczone [data-status-ui], więc klik w „⋯" innej karty
  // nie zamyka tutaj — to jej własny onClick przełączy otwarte menu.
  useEffect(() => {
    if (!openStatusId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-status-ui]")) return;
      setOpenStatusId(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openStatusId]);

  const categories = useMemo(
    () => ["Wszystkie", ...Array.from(new Set(items.map((c) => c.category)))],
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const okCat = category === "Wszystkie" || c.category === category;
        const okQuery = `${c.title} ${c.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return okCat && okQuery;
      }),
    [items, query, category],
  );

  /** Optymistyczna zmiana statusu (PATCH); przy publikacji aktualizuje slug. */
  async function changeStatus(course: AdminCourse, status: StatusValue) {
    if (course.status === status) return;
    const snapshot = items;
    setItems((cur) =>
      cur.map((c) => (c.id === course.id ? { ...c, status } : c)),
    );
    try {
      const res = await fetch(`/api/admin/kursy/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "PUBLISHED" && course.title
            ? { title: course.title }
            : {}),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(err?.error || "");
      }
      const data = (await res.json().catch(() => null)) as {
        slug?: string;
      } | null;
      if (data?.slug) {
        setItems((cur) =>
          cur.map((c) =>
            c.id === course.id ? { ...c, slug: data.slug as string } : c,
          ),
        );
      }
      toast.success(`Status zmieniony: ${STATUS_DEFS[status].label}.`);
    } catch (e) {
      setItems(snapshot);
      // Publikacja bez treści/FAQ → serwer zwraca konkretny komunikat (bramka).
      toast.error(
        e instanceof Error && e.message
          ? e.message
          : "Nie udało się zmienić statusu.",
      );
    }
  }

  /** Trwałe usunięcie kursu (DELETE) po potwierdzeniu w modalu. */
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/kursy/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((cur) => cur.filter((c) => c.id !== deleteTarget.id));
      toast.success("Kurs usunięty.");
      setDeleteTarget(null);
    } catch {
      toast.error("Nie udało się usunąć kursu.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pasek narzędzi: kategorie + szukaj + przełącznik widoku */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* MOBILE: kategorie jako dropdown (mniej miejsca niż pasek pigułek) */}
        <div className="relative lg:hidden">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtr kategorii"
            className="w-full h-11 appearance-none rounded-full bg-white/70 backdrop-blur-md border border-white/60 pl-4 pr-10 font-montserrat font-semibold text-[13px] text-brand-secondary outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <CaretDown
            size={15}
            weight="bold"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-secondary/45"
          />
        </div>

        {/* DESKTOP: pigułki kategorii (od lg) */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isActive = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`relative shrink-0 px-3.5 py-1.5 rounded-full font-montserrat font-semibold text-[12px] border transition-all overflow-hidden ${
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

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-[260px]">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj kursu…"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white/70 backdrop-blur-md border border-white/60 font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
            />
          </div>

          {/* Przełącznik widoku siatka / lista */}
          <div className="flex items-center gap-1 h-11 p-1 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm shrink-0">
            <ViewToggle
              active={view === "grid"}
              onClick={() => setView("grid")}
              label="Widok siatki"
            >
              <SquaresFour size={17} weight={view === "grid" ? "fill" : "bold"} />
            </ViewToggle>
            <ViewToggle
              active={view === "list"}
              onClick={() => setView("list")}
              label="Widok listy"
            >
              <Rows size={17} weight={view === "list" ? "fill" : "bold"} />
            </ViewToggle>
          </div>
        </div>
      </div>

      {/* Zawartość */}
      {filtered.length === 0 ? (
        <div className="rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 p-12 text-center font-montserrat text-brand-secondary/50">
          Brak kursów pasujących do filtrów.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              statusOpen={openStatusId === course.id}
              onToggleStatus={toggleStatusMenu}
              onCloseStatus={closeStatusMenu}
              onChangeStatus={changeStatus}
              onAskDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <CourseRows
          courses={filtered}
          openStatusId={openStatusId}
          onToggleStatus={toggleStatusMenu}
          onChangeStatus={changeStatus}
          onAskDelete={setDeleteTarget}
        />
      )}

      {/* Modal potwierdzenia usunięcia */}
      <DeleteModal
        course={deleteTarget}
        deleting={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}

/* ----------------------------- Widok siatki ----------------------------- */

type CardActions = {
  onChangeStatus: (course: AdminCourse, status: StatusValue) => void;
  onAskDelete: (course: AdminCourse) => void;
};

/** Wspólne propsy menu statusu (sterowanego z rodzica). */
type StatusMenuProps = {
  statusOpen: boolean;
  onToggleStatus: (id: string) => void;
  onCloseStatus: () => void;
};

function CourseCard({
  course,
  statusOpen,
  onToggleStatus,
  onCloseStatus,
  onChangeStatus,
  onAskDelete,
}: { course: AdminCourse } & CardActions & StatusMenuProps) {
  const draft = isDraft(course);
  const href = cardHref(course);

  return (
    <div className="group relative flex flex-col rounded-3xl rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.35)] overflow-hidden hover:shadow-[0_24px_60px_-30px_rgba(40,125,136,0.45)] hover:-translate-y-0.5 transition-all duration-300">
      {/* Okładka */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
          />
        ) : (
          <CoverPlaceholder />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-brand-secondary/5 to-transparent" />

        {/* Kategoria */}
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md text-brand-primary border border-white/60 shadow-sm">
          {course.category}
        </span>
        {/* Status */}
        <StatusBadge status={course.status} />
        {/* Piaskownica — kurs niewidoczny dla klientów */}
        {course.sandbox && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand-secondary bg-brand-yellow/95 backdrop-blur-md rounded-full px-2 py-1 shadow-sm">
            <Flask size={11} weight="fill" />
            Sandbox
          </span>
        )}
        {/* Czas trwania / liczba lekcji (z realnych długości wideo) */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white drop-shadow">
          <Clock size={13} weight="fill" />
          {durationLabel(course)}
        </span>
        {/* Brak nagrań */}
        {course.videoPending && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm">
            <VideoCamera size={11} weight="fill" />
            Brak nagrań
          </span>
        )}

        {/* Nakładka akcji (hover lub gdy menu statusu otwarte) */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center bg-brand-secondary/55 backdrop-blur-[2px] transition-opacity duration-300 ${
            statusOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {statusOpen ? (
              <motion.div
                key="status"
                data-status-ui
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="flex w-[78%] max-w-[230px] flex-col gap-1.5 rounded-2xl rounded-tr-none bg-white/90 backdrop-blur-xl border border-white/60 p-2 shadow-[0_12px_30px_-12px_rgba(3,63,99,0.5)]"
              >
                <p className="px-1.5 pt-0.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40">
                  Zmień status
                </p>
                {STATUS_ORDER.map((value) => {
                  const def = STATUS_DEFS[value];
                  const current = (course.status ?? "PUBLISHED") === value;
                  const blocked =
                    value === "PUBLISHED" && !course.title?.trim();
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={current || blocked}
                      title={
                        blocked
                          ? "Nadaj tytuł, aby opublikować"
                          : undefined
                      }
                      onClick={() => {
                        onCloseStatus();
                        onChangeStatus(course, value);
                      }}
                      className={`flex items-center gap-2 rounded-xl rounded-tr-[3px] px-2.5 py-1.5 text-left font-montserrat font-semibold text-[12px] transition-colors ${
                        current
                          ? `${def.soft} ${def.text} cursor-default`
                          : blocked
                            ? "text-brand-secondary/30 cursor-not-allowed"
                            : "text-brand-secondary/70 hover:bg-brand-primary/5 hover:text-brand-secondary"
                      }`}
                    >
                      <def.Icon size={15} weight="fill" className={def.text} />
                      {current ? `${def.label} · aktualny` : def.verb}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onCloseStatus}
                  className="mt-0.5 inline-flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 font-montserrat font-semibold text-[11.5px] text-brand-secondary/50 hover:text-brand-secondary transition-colors"
                >
                  <CaretLeft size={13} weight="bold" />
                  Wróć
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2.5"
              >
                {/* Główne wejście: szczegóły / dokończ szkic */}
                <Link
                  href={href}
                  title={
                    draft
                      ? "Dokończ szkic w kreatorze"
                      : "Zobacz szczegóły kursu"
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-white/60 text-brand-secondary font-montserrat font-bold text-[13px] px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:scale-105"
                >
                  {draft ? (
                    <>
                      <PencilSimpleLine size={17} weight="fill" />
                      Dokończ szkic
                    </>
                  ) : (
                    <>
                      <Eye size={17} weight="fill" />
                      Szczegóły
                    </>
                  )}
                </Link>

                {/* Pasek akcji zarządzania */}
                <div className="flex items-center gap-1.5">
                  {!draft && (
                    <OverlayAction as="link" href={editHref(course)} title="Edytuj dane kursu">
                      <PencilSimpleLine size={16} weight="bold" />
                    </OverlayAction>
                  )}
                  <OverlayAction
                    title="Zmień status"
                    statusToggle
                    onClick={() => onToggleStatus(course.id)}
                  >
                    <DotsThree size={20} weight="bold" />
                  </OverlayAction>
                  <OverlayAction
                    title="Usuń trwale"
                    danger
                    onClick={() => onAskDelete(course)}
                  >
                    <Trash size={16} weight="bold" />
                  </OverlayAction>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Treść */}
      <div className="flex flex-col flex-1 p-4">
        <Link
          href={href}
          className="font-jakarta font-bold text-[15px] text-brand-secondary leading-snug line-clamp-2 min-h-[42px] hover:text-brand-primary transition-colors"
        >
          {course.title || "Kurs bez tytułu"}
        </Link>
        <p className="font-montserrat text-[12px] text-brand-secondary/45 mt-1.5 line-clamp-2">
          {course.excerpt}
        </p>

        {/* Statystyki */}
        <div className="flex flex-col gap-1.5 mt-3">
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-[11px] text-brand-secondary/40">Kursanci</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/15 font-montserrat font-semibold text-[11px] text-violet-600">
              <GraduationCap size={11} weight="fill" />
              {course.enrollmentCount ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-[11px] text-brand-secondary/40">Opinie</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-yellow/15 border border-brand-yellow/20 font-montserrat font-semibold text-[11px] text-amber-700">
              <Star size={11} weight="fill" />
              {course.rating.toFixed(1)}{" "}
              <span className="font-normal opacity-60">({course.reviews})</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-[11px] text-brand-secondary/40">Wyświetlenia</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 font-montserrat font-semibold text-[11px] text-brand-primary">
              <Eye size={11} weight="duotone" />
              {plnFmt.format(course.views ?? 0)}
            </span>
          </div>
        </div>

        {/* Stopka: cena + szybkie podglądy */}
        <div className="flex items-end justify-between mt-4 pt-3 border-t border-brand-secondary/[0.07]">
          <div>
            <p className="font-jakarta font-bold text-[18px] text-brand-secondary leading-none">
              {plnFmt.format(course.price)} zł
            </p>
            <p className="font-montserrat text-[10px] text-brand-secondary/40 mt-1">
              dożywotni dostęp
            </p>
          </div>
          {draft ? (
            <Link
              href={href}
              title="Dokończ szkic w kreatorze"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl rounded-tr-[3px] bg-amber-400/15 text-amber-700 font-montserrat font-bold text-[12px] hover:bg-amber-400/25 transition-colors"
            >
              <PencilSimpleLine size={15} weight="bold" />
              Dokończ
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/panel/vod/${course.slug}`}
                title="Otwórz w odtwarzaczu"
                className="inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
              >
                <PlayCircle size={18} weight="fill" />
              </Link>
              <Link
                href={`/kursy/${course.slug}`}
                title="Podgląd strony kursu"
                className="inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] bg-white/70 border border-white/60 text-brand-secondary/60 hover:text-brand-primary transition-colors"
              >
                <ArrowSquareOut size={17} weight="bold" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Okrągły przycisk akcji w nakładce (glass na ciemnym scrimie). */
function OverlayAction({
  children,
  title,
  onClick,
  danger,
  as,
  href,
  statusToggle,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
  danger?: boolean;
  as?: "link";
  href?: string;
  statusToggle?: boolean;
}) {
  const cls = `inline-flex items-center justify-center size-9 rounded-full backdrop-blur-md border transition-colors ${
    danger
      ? "bg-white/90 border-white/60 text-red-500 hover:bg-red-500 hover:text-white"
      : "bg-white/90 border-white/60 text-brand-secondary hover:bg-brand-primary hover:text-white"
  }`;
  if (as === "link" && href) {
    return (
      <Link href={href} title={title} aria-label={title} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cls}
      {...(statusToggle ? { "data-status-ui": "" } : {})}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Widok listy ------------------------------ */

function CourseRows({
  courses,
  openStatusId,
  onToggleStatus,
  onChangeStatus,
  onAskDelete,
}: {
  courses: AdminCourse[];
  openStatusId: string | null;
  onToggleStatus: (id: string) => void;
} & CardActions) {
  return (
    <div className="rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] overflow-visible divide-y divide-brand-secondary/[0.06]">
      {courses.map((course) => (
        <CourseRow
          key={course.id}
          course={course}
          statusOpen={openStatusId === course.id}
          onToggleStatus={onToggleStatus}
          onChangeStatus={onChangeStatus}
          onAskDelete={onAskDelete}
        />
      ))}
    </div>
  );
}

function CourseRow({
  course,
  statusOpen,
  onToggleStatus,
  onChangeStatus,
  onAskDelete,
}: {
  course: AdminCourse;
  statusOpen: boolean;
  onToggleStatus: (id: string) => void;
} & CardActions) {
  const draft = isDraft(course);
  const href = cardHref(course);

  return (
    <div className="group relative flex items-center gap-4 p-3.5 sm:p-4 hover:bg-brand-primary/[0.03] transition-colors first:rounded-t-[24px] first:rounded-tr-none last:rounded-b-[24px]">
      {/* Miniatura */}
      <div className="relative size-14 sm:size-16 shrink-0 rounded-2xl rounded-tr-none overflow-hidden shadow-[0_8px_20px_-12px_rgba(3,63,99,0.5)]">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <CoverPlaceholder compact />
        )}
      </div>

      {/* Tytuł + kategoria */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
            {course.category}
          </span>
          <StatusPill status={course.status} />
          {course.sandbox && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-secondary bg-brand-yellow/40 rounded-full px-2 py-0.5">
              <Flask size={11} weight="fill" />
              Sandbox
            </span>
          )}
          {course.videoPending && !draft && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-400/15 rounded-full px-2 py-0.5">
              <VideoCamera size={11} weight="fill" />
              Brak nagrań
            </span>
          )}
        </div>
        <Link
          href={href}
          className="block font-jakarta font-bold text-[14px] text-brand-secondary leading-snug line-clamp-1 hover:text-brand-primary transition-colors"
        >
          {course.title || "Kurs bez tytułu"}
        </Link>
        <div className="flex items-center gap-3 mt-1 text-[11.5px] font-montserrat text-brand-secondary/45">
          <span
            className="inline-flex items-center gap-1"
            title="Kursanci z dostępem"
          >
            <GraduationCap
              size={13}
              weight="fill"
              className="text-violet-500"
            />
            {course.enrollmentCount ?? 0}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`Ocena: ${course.reviews} ${course.reviews === 1 ? "opinia" : "opinii"}`}
          >
            <Star size={13} weight="fill" className="text-brand-yellow" />
            {course.rating.toFixed(1)}{" "}
            <span className="text-brand-secondary/35">({course.reviews})</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Clock size={13} weight="duotone" className="text-brand-primary" />
            {durationLabel(course)}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title="Wyświetlenia strony kursu"
          >
            <Eye size={13} weight="duotone" className="text-brand-primary" />
            {plnFmt.format(course.views ?? 0)}
          </span>
        </div>
      </div>

      {/* Cena */}
      <div className="hidden md:block text-right shrink-0">
        <p className="font-jakarta font-bold text-[16px] text-brand-secondary leading-none">
          {plnFmt.format(course.price)} zł
        </p>
        <p className="font-montserrat text-[10.5px] text-brand-secondary/40 mt-1">
          dożywotni
        </p>
      </div>

      {/* Akcje */}
      <div className="flex items-center gap-1.5 shrink-0">
        {draft ? (
          <Link
            href={href}
            title="Dokończ szkic w kreatorze"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl rounded-tr-[3px] bg-amber-400/15 text-amber-700 font-montserrat font-bold text-[12px] hover:bg-amber-400/25 transition-colors"
          >
            <PencilSimpleLine size={15} weight="bold" />
            Dokończ
          </Link>
        ) : (
          <>
            <Link
              href={`/panel/vod/${course.slug}`}
              title="Otwórz w odtwarzaczu"
              className="hidden sm:inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
            >
              <PlayCircle size={18} weight="fill" />
            </Link>
            <Link
              href={editHref(course)}
              title="Edytuj dane kursu"
              className="inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] bg-white/70 border border-white/60 text-brand-secondary/60 hover:text-brand-primary transition-colors"
            >
              <PencilSimpleLine size={16} weight="bold" />
            </Link>
          </>
        )}

        {/* Menu statusu */}
        <div className="relative">
          <button
            type="button"
            title="Zmień status"
            aria-label="Zmień status"
            data-status-ui
            onClick={() => onToggleStatus(course.id)}
            className={`inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] border transition-colors ${
              statusOpen
                ? "bg-brand-primary text-white border-brand-yellow/30"
                : "bg-white/70 border-white/60 text-brand-secondary/60 hover:text-brand-primary"
            }`}
          >
            <DotsThree size={20} weight="bold" />
          </button>
          <AnimatePresence>
            {statusOpen && (
              <motion.div
                data-status-ui
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-40 w-[210px] flex flex-col gap-1.5 rounded-2xl rounded-tr-none bg-white/95 backdrop-blur-xl border border-white/60 p-2 shadow-[0_18px_40px_-18px_rgba(3,63,99,0.5)]"
              >
                <p className="px-1.5 pt-0.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40">
                  Zmień status
                </p>
                {STATUS_ORDER.map((value) => {
                  const def = STATUS_DEFS[value];
                  const current = (course.status ?? "PUBLISHED") === value;
                  const blocked = value === "PUBLISHED" && !course.title?.trim();
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={current || blocked}
                      title={
                        blocked ? "Nadaj tytuł, aby opublikować" : undefined
                      }
                      onClick={() => {
                        onToggleStatus(course.id);
                        onChangeStatus(course, value);
                      }}
                        className={`flex items-center gap-2 rounded-xl rounded-tr-[3px] px-2.5 py-1.5 text-left font-montserrat font-semibold text-[12px] transition-colors ${
                          current
                            ? `${def.soft} ${def.text} cursor-default`
                            : blocked
                              ? "text-brand-secondary/30 cursor-not-allowed"
                              : "text-brand-secondary/70 hover:bg-brand-primary/5 hover:text-brand-secondary"
                        }`}
                      >
                        <def.Icon size={15} weight="fill" className={def.text} />
                        {current ? `${def.label} · aktualny` : def.verb}
                      </button>
                    );
                  })}
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Usuń trwale */}
        <button
          type="button"
          title="Usuń trwale"
          aria-label="Usuń trwale"
          onClick={() => onAskDelete(course)}
          className="inline-flex items-center justify-center size-9 rounded-xl rounded-tr-[3px] bg-white/70 border border-white/60 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Modal usuwania ------------------------------ */

function DeleteModal({
  course,
  deleting,
  onCancel,
  onConfirm,
}: {
  course: AdminCourse | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!course) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [course, deleting, onCancel]);

  return (
    <Portal>
      <AnimatePresence>
        {course && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm"
            onClick={onCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl rounded-tr-none bg-white/90 backdrop-blur-2xl border border-white/60 p-6 shadow-[0_30px_70px_-24px_rgba(3,63,99,0.6)]"
            >
              <button
                type="button"
                onClick={onCancel}
                disabled={deleting}
                aria-label="Zamknij"
                className="absolute top-3.5 right-3.5 inline-flex items-center justify-center size-8 rounded-full text-brand-secondary/40 hover:bg-brand-secondary/5 hover:text-brand-secondary transition-colors disabled:opacity-40"
              >
                <X size={16} weight="bold" />
              </button>

              <span className="relative inline-flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-red-500 text-white shadow-[0_8px_22px_-6px_rgba(239,68,68,0.6)] mb-4">
                <Trash size={22} weight="fill" />
              </span>

              <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary">
                Usunąć kurs trwale?
              </h3>
              <p className="font-montserrat text-[13px] leading-relaxed text-brand-secondary/55 mt-1.5">
                Kurs{" "}
                <span className="font-bold text-brand-secondary">
                  „{course.title || "bez tytułu"}"
                </span>{" "}
                zostanie nieodwracalnie usunięty wraz z modułami i lekcjami. Tej
                operacji nie można cofnąć.
              </p>

              <div className="flex items-center gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl rounded-tr-[3px] bg-white/70 border border-white/60 font-montserrat font-bold text-[13px] text-brand-secondary/70 hover:text-brand-secondary hover:bg-white transition-colors disabled:opacity-40"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl rounded-tr-[3px] bg-red-500 text-white font-montserrat font-bold text-[13px] shadow-[0_8px_22px_-6px_rgba(239,68,68,0.6)] hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Usuwanie…
                    </>
                  ) : (
                    <>
                      <Trash size={16} weight="bold" />
                      Tak, usuń
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------ Pomocnicze ------------------------------ */

function ViewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative inline-flex items-center justify-center size-8 rounded-full transition-all overflow-hidden ${
        active
          ? "bg-brand-primary text-white border border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
          : "text-brand-secondary/45 hover:text-brand-secondary"
      }`}
    >
      {active && (
        <span className="pointer-events-none absolute -right-1 -bottom-1 size-4 rounded-full bg-brand-yellow/50 blur-[8px]" />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
