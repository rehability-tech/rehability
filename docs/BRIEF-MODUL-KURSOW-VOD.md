# BRIEF: Moduł kursów VOD (sprzedaż + odtwarzanie + panel admina)

> Brief do wklejenia Claude'owi w innym projekcie. Opisuje kompletną, działającą
> implementację modułu VOD: model danych, sprzedaż przez Stripe, nadawanie dostępu,
> odtwarzacz z postępem, kreator kursu w panelu admina oraz hosting wideo na Bunny Stream.
> Wszystkie reguły biznesowe poniżej są odwzorowaniem produkcyjnego kodu — nie propozycją.

---

## 0. Kontekst techniczny

Stack referencyjny: **Next.js 16 (App Router) + React 19 + TypeScript + Prisma 5 (PostgreSQL) + NextAuth 4 + Tailwind 4 + Stripe + Bunny Stream + framer-motion**.

Jeśli docelowy projekt używa innego stacku, zachowaj **reguły biznesowe i kształt danych** — one są istotą tego briefu. Warstwa UI jest wymienna.

Uwagi implementacyjne z oryginału:
- Prisma generuje klienta do niestandardowej ścieżki → importy to `@/generated/prisma`, nie `@prisma/client`. W nowym projekcie użyj domyślnej ścieżki, chyba że jest powód.
- `status` i `format` na `Course` to **zwykłe `String`, nie enumy**. (Jeśli chcesz enumy — to świadoma zmiana, nie port.)
- Cena (`Course.price`) to **`Int` w PEŁNYCH ZŁOTÓWKACH**, nie grosze. Konwersja na grosze dzieje się dopiero przy tworzeniu PaymentIntenta.

---

## 1. Model danych (Prisma)

```prisma
model Course {
  id           String   @id @default(cuid())
  slug         String   @unique
  title        String
  category     String
  excerpt      String   @db.Text
  price        Int      @default(0)      // ZŁOTÓWKI (int), nie grosze
  durationMin  Int      @default(0)      // liczone z realnych długości wideo
  rating       Float    @default(0)      // CACHE: średnia z CourseReview
  reviews      Int      @default(0)      // CACHE: liczba CourseReview
  views        Int      @default(0)      // CACHE licznika wyświetleń
  format       String   @default("sections")  // "single" | "sections"
  video        String?                   // główne wideo (single) lub zwiastun — embed URL Bunny
  videoDurationSec Int  @default(0)
  image        String?                   // okładka
  status       String   @default("PUBLISHED")  // DRAFT | PUBLISHED | ARCHIVED

  description  Json?    // bloki zakładki „O kursie"  → CourseBlock[]
  content      Json?    // bloki zakładki „Zawartość" → CourseBlock[]
  faq          Json?    // → { q: string; a: string }[]
  testimonials Json?    // LEGACY — zastąpione tabelą CourseReview, nic tego nie zapisuje

  // SEO / Open Graph
  metaTitle       String?
  metaDescription String?  @db.Text
  focusKeyword    String?
  ogImage         String?
  canonicalUrl    String?
  noIndex         Boolean  @default(false)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  publishedAt  DateTime?   // data PIERWSZEJ publikacji; ustawiana raz, nigdy nadpisywana

  modules       CourseModule[]
  enrollments   Enrollment[]
  courseReviews CourseReview[]
  pageViews     CourseView[]
  favorites     CourseFavorite[]

  @@index([status])
}

model CourseModule {
  id       String   @id @default(cuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title    String
  order    Int      @default(0)
  lessons  Lesson[]
  @@index([courseId])
}

model Lesson {
  id          String  @id @default(cuid())
  moduleId    String
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title       String
  description String? @db.Text
  video       String?          // embed URL Bunny
  durationSec Int     @default(0)   // z Bunny
  order       Int     @default(0)
  progress    LessonProgress[]
  @@index([moduleId])
}

// ▶ JEDYNY nośnik dostępu do kursu. Brak tabeli zamówień/płatności.
model Enrollment {
  id          String    @id @default(cuid())
  userId      String
  courseId    String
  user        User   @relation(fields: [userId],   references: [id], onDelete: Cascade)
  course      Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt
  completedAt DateTime?
  watchedSec  Int       @default(0)   // TYLKO dla format "single"
  @@unique([userId, courseId])        // klucz Prisma: userId_courseId
  @@index([userId])
}

model LessonProgress {
  id        String  @id @default(cuid())
  userId    String
  lessonId  String
  user      User   @relation(fields: [userId],   references: [id], onDelete: Cascade)
  lesson    Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completed Boolean @default(false)
  seconds   Int     @default(0)
  updatedAt DateTime @updatedAt      // brak createdAt — to jest „ostatnia aktywność"
  @@unique([userId, lessonId])       // klucz: userId_lessonId
  @@index([userId])
}

model CourseReview {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User   @relation(fields: [userId],   references: [id], onDelete: Cascade)
  rating    Int      // 1–5
  text      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([courseId, userId])       // klucz: courseId_userId  (UWAGA: inna kolejność niż wyżej!)
  @@index([courseId])
}

model CourseFavorite {
  id String @id @default(cuid())
  userId String; courseId String
  createdAt DateTime @default(now())
  @@unique([userId, courseId])
  @@index([userId])
}

// Dedup wyświetleń na poziomie bazy: 1 odsłona / gość / dzień
model CourseView {
  id String @id @default(cuid())
  courseId String
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  visitorHash String
  day DateTime @db.Date
  createdAt DateTime @default(now())
  @@unique([courseId, visitorHash, day])
  @@index([courseId, day])
}
```

Na `User`: `role Role @default(USER)` (`enum Role { USER ADMIN }`) + relacje `enrollments`, `lessonProgress`, `courseReviews`, `courseFavorites`. `User.name/email/image` są **nullable** — stąd fallback autora opinii.

### ⚠️ Trzy pułapki do zapamiętania
1. **Kolejność pól w `@@unique` jest różna w każdym modelu** (`userId_courseId`, `userId_lessonId`, `courseId_userId`). Przenieś dokładnie — inaczej generowane klucze `where` przestaną się zgadzać.
2. `Lesson` **nie ma `courseId`** — zawsze idziesz przez `lesson.module.courseId` (filtry: `where: { lesson: { module: { courseId } } }`).
3. `Enrollment.updatedAt` ma **jednocześnie** `@default(now())` i `@updatedAt` — bo sortujemy po nim kursy „single", a nigdy nietknięty wiersz musi mieć sensowną wartość.

---

## 2. Typy treści (współdzielone client/server)

