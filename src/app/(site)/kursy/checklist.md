# Platforma VOD — Checklista podstron i wdrożenia

Lista wszystkich podstron (routes) oraz wspierającego backendu potrzebnych do
uruchomienia platformy kursów wideo wg przyjętej architektury (dostawca wideo
**Mux** + HLS/Adaptive Bitrate, **Signed JWT** na treści, Stripe na płatności).

**Legenda statusu:** `[x]` gotowe · `[~]` częściowe / do rozbudowy · `[ ]` do zrobienia

**Architektura w skrócie (4 filary):**

1. **Ingest & Transcoding** — Direct Upload z przeglądarki Admina prosto do Mux (omija Next.js), auto-HLS, webhook `Ready` → zapis `playbackId`.
2. **Zabezpieczenie treści** — HLS (`.m3u8` + segmenty `.ts`), krótkoterminowy podpisany token JWT (np. 12h) generowany dopiero po weryfikacji `Purchase`, restrykcja domeny (CORS) po stronie Mux.
3. **Logika biznesowa** — hierarchia `Course → Chapter → Lesson(playbackId)`, kontrola dostępu przez `Purchase`, telemetria przez `UserProgress` (debounced zapis co ~15 s).
4. **Player (UX)** — `@mux/mux-player-react`, `onTimeUpdate` (resume watching), `onEnded` (zalicz lekcję + konfetti + autoplay następnej).

---

## A. Podstrony publiczne — marketing i zakup (`/kursy/*`)

Strefa sprzedażowa (niezalogowani + zalogowani). Cel: prezentacja oferty i zakup.

