# Plan budowy systemu kursów VOD — lista zadań dla AI

## Kontekst projektu

Next.js 14+ App Router, TypeScript, Tailwind CSS, Prisma (PostgreSQL), Stripe, Bunny Stream, Vercel Blob. Kod produkcyjny — bez placeholderów, bez TODO.

---

## FAZA 0 — Modele bazy danych

### Zadanie 0.1 — Schemat Prisma: modele VOD

Dodaj do `prisma/schema.prisma` następujące modele:

```prisma
model Course {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  category        String
  excerpt         String   @db.Text
  price           Int      @default(0)         // centy/grosze; 0 = darmowy
  durationMin     Int      @default(0)
  rating          Float    @default(0)
  reviews         Int      @default(0)
  views           Int      @default(0)
  format          String   @default("single")  // "single" | "sections"
  video           String?                       // Bunny embed URL (main/trailer)
  videoDurationSec Int     @default(0)
  image           String?
  status          String   @default("DRAFT")   // "DRAFT" | "PUBLISHED" | "ARCHIVED"
  description     Json?
  faq             Json?
  testimonials    Json?
  metaTitle       String?
  metaDescription String?
  focusKeyword    String?
  ogImage         String?
  canonicalUrl    String?
  noIndex         Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  modules         CourseModule[]
  enrollments     Enrollment[]
  courseReviews   CourseReview[]
  pageViews       CourseView[]
}

model CourseModule {
  id       String   @id @default(cuid())
  courseId String
  title    String
  order    Int
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]

  @@index([courseId])
}

model Lesson {
  id          String   @id @default(cuid())
  moduleId    String
  title       String
  description String?  @db.Text
  video       String?  // Bunny embed URL
  durationSec Int      @default(0)
  order       Int
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress    LessonProgress[]

  @@index([moduleId])
}

model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
}

model LessonProgress {
  id        String   @id @default(cuid())
  userId    String
  lessonId  String
  completed Boolean  @default(false)
  seconds   Int      @default(0)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}

model CourseReview {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  rating    Int      // 1–5
  text      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([courseId])
}

model CourseView {
  id          String   @id @default(cuid())
  courseId    String
  visitorHash String   // SHA256(IP + UA + date)
  day         DateTime @db.Date
  createdAt   DateTime @default(now())
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([courseId, visitorHash, day])
  @@index([courseId, day])
}
```

Następnie uruchom `npx prisma db push` (NIE `migrate dev` — brak shadow DB).

---

## FAZA 1 — Biblioteka backendowa

### Zadanie 1.1 — `src/lib/bunny.ts`

Utwórz bibliotekę do obsługi Bunny Stream. Wymagane zmienne env: `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_STREAM_TOKEN_KEY`, `BUNNY_WEBHOOK_SECRET`.

Zaimplementuj funkcje:
- `bunnyConfigured()` → `boolean` — czy env są ustawione
- `createBunnyVideo(title: string)` → `Promise<string>` — POST do Bunny API, zwraca GUID
- `getBunnyVideoStatus(videoId: string)` → `Promise<{ status, encodeProgress, ready, failed, length }>` — GET status
- `listBunnyVideos()` → `Promise<{ guid, title, dateUploaded }[]>` — lista wideo
- `deleteBunnyVideo(videoId: string)` → `Promise<boolean>` — usuwa wideo (404 = success)
- `bunnyTusSignature(videoId: string, expire: number)` → `string` — SHA256(libraryId + apiKey + expire + videoId)
- `bunnyEmbedUrl(videoId: string)` → `string` — `https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{videoId}`
- `bunnyHlsUrl(videoId: string)` → `string` — `https://{CDN_HOST}/{videoId}/playlist.m3u8`
- `bunnyGuidFromEmbed(url: string | null)` → `string | null` — extrahuje GUID z embed URL
- `bunnyThumbnailUrl(videoId: string)` → `string` — `https://{CDN_HOST}/{videoId}/thumbnail.jpg`
- `bunnySignedHlsUrl(videoId: string, ttlSeconds?: number)` → `string` — podpisany HLS z tokenem (SHA256, TTL default 6h)

