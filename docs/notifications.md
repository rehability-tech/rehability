# System powiadomień — dokumentacja

System powiadomień w Rehability ma dwie warstwy:

1. **In-app** — rekordy z modelu `Notification` w bazie, wyświetlane w dzwoneczku w topbarze (admin) oraz docelowo w panelu uczestniczki.
2. **Push (OneSignal Web SDK)** — natywne powiadomienia przeglądarki/PWA, wysyłane przez OneSignal REST API.

Każde "ważne" powiadomienie idzie przez helper `sendNotification()`, który **zawsze** zapisuje rekord do DB, a **dodatkowo** wysyła push, jeśli użytkownik się na to zgodził i ma znany `oneSignalPlayerId`.

---

## 1. Zmiany w bazie (`prisma/schema.prisma`)

### Model `Notification`

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String
  message   String?  @db.Text
  // INFO | SUCCESS | WARNING | BOOKING | PAYMENT | HEALTH | SPA | SYSTEM
  type      String   @default("INFO")
  isRead    Boolean  @default(false)
  link      String?

  createdAt DateTime @default(now())

  @@index([userId, isRead, createdAt])
}
```

Index `[userId, isRead, createdAt]` pokrywa typowe zapytania:
- "ostatnie 30 powiadomień użytkownika" (sort po `createdAt desc`),
- "ile nieprzeczytanych ma X".

### Nowe pola w `User`

```prisma
isNotificationEnabled  Boolean   @default(false)
notificationPromptedAt DateTime?
oneSignalPlayerId      String?
notifications          Notification[]
```

| Pole | Cel |
|---|---|
| `isNotificationEnabled` | Czy push jest aktywny na **jakimkolwiek** urządzeniu użytkownika. Sterowane przez event `change` z OneSignal SDK. |
| `notificationPromptedAt` | Kiedy ostatnio pokazaliśmy soft-prompt. Używane do logiki "zapytaj ponownie za 14 dni". |
| `oneSignalPlayerId` | ID urządzenia w OneSignal — używane do targetowanego pusha przez REST API. |

Migracja zaaplikowana przez `npx prisma db push` (bez pliku migracji, sync schema → Neon Postgres).

---

## 2. Endpointy API

### `/api/notifications`

- **`GET`** — zwraca `{ notifications, unreadCount }`. Ostatnie 30 rekordów zalogowanego użytkownika, posortowane malejąco po `createdAt`.

### `/api/notifications/[id]/read`

- **`POST`** — oznacza pojedyncze powiadomienie jako przeczytane. Używa `updateMany` z warunkiem `userId` → bezpieczne nawet jeśli ktoś podstawi cudze `id`.

### `/api/notifications/read-all`

- **`POST`** — oznacza wszystkie nieprzeczytane powiadomienia użytkownika jako przeczytane. Zwraca `{ updated: count }`.

### `/api/user/notification-preferences`

- **`GET`** — zwraca `{ preferences: { isNotificationEnabled, notificationPromptedAt, oneSignalPlayerId } }`.
- **`PUT`** — przyjmuje (wszystkie opcjonalne):
  - `isNotificationEnabled: boolean`,
  - `oneSignalPlayerId: string | null`,
  - `markPrompted: boolean` — gdy `true`, ustawia `notificationPromptedAt = now()`. Używane przez soft-prompt po jego pokazaniu/zamknięciu.

Wszystkie endpointy chronione przez `getServerSession(authOptions)` — bez sesji zwracają `401`.

---

## 3. Helper serwerowy ([src/lib/notifications/send.ts](../src/lib/notifications/send.ts))

```ts
sendNotification({
  userId: "...",
  title: "Wpłata zaksięgowana",
  message: "Otrzymaliśmy 1200 zł — widzimy się na Campie 🌿",
  type: "PAYMENT",
  link: "/panel/abc123",
});
```

Co robi:
1. Tworzy rekord `Notification` w DB (in-app pojawia się natychmiast).
2. Dociąga `user.isNotificationEnabled` + `user.oneSignalPlayerId`.
3. Jeśli oba spełnione → wysyła push przez OneSignal REST (`POST https://onesignal.com/api/v1/notifications`).
4. Błędy push są **best-effort** — nie blokują zapisu do DB, tylko `console.error`.

Dodatkowo: `sendNotificationToAdmins({ ... })` — broadcast do wszystkich z rolą `ADMIN`. Używaj do alertów typu "nowa rejestracja", "nowa wpłata zadatku", "Karta Zdrowia do weryfikacji".

### Wymagane zmienne środowiskowe

```
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...
NEXT_PUBLIC_ONESIGNAL_APP_ID=...   # to samo, ale wystawione klientowi
```

Bez tych zmiennych helper loguje warning i pomija push — system in-app dalej działa.

---

## 4. Klient — OneSignal SDK

### [src/lib/notifications/onesignal.ts](../src/lib/notifications/onesignal.ts)

