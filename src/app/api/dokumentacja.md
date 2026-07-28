# Dokumentacja API — Rehability

Spis wszystkich endpointów REST aplikacji. Każdy plik `route.ts` w `src/app/api/**` odpowiada jednemu endpointowi. Trasa wynika ze struktury folderów (np. `src/app/api/admin/wydarzenia/[id]/route.ts` → `/api/admin/wydarzenia/[id]`).

## Spis treści

- [Konwencje autoryzacji](#konwencje-autoryzacji)
- [`/api/admin/*` — Panel administratora](#apiadmin--panel-administratora)
- [`/api/panel/*` — Panel uczestniczki](#apipanel--panel-uczestniczki)
- [`/api/wydarzenia/*` — Czat wydarzenia](#apiwydarzenia--czat-wydarzenia)
- [`/api/public/*` — Endpointy publiczne](#apipublic--endpointy-publiczne)
- [`/api/bookings/*` — Proces rezerwacji](#apibookings--proces-rezerwacji)
- [`/api/cron/*` — Zadania cykliczne](#apicron--zadania-cykliczne)
- [`/api/auth/*` — NextAuth](#apiauth--nextauth)
- [`/api/notifications/*` — Powiadomienia](#apinotifications--powiadomienia)
- [`/api/user/*` — Ustawienia konta](#apiuser--ustawienia-konta)
- [`/api/webhooks/*` — Callbacki zewnętrzne](#apiwebhooks--callbacki-zewnętrzne)

---

## Konwencje autoryzacji

| Typ | Mechanizm | Gdzie używane |
|---|---|---|
| **Admin** | `requireAdmin()` z `@/lib/auth/requireAdmin` | wszystkie `/api/admin/*` |
| **Sesja użytkownika** | `getServerSession(authOptions)` | `/api/panel/*`, `/api/notifications/*`, `/api/user/*`, `/api/bookings/*` |
| **Sesja + dostęp do wydarzenia** | `getServerSession(authOptions)` + rola `ADMIN` **lub** posiadanie `Booking` w danym wydarzeniu | `/api/wydarzenia/[tripId]/chat` |
| **Cron** | sekret `CRON_SECRET` (header `Authorization: Bearer …`) | `/api/cron/*` |
| **Webhook** | weryfikacja podpisu Stripe (`stripe.webhooks.constructEvent`) | `/api/webhooks/stripe` |
| **Publiczne** | brak | `/api/public/*` |

---

## `/api/admin/*` — Panel administratora

### `/api/admin/uslugi`
Globalny katalog "extra services" (osobny od `TripService` przypisanego do wydarzenia).

- **GET** — Lista wszystkich usług, sort `createdAt desc`. *Modele: `ExtraService`*
- **POST** — Tworzy usługę. **Body:** `name`, `duration`, `price`, `description`. *Modele: `ExtraService`*
- **PATCH** — Edytuje usługę. **Body:** `id`, `name`, `duration`, `price`, `description`. *Modele: `ExtraService`*

### `/api/admin/blog`
- **GET** — Pobiera wszystkie posty z metadanymi SEO i statusem. *Modele: `Post`*

### `/api/admin/blog/[id]`
- **GET** — Pojedynczy post do edycji. *Modele: `Post`*
- **PATCH** — Aktualizuje zawartość (`action: "content"`) lub SEO (`action: "seo"`). **Body:** `action`, `content`, `metaTitle`, `metaDescription`, `focusKeyword`, `ogImage`, `canonicalUrl`, `noIndex`. *Modele: `Post`*

### `/api/admin/blog/save`
- **POST** — Tworzy lub aktualizuje post (Zod validation). Opcjonalnie linkuje do harmonogramu. **Body:** `id`, `scheduleId`, `title`, `slug`, `excerpt`, `coverImage`, `category`, `tags`, `author`, `readTime`, `lastStage`. *Modele: `Post`, `BlogScheduleEntry`*

### `/api/admin/blog/status`
- **PATCH** — Zmienia status (DRAFT/PUBLISHED/SCHEDULED/ARCHIVED), aktualizuje wpis w harmonogramie. **Body:** `id`, `status`, `publishedAt`. *Modele: `Post`, `BlogScheduleEntry`*

### `/api/admin/blog/upload`
- **POST** — Upload zdjęcia bloga na Vercel Blob, zwraca URL. **Query:** `filename`.

### `/api/admin/blog/schedule`
- **GET** — Wpisy harmonogramu na wybrany miesiąc. **Query:** `year`, `month`. *Modele: `BlogScheduleEntry`*
- **POST** — Generuje harmonogram dla miesiąca (admin lub cron). **Body:** `year`, `month`. *Modele: `BlogScheduleEntry`*

### `/api/admin/blog/schedule/[id]`
- **GET** — Pojedynczy wpis harmonogramu. *Modele: `BlogScheduleEntry`*
- **PATCH** — Zmienia status (PLANNED/IN_PROGRESS/PUBLISHED/SKIPPED). **Body:** `status`. *Modele: `BlogScheduleEntry`*

### `/api/admin/blog/schedule/upcoming`
- **GET** — 7 najbliższych wpisów do widżetu. *Modele: `BlogScheduleEntry`*

### `/api/admin/activities`
- **GET** — Ostatnie 50 zdarzeń audit log. *Modele: `Activity`*

### `/api/admin/financials`
- **GET** — Dane do wykresu finansowego. **Query:** `range` (`month`/`six_months`/`year`). *Modele: `Booking`*

### `/api/admin/gemini`
- **POST** — Integracja z Gemini API (~15 akcji: blueprint, copywriting, SEO, artykuły). **Body:** `action`, `prompt`, `model`, `blockType`, `topic`, `overallContext`.

### `/api/admin/wydarzenia`
- **GET** — Wszystkie wydarzenia z metadanymi. *Modele: `Trip`*

### `/api/admin/wydarzenia/save`
- **POST** — Tworzy lub aktualizuje wydarzenie; auto-cofa do DRAFT jeśli niekompletny. **Body:** `id`, `lastStage`, `title`, `location`, `startDate`, `endDate`, `price`, `deposit`, `capacity`, `allowBringFriend`, `description`, `mapUrl`. *Modele: `Trip`*

### `/api/admin/wydarzenia/[id]`
- **GET** — Pełne drzewo: rezerwacje, profile zdrowia, zamówienia usług. *Modele: `Trip`, `Booking`, `HealthProfile`, `ServiceOrder`*
- **PATCH** — Aktualizacja treści (edytor bloków). Synchronizuje `TripService` z blokami typu `pricingList` (upsert po id, soft-delete tylko jeśli brak zamówień). Waliduje kompletność elementów `pricingList`. **Body:** `subtitle`, `tags`, `heroImage`, `blocks`. *Modele: `Trip`, `TripService`*

### `/api/admin/wydarzenia/[id]/seo`
- **PATCH** — Aktualizuje SEO wydarzenia. **Body:** `metaTitle`, `metaDescription`, `focusKeyword`, `ogImage`, `canonicalUrl`, `noIndex`. *Modele: `Trip`*

### `/api/admin/wydarzenia/[id]/upload`
- **POST** — Upload zdjęcia hero na Vercel Blob. **Query:** `filename`. *Modele: `Trip`*
- **DELETE** — Usuwa zdjęcie hero z chmury i DB. **Query:** `url`. *Modele: `Trip`*

### `/api/admin/wydarzenia/[id]/activity`
- **GET** — Aktywności konkretnego wydarzenia (paginacja). **Query:** `page`, `limit`, `type`. *Modele: `Activity`*

### `/api/admin/wydarzenia/[id]/services`
- **GET** — Lista usług SPA przypisanych do wydarzenia (sort `name asc`). *Modele: `TripService`*

### `/api/admin/wydarzenia/[id]/harmonogram`
- **GET** — Pełny dashboard harmonogramu: trip + usługi + wydarzenia (`TripEvent`) + bloki SPA (`SpaBlock`) z rezerwacjami i obłożeniem per usługa. *Modele: `Trip`, `TripService`, `TripEvent`, `SpaBlock`, `ServiceOrder`*
- **POST** — Tworzy punkt agendy (Zod). Waliduje, że `endTime > startTime`. **Body:** `title`, `description`, `startTime`, `endTime`, `type` (GENERAL/MEAL/ACTIVITY/WELLNESS_FREE/ANNOUNCEMENT), `icon`, `isPublished`, `sortOrder`. *Modele: `TripEvent`*

### `/api/admin/wydarzenia/[id]/harmonogram/[eventId]`
- **PATCH** — Edytuje punkt agendy (te same pola/walidacja co POST). *Modele: `TripEvent`*
- **DELETE** — Usuwa punkt agendy. *Modele: `TripEvent`*

### `/api/admin/wydarzenia/[id]/harmonogram/seed`
- **POST** — Wypełnia przykładowy harmonogram dnia (joga, posiłki, warsztaty + bloki SPA) na 2. dzień wydarzenia. Narzędzie dev/test. *Modele: `TripEvent`, `SpaBlock`*

### `/api/admin/wydarzenia/[id]/harmonogram/clear`
- **DELETE** — Czyści cały harmonogram (wszystkie `TripEvent` + `SpaBlock`; kaskadowo usuwa `ServiceOrder`). Narzędzie dev/test. *Modele: `TripEvent`, `SpaBlock`*

### `/api/admin/wydarzenia/[id]/harmonogram/publish`
- **PATCH** — Publikuje/ukrywa harmonogram (`Trip.isSchedulePublished`). Przy publikacji powiadamia uczestniczki (DEPOSIT_PAID/FULLY_PAID) z per-booking deep-linkiem; rozróżnia pierwszą publikację od aktualizacji. **Body:** `isPublished`. *Modele: `Trip`, `Booking`* — kanały `IN_APP`, `PUSH`, `EMAIL`.

### `/api/admin/wydarzenia/[id]/slots`
- **POST** — Tworzy blok SPA (`SpaBlock`). Wolny blok (`isOpen=true`) z sumarycznym `capacity` lub blok whitelistowy z `serviceCapacities` per usługa. Waliduje nakładanie czasowe (409), długość usług vs. długość bloku oraz przynależność usług do wydarzenia. **Body:** `startTime`, `endTime`, `capacity`, `isOpen`, `serviceCapacities` (`[{ serviceId, capacity }]`). *Modele: `SpaBlock`, `SpaBlockService`, `TripService`*

### `/api/admin/wydarzenia/[id]/slots/[blockId]`
- **DELETE** — Usuwa blok SPA. Blokuje usunięcie (409), jeśli ma aktywne rezerwacje. *Modele: `SpaBlock`, `ServiceOrder`*

### `/api/admin/wydarzenia/service-image`
- **POST** — Upload zdjęcia usługi na Vercel Blob (prefix `usluga-`, losowy sufiks). **Query:** `filename`.
- **DELETE** — Usuwa zdjęcie usługi z chmury. **Query:** `url`.

### `/api/admin/wydarzenia/feature`
- **POST** — Ustawia wyróżnione wydarzenie (tylko jeden naraz). **Body:** `id`. *Modele: `Trip`*

### `/api/admin/wydarzenia/status`
- **PATCH** — Zmiana statusu (DRAFT/PUBLISHED/ARCHIVED) z walidacją kompletności. **Body:** `id`, `status`. *Modele: `Trip`*

### `/api/admin/skaner`
- **POST** — Skan QR rezerwacji + check-in. **Body:** `qrToken`. *Modele: `Booking`, `HealthProfile`*

---

## `/api/panel/*` — Panel uczestniczki

### `/api/panel/orders`
- **POST** — Rezerwuje usługę w bloku SPA i tworzy Stripe `PaymentIntent` (status `PENDING`). W transakcji sprawdza ownership, dostępność (wolny blok: sub-slot + sweep obłożenia; whitelist: capacity per usługa) i dopasowanie usługi do wydarzenia. **Body:** `bookingId`, `spaBlockId`, `serviceId`, `startTime` (tylko wolny blok). *Modele: `ServiceOrder`, `SpaBlock`, `SpaBlockService`, `TripService`, `Booking`*
- **DELETE** — Anuluje zamówienie (soft-delete na `CANCELLED`; blokuje gdy `PAID`). **Query:** `orderId`. *Modele: `ServiceOrder`*

### `/api/panel/updates`
- **GET** — 5 ostatnich opublikowanych aktualizacji systemu. *Modele: `SystemUpdate`*

### `/api/panel/wydarzenia/active`
- **GET** — Aktywna rezerwacja użytkownika (DEPOSIT_PAID/FULLY_PAID/PENDING). *Modele: `Booking`, `Trip`*

### `/api/panel/wydarzenia/[bookingId]`
- **GET** — Szczegóły rezerwacji + profile zdrowia + podgląd agendy. *Modele: `Booking`, `Trip`, `TripEvent`, `HealthProfile`*

### `/api/panel/wydarzenia/[bookingId]/services`
- **GET** — Usługi wydarzenia z sumaryczną liczbą wolnych slotów w aktywnych blokach SPA (sprawdza ownership). *Modele: `TripService`, `SpaBlock`*

### `/api/panel/wydarzenia/[bookingId]/status`
- **GET** — Status płatności rezerwacji. *Modele: `Booking`*

### `/api/panel/wydarzenia/resume-payment`
- **POST** — Wznawia/inicjuje płatność (zadatek lub reszta), tworzy `PaymentIntent` w Stripe. **Body:** `bookingId`. *Modele: `Booking`, `Trip`*

### `/api/panel/harmonogram/[bookingId]`
- **GET** — Timeline: wydarzenia wydarzenia + zamówione usługi. *Modele: `TripEvent`, `ServiceOrder`*

### `/api/panel/wydarzenia/[bookingId]/sklep`
- **GET** — Katalog usług + bloki SPA z obłożeniem (wolne miejsca, miejsca per usługa, oznaczenie własnych rezerwacji) oraz lista wykupionych zabiegów. Sprawdza ownership. *Modele: `TripService`, `SpaBlock`, `SpaBlockService`, `ServiceOrder`*

### `/api/panel/health-profile`
- **GET** — Profil zdrowia użytkownika. *Modele: `HealthProfile`*
- **PUT** — Aktualizuje profil. Loguje zdarzenie (HEALTH_FILLED/HEALTH_UPDATED) **tylko gdy `isFinal=true`** (przycisk "Zapisz Kartę"). **Body:** `dietType`, `foodIntolerances`, `foodNotes`, `chronicConditions`, `medications`, `injuries`, `allergies`, `emergencyName`, `emergencyPhone`, `bookingId`, `isFinal`. *Modele: `HealthProfile`*

---

## `/api/wydarzenia/*` — Czat wydarzenia

Grupowy czat jednego wydarzenia, współdzielony przez panel uczestniczki (`/panel/wydarzenia/[bookingId]/chat`) i panel admina (`/admin/wydarzenia/[id]/chat`). Front odpytuje endpoint co 5 s (SWR polling). Dostęp: admin **lub** posiadanie rezerwacji w danym wydarzeniu.

### `/api/wydarzenia/[tripId]/chat`
- **GET** — Chronologiczna lista wiadomości z danymi nadawcy (imię, avatar, rola), flagą `isMine` i `currentUserId`. *Modele: `Message`, `Booking`, `User`*
- **POST** — Zapisuje wiadomość i „fire & forget” odpala powiadomienia (`dispatchNotification`, kanały `IN_APP` + `PUSH`): admin → uczestniczki (per-booking deep-link), uczestniczka → admini. Walidacja Zod (`text` 1–2000 znaków). **Body:** `text`. *Modele: `Message`, `Booking`, `User`*

---

## `/api/public/*` — Endpointy publiczne

### `/api/public/wydarzenia`
- **GET** — Opublikowane wydarzenia z paginacją. **Query:** `page`, `limit`. *Modele: `Trip`*

### `/api/public/newsletter`
- **POST** — Zapis do newslettera. **Body:** `email`. *Modele: `NewsletterSubscriber`*

---

## `/api/bookings/*` — Proces rezerwacji

### `/api/bookings/create-payment-intent`
- **POST** — Tworzy rezerwację + Stripe `PaymentIntent`. Obsługuje wariant duo z zaproszeniem przyjaciółki. **Body:** `tripId`, `variant`, `customer`, `consents`, `friend`. *Modele: `Booking`, `Trip`*

---

## `/api/cron/*` — Zadania cykliczne

Wymagają nagłówka `Authorization: Bearer ${CRON_SECRET}`.

### `/api/cron/blog/publish`
- **GET** / **POST** — Promuje posty SCHEDULED→PUBLISHED gdy `publishedAt` minął; synchronizuje harmonogram. *Modele: `Post`, `BlogScheduleEntry`*

### `/api/cron/blog/generate-schedule`
- **GET** / **POST** — Idempotentnie generuje harmonogram na miesiąc. **Body/Query:** `year`, `month`, `offset`. *Modele: `BlogScheduleEntry`*

### `/api/cron/blog-schedule`
- **GET** — Generuje harmonogram na następny miesiąc. *Modele: `BlogScheduleEntry`*

### `/api/cron/bookings/expire-invitations`
- **GET** / **POST** — Zmienia status PENDING_INVITATION → EXPIRED po 24h. *Modele: `Booking`*

---

## `/api/auth/*` — NextAuth

### `/api/auth/[...nextauth]`
- **GET** / **POST** — Handler NextAuth (logowanie, callback, sign-out). *Modele: `User`*

---

## `/api/notifications/*` — Powiadomienia

### `/api/notifications`
- **GET** — Lista powiadomień użytkownika z filtrem i paginacją. **Query:** `page`, `limit`, `filter` (`all`/`unread`). *Modele: `Notification`*

### `/api/notifications/[id]/read`
- **POST** — Oznacza pojedyncze jako przeczytane. *Modele: `Notification`*

### `/api/notifications/read-all`
- **POST** — Oznacza wszystkie jako przeczytane. *Modele: `Notification`*

---

## `/api/user/*` — Ustawienia konta

### `/api/user/notification-preferences`
- **GET** — Preferencje powiadomień. *Modele: `User`*
- **PUT** — Zmienia preferencje. **Body:** `isNotificationEnabled`, `oneSignalPlayerId`, `markPrompted`. *Modele: `User`*

---

## `/api/webhooks/*` — Callbacki zewnętrzne

### `/api/webhooks/stripe`
- **POST** — Obsługuje zdarzenia Stripe: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`. Aktualizuje status `Booking` i tworzy wpis w `Activity`. *Modele: `Booking`, `User`, `Activity`*

---

## Modele Prisma używane przez API

W kolejności częstości występowania:

- `Booking` — rezerwacje (status, płatności, QR, check-in, zaproszenia duo)
- `Trip` — wydarzenia (treść, bloki JSON, SEO, status publikacji)
- `Post` + `BlogScheduleEntry` — blog i jego harmonogram
- `User` — konta + preferencje powiadomień
- `HealthProfile` — karta zdrowia uczestniczki (1:1 z `User`)
- `TripService` + `SpaBlock` + `SpaBlockService` + `ServiceOrder` — usługi SPA, bloki czasowe (wolne/whitelistowe) i ich rezerwacja
- `ExtraService` — globalny katalog usług (kopiowany do bloków edytora)
- `TripEvent` — punkty agendy wydarzenia
- `Message` — wiadomości grupowego czatu wydarzenia (powiązane z `Trip` i `User`)
- `Activity` — audit log zdarzeń systemowych
- `Notification` — powiadomienia użytkownika
- `SystemUpdate` — feed nowości w panelu
- `NewsletterSubscriber` — zapisy do newslettera