### Zadanie 1.2 — `src/lib/courses-db.ts`

Jedyne źródło danych kursów z Prisma. Plik wyłącznie server-side.

**Typy do wyeksportowania:**
```typescript
type AdminCourseListItem = Course & { /* computed: studentsCount, revenue */ }
type PlayerLesson = { id: string; title: string; video: string | null; videoHls: string | null }
type PlayerModule = { title: string; lessons: PlayerLesson[] }
type PlayerCourse = Course & { modules: PlayerModule[] }
type AdminLesson = { id: string; title: string; description: string | null; video: string | null; hasVideo: boolean }
type AdminModule = { id: string; title: string; lessons: AdminLesson[] }
type AdminCourseDetail = { /* pełne dane kursu */ stats: { students, revenue, modulesCount, lessonsCount, lessonsWithVideo } }
type CourseParticipant = { userId, name, email, image, enrolledAt, lessonsCompleted, progress, watchSeconds, lastActivity }
type CourseParticipants = { lessonsTotal: number; participants: CourseParticipant[] }
type CourseAdminStats = { enrollmentsByCourse: Record<string,number>; studentsTotal: number; revenueTotal: number; revenueSeries: { month, revenue }[] }
type VodOverview = { courses: Course[]; progressByCourse: Record<string, number>; lessonsDone: number; hoursTotal: number }
```

**Funkcje getterów:**
- `getCourses()` — PUBLISHED, posortowane ASC po createdAt, z modułami i lekcjami
- `getAdminCourses()` — WSZYSTKIE statusy, DESC po updatedAt
- `getCourseBySlug(slug)` — jeden PUBLISHED kurs z modułami + opiniami
- `getCourseForPlayer(slug)` — kurs z pełnymi lekcjami (video URL + bunnySignedHlsUrl), dla odtwarzacza
- `getAdminCourseDetail(slug)` — pełne dane + stats (studenci, przychód)
- `getCourseParticipants(courseId)` — Enrollment join User join LessonProgress; progress%
- `getCourseCategories()` — `["Wszystkie", ...unikalne]`
- `getEnrolledCourses(userId)` — kursy z Enrollment danego usera
- `getCompletedLessonIds(userId, courseId?)` — ID ukończonych lekcji
- `getContinueCourse(userId)` — ostatnio aktywny kurs (LessonProgress.updatedAt) lub ostatnio kupiony
- `getLastWatchedCourse(userId)` — slug + title ostatnio oglądanego (dla API)
- `getVodOverview(userId)` — kursy + progressByCourse (%) + lessonsDone + hoursTotal
- `getCourseAdminStats()` — stats + seria 6 miesięcy (enrollments per month × cena = przychód)

**Funkcje mutatorów:**
- `enrollUserInCourse(userId, courseId)` → upsert Enrollment
- `isUserEnrolled(userId, slug)` → `boolean`
- `getUserCourseReview(userId, courseId)` → `{ rating, text } | null`
- `upsertCourseReview({ userId, courseId, rating, text })` → transakcja: upsert + recompute Course.rating/reviews
- `deleteCourseReview(userId, courseId)` → transakcja: deleteMany + recompute rating
- `recordCourseView(courseId, request)` → upsert CourseView (hash IP+UA+date) + increment Course.views

---

## FAZA 2 — API Routes

### Zadanie 2.1 — `POST /api/kursy/create-payment-intent`

Plik: `src/app/api/kursy/create-payment-intent/route.ts`