Definicje TypeScript dla skrótu SDK v16 + helper `withOneSignal(cb)` — kolejkuje callback przez `window.OneSignalDeferred`, dzięki czemu można wywoływać API zanim skrypt się załaduje (SDK sam odpali kolejkę po init).

### [src/components/notifications/OneSignalProvider.tsx](../src/components/notifications/OneSignalProvider.tsx)

Client component wpięty raz w layout. Co robi:

1. Ładuje skrypt SDK z CDN OneSignal przez `next/script` (`strategy="afterInteractive"`).
2. Po załadowaniu — `OneSignal.init({ appId })`.
3. Gdy `userId` jest dostępne — `OneSignal.login(userId)`. Łączy bieżące urządzenie z kontem użytkownika.
4. Czyta aktualny stan `PushSubscription` (id + optedIn) i synchronizuje go z backendem przez `PUT /api/user/notification-preferences`.
5. Słucha eventu `change` na `PushSubscription` — gdy user wyrazi zgodę / cofnie zgodę / przegląda na innym urządzeniu, aktualizuje DB.

Provider wpięty w:
- [src/app/admin/layout.tsx](../src/app/admin/layout.tsx) — `<OneSignalProvider userId={user.id} />`
- [src/app/panel/layout.tsx](../src/app/panel/layout.tsx) — `<OneSignalProvider userId={session.user.id} />`

`userId` przekazywany jako prop ze server component — projekt nie używa `next-auth/react` `SessionProvider`, więc to czystsze niż dodawać globalny provider.

### [src/components/notifications/NotificationPrompt.tsx](../src/components/notifications/NotificationPrompt.tsx)

Soft-prompt — modal z naszą własną stylistyką (zamiast natywnej szarej zachęty przeglądarki). Logika:

1. Po mount fetch `/api/user/notification-preferences`.
2. Jeśli `isNotificationEnabled === true` → nie pokazuj.
3. W przeciwnym razie:
   - jeśli `notificationPromptedAt === null` → pokaż od razu (parametr `FIRST_PROMPT_AFTER_DAYS = 0`),
   - jeśli minęło ≥ `REMIND_AFTER_DAYS` (14 dni) od ostatniego pytania → pokaż,
   - inaczej cisza.
4. Klik **"Włącz powiadomienia"** → `markPrompted` + `OneSignal.Notifications.requestPermission()` (natywny prompt przeglądarki). Synchronizacja stanu z DB odbywa się automatycznie przez event listener w `OneSignalProvider`.
5. Klik **"Może później"** / zamknięcie → tylko `markPrompted` (odracza pytanie o 14 dni).

Modal można też wymusić: `<NotificationPrompt force={true} />` — przydatne po kluczowych akcjach (wpłata zadatku, dokończenie Karty Zdrowia).

Parametry do ewentualnej zmiany na górze pliku:
```ts
const REMIND_AFTER_DAYS = 14;
const FIRST_PROMPT_AFTER_DAYS = 0;
```

### [src/components/notifications/NotificationToggle.tsx](../src/components/notifications/NotificationToggle.tsx)

Reusable przełącznik do widoków ustawień (admin + panel uczestniczki).

- Wł → wywołuje `requestPermission()` jeśli nie ma jeszcze subskrypcji, lub `optIn()` jeśli była.
- Wył → `OneSignal.User.PushSubscription.optOut()`.
- Po akcji robi delayed re-fetch preferencji (800ms — daje OneSignalProvider czas na sync z DB), więc UI pokaże prawdziwy stan z bazy, nie optimistic guess.

---

## 5. UI — `NotificationsDropdown`

[src/app/admin/\_components/topbar/NotificationsDropdown.tsx](../src/app/admin/_components/topbar/NotificationsDropdown.tsx) — był na mocku, teraz pod API:

- Polling co 60s (`POLL_INTERVAL_MS`).
- Mark-as-read: kliknięcie w pojedyncze powiadomienie → optimistic update + `POST /api/notifications/[id]/read`. Jeśli ma `link` — `router.push(link)`.
- "Oznacz wszystkie jako przeczytane" → optimistic update + `POST /api/notifications/read-all`.
- Czas wyświetlany przez `formatDistanceToNow` z `date-fns` (locale `pl`) — "5 minut temu", "2 godziny temu".

---

## 6. Topbar — refaktor

Stary `AdminTopbar.tsx` (~660 linii) został podzielony na:

```
src/app/admin/_components/
├── AdminTopbar.tsx          (~35 linii — kompozytor)
└── topbar/
    ├── types.ts             (AdminUser + getInitials)
    ├── SearchBar.tsx        (input + dropdown wyników, mock)
    ├── NotificationsDropdown.tsx  (dzwonek + lista, pod API)
    ├── ProfileMenu.tsx      (avatar + dropdown konta + sign-out)
    └── GlobalDrawer.tsx     (boczny drawer menu — obecnie nieotwierany z UI)
```

Każdy podkomponent zarządza swoim stanem i swoim `useEffect` do click-outside.

Usunięto z `AdminTopbar` martwy kod: `sectionLabel()`, zmienne `label`, `isHub`, `pathname`.