```ts
export type CourseBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading";   text: string }
  | { type: "list";      items: string[] }
  | { type: "highlight"; text: string }   // callout w ramce z akcentem
  | { type: "quote";     text: string }
  | { type: "spacer" };

export interface CourseModule { title: string; lessons: string[] }  // widok UI: same tytuły lekcji
export interface CourseReview { author: string; rating: number; text: string }
export interface CourseFaq    { q: string; a: string }

export interface Course {           // ⚠ to NIE jest wiersz z bazy — to kształt dla UI
  id; slug; title; category: string;
  rating; reviews: number; views?: number;
  durationMin; price: number; image: string; excerpt: string;
  format?: "single" | "sections";
  description?: CourseBlock[];
  content?: CourseBlock[];
  curriculum?: CourseModule[];      // zastępuje `modules` z bazy
  testimonials?: CourseReview[];
  faq?: CourseFaq[];
  videoPending?: boolean;           // pole WYLICZANE, nie z bazy
  metaTitle?; metaDescription?; focusKeyword?; ogImage?; canonicalUrl?: string | null;
  noIndex?: boolean;
  createdAt?: string;               // ISO — data serializowana na granicy RSC
  publishedAt?: string | null;
}
```

Stałe fallbackowe (gdy kurs nie ma własnej treści): `COURSE_BENEFITS`, `ORDER_INCLUDES`, `DEFAULT_CURRICULUM`, `DEFAULT_FAQ`.

Helper: `formatCourseDuration(min)` → `200 → "3h 20 min"`, `42 → "42 min"`, `0 → "—"`.

---

## 3. Warstwa dostępu do danych — `lib/courses-db.ts`

**JEDYNE źródło danych kursów.** Plik `server-only`. Cała logika domenowa VOD mieszka tutaj.

### Mapper DB → UI (`mapCourse`) — reguły niezaskakująco ważne

- `curriculum` = **`undefined`** (nie `[]`), gdy brak modułów → UI spada na `DEFAULT_CURRICULUM`.
- Moduły mapują się do `{ title, lessons: string[] }` — **id/video/duration są gubione** (to widok sprzedażowy).
- Wszystkie 4 pola Json przechodzą przez `Array.isArray(x) ? x as T[] : undefined`. **Powód: w bazie zdarza się `{}` zamiast tablicy i gołe `.map()` wywala stronę.** Nie-tablica degraduje się do `undefined` → fallback.
- `image: c.image || FALLBACK_IMAGE`; okładka wyliczana kaskadą: własna miniatura → kadr z Bunny (`bunnyThumbnailUrl(guidFromEmbed(video))`) → stały fallback.
- Daty → `.toISOString()`.

### Eksportowane funkcje

| Funkcja | Zachowanie / reguła |
|---|---|
| `isVideoPending(c)` | `single` → `!video`. `sections` → brak lekcji = `true`, inaczej `lessons.some(l => !l.video)`. |
| `getCourses()` | Katalog publiczny. **`status: "PUBLISHED"`, sort `createdAt asc`.** |
| `getAdminCourses()` | **Bez filtra statusu** (admin widzi DRAFT/ARCHIVED), sort `updatedAt desc`, + `_count.enrollments`. |
| `getCourseBySlug(slug)` | `findFirst({ slug, status: "PUBLISHED" })`. **Nadpisuje `testimonials` realnymi opiniami** z `CourseReview`. |
| `getCourseForPlayer(slug)` | Jak wyżej + **podpisuje HLS** dla każdego wideo (`bunnySignedHlsUrl`). |
| `getAdminCourseDetail(slug)` | **Dowolny status.** Liczy `students`, `revenue = students * price`, `videoThumb`. |
| `getCourseParticipants(courseId)` | 3 zapytania, agregacja w JS. Sort: `lastActivity desc` (null→0), tie-break `enrolledAt desc`. |
| `getCourseCategories()` | `distinct` po kategorii z PUBLISHED, sort alfabetyczny, prefiks `"Wszystkie"`. |
| `enrollUserInCourse(userId, courseId)` | **`upsert` z pustym `update: {}`** — idempotentne, ponowny zakup nie kasuje `watchedSec`/`completedAt`. |
| `isUserEnrolled(userId, slug)` | slug→id, potem `findUnique(userId_courseId)`. **Bez filtra statusu** — dostęp do niepublikowanego kursu działa. |
| `getCourseWatchState` / `isCourseCompleted` | `{ watchedSec, completed: !!completedAt }`. |
| `getEnrolledSlugs(userId)` | Tanie oznaczanie „masz to" w katalogu. |
| `getEnrolledCourses(userId)` | Biblioteka, sort `createdAt desc` (najnowszy zakup pierwszy). |
| `getCompletedLessonIds(userId, courseId?)` | Opcjonalne zawężenie przez `lesson: { module: { courseId } }`. |
| `getCourseLessonSeconds(userId, courseId)` | `Record<lessonId, seconds>`, tylko wiersze `seconds > 0`. |
| `getCourseAdminStats()` | 1 zapytanie + agregacja w JS; 6 miesięcznych kubełków `yyyy-MM`, etykiety `format(d,"LLL",{locale:pl})` z wielkiej litery. |
| `getLastWatchedCourse(userId)` | **`Promise.all` dwóch zapytań** (najnowszy `LessonProgress` vs. najnowszy `Enrollment` z `watchedSec>0`), wygrywa świeższy `updatedAt`; sentinel `-1` gdy brak. |
| `getContinueCourse(userId)` | last-watched → najnowszy zakup → `null`. |
| `getUserCourseReview` / `upsertCourseReview` / `deleteCourseReview` | patrz §7. |
| `getVodOverview(userId)` | patrz niżej. |

### Liczenie postępu — dwa różne modele, celowo

```ts
// Kurs „single": procent z obejrzanych sekund, ale ZAWSZE max 99% dopóki nie ma completedAt.
function singleProgress(completedAt, watchedSec, videoDurationSec) {
  if (completedAt) return 100;
  if (!videoDurationSec || videoDurationSec <= 0) return 0;
  const pct = Math.round((watchedSec || 0) / videoDurationSec * 100);
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(99, pct));   // ← 99, nie 100
}

// Kurs z lekcjami: procent WAŻONY CZASEM, nie liczbą lekcji.
function lessonsTimeProgress(lessons, progressByLesson, completedAt) {
  // lekcje z durationSec <= 0 są wykluczone Z LICZNIKA I Z MIANOWNIKA
  // lekcja ukończona → wnosi pełny durationSec
  // lekcja w trakcie → wnosi Math.min(seconds, durationSec)
  // gdy CAŁY kurs nie ma znanych długości → fallback: done / lessons.length
  // zakres 0–100 (tu bez capa 99)
}
```

`getVodOverview(userId)` miesza dwa modele i **dwie jednostki liczenia** (świadomie):
- `format === "single"` **lub** kurs bez lekcji → liczy się jako **dokładnie 1 jednostka** w `lessonsTotal`; `+1` do `lessonsDone` tylko gdy `completedAt`.
- inaczej → `lessonsTotal += lessons.length`, `lessonsDone += ukończone`.
- **XP / „lekcje zrobione" liczy ukończone jednostki, a procent liczy obejrzany czas.** To nie jest bug.
- `hoursTotal = Math.round(suma(durationMin) / 60)` — zaokrąglenie sumy, nie per-kurs.
- Wszystkie `LessonProgress` użytkownika pobierane są **jednym** zapytaniem i indeksowane do `Map` + `Set`.