Logika:
1. Sprawdź sesję (NextAuth) → 401 jeśli brak
2. Parsuj body: `{ slug, buyerType?, company?, nip? }`
3. Pobierz kurs (PUBLISHED) po slug → 404 jeśli brak
4. `isUserEnrolled(userId, slug)` → `{ alreadyOwned: true }` jeśli ma dostęp
5. Kurs darmowy (price ≤ 0): `enrollUserInCourse()` → `{ free: true }`
6. Utwórz Stripe PaymentIntent z `metadata: { kind: "COURSE_PURCHASE", courseId, slug, userId }`; `amount = course.price` (grosze)
7. Zwróć `{ clientSecret, amount }`

### Zadanie 2.2 — `POST | DELETE /api/kursy/[slug]/opinie`

Plik: `src/app/api/kursy/[slug]/opinie/route.ts`

**POST** — dodaj/zaktualizuj opinię:
1. Sesja → 401
2. `isUserEnrolled(userId, slug)` → 403 jeśli brak dostępu
3. Parsuj + waliduj body: `{ rating: 1–5, text: min 3/max 2000 znaków }`
4. `upsertCourseReview({ userId, courseId, rating, text })`
5. Zwróć `{ ok: true }`

**DELETE** — usuń opinię:
1. Sesja + isUserEnrolled → 403
2. `deleteCourseReview(userId, courseId)`
3. Zwróć `{ ok: true }`

### Zadanie 2.3 — `POST /api/kursy/view`

Plik: `src/app/api/kursy/view/route.ts`

1. Parsuj body: `{ slug }`
2. Pobierz kurs (PUBLISHED) → 404
3. `recordCourseView(courseId, request)` — bez auth (publiczne, z hashowaniem IP)
4. Zwróć `{ ok: true }`

### Zadanie 2.4 — `POST /api/admin/kursy`

Plik: `src/app/api/admin/kursy/route.ts`

Middleware: `requireAdmin()`

Body (wszystkie pola opcjonalne z wartościami domyślnymi):
```typescript
{
  title?, category?, excerpt?, price?, durationMin?, format?,
  video?, videoDurationSec?, image?, status? ("DRAFT" | "PUBLISHED"),
  description?: CourseBlock[], faq?: { q, a }[],
  curriculum?: { title, lessons: { title, description?, video?, durationSec? }[] }[],
  metaTitle?, metaDescription?, focusKeyword?, ogImage?, canonicalUrl?, noIndex?
}
```

Logika:
1. Walidacja: status PUBLISHED wymaga niepustych `description[]` i `faq[]`
2. Generuj slug z tytułu (slugify), deduplikuj numeracją (`-2`, `-3`)
3. Oblicz `durationMin`: suma `durationSec` lekcji ÷ 60 (lub `videoDurationSec ÷ 60` dla format=single), fallback: podane `durationMin`
4. Transakcja: utwórz `Course` + `CourseModule[]` + `Lesson[]`
5. Zwróć `{ ok: true, id, slug }`

### Zadanie 2.5 — `GET | PATCH | DELETE /api/admin/kursy/[id]`

Plik: `src/app/api/admin/kursy/[id]/route.ts`

**GET** — pobierz kurs do kreatora (format draft z ID modułów/lekcji)

**PATCH** — aktualizuj kurs:
1. Synchronizuj moduły po ID: istniejące aktualizuj (title, order), nowe twórz, usuniętych usuwaj (cascade lekcje)
2. Synchronizuj lekcje po ID wewnątrz modułów
3. Recalculate `durationMin` z sumy `durationSec`
4. Walidacja publikacji (DRAFT→PUBLISHED: description + faq)
5. Przy DRAFT→PUBLISHED: regeneruj slug z tytułu

**DELETE** — usuń kurs (cascade przez Prisma: modules, lessons, enrollments, reviews, progress)

### Zadanie 2.6 — `POST /api/admin/kursy/bunny-upload`

Plik: `src/app/api/admin/kursy/bunny-upload/route.ts`

