# Crony — Rehability

Spis wszystkich zadań cyklicznych (`/api/cron/**`) z zalecaną częstotliwością.

## Autoryzacja (wszystkie endpointy)

Każdy cron chroniony jest przez `requireCron` ([src/lib/auth/requireCron.ts](../../../lib/auth/requireCron.ts)).
Ustaw `CRON_SECRET` w env i przekazuj go w nagłówku (sekret w query stringu
NIE jest obsługiwany — trafiałby do logów serwera/proxy):

```
Authorization: Bearer <CRON_SECRET>
x-cron-secret: <CRON_SECRET>
```

- Brak `CRON_SECRET` na **produkcji** → endpoint zwraca 503 (odmowa).
- Brak `CRON_SECRET` lokalnie (dev) → przepuszcza z ostrzeżeniem (do testów).
- Każdy cron obsługuje **GET i POST** (część schedulerów woli GET).

## Odporność na awarie (retry + alert)

Wszystkie endpointy przechodzą przez wspólny wrapper `runCron` ([src/lib/cron/runCron.ts](../../../lib/cron/runCron.ts)):

1. **Retry połączenia** — operacje DB owinięte w `withDbRetry` ([src/lib/prisma.ts](../../../lib/prisma.ts)). Ponawia **tylko** błędy połączenia (P1001/P1002/P1008/P1017 itp.), np. gdy Neon budzi się ze scale-to-zero. Błędy danych nie są ponawiane. Domyślnie 2 ponowienia z backoffem 500/1000 ms.
2. **Alert do admina** — przy awarii e-mail przez Resend ([src/lib/cron/alertAdmin.ts](../../../lib/cron/alertAdmin.ts)). Kanał celowo **niezależny od bazy** (in-app/push padłyby razem z DB). Throttle 30 min na ten sam cron, żeby nie zalać skrzynki.
3. Endpoint i tak zwraca **500**, więc scheduler ponowi przy kolejnym uruchomieniu (a wbudowany alert cron-job.org też może zadziałać).

Wymagane env dla alertów: `RESEND_API_KEY`, `EMAIL_FROM` (zweryfikowana domena), `ADMIN_ALERT_EMAIL` (odbiorca alertów). Brak któregokolwiek → alert tylko do logów serwera.

## Strojenie połączenia (Neon)

Pooled endpoint Neona wymaga dopisania parametrów do `DATABASE_URL`, inaczej cold start potrafi rzucić „Can't reach database server":

```
...neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15&pool_timeout=15
```

## Przegląd

| Endpoint | Co robi | Zalecana częstotliwość | Cron (UTC) |
| --- | --- | --- | --- |
| `/api/cron/bookings/cleanup` | Anuluje porzucone koszyki SPA (`ServiceOrder` w `PENDING` starsze niż 15 min) — zwalnia zablokowane terminy. | **co 5 min** | `*/5 * * * *` |
| `/api/cron/blog/publish` | Publikuje wpisy `SCHEDULED`, których `publishedAt` już minął. | **co 5 min** | `*/5 * * * *` |
| `/api/cron/blog/reminders` | Przypomina adminom (IN_APP + PUSH) o wpisach `PLANNED` zaplanowanych na dziś lub zaległych — „czas napisać publikację". | **raz dziennie** | `0 7 * * *` |
| `/api/cron/bookings/expire-invitations` | Wygasza zaproszenia „zabierz przyjaciółkę" (`PENDING_INVITATION` po 24h) → `EXPIRED`, zwalnia miejsce. | **co 15–30 min** | `*/15 * * * *` |
| `/api/cron/notifications/cleanup` | Kasuje powiadomienia: przeczytane > 30 dni oraz dowolne > 90 dni. | **raz dziennie** | `30 3 * * *` |
| `/api/cron/blog/generate-schedule` | Generuje harmonogram wpisów bloga na **następny** miesiąc (trendy PL + fallback). Idempotentny. | **raz w miesiącu** | `0 3 1 * *` |
| `/api/cron/blob/cleanup` | Kasuje z Vercel Blob pliki nieużywane nigdzie w bazie (starsze niż 24h). | **raz w tygodniu** | `0 4 * * 0` |