Z folderu `_components/` skasowane: `AdminMobileBottomNav.tsx`, `RecentGlobalActivity.tsx` — żaden nigdzie nie był importowany.

---

## 7. Jak dodać nowe powiadomienie (przepływ deweloperski)

### Przykład: po opłacie pełnej kwoty wyślij potwierdzenie

W handlerze Stripe webhook ([src/app/api/webhooks/stripe/route.ts](../src/app/api/webhooks/stripe/route.ts)) po update `booking.status = "FULLY_PAID"`:

```ts
import { sendNotification, sendNotificationToAdmins } from "@/lib/notifications/send";

await sendNotification({
  userId: booking.userId,
  title: "Pełna kwota zaksięgowana 🌿",
  message: `Otrzymaliśmy ${(booking.amountTotal / 100).toFixed(2)} zł. Do zobaczenia na Campie!`,
  type: "PAYMENT",
  link: `/panel/${booking.id}`,
});

await sendNotificationToAdmins({
  title: "Nowa wpłata pełnej kwoty",
  message: `${booking.email} opłacił/a Camp w pełni.`,
  type: "PAYMENT",
  link: `/admin/campy/${booking.campId}/uczestnicy`,
});
```

Z punktu widzenia użytkownika:
- Dzwonek w topbarze pokaże powiadomienie w ≤ 60s (polling).
- Jeśli włączył push w przeglądarce — push przyjdzie nawet gdy karta jest zamknięta.
- Klik w powiadomienie → `router.push(link)`.

---

## 8. Stany i przepływy

### Pierwsza wizyta zalogowanego usera

1. Server layout sprawdza sesję, renderuje `<OneSignalProvider userId={...} />`.
2. SDK się ładuje, `init()` + `login(userId)`.
3. `PushSubscription.id` jeszcze `null`, `optedIn` `false` → `PUT /api/user/notification-preferences` zapisuje `oneSignalPlayerId = null`, `isNotificationEnabled = false`.
4. `NotificationPrompt` fetchuje preferencje, widzi `notificationPromptedAt === null` → pokazuje modal.
5. User klika "Włącz" → natywny prompt → akceptacja.
6. SDK strzela eventem `change` z nowym `id` i `optedIn: true`.
7. Provider robi `PUT /api/user/notification-preferences` → DB ma `oneSignalPlayerId` + `isNotificationEnabled = true`.
8. Od teraz `sendNotification()` posyła zarówno in-app jak i push.

### Klik "Może później"

- `markPrompted: true` → `notificationPromptedAt = now()`.
- Następne pojawienie się promptu: po 14 dniach (`REMIND_AFTER_DAYS`).

### Wyłączenie z poziomu ustawień

1. Klik `NotificationToggle`.
2. `OneSignal.User.PushSubscription.optOut()`.
3. Event `change` → `optedIn: false` → DB zapisuje `isNotificationEnabled = false` (ale `oneSignalPlayerId` zostaje — gdy user znów włączy, jedziemy na to samo urządzenie bez kolejnego permission promptu).

### Logowanie na drugim urządzeniu

- `OneSignal.login(userId)` powiązuje nowe urządzenie z kontem.
- Event `change` z `optedIn: true` (jeśli przeglądarka pamięta zgodę) → DB nadpisuje `oneSignalPlayerId` aktualnym.
- ⚠️ **Ograniczenie**: trzymamy tylko jeden playerId per user. Push idzie tylko na ostatnio aktywne urządzenie. Jeśli będziesz chciał broadcast na wszystkie urządzenia użytkownika — trzeba wydzielić osobną tabelę `UserDevice { userId, playerId, lastSeen }` i wysyłać OneSignal request do listy `include_player_ids`.

---

## 9. Co jeszcze zostało / propozycje

1. **Wpięcie `NotificationToggle`** w faktyczne widoki ustawień (`/admin/ustawienia`, `/panel/[bookingId]/ustawienia`) — komponent gotowy, czeka na osadzenie.
2. **Triggery `sendNotification`** w realnych miejscach: webhook Stripe (zadatek/pełna kwota), rezerwacja slotu SPA (`/api/panel/...`), zapis Karty Zdrowia, check-in.
3. **NotificationCenter (pełna strona)** — dropdown pokazuje ostatnie 30, ale brak strony "wszystkie powiadomienia". Łatwo dorobić: `/panel/powiadomienia` + paginacja.
4. **Realtime zamiast polling** — obecnie dropdown odpytuje API co 60s. Jeśli kiedyś dojdzie SSE/WebSocket, polling można wyciąć.
5. **Wielourządzeniowość** — jak wyżej w ograniczeniach.
6. **PWA service worker dla OneSignal** — wersja v16 SDK używa własnego SW (`OneSignalSDKWorker.js`) hostowanego pod CDN, więc nie trzeba nic dokładać do `public/`. Gdy aplikacja będzie miała własny SW (np. workbox), trzeba będzie scopować je rozłącznie (`serviceWorkerParam.scope`).
