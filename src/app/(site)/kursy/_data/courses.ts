// Statyczny katalog programów VOD odwzorowujący projekt z Figmy
// (frame /kursy(katalog), /kursy/[slug], /kursy/checkout).
// Docelowo do podmiany na model Prisma `Course`.

export type CourseBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  /** Wyróżniony akapit w ramce z akcentem (callout). */
  | { type: "highlight"; text: string }
  /** Cytat / wypowiedź eksperta. */
  | { type: "quote"; text: string }
  /** Pusta przerwa wizualna między sekcjami. */
  | { type: "spacer" };

/** Moduł programu (zakładka „Zawartość"). */
export interface CourseModule {
  title: string;
  lessons: string[];
}

/** Opinia kursanta (zakładka „Opinie"). */
export interface CourseReview {
  author: string;
  rating: number;
  text: string;
}

/** Pytanie i odpowiedź (zakładka „FAQ"). */
export interface CourseFaq {
  q: string;
  a: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: string;
  rating: number;
  reviews: number;
  /** Liczba wyświetleń strony kursu (z bazy; relikt COURSES jej nie ma). */
  views?: number;
  durationMin: number;
  price: number;
  image: string;
  /** Krótki podtytuł na stronie szczegółów (nagłówek). */
  excerpt: string;
  /**
   * Tryb kursu: „single" = jeden film (bez programu modułów),
   * „sections" = moduły + lekcje. Gdy brak — traktujemy jak „sections".
   */
  format?: "single" | "sections";
  /** Pełny opis w zakładce „O kursie". Gdy brak — render fallbacku. */
  description?: CourseBlock[];
  /** Opis zakładki „Zawartość" (co kurs zawiera). Gdy brak — render fallbacku. */
  content?: CourseBlock[];
  /** Program kursu (zakładka „Zawartość"). Gdy brak — render fallbacku. */
  curriculum?: CourseModule[];
  /** Opinie kursantów (zakładka „Opinie"). Gdy brak — render fallbacku. */
  testimonials?: CourseReview[];
  /** Najczęstsze pytania (zakładka „FAQ"). Gdy brak — render fallbacku. */
  faq?: CourseFaq[];
  /** Czy kursowi brakuje nagrań — UI pokazuje „Nagrania w przygotowaniu". */
  videoPending?: boolean;
  // ── SEO / Open Graph (z bazy; relikt COURSES ich nie ma) ──
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  /** Data utworzenia (ISO). */
  createdAt?: string;
  /** Data pierwszej publikacji (ISO) lub null, gdy nigdy nie publikowany. */
  publishedAt?: string | null;
}