1. `requireAdmin()`
2. Parsuj body: `{ title? }`
3. `createBunnyVideo(title ?? "Wideo kursu")` → videoId (GUID)
4. Oblicz expire (now + 1h)
5. `bunnyTusSignature(videoId, expire)` → signature
6. Zwróć: `{ libraryId, videoId, signature, expire, embedUrl, hlsUrl }`

### Zadanie 2.7 — `GET /api/admin/kursy/bunny-status`

Plik: `src/app/api/admin/kursy/bunny-status/route.ts`

1. Query param `?videoId=` (akceptuj pełny embed URL lub sam GUID)
2. Jeśli URL: `bunnyGuidFromEmbed(videoId)` → guid
3. `getBunnyVideoStatus(guid)` → zwróć status

### Zadanie 2.8 — `POST /api/admin/kursy/[id]/cover-from-video`

Plik: `src/app/api/admin/kursy/[id]/cover-from-video/route.ts`

1. Pobierz kurs z Prisma (id, slug, video, modules.lessons.video)
2. Znajdź pierwszy dostępny URL wideo (Course.video ?? first lesson.video)
3. `bunnyGuidFromEmbed(videoUrl)` → guid
4. Pobierz `bunnyThumbnailUrl(guid)` z nagłówkiem `Referer: https://iframe.mediadelivery.net`
5. Waliduj typ (image/jpeg, png, webp, avif)
6. Upload do Vercel Blob: `put("kurs-okladka-{slug}", blob, { access: "public" })`
7. Zaktualizuj `Course.image = blobUrl` w Prisma
8. Zwróć `{ ok: true, url }`

### Zadanie 2.9 — `POST /api/admin/kursy/bunny-webhook`

Plik: `src/app/api/admin/kursy/bunny-webhook/route.ts`

1. Waliduj query param `?secret=` vs `BUNNY_WEBHOOK_SECRET`
2. Parsuj payload: `{ VideoLibraryId, VideoGuid, Status }`
3. Status mapping: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished, 5=Error, 6=UploadFailed
4. Ready = Status in [3, 4]; Failed = Status in [5, 6]
5. Zaloguj status (opcjonalnie: aktualizuj pole w kursie)
6. Zawsze zwróć `{ received: true }` z status 200 (Bunny wymaga 200 dla idempotency)

### Zadanie 2.10 — `POST /api/panel/vod/progress`

Plik: `src/app/api/panel/vod/progress/route.ts`

1. Sesja → 401
2. Parsuj body: `{ lessonId: string, completed: boolean, seconds?: number }`
3. Upsert `LessonProgress` po `{ userId, lessonId }`: ustaw `completed`, `seconds` (max z obecnej wartości), dotknij `updatedAt`
4. Zwróć `{ ok: true }`

### Zadanie 2.11 — `GET /api/panel/vod/last`

Plik: `src/app/api/panel/vod/last/route.ts`

1. Sesja → 401
2. `getLastWatchedCourse(userId)` → `{ slug, title } | null`
3. Zwróć `{ course }` (null jeśli brak)

### Zadanie 2.12 — Stripe Webhook — obsługa `COURSE_PURCHASE`

W istniejącym pliku webhooka Stripe (`src/app/api/webhooks/stripe/route.ts`) dodaj obsługę:

```
Event: payment_intent.succeeded
Warunek: metadata.kind === "COURSE_PURCHASE"
```

Funkcja `handleCoursePurchasePaid(pi: Stripe.PaymentIntent)`:
1. Wyciągnij `userId`, `courseId`, `slug` z `pi.metadata`
2. `enrollUserInCourse(userId, courseId)` — idempotentnie
3. Pobierz kurs (title) z Prisma
4. Wyślij powiadomienie do usera: "Dostęp do kursu odblokowany: {title}"
5. Zaloguj do activity feed admina: user, kurs, kwota

---

## FAZA 3 — Frontend: Panel Publiczny (katalog + checkout)

### Zadanie 3.1 — Typy i stałe: `src/app/(site)/kursy/_data/courses.ts`

