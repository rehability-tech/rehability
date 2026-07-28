# BRIEF: Odtwarzacz VOD w panelu użytkownika

Kompletna specyfikacja do odtworzenia 1:1 w nowej aplikacji.
Źródło: `/panel/vod/[slug]` — `VodCoursePlayer.tsx` + `HlsPlayer.tsx`.

---

## 1. Cel

Ekran oglądania kursu wideo dla zalogowanego użytkownika z wykupionym dostępem.
Łączy w sobie: własny odtwarzacz HLS, nawigację po lekcjach, zapis postępu,
oznaczanie ukończenia, opinie i rekomendacje kolejnych kursów.

Filozofia UI: **YouTube-like** — player na całą szerokość na górze, pod nim tytuł
+ akcje, dalej nawigacja lekcji, opis, program kursu, opinie, podobne kursy.

---

## 2. Stack i zależności

| Warstwa | Technologia |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Styl | Tailwind CSS |
| Animacje | **framer-motion** (cały ruch UI — nie CSS/Tailwind keyframes) |
| Ikony | `@phosphor-icons/react/dist/ssr` |
| Wideo | `hls.js` (^1.6) + natywny HLS na Safari/iOS |
| Toasty | `sonner` |
| ORM | Prisma |
| Auth | NextAuth (`getServerSession`) |
| Hosting wideo | Bunny Stream (Video Library + Pull Zone z token-auth) |

---

## 3. Architektura trasy

```
/panel/vod/[slug]/page.tsx            ← Server Component: auth + gating + pobranie danych
  └── _components/VodCoursePlayer.tsx ← "use client": cały UI i logika ekranu
        └── _components/HlsPlayer.tsx ← "use client": czysty odtwarzacz wideo
```

### 3.1 Server Component (`page.tsx`)

```
export const dynamic = "force-dynamic";   // podpisane URL-e HLS mają TTL — nie cache'ujemy
```

Kolejność:

1. `getServerSession` → brak sesji → `redirect("/logowanie?callbackUrl=/panel/vod")`
2. `getCourseForPlayer(slug)` → brak → `notFound()`
   — zapytanie filtruje **`status: "PUBLISHED"`** (kurs `DRAFT`/`ARCHIVED` nie odtworzy się
   nawet przy istniejącym `Enrollment`) i sortuje `modules.order asc` → `lessons.order asc`
3. **Gating**: `isUserEnrolled(userId, slug)` → brak dostępu → `redirect("/kursy/{slug}/checkout")`
4. Równolegle (`Promise.all`):
   - `getCourses()` — katalog do sekcji „Podobne kursy"
   - `getCompletedLessonIds(userId, courseId)` — ukończone lekcje
   - `getCourseLessonSeconds(userId, courseId)` — mapa `lessonId → sekundy` (wznawianie)
   - `getUserCourseReview(userId, courseId)` — własna opinia (lub null)
   - `getCourseWatchState(userId, courseId)` — `{ watchedSec, completed }` dla formatu „single"
   - `getVodOverview(userId)` — do mapy `slug → % postępu` posiadanych kursów
5. `generateMetadata` → `"{tytuł} – VOD"`

### 3.2 Props przekazywane do klienta

```ts
{
  course: PlayerCourse;                     // kurs z lekcjami + podpisany HLS
  allCourses: Course[];                     // katalog (podobne kursy)
  completedLessonIds: string[];
  lessonSeconds: Record<string, number>;    // lessonId → sekundy
  myReview: { rating: number; text: string } | null;
  viewerName: string;                       // session.user.name ?? "Ty"
  initialCompleted: boolean;                // Enrollment.completedAt
  initialWatchedSec: number;                // Enrollment.watchedSec (single)
  ownedProgress: Record<string, number>;    // slug → % (karty „Podobne kursy")
}
```

---

## 4. Model danych (Prisma — 1:1 z produkcyjnym schematem)

Poniżej pola **faktycznie istniejące** w modelach. Oznaczone `[player]` są używane
przez ekran odtwarzacza; reszta należy do modułu VOD i musi istnieć, bo mapper
`mapCourse()` je czyta.

