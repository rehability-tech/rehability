# Brief: Platforma VOD (Kursy) — jak działa w systemie Rehability

> Dokument techniczno-produktowy. Opisuje realny stan implementacji (kod), nie plany.
> Terminologia w UI: „kurs/program", użytkownik to „kursant". Dostęp **per-konto**, **dożywotni**.

---

## 1. Obraz całości

VOD to druga noga produktu obok wydarzeń: sprzedaż i odtwarzanie kursów wideo on-demand.
Platforma ma trzy warstwy użytkownika i jedno źródło danych domenowych:

- **Publiczna** (`(site)`) — katalog, strony sprzedażowe, checkout.
- **Panel kursanta** (`/panel/vod`, PWA) — biblioteka i odtwarzacz, gating po zakupie.
- **Panel admina** (`/admin/kursy`) — dashboard, lista, kreator, edycja, uczestnicy.

**Źródło danych:** wszystkie kursy żyją w bazie (Prisma/PostgreSQL). Cała logika domenowa
jest w `src/lib/courses-db.ts`. Plik `src/app/(site)/kursy/_data/courses.ts` to już TYLKO
typy + statyczne fallbacki (`COURSE_BENEFITS`, `DEFAULT_FAQ`, `DEFAULT_CURRICULUM`,
`formatCourseDuration`); tablica `COURSES` jest reliktem.

**Filary techniczne:**
- Hosting wideo: **Bunny Stream** (upload TUS z przeglądarki, odtwarzanie podpisanym HLS).
- Płatności: **Stripe Payment Element** (karta / BLIK / Przelewy24) + webhook.
- AI: **Gemini** (`/api/admin/gemini`) — generowanie kursu, SEO, treści; autopilot w kreatorze.

---

## 2. Model danych (Prisma)

| Model | Klucz | Najważniejsze pola |
|---|---|---|
| **Course** | `slug @unique` | `title`, `category`, `excerpt`, `price` (zł, int), `durationMin`, `rating`/`reviews`/`views` (cache), `format` (`single`\|`sections`), `video`, `videoDurationSec`, `image`, `status` (`DRAFT`\|`PUBLISHED`\|`ARCHIVED`), `description`/`content`/`faq`/`testimonials` (Json), pola SEO (`metaTitle`, `metaDescription`, `focusKeyword`, `ogImage`, `canonicalUrl`, `noIndex`), `publishedAt`, `createdAt`, `updatedAt`. Indeks `@@index([status])`. |
| **CourseModule** | — | `courseId` (FK), `title`, `order`, `lessons[]`. |
| **Lesson** | — | `moduleId` (FK), `title`, `description`, `video`, `durationSec`, `order`. |
| **Enrollment** | `@@unique([userId, courseId])` | dostęp do kursu; `createdAt`, `completedAt` (gdy ukończony). Nadawany **idempotentnie**. |
| **LessonProgress** | `@@unique([userId, lessonId])` | `completed`, `seconds` (łączny czas), `updatedAt`. Baza statystyk i % ukończenia. |
| **CourseReview** | `@@unique([courseId, userId])` | `rating` (1–5), `text`; po zapisie/usunięciu przeliczamy `Course.rating`/`reviews` w transakcji. |

**Format kursu:**
- `single` — jeden film (`Course.video` + `videoDurationSec`), bez modułów.
- `sections` — program: `CourseModule` → `Lesson`. `durationMin` = suma `durationSec` lekcji.

**Statusy:** `DRAFT` (szkic, autozapis), `PUBLISHED` (publiczny), `ARCHIVED`.

---

## 3. Warstwa danych — `src/lib/courses-db.ts`

Jedyne źródło logiki VOD. Najważniejsze funkcje:

**Katalog / strony publiczne**
- `getCourses()` → tylko `PUBLISHED` (katalog publiczny + statystyki admina).
- `getCourseBySlug(slug)` → pojedynczy `PUBLISHED` + realne opinie (strona sprzedażowa).
- `getCourseCategories()` → unikalne kategorie z `PUBLISHED` + „Wszystkie".

**Panel kursanta**
- `getCourseForPlayer(slug)` → kurs z pełnymi lekcjami i **podpisanym HLS** (odtwarzacz).
- `getVodOverview(userId)` → biblioteka + postęp per kurs + liczby do statystyk.
- `getEnrolledCourses(userId)`, `isUserEnrolled(userId, slug)`, `isCourseCompleted(userId, courseId)`.
- `getCompletedLessonIds(userId, courseId?)`, `getLastWatchedCourse(userId)`, `getContinueCourse(userId)`.

