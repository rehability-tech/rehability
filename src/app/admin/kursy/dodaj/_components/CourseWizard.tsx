"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkle,
  Check,
  X,
  ListNumbers,
  Stack,
  Article,
  Plus,
  Trash,
  CaretLeft,
  CaretRight,
  Clock,
  PlayCircle,
  CircleNotch,
  Tag,
  Coins,
  CheckCircle,
  VideoCamera,
  MagnifyingGlass,
  Globe,
  ImageSquare,
  PaintBrush,
  Eye,
  EyeSlash,
  Crop,
  FilmSlate,
  PencilSimple,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import CourseAiBriefModal from "./CourseAiBriefModal";
import { VideoUploader } from "./VideoUploader";
import OgImageCreator from "@/components/admin/seo/OgImageCreator";
import CoverCropper from "./CoverCropper";
import BlogCoverPicker from "@/app/admin/blog/dodaj/_components/BlogCoverPicker";
import {
  CourseBlockBuilder,
  FaqEditor,
  toBuilderBlocks,
  fromBuilderBlocks,
  toEditFaq,
  fromEditFaq,
  genKey,
  type EditorBlock,
  type EditFaq,
  type BlockKind,
} from "@/app/admin/kursy/_components/contentEditors";
import { geminiFetch, type RateStatus } from "@/lib/gemini/clientRateLimiter";
import NeonAiPanel, {
  type NeonStep,
  type StepStatus,
} from "@/app/admin/blog/dodaj/_components/NeonAiPanel";
import NeonInputGlow from "@/app/admin/blog/dodaj/_components/NeonInputGlow";
import Portal from "@/components/ui/Portal";
import { StartStep } from "./StartStep";
import { Select } from "./Select";
import { FloatingSaveBar } from "./FloatingSaveBar";
import { UploadTrackerContext } from "./uploadTracker";
import {
  useCourseAutosave,
  type Draft,
  type Lesson,
  type CourseModule as Module,
  type CourseFormat,
  type CourseStatus,
} from "./useCourseAutosave";
import {
  COURSE_CATEGORIES,
  formatCourseDuration,
} from "@/app/(site)/kursy/_data/courses";

const CATEGORIES = COURSE_CATEGORIES.filter((c) => c !== "Wszystkie");

// Świeże lekcja/moduł ze stabilnym kluczem klienckim (React key). Klucz jest
// niezależny od kolejności w tablicy, więc usunięcie elementu ze środka nie
// „przesuwa" stanu pól ani uploadera na sąsiedni element.
const newLesson = (): Lesson => ({ _key: genKey(), title: "", video: "" });
const newModule = (title = ""): Module => ({
  _key: genKey(),
  title,
  lessons: [newLesson()],
});

// Uzupełnia brakujące _key (np. po wczytaniu szkicu z bazy lub z mocka) — bez
// nadpisywania istniejących. Zwraca świeże obiekty (bez współdzielenia referencji).
function withCurriculumKeys(curriculum: Module[]): Module[] {
  return curriculum.map((m) => ({
    ...m,
    _key: m._key ?? m.id ?? genKey(),
    lessons: m.lessons.map((l) => ({ ...l, _key: l._key ?? l.id ?? genKey() })),
  }));
}

// Miniatura kadru z Bunny (przez proxy). Gdy kadr jeszcze nie istnieje (wideo
// w trakcie kodowania lub atrapa GUID), pokazujemy łagodny placeholder zamiast
// „zepsutego" obrazka.
function FrameThumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-brand-secondary/[0.04] text-brand-secondary/35">
        <FilmSlate size={22} weight="duotone" />
        <span className="font-montserrat text-[10px] font-semibold">
          Kadr w przygotowaniu
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