Zdefiniuj typy (bez tablicy `COURSES` — kursy żyją w bazie):

```typescript
type CourseBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "highlight"; text: string }
  | { type: "quote"; text: string }
  | { type: "spacer" }

interface CourseModule { title: string; lessons: string[] }
interface CourseReview { author: string; rating: number; text: string }
interface CourseFaq { q: string; a: string }

interface Course {
  id: string; slug: string; title: string; category: string;
  rating: number; reviews: number; views?: number; durationMin: number;
  price: number; image: string; excerpt: string;
  format?: "single" | "sections";
  description?: CourseBlock[]; curriculum?: CourseModule[];
  testimonials?: CourseReview[]; faq?: CourseFaq[];
  videoPending?: boolean; // true jeśli wideo jeszcze się przetwarza
  metaTitle?: string | null; metaDescription?: string | null;
  focusKeyword?: string | null; ogImage?: string | null;
  canonicalUrl?: string | null; noIndex?: boolean;
}
```

Stałe fallbackowe:
- `COURSE_BENEFITS: string[]` — lista 5–7 standardowych korzyści
- `DEFAULT_CURRICULUM: CourseModule[]` — 3 przykładowe moduły
- `DEFAULT_FAQ: CourseFaq[]` — 5 przykładowych pytań

### Zadanie 3.2 — Strona katalogu: `src/app/(site)/kursy/page.tsx`

Server Component z `revalidate = 300`:

1. `getCourses()` + `getCourseCategories()`
2. Renderuj:
   - `<KursyHero />` — nagłówek strony
   - `<KursyCatalog courses={courses} categories={categories} />` — grid z filtrem
   - `<KursySuggestion />` — CTA na dole

### Zadanie 3.3 — Komponenty katalogu

**`KursyHero`** — nagłówek sekcji kursów (tytuł, opis, CTA)

**`KursyCatalog`** (Client Component):
- Filtr po kategorii (przyciski, `"Wszystkie"` = brak filtra)
- Grid kursów (3 kolumny desktop, 1 mobile)
- `CourseCard` — karta kursu: okładka (Next/Image), tytuł, kategoria, cena (lub "Bezpłatny"), ocena (gwiazdki), czas, liczba opinii
- Link do `/kursy/{slug}`

**`KursySuggestion`** — sekcja CTA "Nie znalazłeś kursu?" lub rekomendacje

### Zadanie 3.4 — Strona kursu: `src/app/(site)/kursy/[slug]/page.tsx`

Server Component z `revalidate = 300` + `generateStaticParams()`:

1. `getCourseBySlug(slug)` → 404 jeśli brak
2. Generuj OG metadata (metaTitle, metaDescription, ogImage, canonicalUrl)
3. Renderuj:
   - Hero: okładka, tytuł, kategoria, ocena, czas, cena, CTA "Otrzymaj dostęp" → `/kursy/{slug}/checkout`
   - Alert (jeśli `videoPending`): "Nagrania w przygotowaniu"
   - `<CourseTabs course={course} />` — zakładki
   - `<CourseViewBeacon slug={slug} />` — beacon licznika wyświetleń

**`CourseTabs`** (Client Component) — 4 zakładki:
- "O kursie" — renderuj `description` (bloki: paragraph, heading, list, highlight, quote)
- "Zawartość" — lista modułów z lekcjami (accordion)
- "Opinie" — karty opinii (rating, tekst, autor)
- "FAQ" — accordion pytań i odpowiedzi

**`CourseViewBeacon`** (Client Component) — po mount: POST `/api/kursy/view`, brak UI

### Zadanie 3.5 — Checkout kursu: `src/app/(site)/kursy/[slug]/checkout/page.tsx`

Server Component:
1. Pobierz kurs (PUBLISHED) po slug → 404
2. Sprawdź sesję: niezalogowany → redirect na logowanie z `callbackUrl`
3. `isUserEnrolled(userId, slug)` → redirect `/panel/vod` jeśli już ma dostęp
4. Renderuj `<CheckoutClient course={course} />`