**Dostęp / opinie**
- `enrollUserInCourse(userId, courseId)` → `Enrollment.upsert` (idempotentnie).
- `upsertCourseReview({userId, courseId, rating, text})` → opinia + `recomputeCourseRating` (transakcja).
- `getUserCourseReview(userId, courseId)`, `deleteCourseReview(userId, courseId)`.

**Panel admina**
- `getAdminCourses()` → WSZYSTKIE statusy + status + liczba zapisów (lista admina).
- `getAdminCourseDetail(slug)` → pełne dane + statystyki sprzedaży + thumb z Bunny.
- `getCourseParticipants(courseId)` → uczestnicy + postępy + czas oglądania + ostatnia aktywność.
- `getCourseAdminStats()` → zapisy/kurs, kursanci łącznie, przychód łącznie, przychód 6 mies.
- `isVideoPending(...)` → czy kursowi brakuje nagrań (single = brak `video`; sections = brak lekcji/wideo).

---

## 4. Mapa tras

### Publiczne (`(site)`)
- `/kursy` — katalog (filtr po kategorii). `getCourses()` + `getCourseCategories()`, ISR `revalidate 300`.
- `/kursy/[slug]` — strona sprzedażowa (zakładki: O kursie / Zawartość / Opinie / FAQ). `getCourseBySlug`, JSON-LD (Course/FAQ/Breadcrumb), SSG z `generateStaticParams`, SEO z bazy.
- `/kursy/[slug]/checkout` — checkout multi-step (Konto → Dane do faktury → Płatność → Podsumowanie). `CheckoutClient` + `StripePaymentStep` (Payment Element). Wymaga logowania, `noIndex`.

### Panel kursanta (`/panel`, PWA)
- `/panel/vod` — biblioteka: kursy posiadane + cały katalog do kupienia; tryb „locked" gdy brak zakupów. `force-dynamic`. Zawiera **fallback Stripe** (patrz §6).
- `/panel/vod/[slug]` — odtwarzacz. **Gating** przez `isUserEnrolled()` → bez dostępu redirect na checkout. Ładuje `getCourseForPlayer`, `getCompletedLessonIds`, `getUserCourseReview`, `isCourseCompleted`. Komponent `VodCoursePlayer` + `HlsPlayer`.

### Panel admina (`/admin/kursy`)
- `/admin/kursy` — dashboard (bento): KPI (liczba kursów, kursanci, przychód, śr. ocena), top kursy, rozkład kategorii, „Wymaga uwagi" (mało kursantów po karencji 14 dni lub ocena < 4.7), „W pigułce", AI Studio. Pusty stan = mock pod nakładką.
- `/admin/kursy/lista` — lista WSZYSTKICH kursów (każdy status) ze statystykami sprzedaży (`AdminCoursesList`).
- `/admin/kursy/dodaj` — kreator (`CourseWizard`).
- `/admin/kursy/[slug]` — dashboard kursu (`CourseDashboard`), zakładki: `overview`, `informacje`, `tresc`, `uczestnicy`.
- `/admin/kursy/[slug]/edytuj` — pełny edytor (ten sam `CourseWizard`, restore draftu z `?draft=<id>`).
- `/admin/kursy/[slug]/uczestnicy` — `getCourseParticipants`: imię, email, data zakupu, % ukończenia, czas oglądania, ostatnia aktywność.

---

## 5. API

### Publiczne / kursant
- `POST /api/kursy/create-payment-intent` — wymaga logowania. Sprawdza duplikat `Enrollment` (→ `alreadyOwned`); kurs darmowy → `Enrollment.upsert` (`free: true`); płatny → Stripe PaymentIntent z `metadata: {kind:"COURSE_PURCHASE", courseId, slug, userId, buyerType?, company?, nip?}` → zwraca `{clientSecret, amount}`.
- `POST /api/kursy/[slug]/opinie` — wymaga logowania + `Enrollment`. `upsertCourseReview` + powiadomienie adminów (link `/admin/kursy/[slug]?tab=uczestnicy`).
- `DELETE /api/kursy/[slug]/opinie` — `deleteCourseReview`.
- `POST /api/panel/vod/progress` — `LessonProgress.upsert` (`lessonId`, `completed`).
- `GET /api/panel/vod/last` — `getLastWatchedCourse(userId)` (skrót w sidebarze).