```prisma
model Course {
  id           String   @id @default(cuid())          // [player]
  slug         String   @unique                       // [player]
  title        String                                 // [player]
  category     String                                 // [player]
  excerpt      String   @db.Text                      // [player]
  price        Int      @default(0)                   // [player] karty „Podobne kursy"
  durationMin  Int      @default(0)                   // [player]
  // Zagregowane oceny (cache liczony z CourseReview): rating = średnia, reviews = liczba.
  rating       Float    @default(0)                   // [player]
  reviews      Int      @default(0)                   // [player]
  // Licznik wyświetleń strony kursu (cache; szczegóły dedupowane w CourseView).
  views        Int      @default(0)
  // "single" = jeden film, "sections" = moduły/lekcje
  format       String   @default("sections")          // [player]
  video        String?  // embed URL Bunny — główny film (single) lub zwiastun  // [player]
  // Długość głównego wideo w sekundach (z Bunny) — MIANOWNIK % postępu „single".
  videoDurationSec Int  @default(0)
  image        String?  // miniatura; gdy null → kadr z wideo (Bunny)          // [player]
  status       String   @default("PUBLISHED")  // DRAFT | PUBLISHED | ARCHIVED // [player]
  // elastyczne pola treści (bloki)
  description  Json?    // zakładka „O kursie"
  content      Json?    // zakładka „Zawartość"
  faq          Json?
  // ── SEO (mirror modelu Post/Trip) ──
  metaTitle       String?
  metaDescription String?  @db.Text
  focusKeyword    String?
  ogImage         String?
  canonicalUrl    String?
  noIndex         Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  publishedAt  DateTime?   // data PIERWSZEJ publikacji; null = nigdy

  modules       CourseModule[]
  enrollments   Enrollment[]
  courseReviews CourseReview[]
  pageViews     CourseView[]
  favorites     CourseFavorite[]
  purchases     CoursePurchase[]

  @@index([status])
}

model CourseModule {
  id       String   @id @default(cuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title    String
  order    Int      @default(0)     // sortowanie modułów (asc)
  lessons  Lesson[]
  @@index([courseId])
}

model Lesson {
  id          String       @id @default(cuid())
  moduleId    String
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  description String?      @db.Text
  video       String?      // embed URL Bunny
  // Długość nagrania w sekundach (z Bunny) — MIANOWNIK % postępu „sections".
  durationSec Int          @default(0)
  order       Int          @default(0)   // sortowanie lekcji (asc)
  progress    LessonProgress[]
  @@index([moduleId])
}

model Enrollment {
  id          String    @id @default(cuid())
  userId      String
  courseId    String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt   // baza „ostatnio oglądany"
  completedAt DateTime?                  // ukończenie kursu (ustawiane raz)
  watchedSec  Int       @default(0)      // postęp filmu w formacie "single"
  @@unique([userId, courseId])
  @@index([userId])
}

model LessonProgress {
  id        String   @id @default(cuid())
  userId    String
  lessonId  String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completed Boolean  @default(false)
  seconds   Int      @default(0)
  updatedAt DateTime @updatedAt
  @@unique([userId, lessonId])
  @@index([userId])
}

model CourseReview {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating    Int      // 1–5
  text      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([courseId, userId])   // UWAGA: kolejność courseId_userId (klucz złożony)
  @@index([courseId])
}

// Potrzebny do przycisku „Zapisz" w odtwarzaczu (useFavorites).
// Gość trzyma ulubione w localStorage; po zalogowaniu migrujemy do bazy.
model CourseFavorite {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, courseId])
  @@index([userId])
}
```

Modele **nieużywane przez sam odtwarzacz**, ale należące do modułu VOD (dla kompletności
relacji `Course`): `CourseView` (dedupowane wyświetlenia), `CoursePurchase` (utrwalony
zakup: kwota w groszach + snapshot danych do faktury, idempotentny po `paymentIntentId`).

### 4.1 Dwa formaty kursu

- `format = "single"` → jeden film; postęp na `Enrollment.watchedSec`, `LessonProgress` nieużywany, lekcje mają puste `id`.
- `format = "sections"` → moduły → lekcje; postęp per lekcja w `LessonProgress`, `Enrollment.watchedSec` zostaje 0.