> ⚠️ `getCourseParticipants` liczy `progress` **po liczbie lekcji** (`completed / lessonsTotal`), a nie po czasie. Niespójne z `lessonsTimeProgress` — w nowym projekcie ujednolić.

---

## 4. Ścieżki (routing)

**Publiczne**
- `/kursy` — katalog (filtr po kategorii)
- `/kursy/[slug]` — strona sprzedażowa (zakładki: O kursie / Zawartość / Opinie / FAQ)
- `/kursy/[slug]/checkout` — koszyk + płatność

**Panel kursanta (PWA)**
- `/panel/vod` — biblioteka: posiadane + katalog; tryb „locked" przy 0 zakupów
- `/panel/vod/[slug]` — odtwarzacz (gating po `Enrollment`)

**Panel admina**
- `/admin/kursy` — hub ze statystykami
- `/admin/kursy/lista` — lista wszystkich kursów (zmiana statusu, usuwanie)
- `/admin/kursy/dodaj` — kreator (`CourseWizard`)
- `/admin/kursy/[slug]` — dashboard kursu; zakładki `overview` | `uczestnicy`
  (edycja danych/treści odbywa się **przez kreator** — `/[slug]/edytuj` to serwerowy redirect do `/dodaj?draft=<id>`)

**API**
| Endpoint | Rola |
|---|---|
| `POST /api/kursy/create-payment-intent` | start płatności / darmowy dostęp |
| `POST /api/webhooks/stripe` | **główne** nadanie dostępu |
| `POST\|DELETE /api/kursy/[slug]/opinie` | opinia kursanta |
| `POST /api/panel/vod/progress` | zapis postępu |
| `POST /api/panel/vod/complete` | oznaczenie kursu ukończonym |
| `GET /api/panel/vod/last` | ostatnio oglądany (skrót w sidebarze) |
| `POST /api/admin/kursy` | tworzenie (także autozapis szkicu) |
| `GET\|PATCH\|DELETE /api/admin/kursy/[id]` | odczyt szkicu / edycja / usunięcie |
| `POST /api/admin/kursy/bunny-upload` | inicjacja uploadu wideo |
| `GET /api/admin/kursy/bunny-status` | polling statusu kodowania |
| `POST /api/admin/kursy/bunny-webhook` | status z Bunny |

---

## 5. SPRZEDAŻ — pełny przepływ

### 5.1 `POST /api/kursy/create-payment-intent`

`runtime = "nodejs"`, `dynamic = "force-dynamic"`.

```ts
const BodySchema = z.object({
  slug: z.string().min(1),
  buyerType: z.enum(["private", "company"]).optional(),
  company: z.string().trim().optional(),
  nip: z.string().trim().optional(),
});
```

Kolejność bramek i kody odpowiedzi — **odtworzyć dokładnie**:

| # | Warunek | Odpowiedź | Kod |
|---|---|---|---|
| 1 | brak `session.user.id` **lub** `session.user.email` | `{error:"Zaloguj się, aby kupić kurs."}` | 401 |
| 2 | niepoprawny JSON | `{error:"Invalid JSON body."}` | 400 |
| 3 | błąd Zod | `{error:"Validation failed", issues}` | **422** |
| 4 | brak kursu PUBLISHED | `{error:"Ten kurs nie jest już dostępny."}` | 404 |
| 5 | `Enrollment` już istnieje | `{alreadyOwned: true}` | 200 |
| 6 | `amount <= 0` | upsert Enrollment → `{free: true}` | 200 |
| 7 | Stripe rzucił | `{error:"Nie udało się utworzyć płatności."}` | **502** |
| 8 | brak `client_secret` | `{error:"Stripe nie zwrócił client_secret."}` | **502** |
| 9 | sukces | `{clientSecret, amount}` | 200 |

```ts
const amount = Math.round((course.price ?? 0) * 100);   // zł → grosze

// Kurs darmowy — dostęp OD RAZU, bez Stripe:
if (amount <= 0) {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: {}, create: { userId, courseId: course.id },
  });
  return NextResponse.json({ free: true });
}

// Metadata = KONTRAKT z webhookiem:
const metadata: Record<string, string> = {
  kind: "COURSE_PURCHASE",       // ← dyskryminator, po nim routuje webhook
  courseId: course.id,
  slug,                          // tylko do forensyki w dashboardzie Stripe
  userId,
};
if (buyerType) metadata.buyerType = buyerType;
if (company)   metadata.company = company.slice(0, 400);  // limit 500 znaków w Stripe
if (nip)       metadata.nip = nip.slice(0, 40);

paymentIntent = await stripe.paymentIntents.create({
  amount, currency: "pln",
  receipt_email: email,
  automatic_payment_methods: { enabled: true },   // ← karta/BLIK/P24 z Dashboardu, NIE z kodu
  metadata,
});
```

**Nośne są tylko `kind`, `userId`, `courseId`.** Reszta metadanych nigdy nie jest czytana.

### 5.2 Checkout (klient)

Stepper 4-krokowy: `["Konto", "Dane do płatności", "Płatność", "Podsumowanie"]`. Aktywny krok jest **wyliczany, nie trzymany w stanie**:

```ts
const activeStep = !isLoggedIn ? 1 : clientSecret ? 3 : 2;
const isStepClickable = (step) => step < activeStep && step !== 1;
```
Cofnięcie 3→2 robi `setClientSecret(null)` — PaymentIntent jest porzucany, przy ponownym submicie tworzy się nowy (bez `update`/reuse).

**Walidacja PL (wyłącznie po stronie klienta):**
```ts
const isValidEmail  = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPostal = (v) => /^\d{2}-\d{3}$/.test(v.trim());          // 00-000
function isValidNip(v) {                                              // suma kontrolna mod-11
  const d = v.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(d)) return false;
  const w = [6,5,7,2,3,4,5,6,7];
  return w.reduce((a, wi, i) => a + wi * Number(d[i]), 0) % 11 === Number(d[9]);
}
```
Reguły: `company` → wymagana nazwa firmy + poprawny NIP; `private` → wymagane imię i nazwisko; zawsze → email, adres, kod `00-000`, miasto.

Prefill z konta: `{ name: session.user.name, email: session.user.email }` przekazywane z serwera.

Rozgałęzienie po submicie:
```ts
if (data.alreadyOwned) location.href = `/panel/vod/${slug}`;
if (data.free)         location.href = `/panel/vod?zakup=sukces`;
if (data.clientSecret) { setReturnUrl(`${origin}/panel/vod?zakup=sukces`); setClientSecret(data.clientSecret); }
```