### Admin — kursy
- `POST /api/admin/kursy` — tworzy kurs; status `DRAFT` (autozapis) lub `PUBLISHED`; przy publikacji bramka `coursePublishBlockers`; liczy `durationMin`; nested create modułów.
- `GET /api/admin/kursy/[id]` — zwraca kurs w kształcie `draft` (do edytora) + `status`.
- `PATCH /api/admin/kursy/[id]` — autozapis + publikacja. **Sync modułów/lekcji po ID** (zachowuje postępy), `publishedAt` ustawiane raz, regeneracja slug przy pierwszej publikacji, powiadomienia: nowa publikacja → push do wszystkich; nowe lekcje w opublikowanym kursie → push do kursantów (link `/panel/vod/[slug]`).
- `DELETE /api/admin/kursy/[id]` — hard delete (cascade); `P2025` → `alreadyGone`.

### Admin — Bunny
- `POST /api/admin/kursy/bunny-upload` — tworzy obiekt wideo + podpisuje upload TUS; zwraca `{libraryId, videoId, signature, expire, embedUrl, hlsUrl}`.
- `GET /api/admin/kursy/bunny-status?videoId=` — status kodowania (do pollingu).
- `POST /api/admin/kursy/bunny-webhook?secret=` — webhook statusu wideo (porównanie z `BUNNY_WEBHOOK_SECRET`); zawsze `200` (Bunny ponawia).
- `POST /api/admin/kursy/[id]/cover-from-video` — kadr z wideo na okładkę.
- `GET /api/admin/kursy/thumbnail?guid=` — proxy miniatur (wymaga nagłówka Referer).

### Admin — AI
- `POST /api/admin/gemini` — wszystkie akcje AI: `generateCourse`, `generateCourseSeo`, `generateCourseBlueprint`, `generateCourseSingleBlock` (rate limiter `geminiFetch`).

