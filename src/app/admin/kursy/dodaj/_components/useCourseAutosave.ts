"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ===========================================================================
 *  Autozapis kreatora kursu — wzorzec z edytora wydarzeń.
 *  Nowy kurs nie ma ID, więc przy pierwszym zapisie tworzymy szkic (POST,
 *  status DRAFT) i zapamiętujemy ID; kolejne zapisy lecą PATCH-em. „Opublikuj"
 *  zapisuje ze statusem PUBLISHED. Szkice są niewidoczne publicznie
 *  (getCourses filtruje status = PUBLISHED).
 * ========================================================================= */

import type {
  CourseBlock,
  CourseFaq,
} from "@/app/(site)/kursy/_data/courses";

/** `id` obecne tylko przy edycji istniejącego kursu — pozwala PATCH-owi
 *  synchronizować moduły/lekcje w miejscu (zachowuje postępy kursantów). */
export type Lesson = {
  id?: string;
  /** Stabilny klucz kliencki (React key) — niezależny od kolejności, nie trafia
   *  do API. Zapobiega mieszaniu stanu pól/uploadera przy usuwaniu lekcji. */
  _key?: string;
  title: string;
  description?: string;
  video: string;
  durationSec?: number;
};
export type CourseModule = {
  id?: string;
  /** Stabilny klucz kliencki (React key) — patrz Lesson._key. */
  _key?: string;
  title: string;
  lessons: Lesson[];
};
export type CourseFormat = "single" | "sections";
/** Pola liczbowe dopuszczają "" — pusty start formularza (bez danych-makiet). */
export type Draft = {
  title: string;
  category: string;
  price: number | "";
  durationMin: number | "";
  excerpt: string;
  format: CourseFormat;
  video: string;
  /** Długość głównego wideo (sekundy; format „single") — z Bunny. */
  videoDurationSec?: number;
  /** Okładka kursu (miniatura). Z kreatora okładki, uploadu lub kadru z wideo. */
  image: string;
  // ── SEO / Open Graph (krok „SEO") ──
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  /** Grafika OG — z kreatora OG image, uploadu lub URL. */
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  /** Treść sekcji „O kursie" na stronie sprzedażowej. null = domyślny fallback. */
  description?: CourseBlock[] | null;
  /** Opis zakładki „Zawartość" (co kurs zawiera). null = domyślny fallback. */
  content?: CourseBlock[] | null;
  /** Własne FAQ kursu. null = domyślne pytania. */
  faq?: CourseFaq[] | null;
  curriculum: CourseModule[];
};

export type SaveSource = "auto" | "manual" | "publish";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const toInt = (v: number | "") => Math.max(0, Math.round(Number(v) || 0));

/** Moduły w kształcie wymaganym przez PATCH (tytuł min. 1, lekcje z tytułem).
 *  Przy edycji przekazujemy `id` modułów/lekcji — PATCH synchronizuje je w
 *  miejscu (zachowuje postępy). Lekcję z nagraniem zostawiamy nawet bez tytułu. */
function modulesPayload(draft: Draft) {
  return draft.curriculum
    .map((m, mi) => ({
      ...(m.id ? { id: m.id } : {}),
      title: m.title.trim() || `Moduł ${mi + 1}`,
      lessons: m.lessons
        .filter((l) => l.title.trim() || l.video?.trim())
        .map((l, li) => ({
          ...(l.id ? { id: l.id } : {}),
          title: l.title.trim() || `Lekcja ${li + 1}`,
          description: l.description?.trim() || null,
          video: l.video || null,
          durationSec: l.durationSec ?? 0,
        })),
    }))
    .filter((m) => m.lessons.length > 0);
}

/** Body dla POST (tworzenie) — API mapuje `curriculum` i dopełnia braki. */
function createBody(draft: Draft, status: CourseStatus) {
  return {
    title: draft.title.trim(),
    category: draft.category.trim(),
    price: toInt(draft.price),
    durationMin: toInt(draft.durationMin),
    excerpt: draft.excerpt,
    format: draft.format,
    video: draft.video || null,
    videoDurationSec: draft.videoDurationSec ?? 0,
    image: draft.image || null,
    metaTitle: draft.metaTitle ?? "",
    metaDescription: draft.metaDescription ?? "",
    focusKeyword: draft.focusKeyword ?? "",
    ogImage: draft.ogImage ?? "",
    canonicalUrl: draft.canonicalUrl ?? "",
    noIndex: draft.noIndex ?? false,
    description: draft.description ?? null,
    content: draft.content ?? null,
    faq: draft.faq ?? null,
    status,
    // Czysta projekcja (bez klucza `_key` Reacta, spójna z PATCH) — inaczej
    // pole tylko-klienckie trafiałoby do API (POST je ignoruje, ale nie wysyłamy).
    curriculum: modulesPayload(draft),
  };
}

/** Body dla PATCH (aktualizacja) — pomija pustą kategorię, by jej nie kasować. */
function patchBody(draft: Draft, status: CourseStatus) {
  const body: Record<string, unknown> = {
    excerpt: draft.excerpt,
    price: toInt(draft.price),
    durationMin: toInt(draft.durationMin),
    format: draft.format,
    video: draft.video || null,
    videoDurationSec: draft.videoDurationSec ?? 0,
    image: draft.image || null,
    metaTitle: draft.metaTitle ?? "",
    metaDescription: draft.metaDescription ?? "",
    focusKeyword: draft.focusKeyword ?? "",
    ogImage: draft.ogImage ?? "",
    canonicalUrl: draft.canonicalUrl ?? "",
    noIndex: draft.noIndex ?? false,
    description: draft.description ?? null,
    content: draft.content ?? null,
    faq: draft.faq ?? null,
    status,
    modules: draft.format === "sections" ? modulesPayload(draft) : [],
  };
  // Pusty tytuł pomijamy — PATCH-schema wymaga min. 1 znaku, a szkic może go
  // jeszcze nie mieć (zapis np. po samym wgraniu wideo).
  if (draft.title.trim()) body.title = draft.title.trim();
  if (draft.category.trim()) body.category = draft.category.trim();
  return body;
}