**`CheckoutClient`** (Client Component):
1. On mount: POST `/api/kursy/create-payment-intent` → `{ clientSecret, amount }` lub `{ free }` lub `{ alreadyOwned }`
2. `{ free }` → redirect `/panel/vod?zakup=sukces`
3. `{ alreadyOwned }` → redirect `/panel/vod`
4. `{ clientSecret }` → renderuj Stripe `<PaymentElement>` i `<Elements>`
5. Po submit: `stripe.confirmPayment({ return_url: /panel/vod?zakup=sukces })`
6. Loading/error states

**`OrderSummary`** — panel podsumowania zamówienia: okładka, tytuł, cena, co zawiera (`ORDER_INCLUDES`)

---

## FAZA 4 — Frontend: Panel Uczestnika (odtwarzacz VOD)

### Zadanie 4.1 — Biblioteka VOD: `src/app/panel/vod/page.tsx`

Server Component z `force-dynamic`:

1. Sprawdź sesję → redirect na logowanie
2. Fallback Stripe: jeśli params `payment_intent` + status = `succeeded` → weryfikuj PaymentIntent ze Stripe → `enrollUserInCourse()` jeśli `metadata.kind === COURSE_PURCHASE`
3. `getVodOverview(userId)` — kursy, postępy
4. `getCourses()` — pełny katalog (do kupienia)
5. `locked = brak kupionych kursów`
6. Renderuj `<VodClient overview={...} catalog={...} locked={locked} />`

**`VodClient`** (Client Component):
- Statystyki: lekcji ukończone, godzin materiału
- `ContinueCard` — ostatnio oglądany kurs (z linkiem do odtwarzacza)
- `LibraryCard` — grid kupionych kursów
- `PurchaseSuccessFlow` — jeśli param `zakup=sukces`: modal/toast sukcesu (raz, po 1s)
- Gdy `locked`: nakładka "Kup pierwszy kurs" z CTA do katalogu

### Zadanie 4.2 — Odtwarzacz kursu: `src/app/panel/vod/[slug]/page.tsx`

Server Component z `force-dynamic`:

1. Sprawdź sesję → redirect
2. `getCourseForPlayer(slug)` → 404
3. `isUserEnrolled(userId, slug)` → redirect `/kursy/{slug}/checkout` jeśli brak
4. `getCompletedLessonIds(userId, courseId)` — postęp
5. `getUserCourseReview(userId, courseId)` — własna opinia (do prefillu)
6. Renderuj `<VodCoursePlayer course={...} completedIds={...} review={...} />`

**`VodCoursePlayer`** (Client Component):
- Layout 2-kolumnowy: player (lewy) + playlist (prawy)
- Stan: aktywna lekcja (`activeLesson`)
- `HlsPlayer` — odtwarzacz:
  - Jeśli lekcja ma `videoHls` (podpisany URL): hls.js player
  - Fallback: Bunny iframe embed
  - Po zakończeniu lekcji: POST `/api/panel/vod/progress` (completed=true)
  - Co 30s: POST `/api/panel/vod/progress` (seconds=elapsed)
- `Playlist` — lista modułów/lekcji:
  - Zaznaczone (✓) jeśli ID w `completedIds`
  - Click → zmień `activeLesson`
- `ReviewForm` — po ukończeniu co najmniej 1 lekcji:
  - Gwiazdki (1–5) + textarea
  - POST/DELETE `/api/kursy/[slug]/opinie`

### Zadanie 4.3 — `HlsPlayer` (Client Component)

Plik: `src/components/HlsPlayer.tsx` (lub w katalogu vod)

Zależność: `hls.js`