Błędy: per-pole (shake framer-motion `x: [0,-5,5,-3,3,0]`, czyszczone przy pierwszym keystroke) + banner formularza.

> 🔴 **DŁUG DO NAPRAWIENIA W NOWYM PROJEKCIE:** pola `name`, `address`, `postal`, `city` są walidowane, ale **nigdy nie wysyłane** — body to tylko `{slug, buyerType, company, nip}`. Zebrany adres rozliczeniowy jest wyrzucany. Jeśli potrzebujesz faktur, wyślij te dane i zapisz je (albo przekaż do Stripe jako `billing_details` / Customer).

### 5.3 Stripe Payment Element

```tsx
<Elements stripe={getStripe()} options={{
  clientSecret,
  locale: "pl",
  appearance: { theme: "stripe", variables: {
    colorPrimary: "#287D88", colorText: "#0B3B4C", colorTextSecondary: "#6b7280",
    borderRadius: "12px", fontFamily: "Montserrat, system-ui, sans-serif", fontSizeBase: "14px",
  }},
}}>
  <PaymentElement options={{
    layout: { type: "tabs", defaultCollapsed: false },
    ...(email ? { defaultValues: { billingDetails: { email } } } : {}),
  }} onReady={() => setReady(true)} />
</Elements>
```
`loadStripe` wołane **raz** (singleton na poziomie modułu). Przycisk płatności zablokowany do `onReady`.

```ts
const { error: submitError } = await elements.submit();
if (submitError) { /* pokaż */ return; }
await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
// dotarcie tutaj = redirect się nie odbył → błąd
```

### 5.4 Webhook — `POST /api/webhooks/stripe` (ścieżka: liczba mnoga „webhooks")

```ts
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) return 500 { error: "Webhook secret not configured" };
const signature = req.headers.get("stripe-signature");
if (!signature) return 400 { error: "Missing signature" };
const rawBody = await req.text();        // App Router: surowy tekst, bez konfiguracji bodyParser
event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
// throw → 400; błąd handlera → 500 (Stripe ponowi); reszta → 200 { received: true }
```

Routing `payment_intent.succeeded` po `pi.metadata.kind`: `"COURSE_PURCHASE"` → `handleCoursePurchasePaid`, inne rodzaje → własne handlery, nieznane typy zdarzeń → `default: break` → 200.

**Nie ma handlera niepowodzenia dla `COURSE_PURCHASE`** — i słusznie, bo nic nie powstaje przed sukcesem.

```ts
async function handleCoursePurchasePaid(pi) {
  const { userId, courseId } = pi.metadata ?? {};
  if (!userId || !courseId) { console.warn(...); return; }   // połknij → 200, bez retry

  // ▶ IDEMPOTENCJA: wyłącznie @@unique + upsert z pustym update.
  //   Brak tabeli dedupu event.id — powtórki są nieszkodliwe.
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });

  // CRM — fire-and-forget, NIE await (nie może zablokować nadania dostępu)
  prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    .then(u => u?.email && upsertContactFromEmail(u.email, { name: u.name, source: "VOD", userId }))
    .catch(console.error);

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } });
  if (course) {
    await sendNotification({ userId, title: "🎓 Dostęp do kursu odblokowany",
      message: `Masz już pełny dostęp do kursu „${course.title}". Miłej nauki!`,
      type: "PAYMENT", link: `/panel/vod/${course.slug}`, push: true }).catch(console.error);

    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    const amountPln = ((pi.amount_received ?? pi.amount ?? 0) / 100).toFixed(0);
    await logVodPurchase({ userName: buyer?.name || buyer?.email || "Klient",
      courseTitle: course.title, courseSlug: course.slug, amount: amountPln }).catch(console.error);
  }
}
```
**Kolejność ma znaczenie: dostęp powstaje PRZED telemetrią.** Jeśli kurs został usunięty, powiadomienia się nie wyślą, ale `Enrollment` i tak istnieje.

Wpis do live-feedu admina wymaga **jednocześnie** `kind` i `who`, inaczej kanał `ACTIVITY` jest cicho pomijany.

### 5.5 Fallback na wypadek spóźnionego webhooka — `/panel/vod` (RSC)

Stripe dokleja do `return_url` parametry `payment_intent`, `payment_intent_client_secret`, `redirect_status`.

```ts
if (paymentIntentId && redirectStatus === "succeeded" && process.env.STRIPE_SECRET_KEY) {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);  // ← NIGDY nie ufamy klientowi
    const meta = pi.metadata || {};
    if (pi.status === "succeeded" &&
        meta.kind === "COURSE_PURCHASE" &&
        meta.userId === userId &&        // ← blokuje zapis z cudzego ID PaymentIntenta
        meta.courseId) {
      await enrollUserInCourse(userId, meta.courseId);   // ten sam idempotentny upsert
    }
  } catch (err) { console.error(err); }   // niekrytyczne
}
```
**Cztery bramki: ponowne pobranie PI po stronie serwera, status, kind, własność.** Uruchamiane **przed** `getVodOverview`, więc świeżo kupiony kurs jest widoczny już przy pierwszym renderze.

Modal sukcesu (`?zakup=sukces`): warunek `searchParams.get("redirect_status") !== "failed"` (a nie `=== "succeeded"`) — dzięki temu kurs darmowy, który nie ma tego parametru, też pokazuje modal. 3 salwy confetti (x=0.3 → 0.7 po 200 ms → 0.5 po 450 ms, kolory `#287d88, #f2d967, #033f63, #ffffff`), raz, pod strażą refa. „Kontynuuj" czyści z URL `zakup`, `payment_intent`, `payment_intent_client_secret`, `redirect_status` przez `router.replace(..., {scroll:false})` — modal nie wraca po odświeżeniu — a po 350 ms odpala prompt instalacji PWA.

---

## 6. ODTWARZACZ i postęp

### Gating — `/panel/vod/[slug]/page.tsx`
```ts
if (!session?.user?.id) redirect("/logowanie?callbackUrl=/panel/vod");
const course = await getCourseForPlayer(slug);
if (!course) notFound();
const enrolled = await isUserEnrolled(session.user.id, slug);
if (!enrolled) redirect(`/kursy/${slug}/checkout`);   // ← brak dostępu = do kasy, nie 403
```

### `POST /api/panel/vod/progress` — dwutrybowy