### 4.2 ⚠️ Dwa RÓŻNE sposoby liczenia postępu — nie pomylić

To najczęstsze źródło rozjazdu. W systemie współistnieją dwie miary:

| Gdzie | Wzór | Cel |
| --- | --- | --- |
| **Wewnątrz odtwarzacza** (pasek „Twój postęp") | `ukończone lekcje / wszystkie lekcje` | natychmiastowy, optymistyczny feedback po kliknięciu „ukończone" — liczony z lokalnego `Set` bez round-tripu |
| **Serwer** (`ownedProgress`, `/panel/vod`, karty „Podobne kursy") | **po obejrzanym CZASIE** | realny postęp oglądania, odporny na „odklikanie" lekcji |

Funkcje serwerowe:

```ts
// format "single": ukończony → 100; w trakcie → watchedSec / videoDurationSec, CAP 99%
singleProgress(completedAt, watchedSec, videoDurationSec): number

// format "sections": lekcja completed = pełny durationSec, w trakcie = min(seconds, durationSec)
// Lekcje z durationSec = 0 (brak nagrania) POMIJANE w mianowniku.
// Gdy ŻADNA lekcja nie ma durationSec → fallback na ukończone/wszystkie.
lessonsTimeProgress(lessons, progressByLesson, completedAt): number
```

Cap 99% dla „single" jest celowy — pełne 100% daje dopiero realne dojście do końca
filmu (`completedAt`). **Konsekwencja:** bez uzupełnionych `Lesson.durationSec` /
`Course.videoDurationSec` (pobieranych z Bunny przy uploadzie) postęp serwerowy
spadnie do fallbacku po liczbie lekcji lub pokaże 0%.

---

## 5. Warstwa wideo — Bunny Stream

### 5.1 Zasada

- W bazie trzymamy **embed URL** Bunny: `https://iframe.mediadelivery.net/embed/{libraryId}/{guid}`.
- Odtwarzacz kursanta NIE gra z iframe — gra z **podpisanego HLS** we własnym playerze.
- Iframe Bunny używamy tylko w podglądach admina.

### 5.2 Konwersja embed → podpisany HLS (serwer)

```ts
// GUID z embed URL
bunnyGuidFromEmbed(url)   // /embed/{lib}/([^/?#]+)

// Bazowy HLS
bunnyHlsUrl(guid)         // https://{CDN_HOST}/{guid}/playlist.m3u8

// Podpisany HLS — token-auth na pull zone, TTL 6 h
bunnySignedHlsUrl(guid, ttlSeconds = 6 * 3600)
```

Algorytm podpisu (Bunny Token Authentication):

```ts
const expires   = Math.floor(Date.now() / 1000) + ttlSeconds;
const tokenPath = `/${videoId}/`;                    // CAŁY katalog wideo
const token = crypto.createHash("sha256")
  .update(`${TOKEN_KEY}${tokenPath}${expires}`)
  .digest("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");  // base64url

return `${base}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`;
```

> **Kluczowe:** podpisujemy `token_path` (katalog), a nie sam plik playlisty —
> inaczej segmenty `.ts` i warianty jakości dostaną 403.

`getCourseForPlayer()` mapuje każde `video` (kursu i każdej lekcji) na dodatkowe pole
`videoHls` — klient dostaje gotowe, podpisane URL-e i nigdy nie widzi klucza API.

Zwracany kształt (`PlayerCourse`):

```ts
type PlayerLesson = { id: string; title: string; video: string | null; videoHls: string | null };
type PlayerModule = { title: string; lessons: PlayerLesson[] };
type PlayerCourse = {
  id; slug; title; category; excerpt;
  rating; reviews; durationMin;
  image: string;              // z courseCover() — zawsze niepusty
  format: string;
  video: string | null;
  videoHls: string | null;
  videoDurationSec: number;   // przekazywane, ale sam player go NIE używa
  modules: PlayerModule[];
  testimonials: CourseReview[];   // { author, rating, text }
};
```

### 5.3 Okładka / poster — `courseCover()`

```ts
courseCover(image, video) =
  image                              // 1. własna miniatura
  ?? bunnyThumbnailUrl(guid)         // 2. automatyczny kadr z wideo: {CDN}/{guid}/thumbnail.jpg
  ?? "/images/kursy/kurs-1.png";     // 3. statyczny fallback
```

Wynik trafia do `course.image` i jest używany jako `poster` playera oraz tło przed startem.
Pull zone Stream blokuje bezpośredni dostęp do plików (sprawdza `Referer`), więc kadr
pobiera się **po stronie serwera** z nagłówkiem `Referer: https://iframe.mediadelivery.net/`.

### 5.4 Zmienne środowiskowe

```
BUNNY_STREAM_LIBRARY_ID
BUNNY_STREAM_API_KEY        # NIGDY na kliencie
BUNNY_STREAM_CDN_HOSTNAME   # np. vz-xxxxxxxx.b-cdn.net
BUNNY_STREAM_TOKEN_KEY      # klucz token-auth pull zone
NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME  # tylko miniatury
```

---

## 6. Komponent `HlsPlayer` — specyfikacja

Czysty, samodzielny odtwarzacz. Zero wiedzy o kursach.

### 6.1 API

```ts
{
  src: string;               // URL (HLS lub zwykły plik)
  isHls: boolean;
  poster?: string;
  autoPlay?: boolean;        // czy grać od razu po zamontowaniu (domyślnie false)
  startAt?: number;          // sekunda wznowienia (0 = od początku)
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (seconds: number, duration: number) => void;  // throttlowany
  overlay?: React.ReactNode; // nakładka renderowana WEWNĄTRZ playera
}
```

### 6.2 Ładowanie źródła

```ts
const canNative = video.canPlayType("application/vnd.apple.mpegurl");

if (isHls && !canNative) {
  const Hls = (await import("hls.js")).default;   // LENIWY import — poza SSR i initial bundle
  if (Hls.isSupported()) {
    hls = new Hls({ enableWorker: true });
    hls.loadSource(src);
    hls.attachMedia(video);
  } else {
    video.src = src;
  }
} else {
  video.src = src;    // Safari/iOS — natywny HLS
}
if (autoPlay) video.play().catch(() => {});
```

Cleanup: `cancelled = true` (guard po async) + `hls?.destroy()`.

### 6.3 Kontrolki (minimalistyczne)

- Pasek czasu (`<input type="range">`) z gradientowym wypełnieniem w kolorze marki:
  `linear-gradient(to right, var(--color-primary) X%, rgba(255,255,255,.3) X%)`
- Play / Pause
- Czas `M:SS / M:SS` (`tabular-nums`)
- Wycisz + suwak głośności (suwak ukryty `< sm`)
- Pełny ekran (`CornersOut` / `CornersIn`)
- Duży przycisk ▶ na środku, gdy zapauzowane — **chowany, gdy jest `overlay`**
- Klik w samo `<video>` = play/pauza

Pasek na gradiencie `from-black/70 to-transparent`, **auto-ukrywanie po 2600 ms**
podczas odtwarzania (`poke()` na `mousemove` / `touchstart` resetuje timer).

### 6.4 Pełny ekran + orientacja (mobile)

```ts
// Wejście: fullscreen na WRAPPERZE (żeby overlay był widoczny), potem lock landscape
el.requestFullscreen().then(lockLandscape)
// iPhone (brak Fullscreen API na elementach): fallback video.webkitEnterFullscreen()
// Wyjście z fullscreen → screen.orientation.unlock() → powrót do pionu
```

Nasłuch `fullscreenchange` steruje ikoną i blokadą orientacji. Wszystkie wywołania
w `try/catch` — iOS Safari nie wspiera `orientation.lock()`.

### 6.5 Raportowanie postępu

- Na `timeupdate`: raport **nie częściej niż co 10 s** (`t >= last + 10`) **lub** gdy czas cofnięto (`t < last`).
- **Flush końcowy** na `pagehide` i `visibilitychange → hidden` — throttle 10 s
  gubiłby ostatni interwał.
- Wywołania fetch z `keepalive: true`, żeby request przeżył zamknięcie karty.

### 6.6 Wznawianie pozycji

Na `loadedmetadata` / `durationchange`, **jednorazowo** (`seekedRef`):

```ts
if (!seekedRef.current && startAt > 1 && v.duration && startAt < v.duration - 2) {
  seekedRef.current = true;
  try { v.currentTime = startAt; } catch {}
}
```

Warunek `startAt < duration - 2` zapobiega wznowieniu „na napisach końcowych".

---

## 7. `VodCoursePlayer` — logika ekranu

### 7.1 Spłaszczenie programu kursu

Moduły → jedna płaska lista lekcji z **globalną numeracją 1-based**:

```ts
type FlatLesson = {
  id: string; moduleIndex: number; lessonIndex: number;
  moduleTitle: string; title: string;
  video: string | null; videoHls: string | null;
  no: number;   // globalny numer lekcji
};
```

Dla `format="single"` (lub kursu bez modułów) tworzymy **wirtualny moduł**
z jedną lekcją o pustym `id` i głównym wideo kursu. Dzięki temu reszta logiki
ma jedną ścieżkę kodu; puste `id` = brak rekordu `LessonProgress`.

Nawigacja trzyma tylko `activeNo` (numer), lekcja = `lessons.find(l => l.no === activeNo)`.

### 7.2 Trzy flagi sterujące playerem

| Flaga | Znaczenie |
| --- | --- |
| `started` | player zamontowany (dopiero po pierwszym kliknięciu ▶ — przed tym pokazujemy okładkę) |
| `expanded` | „tryb immersyjny" — sterowany zdarzeniami `play`/`pause` playera |
| `playOnLoad` | czy po (prze)montowaniu grać od razu |

Reguła autoplay:
- **Zmiana lekcji z nawigacji/programu** → `playOnLoad = false` → wideo ładuje się zapauzowane z dużym ▶ (zgodność z politykami autoplay przeglądarek + świadomy wybór użytkownika).
- **„Następna lekcja" po zakończeniu** → `playOnLoad = true` → ciągłość oglądania.

### 7.3 Tryb immersyjny (`expanded`)

- `onPlay` → `expanded = true`, `onPause` → `expanded = false`.
- Gdy `expanded`: link „Wróć do biblioteki" **zwija się animacją siatki**
  (`grid-rows-[1fr]` → `grid-rows-[0fr]` + opacity + translate).
- Na **mobile** player wychodzi do krawędzi ekranu: `-mx-4 -mt-6 rounded-none`;
  na `lg:` wraca do karty `lg:mx-0 lg:mt-0 lg:rounded-3xl lg:rounded-tr-none`.

### 7.4 `key` playera — krytyczne

```tsx
<HlsPlayer key={active.videoHls || active.video || active.id} ... />
```

Zmiana źródła = pełny remount (czysty stan hls.js, resetuje `seekedRef`).
**Konsekwencja:** nigdy nie wołamy `router.refresh()` na tym ekranie — odświeżenie
generuje nowy podpisany HLS (nowy `key`) i przerywa oglądanie. Wszystkie mutacje
(opinie, postęp) aktualizują **stan lokalny**.

### 7.5 Zapis postępu

```ts
// throttling 10 s robi HlsPlayer; tu tylko routing danych
const body = isSingle
  ? { courseId: course.id, seconds }       // → Enrollment.watchedSec
  : activeLessonId
    ? { lessonId: activeLessonId, seconds } // → LessonProgress.seconds
    : null;

fetch("/api/panel/vod/progress", { method: "POST", body: JSON.stringify(body), keepalive: true })
  .catch(() => {});   // offline = cicha porażka, UI już zaktualizowane
```

Pozycja wznowienia:
```ts
const resumeAt = isSingle ? initialWatchedSec : (lessonSeconds[activeLessonId] ?? 0);
```

Postęp % **w komponencie** (pasek „Twój postęp"):
```ts
completed = lessons.filter(l => l.id && doneIds.has(l.id)).length;
progress  = total ? Math.round((completed / total) * 100) : 0;
```

> To liczenie **po lekcjach**, celowo inne niż serwerowe liczenie **po czasie**
> (`singleProgress` / `lessonsTimeProgress` — patrz 4.2). Player potrzebuje reakcji
> natychmiastowej po kliknięciu „ukończone", bez round-tripu. Karty „Podobne kursy"
> na tym samym ekranie pokazują już wartość serwerową z `ownedProgress`.

`doneIds` to `Set<string>` w stanie, seedowany z `completedLessonIds`.
Toggle ukończenia jest **optymistyczny** — najpierw UI, potem fetch.

### 7.6 Zakończenie wideo → nakładka + auto-next

`handleVideoEnded()`:
1. `showEndPrompt = true`, `expanded = true`
2. Jeśli lekcja ma `id` i nie jest ukończona → dodaj do `doneIds` + POST `{ lessonId, completed: true }`
3. Jeśli **ostatnia lekcja** → `markCourseComplete()` (POST `/api/panel/vod/complete`, idempotentne)
4. Jeśli **jest następna** → start odliczania `autoNextIn = 5`

Odliczanie: `useEffect` z `setTimeout(1000)`, po dojściu do 0 → `goToNextLesson()`.

**Dwa warianty nakładki** (renderowanej *wewnątrz* playera — widoczna też w fullscreen):

| Warunek | Treść |
| --- | --- |
| ostatnia lekcja | ⭐ „To już koniec — jak Ci się podobało?" → **Oceń kurs** / Później |
| jest następna | ✅ „Lekcja ukończona" + tytuł następnej + „Automatyczne przejście za Ns…" → **Następna teraz (N)** / Anuluj |

Tło nakładki: `bg-brand-secondary/85 backdrop-blur-md`, wejście animowane
(fade kontenera + `scale 0.92→1`, `y 12→0`, ease `[0.22, 1, 0.36, 1]`).

„Oceń kurs" → `goToReview()`: zamyka nakładkę, otwiera formularz (tryb edycji, jeśli
opinia istnieje), po 60 ms `scrollIntoView({ behavior: "smooth", block: "center" })`,
po 650 ms `focus()` na textarea.

### 7.7 Sekcja opinii

- Stan lokalny `reviews` (seed z serwera) + `myReview`.
- **Własna opinia wyodrębniona z listy** i przypięta na górze z tagiem „Twoja opinia"
  + przyciski edycji/usuwania (żeby się nie dublowała).
- Pozostałe opinie: **3 na stronę** + paginacja `‹ 1/N ›`.
- Wejście kart: framer-motion **waterfall** — kontener `staggerChildren: 0.09`,
  dziecko `opacity 0→1`, `y 16→0`, `duration .32`, ease `[0.22, 1, 0.36, 1]`,
  `AnimatePresence mode="wait"` przy zmianie strony.
- Formularz: 5 gwiazdek z `whileHover={{ scale: 1.2, rotate: -6 }}`,
  `whileTap={{ scale: 0.85 }}`, spring `stiffness 400 / damping 14`;
  etykiety ocen: `["", "Słabo", "Może być", "Dobrze", "Bardzo dobrze", "Super!"]`.
- Walidacja klienta: `rating >= 1`, `text.trim().length >= 3`, `maxLength 2000`.
- Pusty stan: „Jeszcze nikt nie ocenił tego kursu" + zachęta.
- Akcje na mobile jako same ikony, od `sm:` z etykietami.

### 7.8 Pozostałe sekcje

- **Tytuł + meta**: dla `sections` badge „Lekcja X/Y" + tytuł kursu wyżej, `<h1>` = tytuł lekcji; dla `single` `<h1>` = tytuł kursu. Meta: kategoria · ocena (opinii) · liczba lekcji · czas · „Ukończono".
- **Akcje**: `Zapisz` (ulubione — wspólny provider: gość = localStorage, zalogowany = baza), `Udostępnij` (`navigator.share` → fallback kopiowanie linku publicznego + toast).
- **Nawigacja lekcji** (tylko `sections`): ‹ Poprzednia | [Lekcja N — toggle ukończenia] | Następna ›. Etykiety tekstowe ukrywane poniżej `420px`.
- **Opis** rozwijany („Pokaż więcej/mniej") — `excerpt` + lista „Czego się nauczysz".
- **Postęp**: pasek `bg-gradient-to-r from-brand-primary to-brand-yellow` + „Ukończono X z Y lekcji".
- **Program kursu**: akordeon modułów (jeden otwarty naraz, domyślnie moduł aktywnej lekcji). Ikona lekcji: ✅ ukończona / ▶ aktywna / 🔒 pozostałe.
- **Podobne kursy**: max 4 — najpierw ta sama kategoria, dopełnione innymi. Karta posiadanego kursu → link do `/panel/vod/{slug}` + pasek postępu („Obejrzano X%" / „Ukończony”); nieposiadanego → `/kursy/{slug}` + cena.

---

## 8. Kontrakty API

### `POST /api/panel/vod/progress`
Auth: wymagana. Body (jeden z wariantów):
```jsonc
{ "courseId": "…", "seconds": 123 }                 // format "single" → Enrollment.watchedSec
{ "lessonId": "…", "seconds": 123 }                 // format "sections" → LessonProgress.seconds
{ "lessonId": "…", "completed": true }              // toggle ukończenia
```
Zasady serwera:
- **Weryfikacja dostępu**: dla `lessonId` idziemy `lesson → module → courseId` i sprawdzamy `Enrollment` (inaczej każdy zalogowany zapisałby postęp cudzej lekcji) → 403.
- `seconds` **monotonicznie rosnące** (`Math.max(existing, new)`) — przewinięcie wstecz nie cofa postępu.
- `completed` i `seconds` aktualizowane **niezależnie** (tick playera niesie tylko sekundy, przycisk tylko flagę).
- Odpowiedzi: `401` brak sesji, `403` brak dostępu, `404` brak lekcji, `400` brak identyfikatora.

### `POST /api/panel/vod/complete`
Body: `{ courseId }`. Ustawia `Enrollment.completedAt` **tylko raz** (pierwsze ukończenie).
403 bez dostępu.

### `POST | DELETE /api/kursy/[slug]/opinie`
- POST body (zod): `{ rating: int 1–5, text: string 3–2000 }` (`text` trimowany).
- Tylko kursant z `Enrollment` (403); brak kursu → 404; brak sesji → 401.
- Upsert po kluczu złożonym `courseId_userId`; `rating` dodatkowo klampowany serwerowo
  do 1–5 (`Math.min(5, Math.max(1, Math.round(r)))`).
- Po zapisie/usunięciu **przeliczenie agregatu w tej samej transakcji**:
  `reviews = count`, `rating = count > 0 ? Math.round(avg * 10) / 10 : 0`
  (zero → UI pokazuje badge „Nowość — brak ocen").
- Powiadomienie do adminów (typ `VOD`) z linkiem do `/admin/kursy/{slug}?tab=uczestnicy`.
- Autor opinii = `user.name`; fallback gdy brak nazwy. **W nowej aplikacji użyj
  neutralnego fallbacku** („Kursant" / „Uczestnik") — obecna implementacja ma tu
  literał w rodzaju żeńskim, niezgodny z regułą neutralnego języka.

### `GET /api/panel/vod/last`
Zwraca ostatnio oglądany kurs (skrót w sidebarze).

---

## 9. Design system (do przeniesienia)

```
--color-primary:   #287d88   (morski — akcenty, przyciski)
--color-secondary: #033f63   (granat — tekst, nagłówki)
--color-yellow:    #f2d967   (słoneczny akcent)
```

Wzorce:
- **Kształt „kropli"**: główne karty `rounded-3xl rounded-tr-none` (mniejsze: `rounded-2xl rounded-tr-none`, `rounded-[22px] rounded-tr-none`).
- **Glassmorphism**: `bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_16px_45px_-32px_rgba(3,63,99,0.35)]`.
- **Aktywny element**: morskie tło + biały tekst + **żółta poświata**
  `shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]` + `border-brand-yellow/30`.
- **Żółta kulka blasku**: `absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]` w prawym dolnym rogu aktywnych komponentów.
- Typografia: nagłówki `font-jakarta font-bold`, treść `font-montserrat`.
- Język neutralny płciowo („Twój postęp", „kursant", „Witaj").

---

## 10. Pułapki (rzeczy, które kosztowały czas)

1. **Nigdy `router.refresh()` na ekranie playera** — nowy podpisany HLS = nowy `key` = remount = przerwane oglądanie. Mutacje aktualizują stan lokalny.
2. `token_path` musi obejmować **cały katalog** wideo, nie samą playlistę — inaczej segmenty dostają 403.
3. `export const dynamic = "force-dynamic"` — podpisy HLS mają TTL, strony nie wolno cache'ować.
4. `hls.js` **tylko przez dynamic import** — pakiet jest duży i nie działa w SSR.
5. Nakładka końcowa musi być renderowana **wewnątrz** kontenera playera (prop `overlay`), inaczej znika w trybie pełnoekranowym.
6. Fullscreen zakładamy na **wrapper**, nie na `<video>` — inaczej tracimy własne kontrolki i overlay. iPhone wymaga fallbacku `webkitEnterFullscreen()`.
7. Autoplay: przeglądarki blokują `play()` bez gestu — stąd `started` (pierwszy klik montuje player) i `playOnLoad` (tylko przy świadomej kontynuacji).
8. Throttle 10 s **musi** mieć flush na `pagehide`/`visibilitychange`, inaczej gubimy ostatni interwał.
9. Sekundy zapisujemy **monotonicznie** — inaczej przewinięcie na początek kasowałoby postęp.
10. Lekcja formatu „single" ma puste `id` — każdy zapis do `LessonProgress` musi być za guardem `if (!active.id) return`.
11. Kolejność `Promise.all` w page.tsx ma znaczenie dla TTFB — 6 zapytań równolegle, nie sekwencyjnie.
12. **`Lesson.durationSec` / `Course.videoDurationSec` muszą być uzupełniane przy uploadzie** (Bunny zwraca `length` w statusie wideo). Bez nich serwerowy postęp po czasie spada do fallbacku po liczbie lekcji albo zwraca 0% — a UI wygląda, jakby nic się nie zapisywało.
13. `getVodOverview().progressByCourse` jest kluczowane **`course.id`**, a karty „Podobne kursy" potrzebują **`slug`** — page.tsx robi remap `Object.fromEntries(courses.map(c => [c.slug, progressByCourse[c.id] ?? 0]))`. Łatwo tu o cichy błąd (wszędzie 0%).
14. Klucz złożony `CourseReview` to `courseId_userId` (w tej kolejności) — odwrotna kolejność w `where` nie skompiluje się w Prisma Client.
15. `getCourseForPlayer` filtruje `status: "PUBLISHED"` — po cofnięciu kursu do `DRAFT` kursanci z dostępem dostaną 404. Świadoma decyzja, ale trzeba ją znać.

---

## 11. Checklista wdrożenia w nowej aplikacji

- [ ] Modele Prisma: `Course`, `CourseModule`, `Lesson`, `Enrollment`, `LessonProgress`, `CourseReview`, `CourseFavorite`
- [ ] Zapis `durationSec` / `videoDurationSec` z Bunny przy uploadzie (bez tego postęp serwerowy nie działa)
- [ ] Funkcje `singleProgress()` i `lessonsTimeProgress()` + świadomość dwóch miar postępu (4.2)
- [ ] Konto Bunny Stream: Video Library + Pull Zone z **Token Authentication**
- [ ] `lib/bunny.ts`: `bunnyGuidFromEmbed`, `bunnyHlsUrl`, `bunnySignedHlsUrl` (+ `"server-only"`)
- [ ] `getCourseForPlayer(slug)` mapujący `video → videoHls` dla kursu i każdej lekcji
- [ ] Gating na poziomie Server Component (`Enrollment` → redirect na checkout)
- [ ] `HlsPlayer` (sekcja 6) — samodzielny, reużywalny
- [ ] `VodCoursePlayer` (sekcja 7) — flagi `started` / `expanded` / `playOnLoad`, `key` na źródle
- [ ] `POST /api/panel/vod/progress` z weryfikacją dostępu i monotonicznymi sekundami
- [ ] `POST /api/panel/vod/complete` (idempotentne)
- [ ] `POST|DELETE /api/kursy/[slug]/opinie` + przeliczanie agregatu ocen w transakcji
- [ ] Nakładka końcowa: auto-next 5 s / prośba o opinię
- [ ] Sekcje: tytuł+akcje, nawigacja lekcji, opis, postęp, program, opinie, podobne kursy
- [ ] Design system: kropla, glass, żółta poświata, framer-motion