Logika:
- Jeśli `Hls.isSupported()`: użyj hls.js z podpisanym URL
- Else: `<video src={hlsUrl}>` (Safari natywnie obsługuje HLS)
- Fallback: `<iframe>` embed Bunny jeśli brak HLS URL
- Callbacki: `onEnded`, `onTimeUpdate(seconds)` do zapisu postępu

---

## FAZA 5 — Frontend: Panel Admina

### Zadanie 5.1 — Dashboard kursów: `src/app/admin/kursy/page.tsx`

Server Component z `revalidate = 60`:

1. `getCourses()` + `getCourseAdminStats()`
2. Oblicz KPI: aktywne kursy, kursanci łącznie, przychód VOD, średnia ocena
3. Renderuj sekcje (bento grid):
   - KPI cards (4 metryki)
   - Najpopularniejszy kurs (cover + stats)
   - Sparkline przychodu VOD (6 miesięcy)
   - Kursy wg kategorii (bar)
   - Najczęściej kupowane (top 4)
   - Wymagają uwagi (< 5 kursantów LUB rating < 4.7)
   - "W pigułce": godziny materiału, kategorie, śr. cena, śr. kursantów na kurs

### Zadanie 5.2 — Lista kursów: `src/app/admin/kursy/lista/page.tsx`

1. `getAdminCourses()` — WSZYSTKIE statusy
2. Renderuj `<AdminCoursesList courses={...} />`

**`AdminCoursesList`** (Client Component) — tabela:
- Kolumny: okładka (mała), tytuł, kategoria, cena, studenci, status (badge), akcje
- Sortowanie po kliknięciu nagłówka
- Akcje: "Edytuj" → `/admin/kursy/{slug}`, "Usuń" → `DELETE /api/admin/kursy/[id]` + potwierdzenie

### Zadanie 5.3 — Dashboard kursu: `src/app/admin/kursy/[slug]/page.tsx`

1. `getAdminCourseDetail(slug)` + `getCourseParticipants(courseId)`
2. Renderuj `<CourseDashboard data={...} participants={...} />`

**`CourseDashboard`** (Client Component) — zakładki:
- "Przegląd" — statystyki: studenci, przychód, ocena, ukończenia
- "Informacje" — formularz edycji (tytuł, kategoria, cena, opis) → PATCH `/api/admin/kursy/[id]`
- "Treść" — edytor modułów/lekcji + upload wideo (Bunny) → PATCH
- "Uczestnicy" — tabela (zadanie 5.4)

### Zadanie 5.4 — Uczestnicy kursu

Tabela w zakładce "Uczestnicy":
- Kolumny: avatar + imię, email, data zapisu, ukończone lekcje, postęp (pasek %), czas oglądania (h:mm), ostatnia aktywność
- Sortowanie po postępie/dacie
- Export do CSV (opcjonalnie)

### Zadanie 5.5 — Kreator kursu: `src/app/admin/kursy/dodaj/page.tsx`

**`CourseWizard`** (Client Component):

Stan: `courseId` (po autozapisie), `step`, `formData`

Kroki:
1. **Start** — tytuł, kategoria (select), cena, format (single/sections), opcjonalny start z AI (pole prompt)
2. **Wideo** (format=single) lub **Program** (format=sections):
   - Format single: `VideoUploader` — TUS upload na Bunny
   - Format sections: edytor modułów i lekcji (drag & drop kolejność, VideoUploader per lekcja)
3. **Zdjęcie** — upload okładki LUB "Pobierz z wideo" (`POST /api/admin/kursy/[id]/cover-from-video`)
4. **Treść** — edytor description (bloki), FAQ (pytania/odpowiedzi)
5. **Podgląd** — podsumowanie, przycisk "Opublikuj"

Autozapis: po każdym kroku → POST/PATCH `/api/admin/kursy` / `/api/admin/kursy/[id]`