**Tryb A (kurs „single"): `courseId` bez `lessonId`**
```ts
const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
if (!enrollment) return 403 { error: "Brak dostępu do kursu." };
const next = Math.max(enrollment.watchedSec, Math.max(0, Math.round(seconds ?? 0)));  // MONOTONICZNIE
await prisma.enrollment.update({ where: { id: enrollment.id },
  data: { watchedSec: next, ...(completed ? { completedAt: new Date() } : {}) } });
```

**Tryb B (lekcja): `lessonId`** — `seconds` i `completed` aktualizowane **niezależnie**, bo tick playera niesie tylko sekundy, a przycisk tylko flagę:
```ts
const nextSeconds   = seconds   !== undefined ? Math.max(existing?.seconds ?? 0, Math.max(0, Math.round(seconds))) : (existing?.seconds ?? 0);
const nextCompleted = completed !== undefined ? !!completed : (existing?.completed ?? false);
await prisma.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } },
  update: { completed: nextCompleted, seconds: nextSeconds },
  create: { userId, lessonId, completed: nextCompleted, seconds: nextSeconds } });
```
Kody: brak sesji → 401; brak obu ID → 400; sukces → `{ok:true}`.

> 🔴 **DŁUG DO NAPRAWIENIA:** tryb B **nie sprawdza żadnego `Enrollment`** — każdy zalogowany może zapisać postęp dowolnej lekcji. Wpływ mały (tylko wiersze postępu), ale asymetria względem trybu A wygląda na przeoczenie. **W nowym projekcie dodaj tam walidację dostępu** (`lesson.module.courseId` → sprawdź Enrollment).

### Klient (`VodCoursePlayer` + `HlsPlayer`)
- Throttle zapisu: jeden request na ~10 s — `t >= last + 10 || t < last` (drugi warunek łapie też przewijanie wstecz).
- `fetch(..., { keepalive: true })` — ostatni tick przeżywa zamknięcie strony.
- Ręczny toggle „ukończone": optymistyczna aktualizacja `Set`, błąd ignorowany (tolerancja offline).
- Koniec wideo → oznacz lekcję ukończoną → jeśli ostatnia, `POST /api/panel/vod/complete`; jeśli nie, odliczanie do auto-next.
- Wznowienie: `resumeAt = isSingle ? initialWatchedSec : (lessonSeconds[activeLessonId] ?? 0)`; seek **raz**, na `loadedmetadata`, tylko gdy `startAt > 1`.
- Własny player `hls.js` + natywny HLS na Safari/iOS. Minimalne kontrolki (play/pauza, pasek, głośność, fullscreen). Na mobile fullscreen **blokuje orientację landscape** (`screen.orientation.lock("landscape")`), wyjście przywraca pion.

### `GET /api/panel/vod/last`
Zwraca `{ course: getLastWatchedCourse(userId) }`. Bez sesji: **`{course: null}` ze statusem 401** (body zawsze poprawne — konsument robi `r.ok ? r.json() : null`).

---

## 7. OPINIE — `/api/kursy/[slug]/opinie`

```ts
const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Opinia jest za krótka.").max(2000),
});
```

Wspólna bramka `resolveEnrolledCourse(slug, userId)`: brak kursu → 404 `"Kurs nie istnieje."`; brak `Enrollment` → **403** `"Opinię może dodać tylko kursant z dostępem do kursu."`

**POST**: sesja (401) → bramka (404/403) → Zod (400, komunikat z `error.issues[0]?.message`) → `upsertCourseReview` → powiadomienie admina fire-and-forget (`void`) → `{ok:true}`.
**DELETE**: sesja → bramka → `deleteCourseReview` → `{ok:true}` (usunięcie nieistniejącej opinii to poprawny no-op).

**Przeliczanie cache oceny — ZAWSZE w tej samej transakcji co zapis:**
```ts
async function recomputeCourseRating(tx, courseId) {
  const agg = await tx.courseReview.aggregate({ where: { courseId }, _avg: { rating: true }, _count: { _all: true } });
  const count = agg._count._all;
  const avg   = agg._avg.rating ?? 0;
  await tx.course.update({ where: { id: courseId }, data: {
    reviews: count,
    rating:  count > 0 ? Math.round(avg * 10) / 10 : 0,   // 1 miejsce po przecinku; 0 → UI pokazuje „Nowość"
  }});
}

export async function upsertCourseReview({ userId, courseId, rating, text }) {
  const r = Math.min(5, Math.max(1, Math.round(rating)));   // klamra RÓWNIEŻ po stronie serwera
  await prisma.$transaction(async (tx) => {
    await tx.courseReview.upsert({ where: { courseId_userId: { courseId, userId } },
      update: { rating: r, text: text.trim() }, create: { courseId, userId, rating: r, text: text.trim() } });
    await recomputeCourseRating(tx, courseId);
  });
}

export async function deleteCourseReview(userId, courseId) {
  await prisma.$transaction(async (tx) => {
    await tx.courseReview.deleteMany({ where: { userId, courseId } });   // deleteMany, nie delete
    await recomputeCourseRating(tx, courseId);
  });
}
```

---

## 8. PANEL ADMINA — kreator kursu

### Autoryzacja
```ts
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { isAuthorized: false as const,
             response: NextResponse.json({ error: "Brak dostępu. Wymagane uprawnienia administratora." }, { status: 403 }),
             session: null };
  }
  return { isAuthorized: true as const, response: null, session };
}
```
Wołane jako **pierwsza linia każdego handlera** `/api/admin/*`.

### Kroki kreatora — zależne od formatu
```ts
type StepId = "start" | "program" | "dane" | "tresc" | "seo" | "podsumowanie";

function stepsFor(format) {
  return format === "single"
    ? ["start", "dane", "tresc", "seo", "podsumowanie"]              // wideo jest w „Dane"
    : ["start", "program", "dane", "tresc", "seo", "podsumowanie"];  // Program PRZED Dane
}
```
Krok `start` ma dwie fazy: wybór metody (**AI / ręcznie**), potem wybór formatu (**jeden film / podział na lekcje**).

Stan w URL: `/admin/kursy/dodaj?step=<n>&format=<fmt>&draft=<id>` — odświeżenie strony nie gubi kontekstu.

### Bramka publikacji — `lib/coursePublishGate.ts` (JEDNO źródło prawdy)

Egzekwowana **po stronie serwera** w POST i PATCH; klient liczy to samo tylko po to, by zablokować przycisk.

Wymagane do `PUBLISHED`: `title` (≥3 znaki), `category`, `price` (liczba skończona — **`0` jest OK, `null` nie**), `excerpt`, `image`, `ogImage`, `description` (niepusta tablica), `faq` (niepusta tablica) oraz gotowość wideo:
```ts
function isVideoReady(input) {
  if (input.format === "single") return isFilled(input.video);
  const titled = (input.modules ?? []).flatMap(m => (m.lessons ?? []).filter(l => isFilled(l.title)));
  if (titled.length === 0) return false;
  return titled.every(l => isFilled(l.video));   // KAŻDA nazwana lekcja musi mieć nagranie
}
```
Błąd: `400 { error: "Aby opublikować kurs, uzupełnij: …", code: "MISSING_CRITICAL", missing: string[] }`.

Etykiety PL: `title→"tytuł kursu"`, `category→"kategorię"`, `price→"cenę"`, `excerpt→"krótki opis"`, `image→"okładkę kursu"`, `video→"wideo"`, `description→"treść strony (O kursie)"`, `faq→"sekcję FAQ"`, `ogImage→"grafikę OG"`.

Szkice (`DRAFT`) i archiwum przechodzą **bez** tych wymagań.

### Autozapis szkicu — `useCourseAutosave`

Wzorzec: nowy kurs nie ma ID → pierwszy zapis to **POST ze statusem `DRAFT`**, zapamiętujemy ID → kolejne zapisy to **PATCH**. „Opublikuj" to ten sam `persist()` ze statusem `PUBLISHED`.

```ts
const AUTOSAVE_MS = 30000;   // 30 s po OSTATNIEJ zmianie (timer resetowany przy każdej edycji)
const MIN_TITLE = 3;

// Szkic zapisujemy przy JAKIEJKOLWIEK treści — wystarczy samo wgrane wideo, tytuł nie jest wymagany.
const hasContent = title.trim() || video.trim() ||
  curriculum.some(m => m.title.trim() || m.lessons.some(l => l.title.trim() || l.video.trim()));
```
Zabezpieczenia:
- `publishedRef` — po publikacji autozapis **nie może** cofnąć statusu do DRAFT.
- `baseStatus` — przy edycji już opublikowanego kursu autozapis zapisuje z `PUBLISHED`, nie `DRAFT`.
- `inFlight` — brak nakładających się zapisów.
- `patchBody` **pomija pusty tytuł i pustą kategorię**, bo schema PATCH wymaga `min(1)`, a szkic może ich jeszcze nie mieć.
- Zmiana `videoSignature(draft)` (konkatenacja wszystkich URL-i wideo) wyzwala **natychmiastowy** zapis, bez czekania 30 s.
- `_key` na module/lekcji — stabilny klucz Reacta, **nie trafia do API**; zapobiega mieszaniu stanu pól przy usuwaniu lekcji.

Zwraca: `{ courseId, savingSource, showAutosaveTooltip, lastSavedAt, error, canSave, saveDraft, saveNow, publish }`.

### `GET /api/admin/kursy/[id]` — przywracanie szkicu
Zwraca `{ draft, status }` w kształcie stanu kreatora. **Kluczowe: zwraca `id` modułów i lekcji**, żeby kolejny PATCH mógł synchronizować je w miejscu (bez tego postępy kursantów by przepadły). Pusty kurs → seed `[{ title: "", lessons: [{ title: "", video: "" }] }]`.

### `POST /api/admin/kursy` — tworzenie
- Slug z `slugify` (NFD + strip diakrytyków, jawne `ł → l`, `[^a-z0-9]+ → -`, cap 60 znaków) + pętla unikalności `-2`, `-3`…; brak tytułu → baza `"kurs"`.
- `hasContent` — odrzuca całkiem puste body (400).
- Domyślny status to `PUBLISHED`; kreator przy autozapisie jawnie wysyła `DRAFT`.
- `durationMin` z **realnych** długości wideo: `single` → `videoDurationSec`, `sections` → suma `lesson.durationSec`; `Math.max(1, Math.round(totalSec / 60))`. Fallback do ręcznego `body.durationMin` gdy `totalSec === 0`.
- Moduły bez ani jednej lekcji z tytułem są **odrzucane**.
- `publishedAt` ustawiane przy tworzeniu tylko gdy `status === "PUBLISHED"`.

### `PATCH /api/admin/kursy/[id]` — **najważniejszy algorytm: synchronizacja po ID**

Cel: edycja programu **nie może** kasować `LessonProgress` kursantów. Dlatego zamiast „usuń wszystko i utwórz od nowa" robimy sync in-place, całość w `$transaction`:

```ts
await prisma.$transaction(async (tx) => {
  // (opcjonalnie) DRAFT → PUBLISHED z tytułem: przelicz slug.
  // Slugów JUŻ opublikowanych kursów NIE ruszamy (stałe linki).
  if (data.status === "PUBLISHED" && data.title) {
    const current = await tx.course.findUnique({ where: { id }, select: { status: true } });
    if (current?.status === "DRAFT") {
      const base = slugify(data.title) || "kurs";
      let slug = base, n = 1;
      while (await tx.course.findFirst({ where: { slug, NOT: { id } }, select: { id: true } }))
        slug = `${base}-${++n}`;
      scalar.slug = slug;
    }
  }

  // Zawsze bump updatedAt — UI rozpoznaje świeży stan po tej dacie
  // (remount edytora z realnymi ID nowo utworzonych lekcji).
  await tx.course.update({ where: { id }, data: { ...scalar, updatedAt: new Date() } });

  if (data.modules) {
    const existing = await tx.courseModule.findMany({
      where: { courseId: id }, include: { lessons: { select: { id: true } } },
    });

    // 1) Usuń moduły nieobecne w payloadzie
    const incomingModuleIds = new Set(data.modules.filter(m => m.id).map(m => m.id));
    const modulesToDelete = existing.filter(m => !incomingModuleIds.has(m.id)).map(m => m.id);
    if (modulesToDelete.length) await tx.courseModule.deleteMany({ where: { id: { in: modulesToDelete } } });

    // 2) Upsert modułów w NOWEJ kolejności (order = indeks w tablicy)
    for (let mi = 0; mi < data.modules.length; mi++) {
      const m = data.modules[mi];
      const existingMod = m.id ? existing.find(e => e.id === m.id) : undefined;

      let moduleId;
      if (existingMod) {
        await tx.courseModule.update({ where: { id: existingMod.id }, data: { title: m.title, order: mi } });
        moduleId = existingMod.id;
      } else {
        moduleId = (await tx.courseModule.create({ data: { courseId: id, title: m.title, order: mi } })).id;
      }

      // 3) Synchronizacja lekcji W OBRĘBIE modułu — po ID → POSTĘPY ZOSTAJĄ
      const existingLessonIds = new Set((existingMod?.lessons ?? []).map(l => l.id));
      const incomingLessonIds = new Set(m.lessons.filter(l => l.id).map(l => l.id));
      const lessonsToDelete = [...existingLessonIds].filter(lid => !incomingLessonIds.has(lid));
      if (lessonsToDelete.length) await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete } } });

      for (let li = 0; li < m.lessons.length; li++) {
        const l = m.lessons[li];
        if (l.id && existingLessonIds.has(l.id)) {
          await tx.lesson.update({ where: { id: l.id }, data: {
            title: l.title, description: l.description || null, video: l.video || null,
            durationSec: l.durationSec ?? 0, order: li } });
        } else {
          await tx.lesson.create({ data: {
            moduleId, title: l.title, description: l.description || null, video: l.video || null,
            durationSec: l.durationSec ?? 0, order: li } });
        }
      }
    }
  }
});
```

Pozostałe reguły PATCH:
- **Stan efektywny przy bramce publikacji**: payload nadpisuje wartości z bazy. Konieczne, bo zmiana statusu z listy nie wysyła pełnych danych.
- `publishedAt` zapisywane **tylko raz**, pod strażą `alreadyPublishedAt`.
- **`null` vs `undefined` w polach Json** — rozróżnienie ma znaczenie:
  ```ts
  if (data.description !== undefined) scalar.description = data.description ?? Prisma.DbNull;
  // jawne null w payloadzie → Prisma.DbNull (SQL NULL, czyści pole → UI wraca do fallbacku)
  // brak klucza                    → pole nietknięte
  ```
- `durationMin` przeliczane tylko gdy przyszedł `format` (pełny patch z kreatora) — zwykła zmiana statusu z listy go nie rusza.
- Efekty uboczne przy przejściach: pierwsza publikacja (`DRAFT|ARCHIVED → PUBLISHED`) → push do wszystkich; przyrost liczby lekcji na opublikowanym kursie → push do wszystkich zapisanych.
- Zod: `description`/`content` to `z.array(z.any()).nullable().optional()` — **zawartość bloków nie jest walidowana**, tylko „czy tablica". Tylko `faq` ma walidację strukturalną `z.array(z.object({ q: z.string(), a: z.string() }))`. *(Rozważ dokręcenie w nowym projekcie.)*
- `P2025` (nie znaleziono) → 404; `DELETE` na nieistniejącym → `{ok:true, alreadyGone:true}`.

### AI w kreatorze (opcjonalne)

Oryginał używa **Google Gemini** (`@google/generative-ai`, domyślny model `gemini-3.1-flash-lite`) przez jedną wspólną trasę `POST /api/admin/gemini` z dyspozytorem po polu `action`. Akcje kursowe: `generateCourse`, `generateCourseBlueprint`, `generateCourseStructure`, `generateCourseSingleBlock`, `generateLessonMeta`, `generateCourseSeo`, `analyzeCourseSeo`, `generateBasicInfo`.

Wzorzec: `responseMimeType: "application/json"` + walidacja Zod odpowiedzi + tolerancyjny parser (`parseModelJson`) na wypadek, gdy model owinie JSON w markdown.

> **W nowym projekcie użyj Claude API** (`@anthropic-ai/sdk`), zachowując ten sam kształt: jedna trasa admin-only, dyspozytor po `action`, walidacja Zod wyjścia, schematy narzędzi zamiast surowego JSON w prompcie. Autopilot kreatora prowadzi twórcę przez etapy: `skeleton → video → cover → data → content → contentTab → seo → og`.

---

## 9. HOSTING WIDEO — Bunny Stream

### Zmienne środowiskowe
```
BUNNY_STREAM_LIBRARY_ID
BUNNY_STREAM_API_KEY            # NIGDY na kliencie
BUNNY_STREAM_CDN_HOSTNAME       # np. vz-xxxxxxxx.b-cdn.net
BUNNY_STREAM_TOKEN_KEY          # token-auth do podpisywania URL
BUNNY_WEBHOOK_SECRET
NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME   # tylko do miniatur po stronie klienta
```

### Zasada nadrzędna
**Klucz API nigdy nie opuszcza serwera.** Serwer tworzy obiekt wideo i podpisuje upload; plik leci **bezpośrednio z przeglądarki do Bunny** przez TUS (wznawialny, z progresem).

### `lib/bunny.ts` — kluczowe funkcje

```ts
// Tworzy obiekt wideo w bibliotece, zwraca GUID.
POST https://video.bunnycdn.com/library/{LIBRARY_ID}/videos
     headers: { AccessKey: API_KEY }  body: { title }

// Podpis uploadu TUS: SHA256(libraryId + apiKey + expire + videoId), hex.
export function bunnyTusSignature(videoId: string, expire: number): string {
  return crypto.createHash("sha256")
    .update(`${LIBRARY_ID}${API_KEY}${expire}${videoId}`)
    .digest("hex");
}

export const bunnyEmbedUrl = (id) => `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${id}`;
export const bunnyHlsUrl   = (id) => CDN_HOST ? `https://${CDN_HOST}/${id}/playlist.m3u8` : "";
export const bunnyThumbnailUrl = (id) => CDN_HOST ? `https://${CDN_HOST}/${id}/thumbnail.jpg` : "";
export const bunnyGuidFromEmbed = (url) => url?.match(/\/embed\/[^/]+\/([^/?#]+)/)?.[1] ?? null;

// Podpisany HLS (Token Authentication na pull zone).
// PODPISUJEMY CAŁY KATALOG przez token_path — token obejmuje playlistę ORAZ
// wszystkie segmenty/warianty (.m3u8/.ts). Bez tego segmenty dostają 403.
export function bunnySignedHlsUrl(videoId: string, ttlSeconds = 6 * 3600): string {
  const base = bunnyHlsUrl(videoId);
  if (!base || !TOKEN_KEY) return base;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const tokenPath = `/${videoId}/`;
  const token = crypto.createHash("sha256")
    .update(`${TOKEN_KEY}${tokenPath}${expires}`)
    .digest("base64")
    .replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");  // base64url
  return `${base}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`;
}
```

**Statusy Bunny:** `0 Created · 1 Uploaded · 2 Processing · 3 Transcoding · 4 Finished · 5 Error · 6 UploadFailed`.
```ts
const hasResolution = (data.availableResolutions ?? "").trim().length > 0;
ready  = status === 4 || hasResolution;   // NIE czekamy na pełne „Finished" — Bunny gra od
                                          // pierwszej gotowej rozdzielczości, a „Finished"
                                          // dla krótkich filmów potrafi długo dochodzić
failed = status === 5 || status === 6;
```
`404` z Bunny → zwracamy `{ notFound: true }` zamiast rzucać, żeby uploader nie pollował w nieskończoność. Inne błędy (5xx, sieć) → rzucamy, poll spróbuje ponownie.

**Miniatury:** pull zone Stream blokuje bezpośredni dostęp do plików (sprawdza `Referer`). Miniaturę pobieramy **wyłącznie po stronie serwera** z nagłówkiem `Referer: https://iframe.mediadelivery.net/`.

**Podział playerów:** kursant gra **podpisany HLS we własnym `HlsPlayer`** (hls.js). Admin i podglądy w kreatorze używają **iframe Bunny** (z doklejonym `?autoplay=false&preload=false`, bo Bunny domyślnie startuje sam).

### `POST /api/admin/kursy/bunny-upload`
```ts
requireAdmin();
if (!bunnyConfigured()) return 503 { error: "Bunny Stream nie jest skonfigurowany…" };
const videoId  = await createBunnyVideo(title || "Wideo kursu");
const expire   = Math.floor(Date.now() / 1000) + 3600;   // 1 h na upload
const signature = bunnyTusSignature(videoId, expire);
return { libraryId, videoId, signature, expire, embedUrl, hlsUrl };
```

### `VideoUploader` (klient, `tus-js-client`)
```ts
const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-matroska";
const MAX_BYTES = 2_000_000_000;   // 2 GB
const STATUS_POLL_MS = 4000;
type Phase = "idle" | "uploading" | "processing" | "done" | "error";

const upload = new tus.Upload(file, {
  endpoint: "https://video.bunnycdn.com/tusupload",
  retryDelays: [0, 3000, 6000, 12000],
  headers: {
    AuthorizationSignature: data.signature,
    AuthorizationExpire: String(data.expire),
    VideoId: data.videoId,
    LibraryId: String(data.libraryId),
  },
  metadata: { filetype: file.type, title: file.name },
  onError:    () => { onChange(""); /* cofnij URL — inaczej w szkicu zostaje martwy link */ },
  onProgress: (uploaded, total) => report(Math.round(uploaded / total * 100)),
  onSuccess:  () => setPhase("processing"),   // czekamy aż Bunny zakończy kodowanie
});
```

Niuanse warte przeniesienia:
- **`embedUrl` i `videoId` znamy JUŻ przy inicjacji** (Bunny tworzy obiekt przed wysłaniem pliku) → zapisujemy je od razu, kreator widzi „jest wideo" i odblokowuje przejście dalej, a plik dochodzi w tle.
- Postęp raportowany **wprost z callbacków TUS** do globalnego trackera (nie przez efekt sprzątany przy odmontowaniu) → pasek postępu przeżywa zmianę kroku kreatora.
- Faza `processing` z własnym overlayem zamiast surowej planszy „Processing" z embeda; po 45 s pokazuje podpowiedź „trwa dłużej niż zwykle" + przycisk „Sprawdź teraz" (ręczny re-poll).
- Po `ready` uploader zgłasza `onDuration(length)` → kreator aktualizuje `durationSec`/`videoDurationSec` → z tego liczy się `durationMin` kursu.
- Wejście na krok z gotowym `value` (edycja / przywrócony szkic) sprawdza status **raz** i albo odświeża czas, albo przełącza w `processing`.

---

## 10. Kolejność wdrożenia (rekomendowana)

1. **Schema Prisma** + migracja. (Uwaga na kolejność pól w `@@unique`.)
2. **`lib/courses-db.ts`** — mappery, `getCourses`, `getCourseBySlug`, funkcje postępu.
3. **Katalog + strona sprzedażowa** (`/kursy`, `/kursy/[slug]`) na danych z bazy.
4. **`coursePublishGate.ts`** — zanim powstaną trasy admina.
5. **API admina** (`POST` + `PATCH` z synchronizacją po ID) + `requireAdmin`.
6. **Bunny** (`lib/bunny.ts`, `bunny-upload`, `bunny-status`, `VideoUploader`).
7. **CourseWizard** + `useCourseAutosave`.
8. **Stripe**: `create-payment-intent` → checkout → webhook → fallback na `/panel/vod`.
9. **Player**: gating, `HlsPlayer`, `/api/panel/vod/progress`, `/complete`, `/last`.
10. **Opinie** + przeliczanie cache oceny.
11. Statystyki admina, uczestnicy, powiadomienia.

---

## 11. Świadome długi z oryginału — NAPRAW przy przepisywaniu

1. **Adres rozliczeniowy z checkoutu jest wyrzucany.** Walidujemy `name`/`address`/`postal`/`city`, ale wysyłamy tylko `{slug, buyerType, company, nip}`. Przy fakturowaniu — wysłać i zapisać.
2. **Brak jakiegokolwiek rekordu zamówienia.** Zapłacona kwota nie jest u nas nigdzie utrwalona; `revenue` liczy się jako `liczba_kursantów × AKTUALNA cena`, więc edycja ceny **zmienia historyczne przychody**. Jeśli raportowanie finansowe ma znaczenie — dodaj tabelę `CoursePurchase` (kwota, waluta, `paymentIntentId`, data) zapisywaną w webhooku.
3. **Tryb lekcyjny `/api/panel/vod/progress` nie sprawdza `Enrollment`.** Dodać walidację.
4. **Dwie różne definicje „postępu"** (`lessonsTimeProgress` po czasie vs. `getCourseParticipants` po liczbie lekcji). Ujednolicić.
5. **`Course.testimonials` (Json) jest martwe** — nic go nie zapisuje, zastąpiła je tabela `CourseReview`. Nie przenoś tej kolumny.
6. **Kolizja nazw**: `getCourseBySlug` istnieje jako async (baza) i sync (statyczny fallback). Nazwij inaczej.
7. **Bloki `description`/`content` nie mają walidacji struktury** — tylko `z.array(z.any())`. Zwaliduj union `CourseBlock`.
8. **Brak dedupu po `event.id` w webhooku.** Idempotencja opiera się wyłącznie na `@@unique` — wystarcza dla `Enrollment`, ale gdy dojdzie zapis zamówienia/przychodu, trzeba będzie dołożyć tabelę przetworzonych zdarzeń.

---

## 12. Kryteria akceptacji

- [ ] Zakup kursu kartą/BLIK/P24 nadaje dostęp przez webhook; **ponowne dostarczenie tego samego zdarzenia niczego nie duplikuje ani nie kasuje postępu**.
- [ ] Gdy webhook się spóźni, powrót na `/panel/vod` domyka dostęp — a podstawienie cudzego `payment_intent` w URL **nie** nadaje dostępu.
- [ ] Kurs za 0 zł nadaje dostęp bez udziału Stripe.
- [ ] Ponowne wejście na checkout posiadanego kursu przekierowuje do panelu.
- [ ] `/panel/vod/[slug]` bez `Enrollment` przekierowuje na checkout.
- [ ] Postęp jest monotoniczny — przewinięcie wstecz go nie cofa.
- [ ] **Edycja programu opublikowanego kursu (zmiana kolejności, przemianowanie, dodanie lekcji) nie kasuje `LessonProgress` kursantów.**
- [ ] Publikacja bez kompletu krytycznych pól zwraca 400 z listą braków — **także przy zmianie statusu z listy**, gdzie payload nie zawiera pełnych danych.
- [ ] Slug opublikowanego kursu nigdy się nie zmienia; slug szkicu przeliczany jest przy pierwszej publikacji.
- [ ] Wgranie wideo działa dla pliku ~1 GB, pokazuje progres, **przeżywa zmianę kroku kreatora**, a po zakończeniu kodowania automatycznie przełącza się na player.
- [ ] Kursant gra podpisany HLS; bezpośredni URL playlisty bez tokenu zwraca 403; token wygasa po 6 h.
- [ ] Dodanie/usunięcie opinii natychmiast aktualizuje `Course.rating` i `Course.reviews`; ostatnia usunięta opinia zeruje ocenę.
- [ ] Opinię może wystawić wyłącznie kursant z `Enrollment` (403 dla pozostałych).
