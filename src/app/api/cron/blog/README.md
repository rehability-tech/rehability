# Blog cron endpoints

These endpoints are designed to be hit by an external scheduler (Vercel
Cron, GitHub Actions, EasyCron, AWS EventBridge — whatever you prefer). They
are intentionally idempotent so it's safe to retry them.

## Auth

All endpoints require a shared secret. Set it in `.env`:

```
CRON_SECRET=replace-with-a-long-random-string
```

Send it on every call as either:

| Where             | Format                              |
| ----------------- | ----------------------------------- |
| `Authorization`   | `Bearer <CRON_SECRET>`              |
| `x-cron-secret`   | `<CRON_SECRET>`                     |
| query string      | `?secret=<CRON_SECRET>`             |

In **development** (`NODE_ENV !== "production"`) the endpoints will
log-and-allow if `CRON_SECRET` is missing, so you can `curl` them locally
without setup. In production the call is rejected with `503` if the secret
is unset.

## Endpoints

### `POST /api/cron/blog/publish`

Promotes every `Post` with `status = "SCHEDULED"` whose `publishedAt <= now`
to `status = "PUBLISHED"`. Also flips the linked `BlogScheduleEntry` to
`PUBLISHED`.

**Recommended schedule:** every 5–15 minutes.

```bash
curl -X POST https://rehability.pl/api/cron/blog/publish \
  -H "Authorization: Bearer $CRON_SECRET"
```

Response:

```json
{
  "ok": true,
  "checkedAt": "2026-05-21T09:05:12.000Z",
  "promoted": 2,
  "posts": [
    { "id": "...", "slug": "5-cwiczen-na-kregoslup", "title": "..." },
    { "id": "...", "slug": "kolacja-regeneracyjna",  "title": "..." }
  ]
}
```

Backdating is impossible — the endpoint only looks for posts whose target
time has *already passed*. Scheduling a post for the past is rejected at the
PATCH `/api/admin/blog/status` layer.

### `POST /api/cron/blog/generate-schedule`

Generates a content calendar (`BlogScheduleEntry` rows) for one month using
the existing `generateMonthlySchedule()` helper.

```bash
# Generate next month
curl -X POST https://rehability.pl/api/cron/blog/generate-schedule \
  -H "Authorization: Bearer $CRON_SECRET"

# Generate a specific month (month is 0-indexed: May = 4)
curl -X POST "https://rehability.pl/api/cron/blog/generate-schedule?year=2026&month=4" \
  -H "Authorization: Bearer $CRON_SECRET"

# Generate the month two-out from today
curl -X POST "https://rehability.pl/api/cron/blog/generate-schedule?offset=2" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Recommended schedule:** once per month, around the 25th, so the admin
panel already shows next month's plan before it begins.

The helper is **idempotent** — if a plan for the target month already
exists, it returns `{ created: 0 }` and changes nothing. Safe to re-run.

## End-to-end workflow

```
┌──────────────────────────────┐
│  cron: generate-schedule     │  monthly
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│  BlogScheduleEntry rows      │
│  status = PLANNED            │
└─────────────┬────────────────┘
              │ admin clicks "Wygeneruj przez AI"
              ▼
┌──────────────────────────────┐
│  /admin/blog/dodaj/*         │  3-step wizard
│  • dane-podstawowe           │  → save endpoint links Post.postId
│  • edytor-tresci             │    to the schedule entry, sets
│  • seo                       │    status = IN_PROGRESS
└─────────────┬────────────────┘
              │ admin clicks one of:
              ├──→ "Opublikuj teraz"   → PATCH status → PUBLISHED
              └──→ "Zaplanuj"          → PATCH status → SCHEDULED + future date
                                                     ▲
                                                     │ enforced > now()
                                                     │
┌──────────────────────────────┐                     │
│  cron: publish               │  every 5–15 min      │
│  finds SCHEDULED && due      │─────────────────────┘
│  flips → PUBLISHED           │
│  syncs schedule entry        │
└──────────────────────────────┘
```

## Status field cheat-sheet

`Post.status`:

| Value       | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| `DRAFT`     | Default. Author still working on the article.          |
| `SCHEDULED` | Locked, will go live when `publishedAt` passes.        |
| `PUBLISHED` | Visible at `/blog/<slug>`. `publishedAt` is in the past. |
| `ARCHIVED`  | Hidden again. Mirrors to `BlogScheduleEntry: SKIPPED`. |

`BlogScheduleEntry.status` (mirrors the post when linked):

| Value         | Meaning                                                 |
| ------------- | ------------------------------------------------------- |
| `PLANNED`     | Topic generated, no post written yet.                   |
| `IN_PROGRESS` | A `Post` is linked and being edited.                    |
| `SCHEDULED`   | Post is queued for future publish.                      |
| `PUBLISHED`   | Live on the site.                                       |
| `SKIPPED`     | Topic dropped (post archived or never written).         |
