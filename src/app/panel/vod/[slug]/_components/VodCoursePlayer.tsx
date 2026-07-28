"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  Play,
  CheckCircle,
  Check,
  Clock,
  Star,
  ListChecks,
  CaretDown,
  CaretLeft,
  CaretRight,
  Lock,
  BookmarkSimple,
  ShareNetwork,
  Quotes,
  PaperPlaneTilt,
  PencilSimple,
  Trash,
  CircleNotch,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import {
  COURSE_BENEFITS,
  formatCourseDuration,
  type Course,
} from "@/app/(site)/kursy/_data/courses";
import type { PlayerCourse } from "@/lib/courses-db";
import { useFavorites } from "@/app/_components/FavoritesProvider";
import { HlsPlayer } from "./HlsPlayer";

type FlatLesson = {
  id: string;
  moduleIndex: number;
  lessonIndex: number;
  moduleTitle: string;
  title: string;
  video: string | null;
  videoHls: string | null;
  /** Globalny numer lekcji (1-based). */
  no: number;
};

// Animacja „waterfall" kart opinii — kontener stageruje dzieci po kolei.
const reviewContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const reviewItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-full font-montserrat font-semibold text-[13px] border transition-colors ${
        active
          ? "bg-brand-primary text-white border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.3)]"
          : "bg-white/70 text-brand-secondary/80 border-brand-primary/15 hover:border-brand-primary/40 hover:text-brand-secondary"
      }`}
    >
      <Icon size={16} weight={active ? "fill" : "bold"} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}

// Formularz opinii kursantki — dodanie/edycja/usunięcie własnej opinii.
// Po zapisie/usunięciu NIE odświeżamy strony (router.refresh), bo to remontuje
// odtwarzacz (świeży podpisany HLS = nowy key) — zamiast tego aktualizujemy stan
// opinii lokalnie przez callbacki onSaved/onDeleted.
function ReviewForm({
  slug,
  myReview,
  onSaved,
  onDeleted,
  onCancel,
}: {
  slug: string;
  myReview: { rating: number; text: string } | null;
  onSaved?: (review: { rating: number; text: string }) => void;
  onDeleted?: () => void;
  onCancel?: () => void;
}) {
  const editing = !!myReview;
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(myReview?.text ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (rating < 1) {
      setError("Wybierz ocenę (1–5 gwiazdek).");
      return;
    }
    if (text.trim().length < 3) {
      setError("Napisz kilka słów opinii.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/kursy/${slug}/opinie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.error || "Nie udało się zapisać opinii.");
      onSaved?.({ rating, text: text.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/kursy/${slug}/opinie`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nie udało się usunąć opinii.");
      }
      setRating(0);
      setText("");
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd usuwania.");
    } finally {
      setDeleting(false);
    }
  }

  const activeStars = hover || rating;
  const RATING_LABELS = ["", "Słabo", "Może być", "Dobrze", "Bardzo dobrze", "Super!"];

  return (
    <div className="relative overflow-hidden rounded-2xl rounded-tr-none bg-gradient-to-br from-white/95 to-white/80 border border-brand-primary/15 p-4 sm:p-5 shadow-[0_12px_40px_-26px_rgba(3,63,99,0.5)]">
      <span className="pointer-events-none absolute -right-6 -bottom-8 size-28 rounded-full bg-brand-yellow/10 blur-[28px]" />
      <p className="relative font-jakarta font-bold text-[14px] text-brand-secondary mb-3.5 inline-flex items-center gap-2">
        <span className="flex items-center justify-center size-7 rounded-xl rounded-tr-[3px] bg-brand-primary/10 text-brand-primary">
          {editing ? (
            <PencilSimple size={15} weight="bold" />
          ) : (
            <PaperPlaneTilt size={15} weight="fill" />
          )}
        </span>
        {editing ? "Edytuj swoją opinię" : "Napisz opinię"}
      </p>
      <div className="relative flex items-center gap-2 mb-3.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            const filled = activeStars >= val;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHover(val)}
                onMouseLeave={() => setHover(0)}
                whileHover={{ scale: 1.2, rotate: -6 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                aria-label={`Ocena ${val} z 5`}
                className="p-0.5"
              >
                <Star
                  size={26}
                  weight="fill"
                  className={
                    filled
                      ? "text-brand-yellow drop-shadow-[0_2px_6px_rgba(242,217,103,0.5)]"
                      : "text-brand-secondary/15"
                  }
                />
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          {activeStars > 0 && (
            <motion.span
              key={activeStars}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
              className="font-montserrat font-bold text-[12.5px] text-brand-primary"
            >
              {RATING_LABELS[activeStars]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <textarea
        id="vod-review-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Co dała Ci ta praktyka? Co najbardziej Ci pomogło?"
        className="relative w-full px-4 py-3 rounded-xl rounded-tr-[3px] bg-white/80 border border-brand-secondary/10 font-montserrat text-[13.5px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all resize-y leading-relaxed"
      />
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12.5px] text-rose-500">
          <WarningCircle size={15} weight="fill" />
          {error}
        </p>
      )}
      {/* Akcje — na mobile ikonki (oszczędność miejsca), od sm pełne etykiety. */}
      <div className="relative flex flex-wrap items-center gap-2 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || deleting}
          title={editing ? "Zapisz zmiany" : "Oceń"}
          aria-label={editing ? "Zapisz zmiany" : "Oceń"}
          className="inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[12.5px] px-3 sm:px-4 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all disabled:opacity-60"
        >
          {saving ? (
            <CircleNotch size={15} weight="bold" className="animate-spin" />
          ) : (
            <Star size={15} weight="fill" />
          )}
          <span className="hidden sm:inline">
            {editing ? "Zapisz zmiany" : "Oceń"}
          </span>
        </button>
        {editing && (
          <button
            type="button"
            onClick={remove}
            disabled={deleting || saving}
            title="Usuń opinię"
            aria-label="Usuń opinię"
            className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 font-montserrat font-bold text-[12.5px] px-3 sm:px-3.5 py-2.5 rounded-xl rounded-tr-[3px] hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-60"
          >
            {deleting ? (
              <CircleNotch size={14} weight="bold" className="animate-spin" />
            ) : (
              <Trash size={14} weight="bold" />
            )}
            <span className="hidden sm:inline">Usuń</span>
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || deleting}
            title="Anuluj"
            aria-label="Anuluj"
            className="inline-flex items-center gap-1.5 ml-auto bg-white/70 text-brand-secondary/70 font-montserrat font-bold text-[12.5px] px-3 sm:px-3.5 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-primary/15 hover:border-brand-primary/40 hover:text-brand-secondary transition-colors disabled:opacity-60"
          >
            <X size={14} weight="bold" />
            <span className="hidden sm:inline">Anuluj</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function VodCoursePlayer({
  course,
  allCourses,
  completedLessonIds,
  myReview: initialMyReview,
  viewerName = "Ty",
  initialCompleted = false,
  initialWatchedSec = 0,
  lessonSeconds = {},
  ownedProgress = {},
}: {
  course: PlayerCourse;
  allCourses: Course[];
  completedLessonIds: string[];
  myReview: { rating: number; text: string } | null;
  viewerName?: string;
  initialCompleted?: boolean;
  /** Obejrzane sekundy głównego filmu (format „single") — wznowienie pozycji. */
  initialWatchedSec?: number;
  /** Obejrzane sekundy per lekcja (kursy z modułami) — wznowienie pozycji. */
  lessonSeconds?: Record<string, number>;
  /** Postęp posiadanych kursów (slug → %) — karty „Podobne kursy". */
  ownedProgress?: Record<string, number>;
}) {
  const isSingle = course.format === "single";

  // Opinie kursantów — w lokalnym stanie (seed z bazy). Po dodaniu/edycji/usunięciu
  // własnej opinii aktualizujemy stan tutaj, BEZ router.refresh() — odświeżenie
  // remontowałoby odtwarzacz (świeży podpisany HLS = nowy key playera).
  const [reviews, setReviews] = useState<typeof course.testimonials>(
    course.testimonials,
  );
  const [myReview, setMyReview] = useState(initialMyReview);
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  // Wyodrębniamy własną opinię z listy — pokazujemy ją osobno z tagiem
  // „Twoja opinia" i akcjami edycji/usuwania, żeby nie dublowała się w liście.
  const myReviewIndex = myReview
    ? reviews.findIndex(
        (r) => r.rating === myReview.rating && r.text === myReview.text,
      )
    : -1;
  const myReviewAuthor = myReviewIndex >= 0 ? reviews[myReviewIndex].author : "Ty";
  const otherReviews =
    myReviewIndex >= 0 ? reviews.filter((_, i) => i !== myReviewIndex) : reviews;

  // Formularz opinii rozwijamy tylko gdy: brak własnej opinii (pisanie) lub
  // kursant kliknął „edytuj". Po dodaniu opinia zwija się do karty z tagiem.
  const [editingReview, setEditingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  // Usuwa własną opinię z lokalnej listy (po potwierdzeniu z API).
  const applyMyReviewRemoved = () => {
    setReviews((prev) =>
      myReview
        ? prev.filter(
            (r) => !(r.rating === myReview.rating && r.text === myReview.text),
          )
        : prev,
    );
    setMyReview(null);
    setEditingReview(false);
  };

  // Wstawia/aktualizuje własną opinię na początku lokalnej listy.
  const applyMyReviewSaved = (review: { rating: number; text: string }) => {
    setReviews((prev) => {
      const withoutMine = myReview
        ? prev.filter(
            (r) => !(r.rating === myReview.rating && r.text === myReview.text),
          )
        : prev;
      const author = myReview ? myReviewAuthor : viewerName;
      return [{ author, rating: review.rating, text: review.text }, ...withoutMine];
    });
    setMyReview(review);
    setEditingReview(false);
  };

  const deleteMyReview = async () => {
    if (deletingReview) return;
    setDeletingReview(true);
    try {
      const res = await fetch(`/api/kursy/${course.slug}/opinie`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      applyMyReviewRemoved();
    } catch {
      toast.error("Nie udało się usunąć opinii.");
    } finally {
      setDeletingReview(false);
    }
  };

  // Format „single" lub brak modułów → jeden moduł z głównym wideo kursu.
  const modules = useMemo(
    () =>
      course.modules.length
        ? course.modules
        : [
            {
              title: "Kurs",
              lessons: [
                {
                  id: "",
                  title: course.title,
                  video: course.video,
                  videoHls: course.videoHls,
                },
              ],
            },
          ],
    [course.modules, course.title, course.video],
  );

  // Podobne kursy: najpierw z tej samej kategorii, dopełnione innymi.
  const similar = useMemo(() => {
    const sameCat = allCourses.filter(
      (c) => c.slug !== course.slug && c.category === course.category,
    );
    const others = allCourses.filter(
      (c) => c.slug !== course.slug && c.category !== course.category,
    );
    return [...sameCat, ...others].slice(0, 4);
  }, [allCourses, course.slug, course.category]);

  // Spłaszczona lista lekcji do nawigacji + numeracji.
  const lessons = useMemo<FlatLesson[]>(() => {
    let no = 0;
    return modules.flatMap((mod, moduleIndex) =>
      mod.lessons.map((l, lessonIndex) => {
        no += 1;
        return {
          id: l.id,
          moduleIndex,
          lessonIndex,
          moduleTitle: mod.title,
          title: l.title,
          video: l.video,
          videoHls: l.videoHls,
          no,
        };
      }),
    );
  }, [modules]);

  const total = lessons.length;
  const [activeNo, setActiveNo] = useState(1);
  const active = lessons.find((l) => l.no === activeNo) ?? lessons[0];

  // Zapis obejrzanego czasu (throttling ~10 s robi HlsPlayer). „single" → sekundy
  // na Enrollment (courseId); kursy z modułami → sekundy na LessonProgress
  // (lessonId aktywnej lekcji). Postęp % po stronie serwera liczony jest z tych
  // sekund względem długości materiału.
  const activeLessonId = active.id;
  const saveWatchSeconds = useCallback(
    (seconds: number) => {
      const body = isSingle
        ? { courseId: course.id, seconds }
        : activeLessonId
          ? { lessonId: activeLessonId, seconds }
          : null;
      if (!body) return;
      fetch("/api/panel/vod/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    },
    [isSingle, course.id, activeLessonId],
  );

  // Pozycja wznowienia dla aktywnego materiału: single → sekundy z Enrollment,
  // lekcja → sekundy z LessonProgress (mapa z serwera).
  const resumeAt = isSingle
    ? initialWatchedSec
    : (lessonSeconds[activeLessonId] ?? 0);

  // Realny postęp z ukończonych lekcji (LessonProgress).
  const [doneIds, setDoneIds] = useState<Set<string>>(
    () => new Set(completedLessonIds),
  );
  const completed = lessons.filter((l) => l.id && doneIds.has(l.id)).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const activeDone = !!active.id && doneIds.has(active.id);

  const toggleComplete = async () => {
    if (!active.id) return; // kurs jednoodcinkowy bez rekordu lekcji
    const next = !doneIds.has(active.id);
    setDoneIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(active.id);
      else s.delete(active.id);
      return s;
    });
    try {
      await fetch("/api/panel/vod/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: active.id, completed: next }),
        keepalive: true,
      });
    } catch {
      /* offline — UI już zaktualizowane optymistycznie */
    }
  };

  const [openModule, setOpenModule] = useState<number>(active.moduleIndex);
  const [descOpen, setDescOpen] = useState(false);

  // Zapisane/ulubione — wspólny stan (gość: localStorage, zalogowany: baza).
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const saved = isFavorite(course.id);

  // Udostępnij: publiczny link do kursu — natywny share (mobile) lub schowek.
  const shareCourse = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/kursy/${course.slug}`
        : `/kursy/${course.slug}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: course.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link do kursu skopiowany do schowka");
      }
    } catch {
      /* użytkownik anulował arkusz udostępniania */
    }
  };

  // Opinie: pionowe karty, maks. 3 na stronę + paginacja.
  const REVIEWS_PER_PAGE = 3;
  const [reviewPage, setReviewPage] = useState(0);
  const reviewPages = Math.max(
    1,
    Math.ceil(otherReviews.length / REVIEWS_PER_PAGE),
  );
  const safePage = Math.min(reviewPage, reviewPages - 1);
  const visibleReviews = otherReviews.slice(
    safePage * REVIEWS_PER_PAGE,
    safePage * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE,
  );

  // started   = odtwarzacz zamontowany (po pierwszym ▶)
  // expanded  = pełny kadr — sterowany zdarzeniami play/pause odtwarzacza
  // playOnLoad = czy po (prze)montowaniu playera grać od razu. Zmiana lekcji
  //              ją wyłącza — wideo ładuje się zapauzowane (sam użytkownik klika ▶).
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playOnLoad, setPlayOnLoad] = useState(false);

  // Wybór lekcji z nawigacji/programu — bez autoplaya.
  const selectLesson = (no: number) => {
    setPlayOnLoad(false);
    setActiveNo(no);
  };

  // Prośba o opinię po zakończeniu wideo + scroll do formularza.
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  const goToReview = () => {
    setShowEndPrompt(false);
    // Jeśli kursant ma już opinię — otwórz ją od razu w trybie edycji.
    if (myReview) setEditingReview(true);
    // Scroll po renderze (formularz mógł się dopiero zamontować w trybie edycji).
    window.setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 60);
    // Po dojechaniu scrolla ustaw focus na polu tekstowym opinii.
    window.setTimeout(() => {
      document.getElementById("vod-review-input")?.focus();
    }, 650);
  };

  // Po zakończeniu lekcji: jeśli jest następna → proponujemy przejście dalej;
  // dopiero na OSTATNIEJ lekcji pokazujemy prośbę o opinię.
  const isLastLesson = active.no >= total;
  const nextLesson = lessons.find((l) => l.no === active.no + 1);

  // Auto-przejście do kolejnej lekcji: po zakończeniu odliczamy i ładujemy dalej.
  const AUTO_NEXT_SECONDS = 5;
  const [autoNextIn, setAutoNextIn] = useState<number | null>(null);

  const goToNextLesson = () => {
    setAutoNextIn(null);
    setShowEndPrompt(false);
    setPlayOnLoad(true); // kontynuacja oglądania — następna lekcja gra od razu
    setActiveNo((n) => Math.min(total, n + 1));
    setStarted(true);
    setExpanded(true);
  };
  const dismissEnd = () => {
    setAutoNextIn(null);
    setShowEndPrompt(false);
  };

  // Odliczanie auto-przejścia (tylko gdy jest następna lekcja).
  useEffect(() => {
    if (autoNextIn === null) return;
    if (autoNextIn <= 0) {
      goToNextLesson();
      return;
    }
    const t = window.setTimeout(
      () => setAutoNextIn((n) => (n === null ? null : n - 1)),
      1000,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNextIn]);

  // Ukończenie kursu (Enrollment.completedAt) — raz, idempotentnie.
  const [courseCompleted, setCourseCompleted] = useState(initialCompleted);
  const markCourseComplete = async () => {
    if (courseCompleted) return;
    setCourseCompleted(true);
    try {
      await fetch("/api/panel/vod/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
        keepalive: true,
      });
    } catch {
      /* offline — flaga lokalna już ustawiona */
    }
  };

  // Auto po zakończeniu wideo: moduły → bieżąca lekcja jako ukończona; single LUB
  // ostatnia lekcja → cały kurs ukończony; jest następna → start odliczania.
  const handleVideoEnded = () => {
    setShowEndPrompt(true);
    setExpanded(true);
    if (active.id && !doneIds.has(active.id)) {
      setDoneIds((prev) => new Set(prev).add(active.id));
      fetch("/api/panel/vod/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: active.id, completed: true }),
        keepalive: true,
      }).catch(() => {});
    }
    if (isLastLesson) {
      void markCourseComplete();
    } else {
      setAutoNextIn(AUTO_NEXT_SECONDS);
    }
  };

  // Nakładka końcowa — renderowana WEWNĄTRZ playera (widoczna też w fullscreen).
  const endOverlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-brand-secondary/85 backdrop-blur-md px-4 py-4 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-sm my-auto"
      >
        {isLastLesson ? (
          <>
            <span className="inline-flex items-center justify-center size-11 sm:size-14 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow mb-2 sm:mb-3">
              <Star size={24} weight="fill" />
            </span>
            <h3 className="font-jakarta font-bold text-white text-[16px] sm:text-[20px] leading-tight mb-1">
              To już koniec — jak Ci się podobało?
            </h3>
            <p className="font-montserrat text-white/70 text-[12px] sm:text-[13px] leading-snug mb-3 sm:mb-4">
              Twoja opinia pomoże innym wybrać ten kurs. Zajmie chwilę.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={goToReview}
                className="group relative inline-flex items-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[13px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
                <span className="relative inline-flex items-center gap-2">
                  <Star size={15} weight="fill" />
                  Oceń kurs
                </span>
              </button>
              <button
                type="button"
                onClick={dismissEnd}
                className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-[3px] border border-white/15 hover:bg-white/20 transition-colors"
              >
                Później
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="inline-flex items-center justify-center size-11 sm:size-14 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow mb-2 sm:mb-3">
              <CheckCircle size={26} weight="fill" />
            </span>
            <h3 className="font-jakarta font-bold text-white text-[16px] sm:text-[20px] leading-tight mb-1">
              Lekcja ukończona
            </h3>
            <p className="font-montserrat text-white/70 text-[12px] sm:text-[13px] leading-snug mb-1">
              {nextLesson ? (
                <>
                  Następna:{" "}
                  <span className="text-white font-semibold">
                    {nextLesson.title}
                  </span>
                </>
              ) : (
                "Przejdź do kolejnej lekcji."
              )}
            </p>
            {autoNextIn !== null && (
              <p className="font-montserrat text-white/55 text-[11.5px] mb-3 sm:mb-4">
                Automatyczne przejście za {autoNextIn}s…
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={goToNextLesson}
                className="group relative inline-flex items-center gap-2 bg-white text-brand-secondary font-montserrat font-bold text-[13px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
                <span className="relative inline-flex items-center gap-2">
                  {autoNextIn !== null
                    ? `Następna teraz (${autoNextIn})`
                    : "Następna lekcja"}
                  <ArrowRight size={15} weight="bold" />
                </span>
              </button>
              <button
                type="button"
                onClick={dismissEnd}
                className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-[3px] border border-white/15 hover:bg-white/20 transition-colors"
              >
                {autoNextIn !== null ? "Anuluj" : "Później"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="w-full">
      {/* Powrót — zwija się z animacją po starcie odtwarzania */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded
            ? "grid-rows-[0fr] opacity-0 -translate-y-1 mb-0"
            : "grid-rows-[1fr] opacity-100 mb-5"
        }`}
      >
        <div className="overflow-hidden">
          <Link
            href="/panel/vod"
            className="group inline-flex items-center gap-2 font-montserrat text-[13px] font-semibold text-brand-secondary/60 hover:text-brand-primary transition-colors"
          >
            <span className="flex items-center justify-center size-7 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft size={14} weight="bold" />
            </span>
            Wróć do biblioteki
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* PLAYER — pełna szerokość na górze. Na mobile po starcie wychodzi do
            krawędzi (immersyjnie); na desktopie play tylko odpala, nie rozciąga. */}
        <div
          className={`relative aspect-video overflow-hidden bg-brand-secondary shadow-[0_24px_60px_-30px_rgba(3,63,99,0.5)] transition-all duration-300 ease-out ${
            expanded
              ? "-mx-4 -mt-6 rounded-none lg:mx-0 lg:mt-0 lg:rounded-3xl lg:rounded-tr-none"
              : "rounded-3xl rounded-tr-none"
          }`}
        >
            {started && (active.videoHls || active.video) ? (
              <HlsPlayer
                key={active.videoHls || active.video || active.id}
                src={(active.videoHls || active.video) as string}
                isHls={!!active.videoHls}
                poster={course.image}
                autoPlay={playOnLoad}
                startAt={resumeAt}
                onPlay={() => setExpanded(true)}
                onPause={() => setExpanded(false)}
                onEnded={handleVideoEnded}
                onProgress={saveWatchSeconds}
                overlay={showEndPrompt ? endOverlay : null}
              />
            ) : (
              <>
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                {active.video && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayOnLoad(true);
                      setStarted(true);
                      setExpanded(true);
                    }}
                    aria-label="Odtwórz lekcję"
                    className="group absolute inset-0 flex items-center justify-center"
                  >
                    <span className="flex items-center justify-center size-16 md:size-20 rounded-full bg-brand-primary text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105">
                      <Play size={30} weight="fill" className="translate-x-0.5" />
                    </span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* TYTUŁ + AKCJE (YouTube-like) */}
          <div className="flex flex-col gap-4 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[22px] rounded-tr-none p-5 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]">
            <div>
              {!isSingle && (
                <div className="flex items-center gap-2 mb-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-primary/10 text-brand-primary font-montserrat font-bold text-[11px] px-2.5 py-1">
                    <ListChecks size={12} weight="bold" />
                    Lekcja {active.no}/{total}
                  </span>
                  <span className="font-montserrat text-[11.5px] text-brand-secondary/45 truncate min-w-0">
                    {course.title}
                  </span>
                </div>
              )}
              <h1 className="font-jakarta font-bold text-[19px] md:text-[22px] text-brand-secondary leading-snug">
                {isSingle ? course.title : active.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[12px] font-montserrat text-brand-secondary/50">
                <span className="inline-flex items-center rounded-full bg-brand-primary/10 text-brand-primary font-bold text-[11px] px-2.5 py-0.5">
                  {course.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star size={14} weight="fill" className="text-brand-yellow" />
                  {avgRating.toFixed(1)} ({reviewCount} opinii)
                </span>
                <span aria-hidden>·</span>
                {!isSingle && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={14} weight="duotone" className="text-brand-primary" />
                      {total} lekcji
                    </span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} weight="duotone" className="text-brand-primary" />
                  {formatCourseDuration(course.durationMin)}
                </span>
                {courseCompleted && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle size={14} weight="fill" />
                      Ukończono
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Akcje */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-primary/10">
              <ActionButton
                icon={BookmarkSimple}
                label="Zapisz"
                active={saved}
                onClick={() => toggleFavorite(course.id)}
              />
              <ActionButton
                icon={ShareNetwork}
                label="Udostępnij"
                onClick={shareCourse}
              />
            </div>
          </div>

          {/* NAWIGACJA LEKCJI — tylko gdy kurs ma wiele lekcji (nie „single") */}
          {!isSingle && (
          <div className="flex items-center justify-between gap-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[18px] rounded-tr-none px-3 sm:px-4 py-3 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]">
            <button
              type="button"
              disabled={active.no === 1}
              onClick={() => selectLesson(Math.max(1, active.no - 1))}
              className="inline-flex items-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-2 rounded-xl font-montserrat font-semibold text-[13px] text-brand-secondary hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <CaretLeft size={14} weight="bold" />
              <span className="hidden min-[420px]:inline">Poprzednia</span>
            </button>
            {active.id ? (
              <button
                type="button"
                onClick={toggleComplete}
                title={
                  activeDone
                    ? "Oznacz jako nieukończone"
                    : "Oznacz jako ukończone"
                }
                className={`inline-flex items-center gap-1.5 min-w-0 px-2.5 sm:px-3 py-2 rounded-xl font-montserrat font-semibold text-[12.5px] border transition-colors ${
                  activeDone
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-white/70 text-brand-secondary/70 border-brand-primary/15 hover:border-brand-primary/40"
                }`}
              >
                <CheckCircle
                  size={15}
                  weight={activeDone ? "fill" : "bold"}
                  className="shrink-0"
                />
                <span className="truncate">Lekcja {active.no}</span>
              </button>
            ) : (
              <span className="font-montserrat text-[12px] text-brand-secondary/45">
                {active.no} / {total}
              </span>
            )}
            <button
              type="button"
              disabled={active.no === total}
              onClick={() => selectLesson(Math.min(total, active.no + 1))}
              className="group relative inline-flex items-center gap-1.5 shrink-0 px-3 sm:px-4 py-2 rounded-xl font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden min-[420px]:inline">Następna</span>
              <CaretRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          )}

          {/* OPIS (rozwijany) */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[22px] rounded-tr-none p-5 md:p-6 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]">
            <h3 className="font-jakarta font-bold text-[16px] text-brand-secondary mb-2">
              {isSingle ? "O tym kursie" : "O tej lekcji"}
            </h3>
            <p className="font-montserrat text-[14px] leading-[1.7] text-brand-secondary/70">
              {course.excerpt}
            </p>

            <div
              className={`grid transition-all duration-300 ${
                descOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="font-montserrat font-bold text-[13px] text-brand-secondary mb-2">
                  Czego się nauczysz
                </p>
                <ul className="flex flex-col gap-2">
                  {COURSE_BENEFITS.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13.5px] leading-[1.6] text-brand-secondary/70 font-montserrat"
                    >
                      <CheckCircle
                        size={18}
                        weight="fill"
                        className="text-brand-primary shrink-0 mt-0.5"
                      />
                      {b.replace(/\*\*/g, "")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDescOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 font-montserrat font-bold text-[13px] text-brand-primary"
            >
              {descOpen ? "Pokaż mniej" : "Pokaż więcej"}
              <CaretDown
                size={13}
                weight="bold"
                className={`transition-transform ${descOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

        {/* POSTĘP + PROGRAM — pod wideo; niepotrzebne przy kursie „single" */}
        {!isSingle && (
        <aside className="flex flex-col gap-5">
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[22px] rounded-tr-none p-5 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-montserrat font-semibold text-[13px] text-brand-secondary/60">
                Twój postęp
              </span>
              <span className="font-jakarta font-bold text-[14px] text-brand-primary">
                {progress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-montserrat text-[12px] text-brand-secondary/45 mt-2">
              Ukończono {completed} z {total} lekcji
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[22px] rounded-tr-none shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-primary/10 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                Program kursu
              </h3>
            </div>
            <div className="flex flex-col">
              {modules.map((mod, mi) => {
                const isOpen = openModule === mi;
                return (
                  <div key={mi} className="border-b border-brand-primary/5 last:border-0">
                    <button
                      type="button"
                      onClick={() => setOpenModule(isOpen ? -1 : mi)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-white/40 transition-colors"
                    >
                      <span className="font-montserrat font-bold text-[13px] text-brand-secondary min-w-0 break-words">
                        {mod.title}
                      </span>
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={`text-brand-secondary/40 shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="px-2 pb-2">
                          {mod.lessons.map((lessonItem, li) => {
                            const lesson = lessons.find(
                              (l) => l.moduleIndex === mi && l.lessonIndex === li,
                            )!;
                            const isActive = lesson.no === activeNo;
                            const isDone = !!lesson.id && doneIds.has(lesson.id);
                            return (
                              <li key={li}>
                                <button
                                  type="button"
                                  onClick={() => selectLesson(lesson.no)}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                    isActive
                                      ? "bg-brand-primary/10 border border-brand-primary/20"
                                      : "hover:bg-white/50 border border-transparent"
                                  }`}
                                >
                                  <span className="shrink-0">
                                    {isDone ? (
                                      <CheckCircle
                                        size={20}
                                        weight="fill"
                                        className="text-brand-primary"
                                      />
                                    ) : isActive ? (
                                      <PlayCircle
                                        size={20}
                                        weight="fill"
                                        className="text-brand-primary"
                                      />
                                    ) : (
                                      <span className="flex items-center justify-center size-5 rounded-full border border-brand-secondary/20 text-brand-secondary/30">
                                        <Lock size={10} weight="fill" />
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    className={`font-montserrat text-[13px] leading-snug min-w-0 break-words ${
                                      isActive
                                        ? "font-semibold text-brand-secondary"
                                        : "text-brand-secondary/70"
                                    }`}
                                  >
                                    {lessonItem.title}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* OPINIE KURSANTÓW (pełna szerokość, przed podobnymi) */}
      <div className="mt-10 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[22px] rounded-tr-none p-5 md:p-6 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]">
        <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary inline-flex items-center gap-2">
            <Quotes size={20} weight="fill" className="text-brand-primary/30" />
            Opinie kursantów
          </h3>
          {reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 bg-white/70 border border-white/60 rounded-full px-3 py-1 shadow-sm">
              <Star size={14} weight="fill" className="text-brand-yellow" />
              <span className="font-jakarta font-bold text-[14px] text-brand-secondary">
                {avgRating.toFixed(1)}
              </span>
              <span className="font-montserrat text-[12px] text-brand-secondary/50">
                ({reviewCount})
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-brand-yellow/15 border border-brand-yellow/30 rounded-full px-3 py-1 font-montserrat font-semibold text-[12px] text-amber-700">
              <Star size={13} weight="fill" className="text-brand-yellow" />
              Nowość — brak ocen
            </span>
          )}
        </div>

        {reviews.length > 0 ? (
          <>
            <div className="mt-5 flex flex-col gap-3">
              {/* Twoja opinia — przypięta na górze z tagiem i akcjami edycji/usuwania */}
              {myReview && !editingReview && (
                <div className="relative overflow-hidden rounded-2xl rounded-tr-none bg-brand-primary/[0.06] border border-brand-primary/20 p-4">
                  <span className="pointer-events-none absolute -right-5 -bottom-6 size-20 rounded-full bg-brand-yellow/10 blur-[22px]" />
                  <div className="relative flex items-center justify-between gap-3 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary text-white font-montserrat font-bold text-[11px] px-2.5 py-1 border border-brand-yellow/30 shadow-[0_4px_12px_-4px_rgba(40,125,136,0.6)]">
                      <Star size={11} weight="fill" className="text-brand-yellow" />
                      Twoja opinia
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingReview(true)}
                        title="Edytuj opinię"
                        aria-label="Edytuj opinię"
                        className="inline-flex items-center justify-center size-8 rounded-full bg-white/70 border border-brand-primary/15 text-brand-secondary/70 hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                      >
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={deleteMyReview}
                        disabled={deletingReview}
                        title="Usuń opinię"
                        aria-label="Usuń opinię"
                        className="inline-flex items-center justify-center size-8 rounded-full bg-white/70 border border-brand-primary/15 text-brand-secondary/60 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        {deletingReview ? (
                          <CircleNotch
                            size={14}
                            weight="bold"
                            className="animate-spin"
                          />
                        ) : (
                          <Trash size={15} weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={13}
                        weight="fill"
                        className={
                          s < myReview.rating
                            ? "text-brand-yellow"
                            : "text-brand-secondary/15"
                        }
                      />
                    ))}
                  </div>
                  <p className="relative font-montserrat text-[13.5px] leading-[1.6] text-brand-secondary/80 mb-3">
                    {myReview.text}
                  </p>
                  <div className="relative flex items-center gap-2.5">
                    <span className="flex items-center justify-center size-8 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[13px]">
                      {myReviewAuthor.charAt(0)}
                    </span>
                    <span className="font-montserrat font-semibold text-[13px] text-brand-secondary">
                      {myReviewAuthor}
                    </span>
                  </div>
                </div>
              )}

              {/* Pozostałe opinie kursantów — maks. 3 na stronę, „waterfall" */}
              {otherReviews.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={safePage}
                  variants={reviewContainer}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-3"
                >
                  {visibleReviews.map((review, i) => (
                    <motion.div
                      key={safePage * REVIEWS_PER_PAGE + i}
                      variants={reviewItem}
                      className="rounded-2xl rounded-tr-none bg-white/60 border border-white/60 p-4"
                    >
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={13}
                        weight="fill"
                        className={
                          s < review.rating
                            ? "text-brand-yellow"
                            : "text-brand-secondary/15"
                        }
                      />
                    ))}
                  </div>
                  <p className="font-montserrat text-[13.5px] leading-[1.6] text-brand-secondary/75 mb-3">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center size-8 rounded-full bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[13px]">
                      {review.author.charAt(0)}
                    </span>
                    <span className="font-montserrat font-semibold text-[13px] text-brand-secondary">
                      {review.author}
                    </span>
                  </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
              )}
            </div>

            {/* Paginacja — tylko gdy więcej niż jedna strona opinii */}
            {reviewPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  aria-label="Poprzednie opinie"
                  className="inline-flex items-center justify-center size-8 rounded-full border border-brand-secondary/15 text-brand-secondary/70 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <span className="font-montserrat text-[12.5px] font-semibold text-brand-secondary/60">
                  {safePage + 1} / {reviewPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setReviewPage((p) => Math.min(reviewPages - 1, p + 1))
                  }
                  disabled={safePage >= reviewPages - 1}
                  aria-label="Następne opinie"
                  className="inline-flex items-center justify-center size-8 rounded-full border border-brand-secondary/15 text-brand-secondary/70 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-5 flex flex-col items-center text-center rounded-2xl rounded-tr-none bg-gradient-to-b from-white/70 to-white/30 border border-white/60 px-6 py-9">
            <span className="relative flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary mb-3.5">
              <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-7 rounded-full bg-brand-yellow/40 blur-[10px]" />
              <Quotes size={26} weight="fill" className="relative" />
            </span>
            <p className="font-jakarta font-bold text-[15.5px] text-brand-secondary mb-1">
              Jeszcze nikt nie ocenił tego kursu
            </p>
            <p className="font-montserrat text-[13px] leading-relaxed text-brand-secondary/55 max-w-[300px]">
              Bądź pierwszą osobą, która podzieli się wrażeniami — Twoja opinia
              pomoże innym wybrać dobrze.
            </p>
          </div>
        )}

        {/* Formularz opinii — pokazujemy tylko przy pisaniu nowej lub edycji własnej.
            Po dodaniu opinia zwija się do karty „Twoja opinia" wyżej. */}
        {(!myReview || editingReview) && (
          <div
            ref={reviewFormRef}
            className="mt-6 pt-5 border-t border-brand-primary/10 scroll-mt-24 -mx-5 px-px sm:mx-0 sm:px-0"
          >
            <ReviewForm
              slug={course.slug}
              myReview={myReview}
              onSaved={applyMyReviewSaved}
              onDeleted={applyMyReviewRemoved}
              onCancel={
                myReview ? () => setEditingReview(false) : undefined
              }
            />
          </div>
        )}
      </div>

      {/* PODOBNE KURSY — tylko gdy są inne kursy (nie pokazujemy pustej sekcji) */}
      {similar.length > 0 && (
      <div className="mt-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary">
            Podobne kursy
          </h3>
          <Link
            href="/panel/vod"
            className="group inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary hover:gap-2.5 transition-all"
          >
            Cała biblioteka
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {similar.map((c) => {
            // Realne posiadanie + postęp (zamiast wcześniejszej zaślepki).
            const owned = c.slug in ownedProgress;
            const prog = owned ? ownedProgress[c.slug] : undefined;
            const done = (prog ?? 0) >= 100;
            return (
              <Link
                key={c.id}
                href={owned ? `/panel/vod/${c.slug}` : `/kursy/${c.slug}`}
                className="group relative flex flex-col rounded-[20px] rounded-tr-none bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_16px_45px_-28px_rgba(3,63,99,0.35)] overflow-hidden hover:-translate-y-0.5 transition-all"
              >
                <div className="relative h-[120px] overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-transparent to-transparent" />
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-md text-brand-secondary">
                    {c.category}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center justify-center size-11 rounded-full bg-white/90 text-brand-primary shadow-xl">
                      <PlayCircle size={26} weight="fill" />
                    </span>
                  </span>
                </div>
                <div className="flex flex-col flex-1 p-3.5 gap-1.5">
                  <h4 className="font-jakarta font-bold text-[13.5px] text-brand-secondary leading-snug line-clamp-2 min-h-[36px]">
                    {c.title}
                  </h4>
                  {c.excerpt && (
                    <p className="font-montserrat text-[12px] leading-relaxed text-brand-secondary/55 line-clamp-2">
                      {c.excerpt}
                    </p>
                  )}
                  {/* Posiadany kurs → pasek postępu (po czasie); inaczej cena. */}
                  {owned ? (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-montserrat text-brand-secondary/50">
                          <Clock
                            size={11}
                            weight="duotone"
                            className="text-brand-primary"
                          />
                          {formatCourseDuration(c.durationMin)}
                        </span>
                        <span
                          className={`text-[10.5px] font-bold ${
                            done ? "text-emerald-600" : "text-brand-primary"
                          }`}
                        >
                          {done ? (
                            <span className="inline-flex items-center gap-1">
                              <Check size={11} weight="bold" />
                              Ukończony
                            </span>
                          ) : (
                            `Obejrzano ${prog ?? 0}%`
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                          style={{ width: `${prog ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-montserrat text-brand-secondary/50">
                        <Clock size={12} weight="duotone" className="text-brand-primary" />
                        {formatCourseDuration(c.durationMin)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary">
                        {c.price} zł
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