- [x] **`/kursy`** — katalog programów VOD (hero, wyszukiwarka, filtry kategorii, siatka kart, paginacja, sekcja sugestii).
- [x] **`/kursy/[slug]`** — szczegóły kursu (nagłówek + obraz, zakładki: O kursie / Zawartość / Opinie / FAQ, CTA „Otrzymaj dostęp").
- [~] **`/kursy/[slug]/checkout`** — zamówienie. Obecnie: krok „Dane do płatności" (toggle Osoba prywatna/Firma) + podsumowanie. Do dokończenia wieloetapowy flow ze steppera:
  - [ ] Krok **Konto** — wymóg zalogowania (licencja przypisywana do konta); logowanie Google.
  - [~] Krok **Dane do płatności** — dane do faktury (gotowy UI, brak walidacji + zapisu).
  - [ ] Krok **Płatność** — utworzenie sesji Stripe Checkout / Payment Element.
  - [ ] Krok **Podsumowanie** — rekapitulacja przed potwierdzeniem.
- [ ] **`/kursy/[slug]/sukces`** (lub powrót z `?status=success`) — ekran/modal potwierdzenia zakupu, przekierowanie do nauki w panelu.
- [ ] **`/kursy/[slug]/lekcja-demo`** (opcjonalnie) — darmowa lekcja zapowiadająca (publiczny `playbackId`, bez gatekeepera).

## B. Panel kursanta — nauka (gated, `/panel/kursy/*`)

Strefa po zalogowaniu (PWA). Dostęp wyłącznie po weryfikacji `Purchase`. Tu żyje player.

- [ ] **`/panel/kursy`** — „Moje kursy": biblioteka zakupionych kursów, pasek postępu, „Wznów oglądanie". (Podmienić `HubVodWidget` w panelu z „w budowie" na aktywny widget.)
- [ ] **`/panel/kursy/[slug]`** — pulpit kursu: program (lista `Chapter → Lesson`), % ukończenia, przycisk „Kontynuuj od ostatniej lekcji", materiały do pobrania (e-book/PDF).
- [ ] **`/panel/kursy/[slug]/lekcja/[lessonId]`** — **odtwarzacz lekcji**: `mux-player-react` z tokenem JWT, sidebar z listą lekcji + statusami, telemetria (`onTimeUpdate` → debounced zapis), `onEnded` (zalicz + konfetti + autoplay), zmiana prędkości/jakości.
- [ ] **`/panel/kursy/[slug]/certyfikat`** (opcjonalnie) — certyfikat ukończenia po 100% postępu.

## C. Panel admina — zarządzanie i ingest wideo (`/admin/kursy/*`)

Tworzenie kursów i wgrywanie wideo (wzorzec jak `/admin/blog/dodaj` i `/admin/wyjazdy`).

- [ ] **`/admin/kursy`** — lista kursów (status: szkic/opublikowany, cena, sprzedaż, liczba lekcji).
- [ ] **`/admin/kursy/dodaj`** — kreator nowego kursu (dane podstawowe: tytuł, slug, kategoria, cena, okładka, opis/zakładki).
- [ ] **`/admin/kursy/[id]`** — edytor struktury kursu: rozdziały i lekcje (dodawanie, kolejność / drag&drop, publikacja).
- [ ] **`/admin/kursy/[id]/lekcje/[lessonId]`** — edytor lekcji + **upload wideo**: pobranie Direct Upload URL, wgranie do Mux, podgląd statusu transcodingu (`waiting → ready`), zapis `playbackId`, materiały dodatkowe.
- [ ] **`/admin/kursy/[id]/sprzedaz`** (opcjonalnie) — analityka: zakupy, przychód, ukończenia, retencja oglądania.

## D. API / Backend (endpointy) — `src/app/api/*`

- [ ] **`POST /api/admin/kursy/upload-url`** — generuje Mux **Direct Upload URL** (tylko Admin).
- [ ] **`POST /api/webhooks/video`** — webhook Mux `video.asset.ready` → zapis `playbackId`/`muxAssetId`/`duration`, ustaw status lekcji `ready` (weryfikacja podpisu webhooka).
- [ ] **`GET /api/kursy/[slug]/lekcja/[lessonId]/token`** — **Gatekeeper**: sprawdza sesję + `Purchase`, zwraca krótkoterminowy **podpisany JWT** do playera. Bez tokena Mux odrzuca żądanie.
- [ ] **`POST /api/kursy/progress`** — debounced zapis `UserProgress` (`watchTime`, `isCompleted`, `lastWatchedAt`).
- [ ] **`POST /api/kursy/[slug]/checkout`** — tworzy sesję Stripe + `Purchase` w stanie `PENDING`.
- [~] **`POST /api/webhooks/stripe`** — *istnieje* (wyjazdy). Rozszerzyć: po opłacie kursu utwórz/aktywuj `Purchase` (`PAID`) i odblokuj dostęp.
- [ ] **`GET /api/panel/kursy`** — lista kursów kupionych przez zalogowanego użytkownika (do „Moje kursy").

## E. Modele bazy danych (Prisma) — `prisma/schema.prisma`

Brak modeli VOD — wymagana migracja. 5 modeli (3 filary danych):

- [ ] **`Course`** — `id, slug, title, excerpt, description(Json), category, price, coverImage, rating, status, createdAt`.
- [ ] **`Chapter`** — `id, courseId, title, order`.
- [ ] **`Lesson`** — `id, chapterId, title, order, durationSec, muxAssetId, playbackId, status(waiting|ready), isFreePreview, attachments(Json)`.
- [ ] **`Purchase`** *(Access Control)* — `id, userId, courseId, stripePaymentId, status(PENDING|PAID|REFUNDED), createdAt` (unikat: `userId+courseId`).
- [ ] **`UserProgress`** *(Telemetria)* — `id, userId, lessonId, watchTime, isCompleted, lastWatchedAt` (unikat: `userId+lessonId`).

> Po wdrożeniu modeli: podmienić statyczny `_data/courses.ts` na zapytania Prisma.

## F. Integracje i infrastruktura

- [ ] Konto **Mux** + klucze API (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY` + private key) w `.env`.
- [ ] Tryb **mock / zero-config** na starcie (symulacja `playbackId`), by testować logikę bazodanową bez kluczy API.
- [ ] Generowanie i podpisywanie **JWT** dla Mux (klucz prywatny, TTL ~12h).
- [ ] Restrykcja **domeny (CORS)** w Mux — player renderowany tylko na produkcyjnej domenie.
- [ ] Rozszerzenie konfiguracji **Stripe** o produkty/ceny kursów.
- [ ] **Gatekeeper jako współdzielony util** — jedna funkcja `assertCourseAccess(userId, courseId)` używana na każdym endpoincie wydającym token.

---

## Sugerowana kolejność wdrożenia

1. **Modele Prisma** (E) + migracja → podmiana `_data/courses.ts` na bazę.
2. **Gatekeeper API** (`/token`) + `Purchase` (D) — rdzeń kontroli dostępu (na mocku Mux).
3. **Panel kursanta** (B): `/panel/kursy` → `/panel/kursy/[slug]` → odtwarzacz `lekcja/[lessonId]`.
4. **Ingest admina** (C + `upload-url` + `webhooks/video`) — realne wgrywanie wideo do Mux.
5. **Płatności**: dokończenie `checkout` (A) + Stripe + rozszerzenie `webhooks/stripe`.
6. **Telemetria** (`/api/kursy/progress`) + UX playera (resume, konfetti, autoplay).
7. **Twardnienie**: JWT TTL, CORS domeny, weryfikacja podpisów webhooków, opcjonalne certyfikaty/analityka.

---

### Mapa podstron (skrót)

| Obszar | Trasa | Status |
| --- | --- | --- |
| Publiczne | `/kursy` | ✅ |
| Publiczne | `/kursy/[slug]` | ✅ |
| Publiczne | `/kursy/[slug]/checkout` | 🟡 |
| Publiczne | `/kursy/[slug]/sukces` | ⬜ |
| Panel | `/panel/kursy` | ⬜ |
| Panel | `/panel/kursy/[slug]` | ⬜ |
| Panel | `/panel/kursy/[slug]/lekcja/[lessonId]` | ⬜ |
| Admin | `/admin/kursy` | ⬜ |
| Admin | `/admin/kursy/dodaj` | ⬜ |
| Admin | `/admin/kursy/[id]` | ⬜ |
| Admin | `/admin/kursy/[id]/lekcje/[lessonId]` | ⬜ |