**`VideoUploader`** (Client Component):
1. Klik → `POST /api/admin/kursy/bunny-upload` → `{ videoId, signature, expire, libraryId }`
2. TUS upload: `new tus.Upload(file, { endpoint: "https://video.bunnycdn.com/tusupload", headers: { AuthorizationSignature: signature, VideoId: videoId, LibraryId: libraryId, AuthorizationExpire: expire }, ... })`
3. Progress bar
4. Po zakończeniu TUS: polling `GET /api/admin/kursy/bunny-status?videoId={videoId}` co 3s
5. Gdy `ready = true`: pokaż podgląd (iframe Bunny), zapisz `embedUrl` do stanu
6. Gdy `failed = true`: komunikat błędu + retry

**`FloatingSaveBar`** — przyklejony bottom bar:
- Status (zapisywanie/zapisano/błąd)
- Przycisk "Zapisz szkic"
- Przycisk "Opublikuj" (walidacja: description + faq)

---

## FAZA 6 — Nawigacja i routy

### Zadanie 6.1 — Dodanie kursów do nawigacji

W sidebarze/navbarze admina dodaj:
- "Kursy" → `/admin/kursy`
- "Lista kursów" → `/admin/kursy/lista`
- "Dodaj kurs" → `/admin/kursy/dodaj`

W sidebarze panelu uczestnika dodaj:
- "Moje kursy" → `/panel/vod`

### Zadanie 6.2 — Middleware (gating)

Upewnij się, że:
- `/panel/vod/**` wymaga zalogowania (NextAuth middleware)
- `/admin/kursy/**` wymaga roli admin
- `/api/panel/**` wymaga sesji
- `/api/admin/**` wymaga admin

---

## FAZA 7 — Zmienne środowiskowe

Dodaj do `.env.local` (i Vercel env):

```
# Bunny Stream
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_CDN_HOSTNAME=              # np. vz-xxxxxx.b-cdn.net
BUNNY_STREAM_TOKEN_KEY=                 # do podpisywania HLS
BUNNY_WEBHOOK_SECRET=                   # do weryfikacji webhooków Bunny
NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME=  # do miniatur na kliencie

# Vercel Blob (jeśli nie skonfigurowane)
BLOB_READ_WRITE_TOKEN=
```

---

## Kolejność implementacji (zalecana)

| Etap | Zadania |
|------|---------|
| 1 | Faza 0 — schemat Prisma + `db push` |
| 2 | Faza 1 — `bunny.ts` + `courses-db.ts` |
| 3 | API: 2.4 → 2.5 → 2.1 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11 → 2.2 → 2.3 → 2.12 |
| 4 | Faza 3 — katalog publiczny: 3.1 → 3.2 → 3.3 → 3.4 → 3.5 |
| 5 | Faza 5 — panel admina: 5.2 → 5.5 → 5.1 → 5.3 → 5.4 |
| 6 | Faza 4 — panel uczestnika: 4.3 → 4.2 → 4.1 |
| 7 | Faza 6 — nawigacja i middleware |

---

## Kluczowe założenia projektowe

- **Idempotency wszędzie**: Enrollment to `upsert`, nie `create` — podwójny webhook Stripe nie tworzy duplikatu
- **Format kursu**: `"single"` = jedno wideo, `"sections"` = moduły/lekcje; obie ścieżki w kreatorze i odtwarzaczu
- **Ceny w groszach/centach** (Int w Prisma), wyświetlane po ÷100
- **Slug z tytułu**: slugify(title), deduplikacja (`-2`, `-3`); regeneracja przy DRAFT→PUBLISHED
- **Rating**: recompute w transakcji po każdej zmianie opinii; `reviews=0` → `rating=0` (UI: "Nowość")
- **Klucz Bunny API** nigdy nie trafia na klienta; serwer podpisuje upload i zwraca signature
- **ISR**: katalog + strony kursów rewalidują co 300s; panel admina co 60s
- **`force-dynamic`**: panel uczestnika (postęp, Stripe fallback) + odtwarzacz (gating dostępu)