/** Formatuje czas materiału: 200 → „3h 20 min", 42 → „42 min", 0 → „—". */
export function formatCourseDuration(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m} min`;
  if (h) return `${h}h`;
  return `${m} min`;
}

// Standardowe korzyści dla każdego kursu VOD (zakładka „O kursie", fallback).
export const COURSE_BENEFITS: string[] = [
  "**Dożywotni dostęp** do platformy VOD – ćwiczysz, kiedy chcesz i gdzie chcesz.",
  "**Wideo w jakości 4K** z wieloma kątami kamery, aby dokładnie widzieć każdy ruch.",
  "**E-book ze skryptem (PDF)** – ściągawka do wydrukowania i powieszenia na lustrze.",
  "Bezpieczeństwo i pewność, że wykonujesz ruchy ułożone przez dyplomowanego specjalistę.",
];

// Lista „Zawartość" w podsumowaniu zamówienia (checkout).
export const ORDER_INCLUDES: string[] = [
  "Dożywotni dostęp do aplikacji",
  "Treści chronione na panelu kursanta",
  "Natychmiastowy dostęp",
];

// Domyślny program kursu (zakładka „Zawartość", fallback).
export const DEFAULT_CURRICULUM: CourseModule[] = [
  {
    title: "Moduł 1 · Wprowadzenie",
    lessons: [
      "Jak korzystać z platformy i przejść przez program",
      "Krótka autodiagnoza — od czego zacząć",
      "Zasady bezpiecznego ćwiczenia w domu",
    ],
  },
  {
    title: "Moduł 2 · Część praktyczna",
    lessons: [
      "Rozgrzewka i przygotowanie ciała do pracy",
      "Ćwiczenia krok po kroku, pokazane z wielu ujęć kamery",
      "Modyfikacje dla początkujących i zaawansowanych",
    ],
  },
  {
    title: "Moduł 3 · Utrwalenie efektów",
    lessons: [
      "Gotowe plany ćwiczeń na cały tydzień",
      "Najczęstsze błędy i jak ich unikać",
      "Jak podtrzymać rezultaty na co dzień",
    ],
  },
];

// Domyślne FAQ (zakładka „FAQ", fallback).
export const DEFAULT_FAQ: CourseFaq[] = [
  {
    q: "Jak długo mam dostęp do kursu?",
    a: "Dostęp jest dożywotni. Po zakupie materiały zostają na Twoim panelu kursanta — wracasz do nich, kiedy tylko chcesz, bez żadnych limitów czasowych.",
  },
  {
    q: "Czy potrzebuję specjalnego sprzętu?",
    a: "Nie. Program zaprojektowaliśmy tak, by dało się go wykonać w domu. Jeśli przyda się akcesorium (np. mata czy wałek), zaznaczamy to i pokazujemy alternatywy bez sprzętu.",
  },
  {
    q: "Czy ćwiczenia są bezpieczne?",
    a: "Tak. Wszystkie sekwencje ułożył dyplomowany specjalista, a każdy ruch tłumaczymy krok po kroku wraz z modyfikacjami dla różnych poziomów. W razie wątpliwości zdrowotnych skonsultuj się z lekarzem.",
  },
  {
    q: "Na jakich urządzeniach obejrzę materiały?",
    a: "Na komputerze, tablecie i telefonie. Treści odtwarzasz bezpośrednio na chronionym panelu kursanta — wystarczy dostęp do internetu.",
  },
  {
    q: "Czy otrzymam fakturę?",
    a: "Tak. Po opłaceniu zamówienia automatycznie wystawiamy dokument zakupu na podane dane.",
  },
];

export const COURSES: Course[] = [
  {
    id: "c1",
    slug: "zdrowy-silny-kregoslup",
    title: "Zdrowy i silny kręgosłup: Program ratunkowy w bólu lędźwi",
    category: "Fizjoterapia",
    rating: 4.6,
    reviews: 45,
    durationMin: 120,
    price: 149,
    image: "/images/kursy/kurs-1.png",
    excerpt:
      "Specjalistyczny plan działania, który krok po kroku wyprowadzi Cię z ostrego bólu lędźwiowego i przywróci stabilność kręgosłupa.",
  },
  {
    id: "c2",
    slug: "ergonomia-pracy",
    title: "Ergonomia pracy i zdrowa postawa za biurkiem",
    category: "Prewencja",
    rating: 4.8,
    reviews: 32,
    durationMin: 90,
    price: 119,
    image: "/images/kursy/kurs-2.png",
    excerpt:
      "Naucz się ustawiać stanowisko pracy i ciało tak, by długie godziny przy biurku przestały generować ból i napięcia.",
  },
  {
    id: "c3",
    slug: "lifting-twarzy-kobido",
    title: "Naturalny lifting twarzy: Podstawy automasażu Kobido",
    category: "Automasaż",
    rating: 5.0,
    reviews: 28,
    durationMin: 60,
    price: 169,
    image: "/images/kursy/kurs-3.png",
    excerpt:
      'Poznaj sekrety japońskiego "liftingu bez skalpela". Naucz się technik, które ujędrniają owal twarzy, redukują zmarszczki i przywracają skórze naturalny blask w domowym zaciszu.',
    description: [
      {
        type: "paragraph",
        text: "Twoja twarz to mapa emocji, codziennego stresu i przewlekłych napięć.",
      },
      {
        type: "paragraph",
        text: "Czy wiesz, że zaciskanie żuchwy, marszczenie czoła czy wielogodzinna praca przed ekranem nie tylko powodują ból, ale też drastycznie przyspieszają procesy starzenia?",
      },
      {
        type: "paragraph",
        text: "Ten autorski program to Twoja prywatna sesja terapeutyczna, którą możesz wykonać we własnej łazience. Odkryj starojapońską sztukę Kobido i przekonaj się, że najlepszy lifting to ten, który możesz wykonać własnymi dłońmi – bez skalpela, bez igieł, w pełnej zgodzie z naturą.",
      },
      { type: "heading", text: "Dlaczego ten program jest wyjątkowy?" },
      {
        type: "paragraph",
        text: "Automasaż Kobido to znacznie więcej niż standardowa pielęgnacja kosmetyczna. To głęboka, holistyczna praca na tkankach, powięzi i mięśniach twarzy, szyi oraz dekoltu. Pod okiem certyfikowanej terapeutki, Natalii Głód, nauczysz się precyzyjnych chwytów, które na co dzień stosujemy w naszym gabinecie premium.",
      },
      { type: "heading", text: "Dla kogo stworzyliśmy ten kurs?" },
      { type: "paragraph", text: "Ten program jest dla Ciebie, jeśli:" },
      {
        type: "list",
        items: [
          "Szukasz naturalnej i bezinwazyjnej alternatywy dla medycyny estetycznej (chcesz spłycić zmarszczki i ujędrnić owal twarzy).",
          "Budzisz się z napiętą żuchwą, zmagasz się z bruksizmem lub bólami napięciowymi głowy.",
          'Masz problem z porannymi obrzękami ("opuchnięta twarz") i zależy Ci na pobudzeniu krążenia limfy.',
          "Potrzebujesz skutecznego, wieczornego rytuału, który wyciszy Twój przebodźcowany układ nerwowy i ułatwi zasypianie.",
        ],
      },
      { type: "heading", text: "Co otrzymujesz, dołączając do kursu?" },
      {
        type: "list",
        items: COURSE_BENEFITS,
      },
    ],
  },
  {
    id: "c4",
    slug: "wieczorny-reset",
    title: "Wieczorny reset: Rozluźnianie ciała przed snem",
    category: "Relaks i stres",
    rating: 4.9,
    reviews: 52,
    durationMin: 75,
    price: 99,
    image: "/images/kursy/kurs-4.png",
    excerpt:
      "Zestaw delikatnych technik, które wyciszają układ nerwowy i przygotowują ciało do głębokiego, regenerującego snu.",
  },
  {
    id: "c5",
    slug: "przygotowanie-do-sportu",
    title: "Przygotowanie do sportu i prewencja kontuzji",
    category: "Mobilność",
    rating: 4.8,
    reviews: 19,
    durationMin: 150,
    price: 179,
    image: "/images/kursy/kurs-5.png",
    excerpt:
      "Kompleksowe rozgrzewki i ćwiczenia mobilności, które zminimalizują ryzyko kontuzji przed treningiem i zawodami.",
  },
  {
    id: "c6",
    slug: "uwolnij-kark",
    title: "Uwolnij kark: Ćwiczenia na napięciowe bóle głowy i szyi",
    category: "Fizjoterapia",
    rating: 4.6,
    reviews: 3,
    durationMin: 110,
    price: 139,
    image: "/images/kursy/kurs-6.png",
    excerpt:
      "Praktyczne ćwiczenia rozluźniające kark i obręcz barkową, które realnie redukują napięciowe bóle głowy.",
  },
  {
    id: "c7",
    slug: "swiadome-dno-miednicy",
    title: "Świadome dno miednicy: Podstawy treningu i relaksacji",
    category: "Zdrowie miednicy",
    rating: 4.8,
    reviews: 21,
    durationMin: 100,
    price: 149,
    image: "/images/kursy/kurs-7.png",
    excerpt:
      "Świadomy trening i relaksacja mięśni dna miednicy – fundament stabilności, komfortu i zdrowia na co dzień.",
  },
  {
    id: "c8",
    slug: "sztuka-rolowania",
    title: "Sztuka rolowania: Jak bezpiecznie uwalniać punkty spustowe",
    category: "Automasaż",
    rating: 4.7,
    reviews: 40,
    durationMin: 90,
    price: 109,
    image: "/images/kursy/kurs-8.png",
    excerpt:
      "Naucz się bezpiecznie pracować wałkiem i piłką, by samodzielnie uwalniać punkty spustowe i napięcia.",
  },
  {
    id: "c9",
    slug: "mobilnosc-na-co-dzien",
    title: "Mobilność na co dzień: Płynność ruchu w stawach",
    category: "Ruch na co dzień",
    rating: 4.7,
    reviews: 24,
    durationMin: 100,
    price: 129,
    image: "/images/kursy/kurs-9.png",
    excerpt:
      "Codzienna dawka mobilności, dzięki której odzyskasz płynność ruchu i swobodę w stawach.",
  },
];

// Statyczny fallback po slug z hardkodowanej listy COURSES (dane demo).
// UWAGA: to NIE jest źródło produkcyjne — realny kurs pobiera async
// `getCourseBySlug` z `@/lib/courses-db`. Nazwa celowo inna, by uniknąć kolizji
// i przypadkowego zaimportowania danych demo zamiast bazy.
export function getStaticCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

// Unikalne kategorie wyliczone z katalogu (kolejność wystąpienia) + "Wszystkie".
// Kategorie kursów VOD — JAWNA lista, NIEZALEŻNA od relikta `COURSES`.
// Trafia prosto do promptu AI w kreatorze kursu („Dostępne kategorie…”), więc
// jest realnym sygnałem o profilu platformy. Musi być NEUTRALNA płciowo i
// pokrywać pełne spektrum treningu (siłownia, sport, praca z ciałem), a nie
// tylko wellness — inaczej AI ściąga każdy brief w stronę relaksu.
export const COURSE_CATEGORIES: string[] = [
  "Wszystkie",
  "Fizjoterapia",
  "Trening siłowy",
  "Mobilność",
  "Prewencja",
  "Automasaż",
  "Ruch na co dzień",
  "Regeneracja i stres",
  "Zdrowie miednicy",
];