### Webhook Stripe
- `POST /api/webhooks/stripe` — `payment_intent.succeeded` z `metadata.kind === "COURSE_PURCHASE"` → `handleCoursePurchasePaid`: idempotentny `Enrollment.upsert`, sync CRM (`source: "VOD"`), powiadomienie kursanta („🎓 Dostęp do kursu odblokowany", link `/panel/vod/[slug]`), wpis do live-feedu admina.

---

## 6. Przepływ zakup → dostęp

1. Kursant na `/kursy/[slug]` → „Kup" → `/kursy/[slug]/checkout`.
2. `CheckoutClient` woła `create-payment-intent` (wymaga logowania → `userId` w `metadata`). Już posiadany → redirect na panel; darmowy → `Enrollment` od ręki.
3. Płatność osadzonym **Stripe Payment Element** (karta / BLIK / Przelewy24). `return_url` → `/panel/vod?zakup=sukces&payment_intent=…&redirect_status=succeeded`.
4. **Webhook Stripe** (`payment_intent.succeeded`, `COURSE_PURCHASE`) → `handleCoursePurchasePaid` → idempotentny `Enrollment` + powiadomienie + live-feed.
5. **Fallback** na `/panel/vod`: po powrocie strona weryfikuje `payment_intent` w Stripe (`status === "succeeded"` + zgodność `userId`/`courseId`) i domyka `Enrollment`, gdyby webhook się spóźnił — świeży kurs widać od razu.
6. Odtwarzacz zapisuje postęp przez `/api/panel/vod/progress`; kursant z dostępem może wystawić opinię.

**Idempotencja w trzech miejscach** (PaymentIntent → webhook → fallback) gwarantuje dokładnie jeden `Enrollment` na `(userId, courseId)`.

---

## 7. Hosting wideo — Bunny Stream (`src/lib/bunny.ts`)

- **Upload bezpośrednio z przeglądarki** przez TUS (wznawialny). Serwer tylko tworzy obiekt wideo i podpisuje upload — klucz API nigdy nie trafia na klienta.
  - `createBunnyVideo(title)`, `bunnyTusSignature(videoId, expire)` = `SHA256(libraryId + apiKey + expire + videoId)`.
  - Klient: endpoint `https://video.bunnycdn.com/tusupload`, retry `[0,3000,6000,12000]` ms, polling statusu co 4 s (`/api/admin/kursy/bunny-status`), po 45 s „trwa długo" + przycisk „Sprawdź teraz".
- **Przechowywanie:** wideo jako **embed URL** Bunny (`iframe.mediadelivery.net/embed/{lib}/{guid}`).
- **Odtwarzanie kursanta:** **podpisany HLS** (`bunnySignedHlsUrl`, token-auth na pull zone, TTL 6 h) we własnym `HlsPlayer` (hls.js + natywny HLS na Safari/iOS; fullscreen, scrub, auto-hide kontrolek).
- **Admin/podglądy:** iframe Bunny (z `?autoplay=false&preload=false`).
- **Miniatury:** `bunnyThumbnailUrl` + proxy `/api/admin/kursy/thumbnail` (pull zone wymaga Referer `iframe.mediadelivery.net`).
- **Funkcje pomocnicze:** `getBunnyVideoStatus`, `listBunnyVideos`, `deleteBunnyVideo` (idempotentny), `bunnyEmbedUrl`, `bunnyHlsUrl`, `bunnyGuidFromEmbed`, `bunnyConfigured`.

**ENV:** `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_STREAM_TOKEN_KEY`, `BUNNY_WEBHOOK_SECRET`, publiczny `NEXT_PUBLIC_BUNNY_STREAM_CDN_HOSTNAME`.

---

## 8. Kreator kursu (`CourseWizard.tsx`) + AI

**Kroki** (zależne od formatu):
- `single`: Start → Dane → Treść → SEO → Podsumowanie (5).
- `sections`: Start → Program → Dane → Treść → SEO → Podsumowanie (6).

**Start** dwufazowy: metoda (AI / ręcznie) → format (single / sections).
**Program** (tylko sections): moduły + lekcje, popup z `VideoUploader` na każdą lekcję.
**Dane:** tytuł, kategoria, cena, czas (auto), excerpt, okładka (kadr z wideo / Pexels / własna).
**Treść:** „O kursie" (BlockBuilder), opcjonalnie „Zawartość", FAQ.
**SEO:** meta title/description, focus keyword, canonical, audyt nasycenia.
**Podsumowanie:** publikacja przez `publish()` → `POST/PATCH /api/admin/kursy`.

**Autozapis:** `useCourseAutosave` (debounce ~30 s, DRAFT/PUBLISHED); pierwszy zapis POST, kolejne PATCH; zmiana wideo → `saveNow()` natychmiast. Szkice są niewidoczne w katalogu (bo `getCourses` = tylko `PUBLISHED`), widoczne na liście admina (`getAdminCourses`), wznawialne przez `?draft=<id>`.

**Bramka publikacji** (`coursePublishBlockers`): wymaga tytułu, kategorii, ceny, excerptu, okładki, wideo/programu, treści „O kursie", FAQ, OG image; meta title/description = ostrzeżenia.

**AI (Gemini):**
- `CourseAiBriefModal` — brief (temat, dla kogo, efekt, poziom + wskazówki) i opcjonalnie struktura programu (1–8 modułów × 1–12 lekcji).
- `generateCourse` → tytuł, kategoria, cena, excerpt, `description` (bloki), `faq`, `curriculum`.
- `generateCourseSeo` → metaTitle (50–60), metaDescription (130–155), focusKeyword.
- **Autopilot** orkiestruje: skeleton → wideo → okładka → reveal danych → treść blok-po-bloku → „Zawartość" (sections) → SEO + audyt → OG image → podsumowanie (panel `NeonAiPanel` z live message i abort).

**ENV AI:** `GEMINI_API_KEY`.

---

## 9. Skrót: kto co robi

| Aktor | Robi | Gdzie |
|---|---|---|
| Gość | Przegląda katalog, czyta stronę sprzedażową | `/kursy`, `/kursy/[slug]` |
| Kursant | Kupuje, ogląda, śledzi postęp, ocenia | `/kursy/[slug]/checkout`, `/panel/vod`, `/panel/vod/[slug]` |
| Admin | Tworzy/edytuje kursy (AI lub ręcznie), wgrywa wideo, śledzi sprzedaż i uczestników | `/admin/kursy/*` |
| System | Idempotentny dostęp (3 ścieżki), powiadomienia, przeliczanie ratingu, statystyki | Stripe webhook + fallback, `courses-db.ts` |
