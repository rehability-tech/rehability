# Crony — Rehability

Spis wszystkich zadań cyklicznych (`/api/cron/**`) z zalecaną częstotliwością.

## Autoryzacja (wszystkie endpointy)

Każdy cron chroniony jest przez `requireCron` ([src/lib/auth/requireCron.ts](../../../lib/auth/requireCron.ts)).
Ustaw `CRON_SECRET` w env i przekazuj go w jeden z trzech sposobów:

```
Authorization: Bearer <CRON_SECRET>
x-cron-secret: <CRON_SECRET>
?secret=<CRON_SECRET>            # w query stringu
```

- Brak `CRON_SECRET` na **produkcji** → endpoint zwraca 503 (odmowa).
- Brak `CRON_SECRET` lokalnie (dev) → przepuszcza z ostrzeżeniem (do testów).
- Każdy cron obsługuje **GET i POST** (część schedulerów woli GET).

## Przegląd

| Endpoint | Co robi | Zalecana częstotliwość | Cron (UTC) |
| --- | --- | --- | --- |
| `/api/cron/bookings/cleanup` | Anuluje porzucone koszyki SPA (`ServiceOrder` w `PENDING` starsze niż 15 min) — zwalnia zablokowane terminy. | **co 5 min** | `*/5 * * * *` |
| `/api/cron/blog/publish` | Publikuje wpisy `SCHEDULED`, których `publishedAt` już minął. | **co 5 min** | `*/5 * * * *` |
| `/api/cron/bookings/expire-invitations` | Wygasza zaproszenia „zabierz przyjaciółkę" (`PENDING_INVITATION` po 24h) → `EXPIRED`, zwalnia miejsce. | **co 15–30 min** | `*/15 * * * *` |
| `/api/cron/notifications/cleanup` | Kasuje powiadomienia: przeczytane > 30 dni oraz dowolne > 90 dni. | **raz dziennie** | `30 3 * * *` |
| `/api/cron/blog/generate-schedule` | Generuje harmonogram wpisów bloga na **następny** miesiąc (trendy PL + fallback). Idempotentny. | **raz w miesiącu** | `0 3 1 * *` |

## Szczegóły / uzasadnienie

- **bookings/cleanup** — termin „wygasa" po 15 min od utworzenia; uruchamiając co 5 min zwalniasz miejsce maks. ~5 min po wygaśnięciu. Im rzadziej, tym dłużej slot pozostaje zablokowany dla innych.
- **blog/publish** — częstotliwość = dokładność publikacji. Co 5 min oznacza, że wpis ukaże się maks. ~5 min po zaplanowanej godzinie. Runtime nigdy nie cofa czasu (publikuje tylko, gdy `publishedAt <= now`).
- **bookings/expire-invitations** — TTL zaproszenia to 24h, więc precyzja nie jest krytyczna; co 15–30 min w zupełności wystarcza. Można nawet co godzinę.
- **notifications/cleanup** — czysto porządkowe, raz dziennie w nocy (np. 03:30 UTC = 04:30/05:30 PL). Progi: `READ_TTL_DAYS = 30`, `HARD_TTL_DAYS = 90`.
- **blog/generate-schedule** — kalendarz zawsze miesiąc do przodu; odpalany 1. dnia miesiąca. Idempotentny: jeśli plan istnieje, zwraca `created: 0`. Można też wołać ręcznie z `?year=&month=` (month 0-indexed) lub `?offset=N`.

## Jak to spiąć

Wybierz jedno:

### A) Vercel Cron (`vercel.json` w katalogu głównym)

> Uwaga: na planie **Hobby** Vercel uruchamia crony **maks. raz dziennie**. Dla częstszych (co 5/15 min) potrzebny plan **Pro** albo zewnętrzny scheduler (opcja B). Vercel Cron sam dodaje nagłówek autoryzacji, gdy `CRON_SECRET` jest ustawiony w env projektu.

```json
{
  "crons": [
    { "path": "/api/cron/bookings/cleanup", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/blog/publish", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/bookings/expire-invitations", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/notifications/cleanup", "schedule": "30 3 * * *" },
    { "path": "/api/cron/blog/generate-schedule", "schedule": "0 3 1 * *" }
  ]
}
```

### B) Zewnętrzny scheduler (cron-job.org / EasyCron / GitHub Actions)

Ustaw wywołanie URL-a z sekretem, np.:

```
GET https://rehabilityprudnik.pl/api/cron/bookings/cleanup?secret=<CRON_SECRET>
```

(lub nagłówek `x-cron-secret`). Częstotliwości jak w tabeli powyżej.