const EMPTY: Draft = {
  title: "",
  category: "",
  price: "",
  durationMin: "",
  excerpt: "",
  format: "sections",
  video: "",
  image: "",
  curriculum: [newModule()],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Autopilot AI ────────────────────────────────────────────────────────────
// Agent prowadzi przez cały kreator po prompcie: szkielet → wideo → okładka →
// dane (reveal z shimmerem) → treść (blok po bloku) → SEO → grafika OG.
type AutoPhase =
  | "idle"
  | "skeleton"
  | "video"
  | "cover"
  | "data"
  | "content"
  | "seo"
  | "og"
  | "done";

const AUTO_STEP_DEFS: { id: Exclude<AutoPhase, "idle" | "done">; label: string; detail: string }[] = [
  { id: "skeleton", label: "Szkielet kursu", detail: "AI projektuje tytuł, program i FAQ…" },
  { id: "video", label: "Nagrania", detail: "Wgraj film(y), a potem kliknij „Gotowe”." },
  { id: "cover", label: "Okładka", detail: "Wybierz okładkę lub pozwól wybrać agentowi." },
  { id: "data", label: "Dane podstawowe", detail: "Uzupełniam tytuł, kategorię, cenę i opis…" },
  { id: "content", label: "Treść „O kursie”", detail: "Copywriter pisze sekcje strony…" },
  { id: "seo", label: "SEO", detail: "Optymalizuję dane pod wyszukiwarki…" },
  { id: "og", label: "Grafika OG", detail: "Złóż grafikę OG i zaakceptuj." },
];
const AUTO_ORDER = AUTO_STEP_DEFS.map((s) => s.id) as string[];

type StepId = "start" | "program" | "dane" | "tresc" | "seo" | "podsumowanie";

const STEP_META: Record<StepId, { name: string; icon: React.ElementType }> = {
  start: { name: "Start", icon: Sparkle },
  program: { name: "Program", icon: Stack },
  dane: { name: "Dane podstawowe", icon: ListNumbers },
  tresc: { name: "Treść", icon: PencilSimple },
  seo: { name: "SEO", icon: MagnifyingGlass },
  podsumowanie: { name: "Podsumowanie", icon: Article },
};

// Kolejność kroków zależy od formatu: „jeden film" pomija Program (wideo jest
// w „Dane"); „podział na lekcje" dodaje Program PRZED Dane. Krok „Treść" (opis
// strony + FAQ) jest między Danymi a SEO; „SEO" zawsze przed Podsumowaniem.
function stepsFor(format: CourseFormat): StepId[] {
  return format === "single"
    ? ["start", "dane", "tresc", "seo", "podsumowanie"]
    : ["start", "program", "dane", "tresc", "seo", "podsumowanie"];
}
const MAX_STEPS = 6;

function clampStep(v: number, len = MAX_STEPS) {
  return Number.isInteger(v) && v >= 0 && v < len ? v : 0;
}

// URL kreatora z zachowaniem kroku, formatu (dla sidebara) i ID szkicu.
const buildUrl = (s: number, id: string | null, format: CourseFormat) =>
  `/admin/kursy/dodaj?step=${s}&format=${format}${id ? `&draft=${id}` : ""}`;

// Sygnatura wszystkich URL-i wideo (główne + lekcje) — zmiana = przesłano/usunięto
// nagranie, więc warto zapisać od razu (bez czekania na 30 s autozapisu).
function videoSignature(d: Draft) {
  return [d.video, ...d.curriculum.flatMap((m) => m.lessons.map((l) => l.video))].join(
    "|",
  );
}

// Animacje wejścia pól (stagger) — elegancki „reveal" po wejściu na krok.
const stepContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const stepItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// Wynik audytu SEO (akcja analyzeCourseSeo).
type SeoRec = {
  severity: "critical" | "warning" | "info";
  code: string;
  title: string;
  hint: string;
};
type SeoAnalysis = {
  score: number;
  summary: string;
  strengths: string[];
  recommendations: SeoRec[];
};

// Streszczenie całego kursu dla AI (SEO) — tytuł, kategoria, opis, treść strony,
// program i FAQ. `includeSeo` dokłada aktualne pola SEO (do audytu).
function buildCourseSummary(d: Draft, includeSeo = false): string {
  const blockText = (blocks: typeof d.description) =>
    (blocks ?? [])
      .map((b) =>
        b.type === "list"
          ? b.items.join(", ")
          : b.type === "spacer"
            ? ""
            : b.text,
      )
      .join("\n");
  const descText = blockText(d.description);
  const contentText = blockText(d.content);
  const program = d.curriculum
    .filter((m) => m.lessons.some((l) => l.title.trim()))
    .map(
      (m) =>
        `${m.title}: ${m.lessons
          .filter((l) => l.title.trim())
          .map((l) => l.title)
          .join(", ")}`,
    )
    .join("\n");
  const faqText = (d.faq ?? [])
    .map((f) => `P: ${f.q} O: ${f.a}`)
    .join("\n");
  return [
    `Tytuł kursu: ${d.title}`,
    d.category ? `Kategoria: ${d.category}` : "",
    d.excerpt ? `Krótki opis: ${d.excerpt}` : "",
    descText ? `Treść strony (O kursie):\n${descText}` : "",
    contentText ? `Zawartość kursu:\n${contentText}` : "",
    program ? `Program kursu:\n${program}` : "",
    faqText ? `FAQ:\n${faqText}` : "",
    includeSeo
      ? `Aktualne SEO — metaTitle: ${d.metaTitle ?? ""}; metaDescription: ${
          d.metaDescription ?? ""
        }; focusKeyword: ${d.focusKeyword ?? ""}; ogImage: ${
          d.ogImage ? "ustawione" : "brak"
        }`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function CourseWizard({
  categories = [],
}: {
  /** Istniejące kategorie z bazy — podpowiedzi obok listy statycznej. */
  categories?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lista kategorii: statyczne + dodane wcześniej (z bazy), bez duplikatów.
  const categoryOptions = [
    ...CATEGORIES,
    ...categories.filter((c) => c && !CATEGORIES.includes(c)),
  ];
  const [step, setStepState] = useState(() =>
    clampStep(Number(searchParams.get("step"))),
  );
  // Format z URL (?format=) na starcie — by po odświeżeniu (bez szkicu) stepper
  // i sidebar zgadzały się od razu; restore szkicu i tak go potem nadpisze.
  const [draft, setDraft] = useState<Draft>(() => ({
    ...EMPTY,
    format: searchParams.get("format") === "single" ? "single" : "sections",
  }));

  // Kroki zależne od formatu: single → [Start, Dane, Podsumowanie];
  // sections → [Start, Program, Dane, Podsumowanie]. `step` to indeks.
  const steps = stepsFor(draft.format);
  const stepIdx = Math.min(Math.max(step, 0), steps.length - 1);
  const currentId = steps[stepIdx];

  // ID istniejącego szkicu z URL (?draft=) — restore po odświeżeniu + PATCH zamiast POST.
  const draftIdParam = searchParams.get("draft");
  // Aktualne ID szkicu (z URL lub utworzone w trakcie) — w refie, by setStep
  // i callbacki budowały URL bez zależności od asynchronicznego stanu.
  const draftIdRef = useRef<string | null>(draftIdParam);
  // Aktualny krok w refie (callback onCourseId nie może użyć starego domknięcia).
  const stepRef = useRef(step);
  stepRef.current = step;
  // Format w refie — buildUrl w callbackach/po wyborze formatu używa świeżej wartości.
  const formatRef = useRef<CourseFormat>(draft.format);
  formatRef.current = draft.format;

  // Wczytywanie szkicu z bazy (gdy w URL jest ?draft=). Dopóki trwa, NIE
  // pozwalamy autozapisowi ruszyć — inaczej pusty formularz nadpisałby wideo.
  const [loadingDraft, setLoadingDraft] = useState<boolean>(
    Boolean(draftIdParam),
  );

  // Nawigacja kroku + synchronizacja z URL (krok + ID szkicu) — sidebar
  // podświetla aktywny krok, a odświeżenie wczytuje szkic z bazy.
  const setStep = (n: number) => {
    const next = clampStep(n, steps.length);
    setStepState(next);
    router.replace(buildUrl(next, draftIdRef.current, formatRef.current), {
      scroll: false,
    });
  };

  // Klik w krok w sidebarze (zmiana ?step=) → przełącz widok.
  useEffect(() => {
    const q = clampStep(Number(searchParams.get("step")));
    setStepState((cur) => (q !== cur ? q : cur));
  }, [searchParams]);

  // Start ma dwie fazy: metoda (AI/ręcznie) → format (jeden film/lekcje).
  const [startPhase, setStartPhase] = useState<"method" | "format">("method");
  const startMethodRef = useRef<"ai" | "manual">("manual");
  const chosenFormatRef = useRef<CourseFormat>("sections");

  // AI
  const [aiOpen, setAiOpen] = useState(false);

  // Autopilot AI — agent prowadzi przez cały kreator (patrz AutoPhase).
  const [autoPhase, setAutoPhase] = useState<AutoPhase>("idle");
  const [autoLiveMsg, setAutoLiveMsg] = useState<string | undefined>();
  // Pole odsłaniane z shimmerem w kroku „Dane" (reveal po wygenerowaniu).
  const [loadingField, setLoadingField] = useState<
    "title" | "category" | "price" | "excerpt" | null
  >(null);
  // Shimmer na wszystkich polach SEO podczas generacji metadanych.
  const [seoShimmer, setSeoShimmer] = useState(false);
  // Agent dobiera okładkę (kadr/Pexels) — blokuje przyciski przed dublem.
  const [coverAgentBusy, setCoverAgentBusy] = useState(false);
  // Modułowy kreator lekcji w popupie wideo (sections): prompt aktualnej lekcji
  // + flaga generacji tytułu/opisu z tego promptu.
  const [lessonPrompt, setLessonPrompt] = useState("");
  const [lessonGenerating, setLessonGenerating] = useState(false);
  // Kontekst (prompt + tytuł) do generacji treści/SEO w dalszych krokach.
  const autoPromptRef = useRef("");
  const isAutoRunning = autoPhase !== "idle" && autoPhase !== "done";

  // OG image (krok SEO): kreator grafiki + picker (Pexels / własne).
  const [ogCreatorOpen, setOgCreatorOpen] = useState(false);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);

  // Okładka kursu (krok „Dane"): picker Pexels/własne, kadrowanie, kadr z wideo.
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverCropOpen, setCoverCropOpen] = useState(false);
  const [coverFromVideoLoading, setCoverFromVideoLoading] = useState(false);
  // Picker kadrów: w trybie modułowym wybieramy kadr z DOWOLNEGO nagrania.
  const [framePickerOpen, setFramePickerOpen] = useState(false);

  // Status zapisywany przy autozapisie. Przy edycji istniejącego kursu = jego
  // realny status (PUBLISHED/ARCHIVED), żeby autozapis nie cofnął publikacji.
  const [baseStatus, setBaseStatus] = useState<CourseStatus>("DRAFT");

  // Edytory treści strony sprzedażowej („O kursie" + FAQ). Trzymane lokalnie z
  // `_key` (stabilne klucze Reacta); zmiany spływają do draft.description/faq
  // (Json) dla autozapisu. Seed po wczytaniu kursu (restore) — patrz niżej.
  const [descBlocks, setDescBlocks] = useState<EditorBlock[]>([]);
  const [contentBlocks, setContentBlocks] = useState<EditorBlock[]>([]);
  const [faqItems, setFaqItems] = useState<EditFaq[]>([]);
  // FAQ na starcie dostaje jeden pusty blok pytania (chyba że restore/AI dało własne).
  const faqSeededRef = useRef(false);

  // AI-SEO: auto-generacja po wejściu w krok SEO + ręczna analiza nasycenia.
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoStatusMsg, setSeoStatusMsg] = useState<string | null>(null);
  const seoAutoRef = useRef(false);
  // GUID-y wideo, dla których już odpytaliśmy Bunny o długość (dedup w sesji).
  const durationsCheckedRef = useRef<Set<string>>(new Set());
  const [seoAnalyzing, setSeoAnalyzing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null);


  // Śledzenie aktywnych przesyłań wideo (faza „uploading" we WSZYSTKICH
  // VideoUploaderach — w trybie modułowym leci ich wiele naraz). Trzymamy mapę
  // id → postęp%, by pokazać licznik i zagregowany progres w pasku akcji.
  const [activeUploads, setActiveUploads] = useState<Map<string, number>>(
    () => new Map(),
  );
  const setUploadActive = useCallback(
    (id: string, info: { active: boolean; progress: number }) => {
      setActiveUploads((prev) => {
        if (!info.active) {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        }
        if (prev.get(id) === info.progress) return prev;
        const next = new Map(prev);
        next.set(id, info.progress);
        return next;
      });
    },
    [],
  );
  const uploadCount = activeUploads.size;
  const uploadsActive = uploadCount > 0;
  const uploadProgress = uploadCount
    ? Math.round(
        [...activeUploads.values()].reduce((a, b) => a + b, 0) / uploadCount,
      )
    : 0;
  const prevUploadCount = useRef(0);
  // Po zakończeniu wgrywania pokazujemy „check" w pasku przez chwilę, potem znika.
  const [uploadJustDone, setUploadJustDone] = useState(false);
  useEffect(() => {
    if (prevUploadCount.current > 0 && activeUploads.size === 0) {
      toast.success("Przesyłanie zakończone");
      setUploadJustDone(true);
      const t = window.setTimeout(() => setUploadJustDone(false), 2600);
      prevUploadCount.current = activeUploads.size;
      return () => window.clearTimeout(t);
    }
    prevUploadCount.current = activeUploads.size;
  }, [activeUploads]);

  // Autozapis szkicu na serwerze (wzór z edytora wyjazdów) — aktywny od kroku
  // „Dane podstawowe", gdy jest co zapisać.
  const autosave = useCourseAutosave(draft, step >= 1 && !loadingDraft, {
    initialCourseId: draftIdParam,
    baseStatus,
    onCourseId: (id) => {
      // Szkic właśnie utworzony → dopisz ?draft=<id> (zachowując krok), żeby
      // odświeżenie wczytało go z bazy zamiast zaczynać od zera.
      draftIdRef.current = id;
      router.replace(buildUrl(stepRef.current, id, formatRef.current), {
        scroll: false,
      });
    },
  });
  // Trzymaj ref ID w zgodzie z hookiem (szkic z URL lub utworzony w trakcie).
  draftIdRef.current = autosave.courseId ?? draftIdParam;

  // Sygnatura wideo + najświeższy saveNow w refach (do wykrycia zmiany nagrania).
  const videoSig = videoSignature(draft);
  const prevSigRef = useRef(videoSig);
  const saveNowRef = useRef(autosave.saveNow);
  saveNowRef.current = autosave.saveNow;

  // Restore szkicu po odświeżeniu — wczytaj z bazy do `draft` (raz, wg ?draft=).
  useEffect(() => {
    if (!draftIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/kursy/${draftIdParam}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        // Tryb edycji obejmuje też kursy PUBLISHED/ARCHIVED (wejście z dashboardu
        // przez „Edytuj kurs"). Zapamiętujemy realny status jako bazowy, by
        // autozapis NIE cofnął publikacji do wersji roboczej.
        if (data?.status) setBaseStatus(data.status as CourseStatus);
        if (data?.draft) {
          const restored = { ...EMPTY, ...data.draft } as Draft;
          // Stabilne klucze klienckie dla modułów/lekcji (po wczytaniu z bazy
          // ich nie ma) — bez tego usuwanie elementów miesza stan pól/uploadera.
          restored.curriculum = withCurriculumKeys(
            restored.curriculum?.length ? restored.curriculum : EMPTY.curriculum,
          );
          // Ustaw sygnaturę przed setDraft, by restore NIE wywołał zapisu wideo.
          prevSigRef.current = videoSignature(restored);
          formatRef.current = restored.format;
          setDraft(restored);
          // Seed edytorów treści strony sprzedażowej (model z `_key`).
          setDescBlocks(toBuilderBlocks(restored.description ?? null));
          setContentBlocks(toBuilderBlocks(restored.content ?? null));
          setFaqItems(toEditFaq(restored.faq ?? null));
          // Dopisz format do URL, żeby sidebar od razu pokazał właściwe kroki.
          router.replace(
            buildUrl(stepRef.current, draftIdParam, restored.format),
            { scroll: false },
          );
        }
      } catch {
        /* brak/niedostępny szkic — zostaje pusty kreator */
      } finally {
        // Odblokuj autozapis dopiero po wczytaniu (lub jego nieudanej próbie).
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zmiana wideo (główne lub lekcji) → zapisz od razu, nie czekając 30 s.
  useEffect(() => {
    if (prevSigRef.current === videoSig) return;
    prevSigRef.current = videoSig;
    if (stepRef.current >= 1) saveNowRef.current();
  }, [videoSig]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // Edytory „O kursie"/FAQ pracują na modelu z `_key`; final Json idzie do draft.
  // Edytor bloków zapisuje wprost do descBlocks (forma funkcyjna, bez stale
  // closure). Synchronizacja do draft.description idzie osobnym efektem niżej.
  const updateFaq = (f: EditFaq[]) => {
    setFaqItems(f);
    set("faq", fromEditFaq(f));
  };

  // Synchronizacja treści „O kursie" (descBlocks) → draft.description (Json) dla
  // autozapisu/publikacji. Trzymane osobno, by builder mógł używać formy
  // funkcyjnej onChange (bez gubienia bloków przy edycji jednego z nich).
  useEffect(() => {
    set("description", fromBuilderBlocks(descBlocks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descBlocks]);

  // Analogicznie: opis zakładki „Zawartość" (contentBlocks) → draft.content.
  useEffect(() => {
    set("content", fromBuilderBlocks(contentBlocks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentBlocks]);

  // Okładka z kadru nagrania — pull zone Bunny blokuje bezpośredni dostęp i
  // token wygasa, więc serwer pobiera kadr i kopiuje go do magazynu (trwały URL).
  // Wymaga zapisanego kursu (id) z wgranym wideo.
  const useVideoFrame = async (guid?: string) => {
    const id = draftIdRef.current;
    if (!id || coverFromVideoLoading) return;
    setCoverFromVideoLoading(true);
    try {
      const res = await fetch(`/api/admin/kursy/${id}/cover-from-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guid ? { guid } : {}),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.url)
        throw new Error(d?.error || "Nie udało się pobrać kadru z wideo.");
      set("image", d.url);
      setFramePickerOpen(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Nie udało się pobrać kadru z wideo.",
      );
    } finally {
      setCoverFromVideoLoading(false);
    }
  };

  // Generacja SEO przez AI na bazie CAŁEJ treści kursu (auto po wejściu w krok
  // SEO + ręczny przycisk). `auto` = ciche (bez toastów sukcesu).
  const generateSeo = async (auto = false) => {
    if (seoGenerating) return;
    setSeoGenerating(true);
    setSeoStatusMsg("Łączenie z AI…");
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: buildCourseSummary(draft),
            action: "generateCourseSeo",
          }),
        },
        {
          onStatus: (s) =>
            setSeoStatusMsg(
              s.kind === "waiting"
                ? `Limit AI — wznawiam za ${s.countdown}s`
                : "AI analizuje treść i optymalizuje SEO…",
            ),
        },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Błąd generowania SEO.");
      }
      const seo = (await res.json()) as {
        metaTitle?: string;
        metaDescription?: string;
        focusKeyword?: string;
      };
      if (seo.metaTitle) set("metaTitle", seo.metaTitle);
      if (seo.metaDescription) set("metaDescription", seo.metaDescription);
      if (seo.focusKeyword) set("focusKeyword", seo.focusKeyword);
      if (!auto) toast.success("Wygenerowano dane SEO z treści kursu.");
    } catch (e) {
      if (!auto)
        toast.error(
          e instanceof Error ? e.message : "Nie udało się wygenerować SEO.",
        );
    } finally {
      setSeoGenerating(false);
      setSeoStatusMsg(null);
    }
  };

  // Audyt SEO: ocena + rekomendacje, w tym nasycenie treści frazą kluczową.
  const analyzeSeo = async () => {
    if (seoAnalyzing) return;
    setSeoAnalyzing(true);
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: buildCourseSummary(draft, true),
            action: "analyzeCourseSeo",
          }),
        },
        { onStatus: () => {} },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Błąd analizy SEO.");
      }
      setSeoAnalysis((await res.json()) as SeoAnalysis);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Nie udało się przeanalizować SEO.",
      );
    } finally {
      setSeoAnalyzing(false);
    }
  };

  // FAQ startuje z jednym pustym blokiem pytania (chyba że restore/AI dało własne).
  useEffect(() => {
    if (loadingDraft || faqSeededRef.current) return;
    faqSeededRef.current = true;
    setFaqItems((cur) =>
      cur.length === 0 ? [{ _key: genKey(), q: "", a: "" }] : cur,
    );
  }, [loadingDraft]);

  // Auto-generacja SEO po pierwszym wejściu w krok SEO — tylko gdy pola SEO są
  // jeszcze puste i jest tytuł (jest z czego budować).
  useEffect(() => {
    if (currentId !== "seo" || seoAutoRef.current || loadingDraft) return;
    const hasSeo =
      !!draft.metaTitle?.trim() ||
      !!draft.metaDescription?.trim() ||
      !!draft.focusKeyword?.trim();
    if (hasSeo || !draft.title.trim()) {
      seoAutoRef.current = true;
      return;
    }
    seoAutoRef.current = true;
    generateSeo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, loadingDraft]);

  // Odświeżenie czasu materiału po wejściu na krok „Dane" — niezależnie od tego,
  // czy VideoUploader jest zamontowany (lekcje żyją na kroku „Program"). Dla
  // wideo bez znanej długości pytamy Bunny i uzupełniamy draft (autozapis utrwali).
  useEffect(() => {
    if (currentId !== "dane" || loadingDraft) return;
    let cancelled = false;

    const guidOf = (url?: string | null) =>
      url && url.includes("iframe.mediadelivery.net")
        ? (url.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null)
        : null;

    const fetchLen = async (guid: string): Promise<number | null> => {
      try {
        const res = await fetch(
          `/api/admin/kursy/bunny-status?videoId=${encodeURIComponent(guid)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.ready &&
          typeof data.length === "number" &&
          data.length > 0
          ? data.length
          : null;
      } catch {
        return null;
      }
    };

    // GUID trafia do `durationsCheckedRef` DOPIERO po udanym odczycie długości.
    // Wideo wciąż przetwarzane (fetchLen === null) zostawiamy do ponowienia —
    // pollujemy co POLL_MS, aż wszystkie lekcje zgłoszą swoją długość.
    const POLL_MS = 5000;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      if (cancelled) return;

      if (draft.format === "single") {
        if ((draft.videoDurationSec ?? 0) > 0) return;
        const guid = guidOf(draft.video);
        if (!guid) return;
        const len = await fetchLen(guid);
        if (cancelled) return;
        if (len) {
          durationsCheckedRef.current.add(guid);
          set("videoDurationSec", len);
          return;
        }
        timer = setTimeout(run, POLL_MS); // wciąż przetwarzane — ponów
        return;
      }

      // sections — dociągnij brakujące długości WSZYSTKICH lekcji (po GUID).
      const lessons = draft.curriculum.flatMap((m) => m.lessons);
      let pending = false;
      for (const lesson of lessons) {
        if (cancelled) return;
        if ((lesson.durationSec ?? 0) > 0) continue;
        const guid = guidOf(lesson.video);
        if (!guid || durationsCheckedRef.current.has(guid)) continue;
        const len = await fetchLen(guid);
        if (cancelled) return;
        if (!len) {
          pending = true; // wideo wciąż przetwarzane — spróbujemy ponownie
          continue;
        }
        durationsCheckedRef.current.add(guid);
        setDraft((d) => ({
          ...d,
          curriculum: d.curriculum.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              guidOf(l.video) === guid ? { ...l, durationSec: len } : l,
            ),
          })),
        }));
      }
      if (pending && !cancelled) timer = setTimeout(run, POLL_MS);
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, loadingDraft]);

  const lessonCount = draft.curriculum.reduce(
    (s, m) => s + m.lessons.filter((l) => l.title.trim()).length,
    0,
  );

  // Łączny czas materiału z realnych długości wideo (Bunny). Aktualizuje się,
  // gdy nagrania kończą przetwarzanie i zgłaszają długość.
  const totalDurationSec =
    draft.format === "single"
      ? draft.videoDurationSec ?? 0
      : draft.curriculum.reduce(
          (s, m) => s + m.lessons.reduce((ls, l) => ls + (l.durationSec ?? 0), 0),
          0,
        );
  // Poniżej minuty zaokrąglamy w górę do 1 min (spójnie z API).
  const totalDurationMin =
    totalDurationSec > 0 ? Math.max(1, Math.round(totalDurationSec / 60)) : 0;

  // Miniatura do podglądu karty — automatyczna miniatura Bunny z wgranego wideo
  // (single: główne; lekcje: pierwsze nagranie). Tak jak na froncie.
  const previewVideoUrl =
    draft.video ||
    draft.curriculum.flatMap((m) => m.lessons).find((l) => l.video)?.video ||
    "";
  const previewGuid =
    previewVideoUrl.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null;
  // Proxy serwerowe (pull zone Bunny blokuje bezpośredni dostęp z przeglądarki).
  const previewThumb = previewGuid
    ? `/api/admin/kursy/thumbnail?guid=${encodeURIComponent(previewGuid)}`
    : "";
  const [thumbBroken, setThumbBroken] = useState(false);

  // Kandydaci na kadr-okładkę: główne wideo (single) + każda lekcja z nagraniem
  // (moduły). Miniatury z publicznego CDN Bunny — wyświetlalne wprost w <img>.
  const frameCandidates = useMemo(() => {
    const guidOf = (url: string | null | undefined) =>
      url?.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null;
    const out: { guid: string; thumb: string; label: string }[] = [];
    const seen = new Set<string>();
    const push = (url: string | null | undefined, label: string) => {
      const guid = guidOf(url);
      if (!guid || seen.has(guid)) return;
      seen.add(guid);
      // Proxy serwerowe — pull zone Bunny blokuje bezpośredni dostęp z przeglądarki.
      out.push({
        guid,
        thumb: `/api/admin/kursy/thumbnail?guid=${encodeURIComponent(guid)}`,
        label,
      });
    };
    if (draft.format === "single") {
      push(draft.video, "Nagranie kursu");
    } else {
      draft.curriculum.forEach((m, mi) =>
        m.lessons.forEach((l, li) =>
          push(l.video, l.title.trim() || `Moduł ${mi + 1} · lekcja ${li + 1}`),
        ),
      );
    }
    return out;
  }, [draft.format, draft.video, draft.curriculum]);

  // Start, faza „metoda": zapamiętaj wybór i przejdź do pytania o format.
  const pickMethod = (m: "ai" | "manual") => {
    startMethodRef.current = m;
    setStartPhase("format");
  };

  // Start, faza „format": ustaw format i ruszamy — AI otwiera modal, ręczny od
  // razu wchodzi w pierwszy krok (Program dla lekcji / Dane dla jednego filmu).
  const pickFormat = (f: CourseFormat) => {
    set("format", f);
    chosenFormatRef.current = f;
    formatRef.current = f; // synchronicznie, by buildUrl miał już nowy format
    if (startMethodRef.current === "ai") setAiOpen(true);
    else setStep(1);
  };

  // Wstecz/Anuluj z uwzględnieniem dwufazowego Startu.
  const goBack = () => {
    if (currentId === "start") {
      if (startPhase === "format") setStartPhase("method");
      else router.push("/admin/kursy");
      return;
    }
    if (stepIdx === 1) setStartPhase("format"); // wracając na Start → wybór formatu
    setStep(stepIdx - 1);
  };

  // ─── Autopilot AI: orkiestracja całego kreatora ───────────────────────────
  const JSON_HEADERS = { "Content-Type": "application/json" } as const;

  // Komunikat „na żywo" w panelu agenta — przy limicie Gemini pokazuje odliczanie.
  const autoRateStatus = (resume: string) => (s: RateStatus) =>
    setAutoLiveMsg(
      s.kind === "waiting" ? `Limit AI — wznawiam za ${s.countdown}s` : resume,
    );

  // Nawigacja po krokach kreatora po ID (kolejność zależy od formatu).
  const goToStep = (id: StepId) =>
    setStep(stepsFor(formatRef.current).indexOf(id));

  // Treść „O kursie" blok po bloku: plan (blueprint) → każdy blok osobno, z
  // shimmerem i scrollem do generowanego elementu (jak w edytorze bloga).
  const runContentBlocks = async () => {
    const ctx = autoPromptRef.current;
    setAutoLiveMsg("Układam sekcje strony…");
    const VALID: BlockKind[] = [
      "heading",
      "paragraph",
      "highlight",
      "list",
      "quote",
      "spacer",
    ];
    let blueprint: { type: BlockKind; topic: string }[] = [];
    try {
      const bp = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ prompt: ctx, action: "generateCourseBlueprint" }),
        },
        { onStatus: autoRateStatus("Układam sekcje strony…") },
      );
      if (bp.ok) {
        const data = await bp.json();
        blueprint = (Array.isArray(data?.blueprint) ? data.blueprint : []).filter(
          (s: { type?: BlockKind }) => s?.type && VALID.includes(s.type),
        );
      }
    } catch {
      /* brak planu — fallback niżej */
    }
    if (!blueprint.length) {
      // Fallback: jeden akapit z excerptu, żeby krok nie został pusty.
      setDescBlocks([
        { _key: genKey(), type: "paragraph", content: { text: draft.excerpt || "" } },
      ]);
      return;
    }

    let blocks: EditorBlock[] = [];
    for (let i = 0; i < blueprint.length; i++) {
      const step = blueprint[i];
      const key = genKey();
      const base =
        step.type === "list" ? { items: [] } : step.type === "spacer" ? {} : { text: "" };
      blocks = [
        ...blocks,
        { _key: key, type: step.type, content: base, isGenerating: step.type !== "spacer" },
      ];
      setDescBlocks(blocks);
      setAutoLiveMsg(`Piszę sekcję ${i + 1}/${blueprint.length}…`);
      await sleep(120);
      document
        .getElementById(key)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Pauza, żeby szkielet bloku był widoczny zanim wskoczy treść.
      await sleep(400);
      if (step.type === "spacer") {
        await sleep(250);
        continue;
      }
      try {
        const res = await geminiFetch(
          "/api/admin/gemini",
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({
              action: "generateCourseSingleBlock",
              prompt: ctx,
              overallContext: ctx,
              blockType: step.type,
              topic: step.topic,
            }),
          },
          { onStatus: autoRateStatus("Copywriter wraca do pracy…") },
        );
        let content: Record<string, unknown> = res.ok ? await res.json() : {};
        // Rozpakuj ewentualne zagnieżdżenia (content / nazwa bloku) — jak na blogu.
        const c = content as Record<string, unknown>;
        if (c.content && typeof c.content === "object" && !Array.isArray(c.content))
          content = c.content as Record<string, unknown>;
        if (
          content[step.type] &&
          typeof content[step.type] === "object" &&
          !Array.isArray(content[step.type])
        )
          content = content[step.type] as Record<string, unknown>;
        if ("type" in content) delete content.type;

        let mapped: EditorBlock["content"];
        if (step.type === "list") {
          const items = Array.isArray(content.items) ? content.items : [];
          const mappedItems = items
            .map((it: unknown, idx: number) => ({
              id: String((it as { id?: unknown })?.id ?? idx + 1),
              text:
                typeof it === "string"
                  ? it
                  : ((it as { text?: string })?.text ?? ""),
            }))
            .filter((it) => it.text);
          mapped = { items: mappedItems.length ? mappedItems : [{ id: "1", text: "" }] };
        } else {
          const text =
            typeof content === "string" ? content : ((content.text as string) ?? "");
          mapped = { text };
        }
        blocks = blocks.map((b) =>
          b._key === key ? { ...b, content: mapped, isGenerating: false } : b,
        );
        setDescBlocks(blocks);
      } catch {
        blocks = blocks.map((b) =>
          b._key === key
            ? {
                ...b,
                content: { text: "Nie udało się wygenerować — usuń i spróbuj ponownie." },
                isGenerating: false,
              }
            : b,
        );
        setDescBlocks(blocks);
      }
      // Oddech między blokami — żeby generacja nie „przelatywała" za szybko.
      await sleep(550);
    }
  };

  // Zakończenie autopilota — przejście na podsumowanie, panel znika po chwili.
  const finishAutopilot = () => {
    setOgCreatorOpen(false);
    setSeoShimmer(false);
    setLoadingField(null);
    setAutoPhase("done");
    setAutoLiveMsg(undefined);
    goToStep("podsumowanie");
    // Utrwal finalny stan (m.in. ogImage) zanim agent zniknie.
    saveNowRef.current();
    toast.success("Kurs wygenerowany przez AI ✨");
    window.setTimeout(() => setAutoPhase("idle"), 3000);
  };

  // „Ogon" generacji (bez przerw na akcję usera): Dane → Treść → SEO → OG.
  const runGenerationTail = async () => {
    try {
      // Dane podstawowe — wartości już w draft (ze szkieletu), odsłaniamy z shimmerem.
      setAutoPhase("data");
      goToStep("dane");
      await sleep(500);
      for (const f of ["title", "category", "price", "excerpt"] as const) {
        setLoadingField(f);
        await sleep(750);
        setLoadingField(null);
        await sleep(300);
      }
      // Treść „O kursie" — blok po bloku.
      setAutoPhase("content");
      goToStep("tresc");
      await sleep(350);
      await runContentBlocks();
      // SEO — wygeneruj metadane z całej treści. Ustaw flagę PRZED nawigacją,
      // żeby efekt auto-SEO (na wejściu w krok) nie odpalił drugiej generacji.
      seoAutoRef.current = true;
      setAutoPhase("seo");
      goToStep("seo");
      await sleep(500);
      setSeoShimmer(true);
      await generateSeo(true);
      setSeoShimmer(false);
      // Utrwal całą treść + SEO przed krokiem OG (gwarancja zapisu szkicu).
      await saveNowRef.current();
      // OG image — branded szablon do zaakceptowania.
      setAutoPhase("og");
      setAutoLiveMsg("Złóż grafikę OG i zaakceptuj.");
      setOgCreatorOpen(true);
    } catch (e) {
      setSeoShimmer(false);
      setLoadingField(null);
      toast.error(e instanceof Error ? e.message : "Błąd autopilota.");
      finishAutopilot();
    }
  };

  // Krok wideo zaakceptowany → pytanie o okładkę.
  const acceptVideos = () => {
    setAutoPhase("cover");
    setAutoLiveMsg("Wybierz okładkę lub pozwól wybrać agentowi.");
  };

  // ── Modułowy kreator lekcji (popup wideo, format „sections") ──────────────
  // „Aktualna" lekcja = ostatnia lekcja ostatniego modułu (tę właśnie budujemy).
  const updateModuleTitle = (mi: number, title: string) =>
    set(
      "curriculum",
      draft.curriculum.map((m, i) => (i === mi ? { ...m, title } : m)),
    );

  const updateCurrentLesson = (patch: Partial<Lesson>) =>
    setDraft((d) => {
      const cur = [...d.curriculum];
      const mi = cur.length - 1;
      if (mi < 0) return d;
      const lessons = [...cur[mi].lessons];
      const li = lessons.length - 1;
      if (li < 0) return d;
      lessons[li] = { ...lessons[li], ...patch };
      cur[mi] = { ...cur[mi], lessons };
      return { ...d, curriculum: cur };
    });

  const addLessonToCurrent = () => {
    setDraft((d) => {
      const cur = [...d.curriculum];
      const mi = cur.length - 1;
      if (mi < 0) return d;
      cur[mi] = { ...cur[mi], lessons: [...cur[mi].lessons, newLesson()] };
      return { ...d, curriculum: cur };
    });
    setLessonPrompt("");
  };

  const addNewModule = () => {
    setDraft((d) => ({
      ...d,
      curriculum: [...d.curriculum, newModule(`Moduł ${d.curriculum.length + 1}`)],
    }));
    setLessonPrompt("");
  };

  // Generuje tytuł + opis aktualnej lekcji z promptu twórcy.
  const generateLessonMetaNow = async () => {
    if (!lessonPrompt.trim() || lessonGenerating) return;
    setLessonGenerating(true);
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            prompt: lessonPrompt,
            overallContext: autoPromptRef.current,
            action: "generateLessonMeta",
          }),
        },
        { onStatus: () => {} },
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { title?: string; description?: string };
      updateCurrentLesson({
        title: (data.title ?? "").trim(),
        description: (data.description ?? "").trim(),
      });
    } catch {
      toast.error("Nie udało się wygenerować tytułu i opisu lekcji.");
    } finally {
      setLessonGenerating(false);
    }
  };

  // Dalej po wyborze okładki (ręcznie lub przez agenta).
  const proceedAfterCover = () => {
    runGenerationTail();
  };

  // Agent dobiera okładkę: najpierw kadr z wideo (Bunny), fallback → Pexels.
  const pickCoverAgent = async () => {
    if (coverAgentBusy) return;
    setCoverAgentBusy(true);
    setAutoLiveMsg("Dobieram okładkę…");
    let ok = false;
    const id = draftIdRef.current;
    if (id && frameCandidates.length) {
      try {
        const res = await fetch(`/api/admin/kursy/${id}/cover-from-video`, {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ guid: frameCandidates[0].guid }),
        });
        const d = await res.json().catch(() => null);
        if (res.ok && d?.url) {
          set("image", d.url);
          ok = true;
        }
      } catch {
        /* spróbujemy Pexels */
      }
    }
    if (!ok) {
      try {
        // Fraza dla Pexels MUSI być wizualna i na temat — nazwa kategorii
        // (np. „Prewencja") albo długi tytuł dawały losowe wyniki (miasta,
        // budynki). Mapujemy kategorię na pewny, obrazowy zwrot.
        const COVER_QUERY: Record<string, string> = {
          Fizjoterapia: "physiotherapy exercise",
          Prewencja: "home stretching exercise",
          Automasaż: "face massage wellness",
          Mobilność: "mobility stretching workout",
          "Relaks i stres": "relaxation yoga calm",
        };
        const term = COVER_QUERY[draft.category] || "physiotherapy home exercise";
        const q = encodeURIComponent(term);
        const r = await fetch(`/api/admin/pexels?query=${q}&page=1`);
        const data = await r.json().catch(() => null);
        const photo = data?.photos?.[0];
        if (photo?.full) {
          const imp = await fetch("/api/admin/blog/import-image", {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ url: photo.full, filename: term }),
          });
          const idata = await imp.json().catch(() => null);
          if (imp.ok && idata?.url) set("image", idata.url);
        }
      } catch {
        /* brak okładki — user doda ręcznie później */
      }
    }
    setCoverAgentBusy(false);
    proceedAfterCover();
  };

  // Start autopilota (z modala AI): generuje szkielet i przechodzi do wideo.
  const startAutopilot = async (p: string) => {
    const format = chosenFormatRef.current;
    const userPrompt = [
      format === "single"
        ? "Format kursu: jeden film (całość to jedno nagranie, BEZ podziału na moduły i lekcje)."
        : "Format kursu: podział na moduły i lekcje.",
      `Dostępne kategorie (wybierz dokładnie jedną, najlepiej pasującą): ${categoryOptions.join(", ")}.`,
      "",
      "Opis kursu od użytkownika:",
      p.trim(),
    ].join("\n");
    autoPromptRef.current = userPrompt;
    setAutoPhase("skeleton");
    setAutoLiveMsg("AI projektuje szkielet kursu…");
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ prompt: userPrompt, action: "generateCourse" }),
        },
        { onStatus: autoRateStatus("AI projektuje szkielet kursu…") },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Nie udało się wygenerować kursu.");
      }
      const gen = (await res.json()) as {
        title?: string;
        category?: string;
        price?: number;
        excerpt?: string;
        faq?: Draft["faq"];
        curriculum?: {
          title?: string;
          lessons?: { title?: string; description?: string }[];
        }[];
      };

      // Format „sections": program budujemy modułowo w popupie wideo (lekcja po
      // lekcji, z generacją tytułu/opisu z promptu), więc startujemy od jednego
      // pustego modułu — nie z programu wymyślonego przez generateCourse.
      const curriculum: Module[] = [newModule("Moduł 1")];

      setDraft({
        ...EMPTY,
        format,
        title: gen.title?.trim() || "",
        category: gen.category?.trim() || "",
        price: typeof gen.price === "number" && gen.price >= 0 ? gen.price : "",
        excerpt: gen.excerpt?.trim() || "",
        faq: Array.isArray(gen.faq) ? gen.faq : null,
        curriculum,
      });
      setFaqItems(toEditFaq(Array.isArray(gen.faq) ? gen.faq : null));
      faqSeededRef.current = true;
      // Dołóż tytuł do kontekstu — bogatszy brief dla treści i SEO.
      autoPromptRef.current = `${userPrompt}\n\nTytuł kursu: ${gen.title ?? ""}`;

      setLessonPrompt("");
      setAiOpen(false);
      setAutoPhase("video");
      // Pod spodem ustawiamy krok „Dane" (modal wgrywania wideo go zakrywa).
      goToStep("dane");
      setAutoLiveMsg("Wgraj nagranie(a), a potem kliknij „Gotowe”.");
      // Utwórz szkic na serwerze OD RAZU (POST). Autozapis jest debounce'owany
      // 30 s i resetuje się przy każdej zmianie draftu w trakcie generacji, więc
      // bez wymuszenia kurs mógłby nie zapisać się wcale.
      await sleep(50);
      saveNowRef.current();
    } catch (e) {
      setAiOpen(false);
      setAutoPhase("idle");
      toast.error(
        e instanceof Error ? e.message : "Nie udało się wygenerować kursu.",
      );
    }
  };

  // Status kroków agenta dla panelu (pochodna autoPhase).
  const autoStepsLive: (NeonStep & { status: StepStatus })[] = AUTO_STEP_DEFS.map(
    (s) => {
      const i = AUTO_ORDER.indexOf(s.id);
      const cur = AUTO_ORDER.indexOf(autoPhase);
      const status: StepStatus =
        autoPhase === "done"
          ? "done"
          : cur < 0
            ? "pending"
            : i < cur
              ? "done"
              : i === cur
                ? "active"
                : "pending";
      return { ...s, status };
    },
  );

  // Statystyki nagrań do podsumowania.
  const modulesWithLessons = draft.curriculum.filter((m) =>
    m.lessons.some((l) => l.title.trim()),
  ).length;
  const lessonsWithVideo = draft.curriculum.reduce(
    (s, m) => s + m.lessons.filter((l) => l.title.trim() && l.video).length,
    0,
  );
  const videoReady =
    draft.format === "single"
      ? !!draft.video
      : lessonCount > 0 && lessonsWithVideo === lessonCount;

  // Treść strony + FAQ są WYMAGANE do publikacji (bramka też po stronie API).
  const hasDescription =
    Array.isArray(draft.description) && draft.description.length > 0;
  const hasFaq = Array.isArray(draft.faq) && draft.faq.length > 0;
  // ── Bramka publikacji: krytyczne dane, bez których kurs nie może wyjść na
  // produkcję. Każdy brak ma etykietę i krok, do którego prowadzi link w
  // podsumowaniu. TE SAME reguły pilnuje serwer (API) — klient da się obejść.
  const publishBlockers: { label: string; step: StepId }[] = [
    draft.title.trim().length < 3 && {
      label: "Tytuł kursu (min. 3 znaki)",
      step: "dane" as StepId,
    },
    !draft.category.trim() && { label: "Kategoria", step: "dane" as StepId },
    draft.price === "" && { label: "Cena", step: "dane" as StepId },
    !draft.excerpt.trim() && {
      label: "Krótki opis (excerpt)",
      step: "dane" as StepId,
    },
    !draft.image?.trim() && {
      label: "Okładka kursu",
      step: "dane" as StepId,
    },
    !videoReady && {
      label:
        draft.format === "single"
          ? "Wideo kursu"
          : "Nagrania wszystkich lekcji",
      step: (draft.format === "single" ? "dane" : "program") as StepId,
    },
    !hasDescription && {
      label: "Treść „O kursie”",
      step: "tresc" as StepId,
    },
    !hasFaq && { label: "Sekcja FAQ", step: "tresc" as StepId },
    !draft.ogImage?.trim() && {
      label: "Grafika OG (social media)",
      step: "seo" as StepId,
    },
  ].filter(Boolean) as { label: string; step: StepId }[];
  const canPublish = publishBlockers.length === 0;

  // Zalecane (nie blokują) — podpowiadamy, ale pozwalamy opublikować.
  const publishWarnings: { label: string; step: StepId }[] = [
    !draft.metaTitle?.trim() && {
      label: "Meta tytuł (SEO)",
      step: "seo" as StepId,
    },
    !draft.metaDescription?.trim() && {
      label: "Meta opis (SEO)",
      step: "seo" as StepId,
    },
    (draft.durationMin === "" || Number(draft.durationMin) <= 0) &&
      totalDurationMin <= 0 && {
        label: "Czas trwania kursu",
        step: "dane" as StepId,
      },
  ].filter(Boolean) as { label: string; step: StepId }[];

  // Publikacja: domyka szkic statusem PUBLISHED (POST jeśli szkic nie istniał,
  // inaczej PATCH istniejącego). Logika tworzenia/aktualizacji w hooku.
  const publish = async () => {
    if (publishBlockers.length > 0) {
      toast.error(
        `Publikacja niemożliwa — uzupełnij: ${publishBlockers
          .map((b) => b.label)
          .join(", ")}.`,
      );
      return;
    }
    const id = await autosave.publish();
    if (id) router.push("/admin/kursy");
  };

  const canNext = currentId === "dane" ? draft.title.trim().length > 2 : true;

  return (
    <UploadTrackerContext.Provider value={setUploadActive}>
    <div className="w-full pb-24">
      {/* AUTOPILOT: pływający panel agenta (przez Portal — poza drzewem layoutu) */}
      <AnimatePresence>
        {autoPhase !== "idle" && (
          <Portal>
            <NeonAiPanel
              title="Agent AI · Kurs"
              steps={autoStepsLive}
              liveMessage={autoLiveMsg}
              onAbort={() => {
                setAutoPhase("idle");
                setAutoLiveMsg(undefined);
                setLoadingField(null);
                setSeoShimmer(false);
              }}
            />
          </Portal>
        )}
      </AnimatePresence>

      {/* AUTOPILOT: wgrywanie nagrań (popup) */}
      <AnimatePresence>
        {autoPhase === "video" && (
          <Portal>
            <motion.div
              key="auto-video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-secondary/40 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/60 rounded-t-3xl sm:rounded-3xl sm:rounded-tr-none shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                  <span className="relative flex items-center justify-center size-10 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary text-white border border-brand-yellow/30">
                    <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[8px]" />
                    <VideoCamera size={20} weight="duotone" className="relative" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-jakarta font-bold text-brand-secondary leading-tight">
                      Wgraj nagrania
                    </h3>
                    <p className="text-[12px] text-gray-500 font-montserrat mt-0.5">
                      {draft.format === "single"
                        ? "Wideo kursu — jeden film."
                        : "Po jednym nagraniu do każdej lekcji."}{" "}
                      Kodowanie idzie w tle.
                    </p>
                  </div>
                </div>

                {/* Body (scroll) */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4">
                  {draft.format === "single" ? (
                    <VideoUploader
                      value={draft.video}
                      onChange={(url) => set("video", url)}
                      onDuration={(s) => set("videoDurationSec", s)}
                      label="Wideo kursu"
                      hint="Główny (i jedyny) film kursu. MP4 / MOV / WEBM — leci prosto do magazynu."
                    />
                  ) : (
                    draft.curriculum.map((mod, mi) => {
                      const isLastModule = mi === draft.curriculum.length - 1;
                      return (
                        <div
                          key={mod._key ?? mod.id ?? mi}
                          className="rounded-2xl rounded-tr-none border border-gray-100 bg-gray-50/50 p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex items-center justify-center size-6 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[11px]">
                              {mi + 1}
                            </span>
                            <input
                              value={mod.title}
                              onChange={(e) => updateModuleTitle(mi, e.target.value)}
                              placeholder={`Moduł ${mi + 1} — nazwa…`}
                              className="flex-1 font-jakarta font-bold text-[14px] text-[#0B3B4C] placeholder:text-gray-300 placeholder:font-montserrat placeholder:font-semibold bg-transparent outline-none border-b border-transparent focus:border-brand-primary/30"
                            />
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {mod.lessons.map((lesson, li) => {
                              const isCurrent =
                                isLastModule && li === mod.lessons.length - 1;

                              // Lekcje już dodane → kompaktowy wiersz „gotowe".
                              if (!isCurrent) {
                                return (
                                  <div
                                    key={lesson._key ?? lesson.id ?? li}
                                    className="flex items-center gap-2 rounded-xl rounded-tr-[3px] border border-gray-100 bg-white px-3 py-2"
                                  >
                                    <span className="flex items-center justify-center size-5 shrink-0 rounded-md bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[10px]">
                                      {li + 1}
                                    </span>
                                    <span className="flex-1 truncate font-montserrat font-semibold text-[12.5px] text-brand-secondary">
                                      {lesson.title.trim() || `Lekcja ${li + 1}`}
                                    </span>
                                    {lesson.video ? (
                                      <CheckCircle
                                        size={15}
                                        weight="fill"
                                        className="text-emerald-500 shrink-0"
                                      />
                                    ) : (
                                      <VideoCamera
                                        size={15}
                                        weight="duotone"
                                        className="text-amber-500 shrink-0"
                                      />
                                    )}
                                  </div>
                                );
                              }

                              // Aktualna lekcja: wideo → prompt → tytuł + opis.
                              return (
                                <div
                                  key={lesson._key ?? lesson.id ?? li}
                                  className="rounded-xl rounded-tr-none border border-brand-primary/25 bg-white p-3 shadow-[0_10px_30px_-22px_rgba(3,63,99,0.5)]"
                                >
                                  <p className="text-[12.5px] font-montserrat font-bold text-brand-secondary mb-2">
                                    Lekcja {li + 1}
                                  </p>
                                  <VideoUploader
                                    value={lesson.video}
                                    onChange={(url) => updateCurrentLesson({ video: url })}
                                    onDuration={(s) => updateCurrentLesson({ durationSec: s })}
                                    label={`Wideo lekcji ${li + 1}`}
                                    hint="MP4 / MOV / WEBM — przeciągnij lub kliknij."
                                  />

                                  {/* Po dodaniu wideo: opis → generacja tytułu/opisu */}
                                  {lesson.video && (
                                    <div className="mt-3 flex flex-col gap-2.5">
                                      <div>
                                        <span className="inline-flex items-center gap-1.5 font-montserrat font-semibold text-[11.5px] text-gray-500 mb-1">
                                          <PencilSimple
                                            size={13}
                                            weight="duotone"
                                            className="text-brand-primary"
                                          />
                                          O czym jest ta lekcja?
                                        </span>
                                        <textarea
                                          value={lessonPrompt}
                                          onChange={(e) => setLessonPrompt(e.target.value)}
                                          placeholder="np. pokazuję rozgrzewkę i 3 ćwiczenia rozluźniające kark do zrobienia przy biurku…"
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-montserrat text-[13px] text-brand-secondary placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all min-h-[64px] resize-y leading-relaxed"
                                        />
                                        <button
                                          type="button"
                                          onClick={generateLessonMetaNow}
                                          disabled={!lessonPrompt.trim() || lessonGenerating}
                                          className="mt-2 inline-flex items-center gap-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-montserrat font-bold text-[12px] px-3 py-2 rounded-xl rounded-tr-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {lessonGenerating ? (
                                            <CircleNotch size={14} weight="bold" className="animate-spin" />
                                          ) : (
                                            <Sparkle size={14} weight="fill" />
                                          )}
                                          {lessonGenerating
                                            ? "Generuję…"
                                            : "Generuj tytuł i opis"}
                                        </button>
                                      </div>

                                      <div className="relative z-0">
                                        <input
                                          value={lesson.title}
                                          onChange={(e) =>
                                            updateCurrentLesson({ title: e.target.value })
                                          }
                                          placeholder="Tytuł lekcji…"
                                          className="w-full text-[13.5px] font-montserrat font-semibold text-brand-secondary bg-white rounded-lg px-3 py-2 border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary"
                                        />
                                        <NeonInputGlow isLoading={lessonGenerating} />
                                      </div>
                                      <div className="relative z-0">
                                        <textarea
                                          value={lesson.description ?? ""}
                                          onChange={(e) =>
                                            updateCurrentLesson({ description: e.target.value })
                                          }
                                          placeholder="Opis lekcji — czego kursant się nauczy…"
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-montserrat text-[13px] text-brand-secondary placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all min-h-[64px] resize-y leading-relaxed"
                                        />
                                        <NeonInputGlow isLoading={lessonGenerating} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {(() => {
                  // Można iść dalej, gdy aktualna lekcja ma wideo + tytuł.
                  const lastMod = draft.curriculum[draft.curriculum.length - 1];
                  const curLesson = lastMod?.lessons[lastMod.lessons.length - 1];
                  const canProgress =
                    draft.format === "single"
                      ? !!draft.video
                      : !!(curLesson?.video && curLesson.title.trim());
                  return (
                    <div className="flex flex-col gap-2 px-5 sm:px-6 py-4 border-t border-gray-100 bg-white">
                      {draft.format === "sections" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={addLessonToCurrent}
                            disabled={!canProgress}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-secondary/80 font-montserrat font-bold text-[12.5px] px-3 py-2 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} weight="bold" /> Nowa lekcja
                          </button>
                          <button
                            type="button"
                            onClick={addNewModule}
                            disabled={!canProgress}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-secondary/80 font-montserrat font-bold text-[12.5px] px-3 py-2 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Stack size={14} weight="duotone" /> Nowy moduł
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="hidden sm:inline font-montserrat text-[12px] text-gray-400">
                          Przesyłanie dokończy się w tle.
                        </span>
                        <button
                          type="button"
                          onClick={acceptVideos}
                          disabled={!canProgress}
                          className="relative inline-flex items-center gap-1.5 h-10 px-5 rounded-full font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="pointer-events-none absolute -right-2 -bottom-2 size-7 rounded-full bg-brand-yellow/50 blur-[10px]" />
                          <span className="relative inline-flex items-center gap-1.5">
                            Zakończ i przejdź dalej
                            <CaretRight size={14} weight="bold" />
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* AUTOPILOT: wybór okładki (ręcznie / agent) */}
      <AnimatePresence>
        {autoPhase === "cover" && (
          <Portal>
          <motion.div
            key="auto-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="relative w-full max-w-md bg-white rounded-[24px] rounded-tr-none p-6 shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)]"
            >
              <span className="relative inline-flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-brand-primary text-white border border-brand-yellow/30 mb-4">
                <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-6 rounded-full bg-brand-yellow/50 blur-[9px]" />
                <ImageSquare size={24} weight="duotone" className="relative" />
              </span>
              <h3 className="font-jakarta font-bold text-[18px] text-[#0B3B4C]">
                Okładka kursu
              </h3>

              {draft.image ? (
                <>
                  <div className="relative w-full aspect-[16/10] rounded-2xl rounded-tr-none overflow-hidden border border-gray-200 bg-gray-50 mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.image}
                      alt="Okładka"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setCoverPickerOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl rounded-tr-[3px] bg-white border border-gray-200 text-brand-secondary/80 font-montserrat font-bold text-[12.5px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors"
                    >
                      <ImageSquare size={15} weight="duotone" />
                      Zmień
                    </button>
                    <button
                      type="button"
                      onClick={proceedAfterCover}
                      className="flex-1 relative inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl rounded-tr-[3px] bg-brand-primary text-white font-montserrat font-bold text-[12.5px] border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] overflow-hidden"
                    >
                      <span className="pointer-events-none absolute -right-2 -bottom-2 size-7 rounded-full bg-brand-yellow/50 blur-[10px]" />
                      <span className="relative inline-flex items-center gap-1.5">
                        Dalej: dane <CaretRight size={14} weight="bold" />
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-montserrat text-[13px] text-gray-500 mt-2 mb-5">
                    Wybierz okładkę samodzielnie albo pozwól, żeby agent dobrał ją
                    z nagrania (lub trafnego zdjęcia).
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={pickCoverAgent}
                      disabled={coverAgentBusy}
                      className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-brand-primary text-white font-montserrat font-bold text-[13.5px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden disabled:opacity-60"
                    >
                      <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
                      <span className="relative inline-flex items-center gap-2">
                        {coverAgentBusy ? (
                          <CircleNotch size={16} weight="bold" className="animate-spin" />
                        ) : (
                          <Sparkle size={16} weight="fill" />
                        )}
                        {coverAgentBusy ? "Dobieram…" : "Niech wybierze agent"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverPickerOpen(true)}
                      disabled={coverAgentBusy}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white border border-gray-200 text-[#0B3B4C] font-montserrat font-bold text-[13.5px] hover:border-brand-primary/30 hover:bg-brand-primary/[0.03] transition-all disabled:opacity-60"
                    >
                      <ImageSquare size={16} weight="duotone" className="text-brand-primary" />
                      Wybiorę sam
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* STEPPER — równe segmenty (flex-1), linia liczona względem ŚRODKÓW kółek
          (środek kółka i = (i+0.5)/n szerokości), niezależnie od szerokości etykiet. */}
      <div
        className={`relative flex items-start mx-auto mb-10 pt-2 ${
          steps.length >= 4 ? "max-w-2xl" : "max-w-md"
        }`}
      >
        {/* Tor (szary) — od środka pierwszego do środka ostatniego kółka.
            top = pt-2 (0.5rem) + promień kółka (1.25rem) − połowa grubości linii. */}
        <div
          className="absolute top-[calc(1.75rem_-_1.5px)] h-[3px] bg-gray-100 rounded-full z-0"
          style={{
            left: `${50 / steps.length}%`,
            right: `${50 / steps.length}%`,
          }}
        />
        {/* Postęp (morski) — do środka aktualnego kółka. */}
        <div
          className="absolute top-[calc(1.75rem_-_1.5px)] h-[3px] bg-brand-primary rounded-full transition-all duration-500 z-0"
          style={{
            left: `${50 / steps.length}%`,
            width: `calc((100% - ${100 / steps.length}%) * ${stepIdx / (steps.length - 1)})`,
          }}
        />
        {steps.map((id, i) => {
          const Icon = STEP_META[id].icon;
          const done = i < stepIdx;
          const current = i === stepIdx;
          // Spinner na kroku Program, gdy w tle trwa przesyłanie nagrań.
          const showSpinner = id === "program" && uploadsActive;
          return (
            <button
              key={id}
              type="button"
              onClick={() => i <= stepIdx && setStep(i)}
              disabled={i > stepIdx}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all ${
                  done
                    ? "bg-brand-primary border-brand-primary text-white"
                    : current
                      ? "bg-white border-brand-primary text-brand-primary scale-110"
                      : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {showSpinner ? (
                  <CircleNotch
                    size={18}
                    weight="bold"
                    className={`animate-spin ${done ? "text-white" : "text-brand-primary"}`}
                  />
                ) : done ? (
                  <Check size={18} weight="bold" />
                ) : (
                  <Icon size={18} weight={current ? "fill" : "regular"} />
                )}
              </span>
              <span
                className={`hidden sm:flex items-center gap-1 font-montserrat text-[12px] font-semibold whitespace-nowrap ${
                  current ? "text-brand-primary" : done ? "text-[#0B3B4C]" : "text-gray-400"
                }`}
              >
                {STEP_META[id].name}
                {showSpinner && (
                  <span className="text-[10px] font-bold text-brand-primary/70">
                    · wysyłka…
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* === KROK START: metoda + format === */}
      {currentId === "start" && (
        <StartStep
          phase={startPhase}
          onAi={() => pickMethod("ai")}
          onManual={() => pickMethod("manual")}
          onFormat={pickFormat}
        />
      )}

      {/* === KROK DANE PODSTAWOWE === */}
      {currentId === "dane" && (
        <motion.div
          variants={stepContainer}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto flex flex-col gap-5"
        >
          {/* Jeden film → wideo kursu na samej górze (w autopilocie wgrywa się
              przez popup, więc tu chowamy je na czas kroku wideo). */}
          {draft.format === "single" &&
            !(isAutoRunning && autoPhase === "video") && (
              <motion.div variants={stepItem}>
                <VideoUploader
                  value={draft.video}
                  onChange={(url) => set("video", url)}
                  onDuration={(s) => set("videoDurationSec", s)}
                  label="Wideo kursu"
                  hint="Główny (i jedyny) film kursu. MP4 / MOV / WEBM — leci prosto do magazynu."
                />
              </motion.div>
            )}

          {!(isAutoRunning && autoPhase === "video") && (
          <>
          <motion.div variants={stepItem}>
            <Field label="Tytuł kursu *">
              <div className="relative z-0">
                <input
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="np. Zdrowy i silny kręgosłup"
                  className={inputCls}
                />
                <NeonInputGlow isLoading={loadingField === "title"} />
              </div>
            </Field>
          </motion.div>

          <motion.div variants={stepItem} className="relative z-30">
            <Field label="Kategoria">
              <div className="relative z-30">
              <Select
                value={draft.category}
                onChange={(v) => set("category", v)}
                options={
                  draft.category && !categoryOptions.includes(draft.category)
                    ? [draft.category, ...categoryOptions]
                    : categoryOptions
                }
                placeholder="Wybierz lub dodaj kategorię"
                creatable
                createLabel="Dodaj kategorię"
              />
              <NeonInputGlow isLoading={loadingField === "category"} />
              </div>
            </Field>
          </motion.div>

          <motion.div variants={stepItem} className="grid sm:grid-cols-2 gap-5">
            <Field label="Cena (zł)">
              <div className="relative z-0">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) =>
                    set("price", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                  className={inputCls}
                />
                <NeonInputGlow isLoading={loadingField === "price"} />
              </div>
            </Field>
            <Field label="Czas materiału (auto z wideo)">
              <div
                className={`${inputCls} flex items-center gap-2 !cursor-default bg-brand-secondary/[0.03] text-brand-secondary`}
                title="Liczony automatycznie z długości wgranych nagrań"
              >
                <Clock size={16} weight="duotone" className="text-brand-primary" />
                {totalDurationMin > 0 ? (
                  <span className="font-semibold">
                    {formatCourseDuration(totalDurationMin)}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Pojawi się po przetworzeniu wideo
                  </span>
                )}
              </div>
            </Field>
          </motion.div>

          <motion.div variants={stepItem}>
            <Field label="Krótki opis (excerpt)">
              <div className="relative z-0">
                <textarea
                  value={draft.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="Jedno–dwa zdania zachęcające do kursu…"
                  className={`${inputCls} h-auto py-3 min-h-[110px] resize-none`}
                />
                <NeonInputGlow isLoading={loadingField === "excerpt"} />
              </div>
            </Field>
          </motion.div>
          </>
          )}
        </motion.div>
      )}

      {/* === KROK TREŚĆ: opis strony („O kursie") + FAQ === */}
      {currentId === "tresc" && (
        <motion.div
          variants={stepContainer}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto flex flex-col gap-5"
        >
          <motion.div
            variants={stepItem}
            className="rounded-2xl rounded-tr-none border border-brand-primary/15 bg-brand-primary/[0.04] p-4 flex items-start gap-3"
          >
            <span className="flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
              <PencilSimple size={20} weight="duotone" />
            </span>
            <p className="font-montserrat text-[13px] text-gray-600 leading-snug">
              Okładka + opis strony sprzedażowej — sekcja{" "}
              <strong className="text-brand-secondary">„O kursie"</strong> oraz{" "}
              <strong className="text-brand-secondary">FAQ</strong>. Składasz to
              z prostych bloków (nagłówek, akapit, lista, wyróżnik, cytat).
              Treść i FAQ są wymagane do publikacji kursu.
            </p>
          </motion.div>

          {/* Okładka kursu */}
          <motion.div variants={stepItem}>
            <Field label="Okładka kursu">
              <div className="relative w-full aspect-[16/10] rounded-2xl rounded-tr-none overflow-hidden border border-gray-200 bg-gray-50">
                {draft.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.image}
                    alt="Okładka kursu"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-300">
                    <ImageSquare size={30} weight="duotone" />
                    <span className="font-montserrat text-[12px]">
                      Brak okładki — wybierz lub użyj kadru z wideo
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setCoverPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-brand-primary text-white font-montserrat font-bold text-[12.5px] px-3 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 hover:shadow-[0_8px_22px_-8px_rgba(40,125,136,0.6)] transition-shadow"
                >
                  <ImageSquare size={15} weight="duotone" />
                  {draft.image ? "Zmień okładkę" : "Wybierz okładkę"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    frameCandidates.length > 1
                      ? setFramePickerOpen(true)
                      : useVideoFrame()
                  }
                  disabled={
                    !draftIdRef.current ||
                    frameCandidates.length === 0 ||
                    coverFromVideoLoading
                  }
                  title={
                    !draftIdRef.current || frameCandidates.length === 0
                      ? "Najpierw wgraj nagranie — kadr generuje Bunny z wideo."
                      : frameCandidates.length > 1
                        ? "Wybierz kadr z dowolnego nagrania"
                        : undefined
                  }
                  className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-brand-secondary/70 font-montserrat font-bold text-[12.5px] px-3 py-2.5 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {coverFromVideoLoading ? (
                    <CircleNotch size={15} weight="bold" className="animate-spin" />
                  ) : (
                    <FilmSlate size={15} weight="duotone" />
                  )}
                  {coverFromVideoLoading
                    ? "Pobieram…"
                    : frameCandidates.length > 1
                      ? "Kadr z wideo…"
                      : "Kadr z wideo"}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverCropOpen(true)}
                  disabled={!draft.image}
                  title={!draft.image ? "Najpierw wybierz okładkę." : undefined}
                  className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-brand-secondary/70 font-montserrat font-bold text-[12.5px] px-3 py-2.5 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Crop size={15} weight="duotone" />
                  Dopasuj kadr
                </button>
              </div>
              <input
                value={draft.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="…lub wklej adres URL okładki"
                className={`${inputCls} mt-2`}
              />
            </Field>
          </motion.div>

          {/* Sekcja „O kursie" — w wyraźnej karcie, edytor blokowy jak na blogu */}
          <motion.div
            variants={stepItem}
            className="rounded-3xl rounded-tr-none border border-gray-200 bg-white shadow-[0_20px_55px_-40px_rgba(3,63,99,0.4)] overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-brand-primary/[0.07] to-transparent">
              <span className="flex items-center justify-center size-8 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
                <Article size={17} weight="duotone" />
              </span>
              <div>
                <p className="font-jakarta font-bold text-[14px] text-brand-secondary leading-none">
                  O kursie
                </p>
                <p className="font-montserrat text-[11.5px] text-gray-400 mt-1">
                  Główny opis na stronie sprzedażowej (wymagany do publikacji)
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <CourseBlockBuilder blocks={descBlocks} onChange={setDescBlocks} />
            </div>
          </motion.div>

          {/* Sekcja „Zawartość" — opcjonalny opis tego, co kurs zawiera */}
          <motion.div
            variants={stepItem}
            className="rounded-3xl rounded-tr-none border border-gray-200 bg-white shadow-[0_20px_55px_-40px_rgba(3,63,99,0.4)] overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-brand-primary/[0.07] to-transparent">
              <span className="flex items-center justify-center size-8 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
                <Stack size={17} weight="duotone" />
              </span>
              <div>
                <p className="font-jakarta font-bold text-[14px] text-brand-secondary leading-none">
                  Zawartość
                </p>
                <p className="font-montserrat text-[11.5px] text-gray-400 mt-1">
                  Opis tego, co kurs zawiera — zakładka „Zawartość" (opcjonalne)
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <CourseBlockBuilder
                blocks={contentBlocks}
                onChange={setContentBlocks}
              />
            </div>
          </motion.div>

          {/* Sekcja FAQ — osobna karta */}
          <motion.div
            variants={stepItem}
            className="rounded-3xl rounded-tr-none border border-gray-200 bg-white shadow-[0_20px_55px_-40px_rgba(3,63,99,0.4)] overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-brand-primary/[0.07] to-transparent">
              <span className="flex items-center justify-center size-8 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
                <ListNumbers size={17} weight="duotone" />
              </span>
              <div>
                <p className="font-jakarta font-bold text-[14px] text-brand-secondary leading-none">
                  Najczęstsze pytania (FAQ)
                </p>
                <p className="font-montserrat text-[11.5px] text-gray-400 mt-1">
                  Min. jedno pytanie z odpowiedzią (wymagane do publikacji)
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <FaqEditor items={faqItems} onChange={updateFaq} />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* === KROK SEO === */}
      {currentId === "seo" && (
        <motion.div
          variants={stepContainer}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto flex flex-col gap-5"
        >
          {/* Wskazówka */}
          <motion.div
            variants={stepItem}
            className="rounded-2xl rounded-tr-none border border-brand-primary/15 bg-brand-primary/[0.04] p-4 flex items-start gap-3"
          >
            <span className="flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
              <MagnifyingGlass size={20} weight="duotone" />
            </span>
            <p className="font-montserrat text-[13px] text-gray-600 leading-snug">
              Okładka kursu generuje się automatycznie, ale grafika{" "}
              <strong className="text-brand-secondary">OG image</strong> (do
              udostępnień w social media) nie powstaje sama — złóż ją w
              kreatorze lub wgraj własną. Uzupełnij też meta tytuł i opis pod
              wyszukiwarki.
            </p>
          </motion.div>

          {/* Pasek AI: generacja SEO z treści + audyt nasycenia */}
          <motion.div variants={stepItem} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => generateSeo(false)}
                disabled={seoGenerating || !draft.title.trim()}
                className="group relative inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[12.5px] px-4 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[10px]" />
                <span className="relative inline-flex items-center gap-2">
                  {seoGenerating ? (
                    <CircleNotch size={15} weight="bold" className="animate-spin" />
                  ) : (
                    <Sparkle size={15} weight="fill" />
                  )}
                  {seoGenerating ? "Generuję…" : "Generuj SEO z treści"}
                </span>
              </button>
              <button
                type="button"
                onClick={analyzeSeo}
                disabled={seoAnalyzing || seoGenerating}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-brand-secondary/80 font-montserrat font-bold text-[12.5px] px-4 py-2.5 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {seoAnalyzing ? (
                  <CircleNotch size={15} weight="bold" className="animate-spin" />
                ) : (
                  <MagnifyingGlass size={15} weight="bold" />
                )}
                {seoAnalyzing ? "Analizuję…" : "Analizuj SEO"}
              </button>
            </div>
            {seoStatusMsg && (
              <span className="inline-flex items-center gap-1.5 font-montserrat text-[12px] text-brand-primary">
                <CircleNotch size={13} weight="bold" className="animate-spin" />
                {seoStatusMsg}
              </span>
            )}
          </motion.div>

          {/* Wynik audytu SEO */}
          {seoAnalysis && (
            <motion.div variants={stepItem}>
              <SeoAnalysisCard data={seoAnalysis} />
            </motion.div>
          )}

          {/* Podgląd SERP + pola meta — w trakcie generowania AI pokazujemy
              animowane szkielety zamiast pustych pól (stan ładowania). */}
          <AnimatePresence mode="wait" initial={false}>
            {seoGenerating || seoShimmer ? (
              <SeoLoadingSkeleton key="seo-skeleton" />
            ) : (
              <motion.div
                key="seo-fields"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5"
              >
                {/* Podgląd SERP */}
                <motion.div variants={stepItem}>
                  <SerpPreview
                    metaTitle={draft.metaTitle ?? ""}
                    metaDescription={draft.metaDescription ?? ""}
                    fallbackTitle={draft.title}
                    fallbackDesc={draft.excerpt}
                  />
                </motion.div>

                {/* Meta tytuł */}
                <motion.div variants={stepItem}>
                  <Field label="Meta tytuł">
                    <div className="relative z-0">
                      <input
                        value={draft.metaTitle ?? ""}
                        onChange={(e) => set("metaTitle", e.target.value)}
                        placeholder={draft.title || "Główny tytuł SEO kursu…"}
                        className={inputCls}
                      />
                      <NeonInputGlow isLoading={seoShimmer} />
                    </div>
                  </Field>
                  <CharHint value={(draft.metaTitle ?? "").length} max={60} />
                </motion.div>

                {/* Meta opis */}
                <motion.div variants={stepItem}>
                  <Field label="Meta opis">
                    <div className="relative z-0">
                      <textarea
                        value={draft.metaDescription ?? ""}
                        onChange={(e) => set("metaDescription", e.target.value)}
                        placeholder={
                          draft.excerpt ||
                          "Krótki opis kursu w wynikach wyszukiwania…"
                        }
                        className={`${inputCls} h-auto py-3 min-h-[90px] resize-y`}
                      />
                      <NeonInputGlow isLoading={seoShimmer} />
                    </div>
                  </Field>
                  <CharHint
                    value={(draft.metaDescription ?? "").length}
                    max={160}
                  />
                </motion.div>

                {/* Słowo kluczowe */}
                <motion.div variants={stepItem}>
                  <Field label="Słowo kluczowe (focus keyword)">
                    <div className="relative z-0">
                      <input
                        value={draft.focusKeyword ?? ""}
                        onChange={(e) => set("focusKeyword", e.target.value)}
                        placeholder="np. ćwiczenia na ból lędźwi"
                        className={inputCls}
                      />
                      <NeonInputGlow isLoading={seoShimmer} />
                    </div>
                  </Field>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canonical URL */}
          <motion.div variants={stepItem}>
            <Field label="Canonical URL (opcjonalnie)">
              <input
                value={draft.canonicalUrl ?? ""}
                onChange={(e) => set("canonicalUrl", e.target.value)}
                placeholder="https://rehability.pl/kursy/..."
                className={inputCls}
              />
            </Field>
          </motion.div>

          {/* OG image */}
          <motion.div variants={stepItem}>
            <Field label="OG image (social media)">
              <div className="relative w-full aspect-[40/21] rounded-2xl rounded-tr-none overflow-hidden border border-gray-200 bg-gray-50">
                {draft.ogImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.ogImage}
                    alt="OG image"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-300">
                    <Globe size={30} weight="duotone" />
                    <span className="font-montserrat text-[12px]">
                      Brak grafiki OG (1200×630)
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setOgCreatorOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-brand-primary text-white font-montserrat font-bold text-[12.5px] px-3 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 hover:shadow-[0_8px_22px_-8px_rgba(40,125,136,0.6)] transition-shadow"
                >
                  <PaintBrush size={15} weight="duotone" />
                  Kreator OG image
                </button>
                <button
                  type="button"
                  onClick={() => setOgPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-brand-secondary/70 font-montserrat font-bold text-[12.5px] px-3 py-2.5 rounded-xl rounded-tr-[3px] hover:border-brand-primary/40 hover:text-brand-primary transition-colors"
                >
                  <ImageSquare size={15} weight="duotone" />
                  Pexels / własne
                </button>
              </div>
              <input
                value={draft.ogImage ?? ""}
                onChange={(e) => set("ogImage", e.target.value)}
                placeholder="…lub wklej adres URL grafiki"
                className={`${inputCls} mt-2`}
              />
            </Field>
          </motion.div>

          {/* noindex */}
          <motion.div variants={stepItem}>
            <button
              type="button"
              onClick={() => set("noIndex", !draft.noIndex)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left"
            >
              <span className="flex items-center gap-3">
                {draft.noIndex ? (
                  <EyeSlash size={20} className="text-rose-400 shrink-0" />
                ) : (
                  <Eye size={20} className="text-emerald-500 shrink-0" />
                )}
                <span>
                  <span className="block font-montserrat font-semibold text-[13.5px] text-brand-secondary">
                    {draft.noIndex
                      ? "Ukryty przed Google (noindex)"
                      : "Widoczny w Google"}
                  </span>
                  <span className="block font-montserrat text-[12px] text-gray-400">
                    {draft.noIndex
                      ? "Robot Google nie zaindeksuje strony kursu."
                      : "Strona kursu pojawi się w wynikach wyszukiwania."}
                  </span>
                </span>
              </span>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  draft.noIndex ? "bg-rose-400" : "bg-emerald-500"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                    draft.noIndex ? "translate-x-0.5" : "translate-x-[22px]"
                  }`}
                />
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* === KROK PROGRAM (tylko „podział na lekcje") === */}
      {currentId === "program" && (
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div className="rounded-2xl rounded-tr-none border border-brand-primary/15 bg-brand-primary/[0.04] p-4 flex items-start gap-3">
            <span className="flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
              <Stack size={20} weight="duotone" />
            </span>
            <p className="font-montserrat text-[13px] text-gray-600 leading-snug">
              Zbuduj program: dodaj moduły i lekcje, a do każdej wgraj nagranie.
              Przesyłanie idzie w tle — możesz spokojnie przejść dalej i
              uzupełnić dane, a postęp zobaczysz na tym kroku.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-montserrat text-[13px] text-gray-500">
              {draft.curriculum.length} moduły · {lessonCount} lekcji
            </p>
          </div>

          {draft.curriculum.map((mod, mi) => (
            <div
              key={mod._key ?? mod.id ?? mi}
              className="rounded-2xl rounded-tr-none border border-gray-100 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center size-7 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[13px]">
                  {mi + 1}
                </span>
                <input
                  value={mod.title}
                  onChange={(e) =>
                    set(
                      "curriculum",
                      draft.curriculum.map((m) =>
                        m._key === mod._key
                          ? { ...m, title: e.target.value }
                          : m,
                      ),
                    )
                  }
                  placeholder={`Moduł ${mi + 1} — nazwa…`}
                  className="flex-1 font-jakarta font-bold text-[15px] text-[#0B3B4C] placeholder:text-gray-300 placeholder:font-montserrat placeholder:font-semibold bg-transparent outline-none border-b border-transparent focus:border-brand-primary/30"
                />
                {draft.curriculum.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "curriculum",
                        draft.curriculum.filter((m) => m._key !== mod._key),
                      )
                    }
                    className="text-gray-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 pl-9">
                {mod.lessons.map((lesson, li) => {
                  const updateLesson = (patch: Partial<Lesson>) =>
                    set(
                      "curriculum",
                      draft.curriculum.map((m) =>
                        m._key !== mod._key
                          ? m
                          : {
                              ...m,
                              lessons: m.lessons.map((l) =>
                                l._key === lesson._key ? { ...l, ...patch } : l,
                              ),
                            },
                      ),
                    );
                  return (
                    <div
                      key={lesson._key ?? lesson.id ?? li}
                      className="rounded-xl rounded-tr-none border border-gray-100 bg-gray-50/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center size-6 shrink-0 rounded-md bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[11px]">
                          {li + 1}
                        </span>
                        <input
                          value={lesson.title}
                          onChange={(e) => updateLesson({ title: e.target.value })}
                          placeholder="Tytuł lekcji…"
                          className="flex-1 text-[13.5px] font-montserrat font-semibold text-brand-secondary bg-white rounded-lg px-3 py-2 border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "curriculum",
                              draft.curriculum.map((m) =>
                                m._key !== mod._key
                                  ? m
                                  : {
                                      ...m,
                                      lessons: m.lessons.filter(
                                        (l) => l._key !== lesson._key,
                                      ),
                                    },
                              ),
                            )
                          }
                          className="text-gray-300 hover:text-rose-500 transition-colors shrink-0"
                          title="Usuń lekcję"
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                      <div className="mt-2.5">
                        <VideoUploader
                          value={lesson.video}
                          onChange={(url) => updateLesson({ video: url })}
                          onDuration={(s) => updateLesson({ durationSec: s })}
                          label={`Wideo lekcji ${li + 1}`}
                          hint="MP4 / MOV / WEBM — przeciągnij lub kliknij."
                        />
                      </div>
                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1.5 font-montserrat font-semibold text-[11.5px] text-gray-500 mb-1">
                          <PencilSimple
                            size={13}
                            weight="duotone"
                            className="text-brand-primary"
                          />
                          Opis lekcji (opcjonalnie)
                        </span>
                        <textarea
                          value={lesson.description ?? ""}
                          onChange={(e) =>
                            updateLesson({ description: e.target.value })
                          }
                          placeholder="Krótko: czego dotyczy ta lekcja i co kursant z niej wyniesie…"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-montserrat text-[13px] text-brand-secondary placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all min-h-[70px] resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "curriculum",
                      draft.curriculum.map((m) =>
                        m._key === mod._key
                          ? { ...m, lessons: [...m.lessons, newLesson()] }
                          : m,
                      ),
                    )
                  }
                  className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-primary mt-1"
                >
                  <Plus size={13} weight="bold" /> Dodaj lekcję
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              set("curriculum", [
                ...draft.curriculum,
                newModule(`Moduł ${draft.curriculum.length + 1}`),
              ])
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl rounded-tr-none border border-dashed border-brand-primary/40 bg-brand-primary/[0.03] px-4 py-3.5 text-[13px] font-bold text-brand-primary hover:bg-brand-primary/[0.07] transition-colors"
          >
            <Plus size={15} weight="bold" /> Dodaj moduł
          </button>
        </div>
      )}

      {/* === KROK PODSUMOWANIE === */}
      {currentId === "podsumowanie" && (
        <div className="max-w-3xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Podsumowanie danych kursu */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
                Podsumowanie
              </span>
              <h3 className="font-jakarta font-bold text-[20px] text-[#0B3B4C] mt-1 leading-snug">
                {draft.title || "Kurs bez tytułu"}
              </h3>
              {draft.excerpt ? (
                <p className="font-montserrat text-[13.5px] text-gray-500 leading-relaxed mt-1.5">
                  {draft.excerpt}
                </p>
              ) : (
                <p className="font-montserrat text-[13px] text-gray-400 italic mt-1.5">
                  Brak krótkiego opisu — dodasz go w kroku „Dane podstawowe".
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryTile icon={Tag} label="Kategoria" value={draft.category || "—"} />
              <SummaryTile
                icon={Coins}
                label="Cena"
                value={`${Number(draft.price) || 0} zł`}
              />
              <SummaryTile
                icon={draft.format === "single" ? PlayCircle : Stack}
                label="Format"
                value={
                  draft.format === "single"
                    ? "Jeden film"
                    : `${modulesWithLessons} mod. · ${lessonCount} lekcji`
                }
              />
              <SummaryTile
                icon={Clock}
                label="Czas materiału"
                value={formatCourseDuration(totalDurationMin)}
              />
            </div>

            {/* Status nagrań */}
            <div
              className={`flex items-start gap-3 rounded-2xl rounded-tr-none border p-4 ${
                videoReady
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200 bg-amber-50/60"
              }`}
            >
              <span
                className={`flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-none ${
                  videoReady
                    ? "bg-emerald-400/20 text-emerald-600"
                    : "bg-amber-400/20 text-amber-600"
                }`}
              >
                {videoReady ? (
                  <CheckCircle size={20} weight="fill" />
                ) : (
                  <VideoCamera size={20} weight="duotone" />
                )}
              </span>
              <div>
                <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
                  {videoReady ? "Nagrania gotowe" : "Brakuje nagrań"}
                </p>
                <p className="font-montserrat text-[12.5px] text-gray-500 leading-snug mt-0.5">
                  {draft.format === "single"
                    ? draft.video
                      ? "Główny film kursu jest wgrany."
                      : "Dodaj wideo kursu w kroku Dane podstawowe."
                    : `${lessonsWithVideo} z ${lessonCount} lekcji ma nagranie.`}
                </p>
              </div>
            </div>

            {/* Program (przy podziale na lekcje) */}
            {draft.format === "sections" && lessonCount > 0 && (
              <div className="rounded-2xl rounded-tr-none border border-gray-100 bg-white p-4">
                <h4 className="font-jakarta font-bold text-[13px] text-[#0B3B4C] mb-2.5">
                  Program
                </h4>
                <div className="flex flex-col gap-2.5">
                  {draft.curriculum
                    .filter((m) => m.lessons.some((l) => l.title.trim()))
                    .map((m, mi) => (
                      <div key={mi}>
                        <p className="font-montserrat font-semibold text-[12.5px] text-brand-secondary">
                          {m.title.trim() || `Moduł ${mi + 1}`}
                        </p>
                        <ul className="mt-1 flex flex-col gap-1 pl-0.5">
                          {m.lessons
                            .filter((l) => l.title.trim())
                            .map((l, li) => (
                              <li
                                key={li}
                                className="flex items-center gap-2 text-[12px] font-montserrat text-gray-500"
                              >
                                {l.video ? (
                                  <CheckCircle
                                    size={13}
                                    weight="fill"
                                    className="text-emerald-500 shrink-0"
                                  />
                                ) : (
                                  <VideoCamera
                                    size={13}
                                    weight="duotone"
                                    className="text-amber-500 shrink-0"
                                  />
                                )}
                                <span className="truncate">{l.title}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bramka publikacji: braki krytyczne (blokują) + zalecane (nie blokują) */}
            {publishBlockers.length > 0 ? (
              <div className="rounded-2xl rounded-tr-none border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <WarningCircle size={18} weight="fill" className="text-rose-500" />
                  <p className="font-jakarta font-bold text-[13.5px] text-rose-700">
                    Do uzupełnienia przed publikacją
                  </p>
                </div>
                <ul className="flex flex-col gap-0.5">
                  {publishBlockers.map((b) => (
                    <li key={b.label}>
                      <button
                        type="button"
                        onClick={() => goToStep(b.step)}
                        className="group flex w-full items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-rose-100/60 transition-colors"
                      >
                        <span className="size-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span className="font-montserrat text-[12.5px] font-medium text-rose-700/90">
                          {b.label}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-montserrat font-semibold text-rose-500">
                          {STEP_META[b.step].name}
                          <CaretRight size={11} weight="bold" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              publishWarnings.length > 0 && (
                <div className="rounded-2xl rounded-tr-none border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <WarningCircle size={18} weight="fill" className="text-amber-500" />
                    <p className="font-jakarta font-bold text-[13.5px] text-amber-700">
                      Zalecane (opcjonalne)
                    </p>
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {publishWarnings.map((w) => (
                      <li key={w.label}>
                        <button
                          type="button"
                          onClick={() => goToStep(w.step)}
                          className="group flex w-full items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-amber-100/60 transition-colors"
                        >
                          <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="font-montserrat text-[12.5px] font-medium text-amber-800/90">
                            {w.label}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-montserrat font-semibold text-amber-600">
                            {STEP_META[w.step].name}
                            <CaretRight size={11} weight="bold" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}

            <p className="font-montserrat text-[12px] text-gray-400 leading-relaxed">
              „Opublikuj kurs" zapisuje go w bazie i publikuje. Szkic jest
              zapisywany automatycznie w tle przez cały czas pracy w kreatorze.
            </p>
          </div>

          {/* Podgląd karty */}
          <div className="self-start lg:sticky lg:top-6">
            <h3 className="font-jakarta font-bold text-[16px] text-[#0B3B4C] mb-2">
              Podgląd karty
            </h3>
            <div className="rounded-[24px] rounded-tr-none bg-white border border-gray-100 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.45)] overflow-hidden">
              <div className="group relative aspect-[16/10] bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary flex items-center justify-center">
                {draft.image || (previewThumb && !thumbBroken) ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.image || previewThumb}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setThumbBroken(true)}
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <span className="relative flex items-center justify-center size-11 rounded-full bg-white/25 backdrop-blur-sm text-white border border-white/40">
                      <PlayCircle size={26} weight="fill" />
                    </span>
                  </>
                ) : (
                  <>
                    <PlayCircle size={40} weight="fill" className="text-white/80" />
                    <span className="absolute bottom-2 right-3 text-[10px] font-montserrat text-white/60">
                      {previewVideoUrl ? "miniatura w przygotowaniu" : "brak nagrania"}
                    </span>
                  </>
                )}
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md text-brand-primary border border-white/60 shadow-sm">
                  {draft.category || "Kategoria"}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-jakarta font-bold text-[15px] text-[#0B3B4C] leading-snug line-clamp-2 min-h-[40px]">
                  {draft.title || "Tytuł kursu"}
                </h4>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-gray-400 font-montserrat">
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-secondary/60">
                    <Sparkle size={12} weight="fill" className="text-brand-yellow" />
                    Nowość
                  </span>
                  {totalDurationMin > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} weight="duotone" className="text-brand-primary" />
                      {formatCourseDuration(totalDurationMin)}
                    </span>
                  )}
                </div>
                <p className="font-jakarta font-bold text-[18px] text-brand-primary mt-3">
                  {Number(draft.price) || 0} zł
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAWIGACJA (ukryta w trakcie autopilota — agent steruje krokami) */}
      <div
        className={`flex items-center justify-between max-w-2xl mx-auto mt-10 pt-6 border-t border-gray-100 ${
          isAutoRunning ? "hidden" : ""
        }`}
      >
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-montserrat font-semibold text-[13px] text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <CaretLeft size={14} weight="bold" />
          {currentId === "start" && startPhase === "method" ? "Anuluj" : "Wstecz"}
        </button>

        {currentId === "start" ? (
          <span />
        ) : currentId !== "podsumowanie" ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep(stepIdx + 1)}
            className="group relative inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all overflow-hidden"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-1.5">
              Dalej
              <CaretRight size={14} weight="bold" />
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={publish}
              disabled={autosave.savingSource !== null || !canPublish}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-montserrat font-bold text-[13px] text-white bg-brand-primary border border-brand-yellow/30 shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden"
            >
              <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
              <span className="relative inline-flex items-center gap-2">
                {autosave.savingSource === "publish" ? (
                  <CircleNotch size={15} weight="bold" className="animate-spin" />
                ) : (
                  <Check size={15} weight="bold" />
                )}
                {autosave.savingSource === "publish"
                  ? baseStatus === "PUBLISHED"
                    ? "Zapisuję…"
                    : "Publikuję…"
                  : baseStatus === "PUBLISHED"
                    ? "Zapisz zmiany"
                    : "Opublikuj kurs"}
              </span>
            </button>
            {autosave.error && (
              <span className="text-[12px] font-montserrat text-rose-500">
                {autosave.error}
              </span>
            )}
          </div>
        )}
      </div>

      {/* PŁYWAJĄCY PASEK: AI + zapis szkicu (autozapis co 30 s). Tylko na krokach
          edycji — na podsumowaniu jest osobny przycisk „Opublikuj". */}
      {!isAutoRunning &&
        (currentId === "program" ||
          currentId === "dane" ||
          currentId === "tresc" ||
          currentId === "seo") && (
        <FloatingSaveBar
          onAi={() => setAiOpen(true)}
          onSave={autosave.saveDraft}
          savingSource={autosave.savingSource}
          showAutosaveTooltip={autosave.showAutosaveTooltip}
          lastSavedAt={autosave.lastSavedAt}
          canSave={autosave.canSave}
          uploading={uploadsActive}
          uploadingCount={uploadCount}
          uploadProgress={uploadProgress}
          uploadDone={uploadJustDone}
        />
      )}

      {/* MODAL AI — prowadzony brief kursu (pytania → złożony prompt) */}
      <CourseAiBriefModal
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onSubmit={startAutopilot}
      />

      {/* KREATOR OG IMAGE + PICKER (krok SEO) */}
      <OgImageCreator
        isOpen={ogCreatorOpen}
        onClose={() => {
          // W autopilocie zamknięcie kreatora OG kończy sekwencję (OG opcjonalny).
          if (autoPhase === "og") finishAutopilot();
          else setOgCreatorOpen(false);
        }}
        onApply={(url) => {
          set("ogImage", url);
          if (autoPhase === "og") finishAutopilot();
          else setOgCreatorOpen(false);
        }}
        initialTitle={draft.title}
        initialCategory={draft.category}
        initialImage={draft.ogImage || draft.image}
        initialSubtitle="Program wideo · Rehability VOD"
      />
      <BlogCoverPicker
        isOpen={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(url) => {
          set("ogImage", url);
          setOgPickerOpen(false);
        }}
        defaultQuery={draft.category || "fizjoterapia"}
        heading="Wybierz grafikę OG"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne — trafi prosto do magazynu."
      />

      {/* OKŁADKA: picker (Pexels / własne) + kadrowanie (krok „Dane") */}
      <BlogCoverPicker
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(url) => {
          set("image", url);
          setCoverPickerOpen(false);
        }}
        defaultQuery={draft.category || "fizjoterapia"}
        heading="Wybierz okładkę kursu"
        subheading="Zaciągnij zdjęcie z Pexels albo wgraj własne — trafi prosto do magazynu."
      />
      <CoverCropper
        isOpen={coverCropOpen}
        onClose={() => setCoverCropOpen(false)}
        onApply={(url) => {
          set("image", url);
          setCoverCropOpen(false);
        }}
        src={draft.image}
      />

      {/* PICKER KADRÓW (tryb modułowy): kadr z dowolnego nagrania lekcji */}
      <AnimatePresence>
        {framePickerOpen && (
          <Portal>
          <motion.div
            key="frame-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !coverFromVideoLoading && setFramePickerOpen(false)}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-secondary/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-2xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl border border-white/60 rounded-t-3xl sm:rounded-3xl sm:rounded-tr-none shadow-[0_20px_60px_-15px_rgba(3,63,99,0.4)] overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-2xl rounded-tr-none bg-brand-primary flex items-center justify-center text-white">
                    <FilmSlate size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-jakarta font-bold text-brand-secondary leading-tight">
                      Wybierz kadr na okładkę
                    </h3>
                    <p className="text-[12px] text-gray-500 font-montserrat mt-0.5">
                      Miniatura z dowolnego nagrania kursu trafi jako okładka.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFramePickerOpen(false)}
                  disabled={coverFromVideoLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-secondary transition-colors disabled:opacity-40"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {frameCandidates.map((c) => (
                  <button
                    key={c.guid}
                    type="button"
                    onClick={() => useVideoFrame(c.guid)}
                    disabled={coverFromVideoLoading}
                    title={c.label}
                    className="group relative flex flex-col overflow-hidden rounded-xl rounded-tr-[3px] border border-gray-200 bg-gray-50 text-left hover:border-brand-primary/50 transition-colors disabled:opacity-60"
                  >
                    <div className="relative aspect-video bg-brand-secondary/5">
                      <FrameThumb src={c.thumb} alt={c.label} />
                      <span className="absolute inset-0 bg-brand-secondary/0 group-hover:bg-brand-secondary/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 bg-white text-brand-secondary font-montserrat font-bold text-[11px] px-2.5 py-1 rounded-full shadow transition-opacity">
                          <Check size={12} weight="bold" /> Użyj
                        </span>
                      </span>
                    </div>
                    <span className="px-2.5 py-2 font-montserrat font-semibold text-[11.5px] text-brand-secondary/70 truncate">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>

              {coverFromVideoLoading && (
                <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-gray-100 text-brand-primary font-montserrat font-semibold text-[13px]">
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                  Pobieram kadr…
                </div>
              )}
            </motion.div>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
    </UploadTrackerContext.Provider>
  );
}

// Pasek-szkielet z przesuwającym się rozbłyskiem (Framer Motion) — pojedyncza
// „ładująca się" linia.
function ShimmerBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-brand-secondary/[0.08] ${className}`}
    >
      <motion.span
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />
    </div>
  );
}

// Stan ładowania kroku SEO — gdy AI generuje meta dane, w miejscu podglądu SERP
// i pól meta pokazujemy animowane szkielety, żeby było jasne, że treść właśnie
// się tworzy (a nie że pola są puste).
function SeoLoadingSkeleton() {
  const fields: { label: string; tall?: boolean }[] = [
    { label: "Meta tytuł" },
    { label: "Meta opis", tall: true },
    { label: "Słowo kluczowe (focus keyword)" },
  ];
  return (
    <motion.div
      variants={stepItem}
      className="flex flex-col gap-5"
      aria-busy="true"
    >
      {/* Szkielet podglądu SERP */}
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-none p-4 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center gap-2 mb-1">
          <MagnifyingGlass size={15} className="text-gray-300" />
          <ShimmerBar className="h-2.5 w-28" />
        </div>
        <div className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/60 flex flex-col gap-2">
          <ShimmerBar className="h-3 w-40" />
          <ShimmerBar className="h-4 w-3/4 !bg-brand-primary/15" />
          <ShimmerBar className="h-3 w-full" />
          <ShimmerBar className="h-3 w-5/6" />
        </div>
      </div>

      {/* Szkielety pól meta */}
      {fields.map((f) => (
        <div key={f.label} className="flex flex-col gap-1.5">
          <span className="font-montserrat font-semibold text-[12px] text-gray-500">
            {f.label}
          </span>
          <ShimmerBar
            className={`w-full rounded-xl ${f.tall ? "h-[90px]" : "h-12"}`}
          />
        </div>
      ))}

      <span className="inline-flex items-center gap-1.5 font-montserrat text-[12px] text-brand-primary">
        <CircleNotch size={13} weight="bold" className="animate-spin" />
        AI analizuje treść i przygotowuje dane SEO…
      </span>
    </motion.div>
  );
}

// Podgląd wyniku w Google (SERP) — z fallbackiem na tytuł/opis kursu.
function SerpPreview({
  metaTitle,
  metaDescription,
  fallbackTitle,
  fallbackDesc,
}: {
  metaTitle: string;
  metaDescription: string;
  fallbackTitle: string;
  fallbackDesc: string;
}) {
  const title = metaTitle || fallbackTitle || "Tytuł kursu pojawi się tutaj…";
  const desc =
    metaDescription ||
    fallbackDesc ||
    "Opis meta kursu pojawi się tutaj — opisz krótko, czego dotyczy program.";
  return (
    <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-none p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <MagnifyingGlass size={15} className="text-gray-400" />
        <span className="text-[11px] font-semibold font-montserrat text-gray-500 uppercase tracking-wider">
          Podgląd w Google
        </span>
      </div>
      <div className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/60">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-4 h-4 rounded-sm bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
            R
          </span>
          <span className="text-[12px] font-montserrat text-gray-600 truncate">
            rehability.pl › kursy
          </span>
        </div>
        <h3 className="font-montserrat text-[17px] leading-snug text-[#1a0dab] truncate">
          {title}
        </h3>
        <p className="font-montserrat text-[13px] leading-[150%] text-gray-600 line-clamp-2 mt-0.5">
          {desc}
        </p>
      </div>
    </div>
  );
}

// Karta wyniku audytu SEO — ocena, mocne strony i rekomendacje (z nasyceniem
// frazą kluczową w treści jako jednym z punktów).
const SEV_STYLE: Record<SeoRec["severity"], { dot: string; label: string }> = {
  critical: { dot: "bg-rose-500", label: "Krytyczne" },
  warning: { dot: "bg-amber-500", label: "Ostrzeżenie" },
  info: { dot: "bg-slate-400", label: "Wskazówka" },
};

function SeoAnalysisCard({ data }: { data: SeoAnalysis }) {
  const score = Math.max(0, Math.min(100, Math.round(data.score)));
  const scoreColor =
    score >= 85
      ? "text-emerald-600"
      : score >= 70
        ? "text-amber-600"
        : "text-rose-600";
  return (
    <div className="rounded-2xl rounded-tr-none border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`font-jakarta font-bold text-[26px] leading-none ${scoreColor}`}
        >
          {score}
          <span className="text-[14px] text-gray-300">/100</span>
        </span>
        <p className="font-montserrat text-[12.5px] text-gray-600 leading-snug">
          {data.summary}
        </p>
      </div>

      {data.strengths?.length > 0 && (
        <ul className="flex flex-col gap-1 mb-3">
          {data.strengths.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 font-montserrat text-[12px] text-emerald-700"
            >
              <CheckCircle
                size={14}
                weight="fill"
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              {s}
            </li>
          ))}
        </ul>
      )}

      {data.recommendations?.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.recommendations.map((r, i) => {
            const sev = SEV_STYLE[r.severity] ?? SEV_STYLE.info;
            return (
              <div
                key={i}
                className="rounded-xl rounded-tr-[3px] border border-gray-100 bg-gray-50/70 p-2.5"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`size-2 rounded-full shrink-0 ${sev.dot}`} />
                  <span className="font-montserrat font-bold text-[12px] text-brand-secondary">
                    {r.title}
                  </span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {sev.label}
                  </span>
                </div>
                {r.hint && (
                  <p className="font-montserrat text-[11.5px] text-gray-500 leading-snug pl-4">
                    {r.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Licznik znaków z progiem zalecanej długości (zielony/czerwony).
function CharHint({ value, max }: { value: number; max: number }) {
  return (
    <span
      className={`mt-1 inline-block font-montserrat text-[11px] font-bold ${
        value === 0
          ? "text-gray-300"
          : value <= max
            ? "text-emerald-500"
            : "text-rose-500"
      }`}
    >
      {value}/{max} znaków
    </span>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-200 bg-white font-montserrat text-[14px] text-[#0B3B4C] placeholder:text-gray-300 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-montserrat font-semibold text-[12px] text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

// Kafelek metryki w podsumowaniu (ikona + etykieta + wartość).
function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl rounded-tr-none border border-gray-100 bg-white p-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-gray-400">
        <Icon size={14} weight="duotone" className="text-brand-primary" />
        {label}
      </span>
      <p className="font-jakarta font-bold text-[15px] text-brand-secondary mt-1 truncate">
        {value}
      </p>
    </div>
  );
}