## Szczegóły / uzasadnienie

- **bookings/cleanup** — termin „wygasa" po 15 min od utworzenia; uruchamiając co 5 min zwalniasz miejsce maks. ~5 min po wygaśnięciu. Im rzadziej, tym dłużej slot pozostaje zablokowany dla innych.
- **blog/publish** — częstotliwość = dokładność publikacji. Co 5 min oznacza, że wpis ukaże się maks. ~5 min po zaplanowanej godzinie. Runtime nigdy nie cofa czasu (publikuje tylko, gdy `publishedAt <= now`).
- **blog/reminders** — przypomina o `BlogScheduleEntry` w statusie `PLANNED`, których `scheduledDate <= koniec dnia dzisiaj` (czyli na dziś i zaległe). Wysyła JEDNO zbiorcze powiadomienie do adminów (IN_APP + PUSH) z linkiem do `/admin/blog/harmonogram`. **Trzymaj się dziennej kadencji** — brak flagi „wysłano", więc częstsze odpalanie powtarza te same przypomnienia. Każdy zaległy/dzisiejszy wpis przypomina się raz na dobę, aż dostanie treść (zmieni status z `PLANNED`). Pora `0 7 * * *` (UTC) = 9:00 PL.
- **bookings/expire-invitations** — TTL zaproszenia to 24h, więc precyzja nie jest krytyczna; co 15–30 min w zupełności wystarcza. Można nawet co godzinę.
- **notifications/cleanup** — czysto porządkowe, raz dziennie w nocy (np. 03:30 UTC = 04:30/05:30 PL). Progi: `READ_TTL_DAYS = 30`, `HARD_TTL_DAYS = 90`.
- **blog/generate-schedule** — kalendarz zawsze miesiąc do przodu; odpalany 1. dnia miesiąca. Idempotentny: jeśli plan istnieje, zwraca `created: 0`. Można też wołać ręcznie z `?year=&month=` (month 0-indexed) lub `?offset=N`.
- **blob/cleanup** — garbage collection storage. Zbiera referencje ze WSZYSTKICH pól z URL-ami (też JSON: `content` bloga, `blocks`/`invitationEmail*` wyjazdu, `sections` maili) i kasuje bloby, których nigdzie nie ma. **Guard wieku** (`minAgeHours`, domyślnie 24h) chroni przed wyścigiem „wgrano plik → rekord jeszcze niezapisany". `?dryRun=1` = tylko raport (użyj przy pierwszym uruchomieniu!). `?minAgeHours=N` zmienia próg. Rzadko, bo to operacja nieodwracalna.

## Jak to spiąć

Wybierz jedno:

### A) Vercel Cron (`vercel.json` w katalogu głównym)

> Uwaga: na planie **Hobby** Vercel uruchamia crony **maks. raz dziennie**. Dla częstszych (co 5/15 min) potrzebny plan **Pro** albo zewnętrzny scheduler (opcja B). Vercel Cron sam dodaje nagłówek autoryzacji, gdy `CRON_SECRET` jest ustawiony w env projektu.

```json
{
  "crons": [
    { "path": "/api/cron/bookings/cleanup", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/blog/publish", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/blog/reminders", "schedule": "0 7 * * *" },
    { "path": "/api/cron/bookings/expire-invitations", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/notifications/cleanup", "schedule": "30 3 * * *" },
    { "path": "/api/cron/blog/generate-schedule", "schedule": "0 3 1 * *" }
  ]
}
```

### B) Zewnętrzny scheduler (cron-job.org / EasyCron / GitHub Actions)

Ustaw wywołanie URL-a z sekretem przekazanym w nagłówku, np.:

```
GET https://rehabilityprudnik.pl/api/cron/bookings/cleanup
Authorization: Bearer <CRON_SECRET>
```

(lub nagłówek `x-cron-secret: <CRON_SECRET>`). Częstotliwości jak w tabeli powyżej.