const MIN_TITLE = 3;
const AUTOSAVE_MS = 30000;

type Options = {
  /** ID istniejącego szkicu (z ?draft= w URL) — kolejne zapisy lecą PATCH-em. */
  initialCourseId?: string | null;
  /** Wołane raz, gdy szkic zostaje utworzony (POST) — np. dopisanie ?draft= do URL. */
  onCourseId?: (id: string) => void;
  /** Status zapisywany przy autozapisie/„Zapisz" (nie przy publikacji). Przy
   *  edycji opublikowanego kursu = "PUBLISHED", żeby autozapis go nie cofnął
   *  do wersji roboczej. Domyślnie "DRAFT" (tworzenie nowego kursu). */
  baseStatus?: CourseStatus;
};

export function useCourseAutosave(
  draft: Draft,
  enabled: boolean,
  options?: Options,
) {
  const initialId = options?.initialCourseId ?? null;
  const [courseId, setCourseId] = useState<string | null>(initialId);
  const [savingSource, setSavingSource] = useState<SaveSource | null>(null);
  const [showAutosaveTooltip, setShowAutosaveTooltip] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idRef = useRef<string | null>(initialId);
  const inFlight = useRef(false);
  // Po publikacji nie pozwalamy autozapisowi cofnąć statusu PUBLISHED → DRAFT.
  const publishedRef = useRef(false);
  // Status dla zapisów roboczych (autozapis/„Zapisz"). Domyślnie DRAFT (nowy
  // kurs); przy edycji opublikowanego kursu ustawiany na PUBLISHED, by autozapis
  // nie cofnął publikacji. W refie — `persist` ma świeżą wartość bez nowych deps.
  const baseStatusRef = useRef<CourseStatus>(options?.baseStatus ?? "DRAFT");
  baseStatusRef.current = options?.baseStatus ?? "DRAFT";
  // Callback w refie — nie chcemy go w deps `persist` (zmienna tożsamość).
  const onCourseIdRef = useRef(options?.onCourseId);
  onCourseIdRef.current = options?.onCourseId;

  // Szkic zapisujemy, gdy jest JAKAKOLWIEK treść (np. samo wgrane wideo) — bez
  // wymogu tytułu. Tytuł obowiązkowy jest dopiero przy publikacji.
  const hasContent =
    draft.title.trim().length > 0 ||
    draft.video.trim().length > 0 ||
    draft.curriculum.some(
      (m) =>
        m.title.trim().length > 0 ||
        m.lessons.some(
          (l) => l.title.trim().length > 0 || l.video.trim().length > 0,
        ),
    );
  const canSave = hasContent;

  const persist = useCallback(
    async (status: CourseStatus, source: SaveSource) => {
      if (publishedRef.current) return idRef.current;
      // Publikacja wymaga tytułu; szkic — wystarczy jakakolwiek treść.
      if (status === "PUBLISHED" && draft.title.trim().length < MIN_TITLE) {
        if (source !== "auto")
          setError("Tytuł kursu musi mieć min. 3 znaki, aby opublikować.");
        return null;
      }
      const contentOk =
        draft.title.trim().length > 0 ||
        draft.video.trim().length > 0 ||
        draft.curriculum.some(
          (m) =>
            m.title.trim().length > 0 ||
            m.lessons.some(
              (l) => l.title.trim().length > 0 || l.video.trim().length > 0,
            ),
        );
      if (status === "DRAFT" && !contentOk) return null;
      if (inFlight.current) return null;
      inFlight.current = true;
      setSavingSource(source);
      setError(null);
      try {
        let id = idRef.current;
        if (!id) {
          const res = await fetch("/api/admin/kursy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createBody(draft, status)),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Nie udało się zapisać.");
          id = data.id as string;
          idRef.current = id;
          setCourseId(id);
          onCourseIdRef.current?.(id);
        } else {
          const res = await fetch(`/api/admin/kursy/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchBody(draft, status)),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Nie udało się zapisać.");
        }
        if (source === "publish") publishedRef.current = true;
        setLastSavedAt(new Date());
        if (source !== "publish") {
          setShowAutosaveTooltip(true);
          window.setTimeout(() => setShowAutosaveTooltip(false), 2600);
        }
        return id;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się zapisać.";
        if (source !== "auto") setError(msg);
        return null;
      } finally {
        inFlight.current = false;
        setSavingSource(null);
      }
    },
    [draft],
  );

  // Autozapis: 30 s po ostatniej zmianie (timer resetuje się przy każdej edycji).
  useEffect(() => {
    if (!enabled || !canSave) return;
    const t = window.setTimeout(() => {
      if (!inFlight.current) persist(baseStatusRef.current, "auto");
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [draft, enabled, canSave, persist]);

  return {
    courseId,
    savingSource,
    showAutosaveTooltip,
    lastSavedAt,
    error,
    canSave,
    saveDraft: () => persist(baseStatusRef.current, "manual"),
    // Natychmiastowy zapis (m.in. zaraz po przesłaniu wideo) — cicho, bez błędów.
    saveNow: () => persist(baseStatusRef.current, "auto"),
    publish: () => persist("PUBLISHED", "publish"),
  };
}
