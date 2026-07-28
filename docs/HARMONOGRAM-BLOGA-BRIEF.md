# Brief: Harmonogram bloga (kalendarz treści + auto-planowanie + auto-publikacja)

System **planowania, śledzenia i publikacji** wpisów blogowych oparty o kalendarz
miesięczny. Trzy warstwy:

1. **Generator planu** — cron raz w miesiącu tworzy `BlogScheduleEntry` (tematy +
   frazy kluczowe) na podstawie **realnych trendów wyszukiwań PL** (z fallbackiem
   na frazy evergreen).
2. **Widok admina** (`/admin/blog/harmonogram`) — kalendarz z kolorowanymi
   statusami; klik w dzień otwiera temat i prowadzi do kreatora wpisu.
3. **Automaty czasu** — cron publikuje zaplanowane wpisy, gdy nadejdzie ich
   godzina, i przypomina adminowi o zaległych tematach.

Cała pętla jest **idempotentna** i **samosynchronizująca** — status wpisu w
kalendarzu (`BlogScheduleEntry`) zawsze lustrzy status faktycznego artykułu (`Post`).

---

## 1. Mapa plików

### Model danych
| Plik | Rola |
| --- | --- |
| [prisma/schema.prisma](../prisma/schema.prisma) (`BlogScheduleEntry`, l. 244) | Wpis kalendarza: temat, kategoria, frazy, data, status, opcjonalny `postId`. |

### Generatory planu (`src/lib/blog`)
| Plik | Rola |
| --- | --- |
| [src/lib/blog/generateTrendSchedule.ts](../src/lib/blog/generateTrendSchedule.ts) | **AKTUALNY** generator (używany przez cron). Trendy PL per „filar" + fallback evergreen + dedupe. |
| [src/lib/blog/generateMonthlySchedule.ts](../src/lib/blog/generateMonthlySchedule.ts) | **Starszy** generator (Gemini, tematy z historii). Wciąż podpięty pod ręczny POST z panelu. |
| [src/lib/blog/generateWeeklySchedule.ts](../src/lib/blog/generateWeeklySchedule.ts) | Wariant tygodniowy (3 wpisy / tydzień, Gemini). Obecnie bez routingu — relikt/rezerwa. |
| [src/lib/blog/seoConfig.ts](../src/lib/blog/seoConfig.ts) | Definicje `PILLARS` (filary treści), `EVERGREEN_TOPICS`, mapy kategorii. |
| `src/lib/blog/trends/*` | Providery trendów (SerpApi/Autocomplete), plan zapytań, odsiew szumu, przycinanie fraz. |

### API — cron (`src/app/api/cron/blog`)
| Endpoint | Rola |
| --- | --- |
| [publish/route.ts](../src/app/api/cron/blog/publish/route.ts) | `SCHEDULED` + `publishedAt<=now` → `PUBLISHED` (+ powiadomienie + IndexNow). |
| [generate-schedule/route.ts](../src/app/api/cron/blog/generate-schedule/route.ts) | Generuje plan miesiąca (`generateTrendSchedule`). |
| [reminders/route.ts](../src/app/api/cron/blog/reminders/route.ts) | Przypomnienie o `PLANNED` na dziś/zaległych. |
| [README.md](../src/app/api/cron/blog/README.md) | Dokumentacja endpointów cron bloga. |

### API — panel admina (`src/app/api/admin/blog`)
| Endpoint | Rola |
| --- | --- |
| [schedule/route.ts](../src/app/api/admin/blog/schedule/route.ts) | `GET` — wpisy miesiąca (dla kalendarza). `POST` — ręczne generowanie planu. |
| [schedule/[id]/route.ts](../src/app/api/admin/blog/schedule/[id]/route.ts) | `GET`/`PATCH` pojedynczego wpisu (zmiana statusu). |
| [schedule/upcoming/route.ts](../src/app/api/admin/blog/schedule/upcoming/route.ts) | 7 najbliższych wpisów (widget na dashboardzie). |
| [save/route.ts](../src/app/api/admin/blog/save/route.ts) | Zapis danych wpisu; **linkuje `scheduleId → postId`** i ustawia `IN_PROGRESS`. |
| [status/route.ts](../src/app/api/admin/blog/status/route.ts) | Zmiana statusu `Post` (publikuj/zaplanuj/archiwizuj); **lustrzy status na `BlogScheduleEntry`**. |

### Frontend — widok kalendarza (`src/app/admin/blog/harmonogram`)
| Plik | Rola |
| --- | --- |
| [page.tsx](../src/app/admin/blog/harmonogram/page.tsx) | Kontener: stan miesiąca, fetch wpisów, nawigacja, highlight z `?highlight=`. |
| [_components/HarmonogramHero.tsx](../src/app/admin/blog/harmonogram/_components/HarmonogramHero.tsx) | Hero: nazwa miesiąca, nawigacja ‹ ›, „Dziś", pasek postępu publikacji. |
| [_components/CalendarGrid.tsx](../src/app/admin/blog/harmonogram/_components/CalendarGrid.tsx) | Desktop = siatka 7-kol.; Mobile = agenda (tylko dni z wpisami). |
| [_components/CalendarDayCell.tsx](../src/app/admin/blog/harmonogram/_components/CalendarDayCell.tsx) | Pojedyncza komórka dnia + karta wpisu (kolor statusu). |
| [_components/EntryDetailModal.tsx](../src/app/admin/blog/harmonogram/_components/EntryDetailModal.tsx) | Modal tematu: opis, frazy, status, akcje (napisz / AI / kontynuuj). |
| [_components/StatusLegend.tsx](../src/app/admin/blog/harmonogram/_components/StatusLegend.tsx) | Legenda kolorów statusów. |
| [_components/types.ts](../src/app/admin/blog/harmonogram/_components/types.ts) | Typy `ScheduleEntry`/`Status`, mapy kolorów, helpery dat PL. |

---

## 2. Model danych

```prisma
model BlogScheduleEntry {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())

  scheduledDate DateTime?          // dzień publikacji (planowany)
  title         String             // roboczy tytuł artykułu
  topic         String   @db.Text  // 2-3 zdania briefu o czym jest wpis
  category      String             // kategoria/filar (Fizjoterapia, Mindfulness…)
  keywords      String[]           // frazy kluczowe SEO
  status        String   @default("PLANNED") // PLANNED | IN_PROGRESS | PUBLISHED | SKIPPED (+ SCHEDULED z lustrzenia)

  postId        String?            // null = temat bez artykułu; ustawiany po starcie pisania
}
```

> **Uwaga:** `BlogScheduleEntry` NIE ma relacji FK do `Post` — trzyma luźny
> `postId: String?`. Powiązanie robimy ręcznie w `save`/`status`. Dzięki temu
> temat może istnieć bez artykułu (`PLANNED`), a artykuł może istnieć bez wpisu
> w kalendarzu (napisany „z ręki", poza harmonogramem).

---

## 3. Cykl życia wpisu (end-to-end)

```
┌────────────────────────────────────────┐
│  CRON generate-schedule (raz/miesiąc)  │  0 3 1 * *
│  generateTrendSchedule(year, month)    │
└───────────────────┬────────────────────┘
                    ▼
┌────────────────────────────────────────┐
│  BlogScheduleEntry × ~12                │
│  status = PLANNED, postId = null       │   ← widoczne w kalendarzu
└───────────────────┬────────────────────┘
                    │  admin klika dzień → EntryDetailModal
                    │  „Napisz sam" / „Wygeneruj przez AI"
                    ▼
┌────────────────────────────────────────┐
│  /admin/blog/dodaj/dane-podstawowe     │  ?scheduleId=<id>[&autogenerate=true]
│  → POST /api/admin/blog/save           │
│     linkuje postId + status IN_PROGRESS│   ← kalendarz od razu pokazuje „Edytowany"
└───────────────────┬────────────────────┘
                    │  kreator 3-krokowy: dane → edytor-tresci → seo
                    ▼
┌────────────────────────────────────────┐
│  /admin/blog/dodaj/seo → PATCH status  │
│  ├─ „Opublikuj teraz"  → PUBLISHED     │  publishedAt = now
│  └─ „Zaplanuj"         → SCHEDULED     │  publishedAt > now (walidacja!)
│     (lustrzenie na BlogScheduleEntry)  │
└───────────────────┬────────────────────┘
                    │  jeśli SCHEDULED:
                    ▼
┌────────────────────────────────────────┐
│  CRON publish (co 5 min)               │  */5 * * * *
│  Post SCHEDULED && publishedAt<=now    │
│  → PUBLISHED  +  entry → PUBLISHED     │  + powiadomienie adminów + IndexNow
└────────────────────────────────────────┘

  Równolegle:
┌────────────────────────────────────────┐
│  CRON reminders (raz dziennie 9:00 PL) │  0 7 * * *
│  entry PLANNED && scheduledDate<=dziś  │  → „✍️ czas napisać" (IN_APP + PUSH)
└────────────────────────────────────────┘
```

### Punkty synchronizacji statusu (żeby kalendarz zawsze był prawdą)
- **`save`** (start pisania): `BlogScheduleEntry.postId = post.id`, `status = IN_PROGRESS`.
- **`status`** (publikacja/plan): lustrzy `Post.status → BlogScheduleEntry.status`
  przez `syncScheduleEntryStatus()`:
  - `PUBLISHED → PUBLISHED`
  - `SCHEDULED → SCHEDULED`
  - `ARCHIVED → SKIPPED`
  - `DRAFT (i inne) → IN_PROGRESS`
- **`cron/publish`**: przy promocji `Post → PUBLISHED` robi `updateMany` na
  `BlogScheduleEntry` po `postId` → `PUBLISHED`.

---

## 4. Maszyna stanów — cheat-sheet

`Post.status`:
| Wartość | Znaczenie |
| --- | --- |
| `DRAFT` | Domyślny. Autor wciąż pracuje. |
| `SCHEDULED` | Zablokowany, pójdzie na żywo gdy minie `publishedAt`. |
| `PUBLISHED` | Widoczny na `/blog/<slug>`. `publishedAt` w przeszłości. |
| `ARCHIVED` | Ukryty. Lustrzy się na `BlogScheduleEntry: SKIPPED`. |

`BlogScheduleEntry.status` (lustrzy Post, gdy podlinkowany):
| Wartość | Kropka | Znaczenie |
| --- | --- | --- |
| `PLANNED` | morska | Temat wygenerowany, brak artykułu. |
| `IN_PROGRESS` | niebieska | `Post` podlinkowany i edytowany. |
| `SCHEDULED` | bursztynowa | Artykuł w kolejce na przyszłą publikację. |
| `PUBLISHED` | zielona | Na żywo. |
| `SKIPPED` | szara | Temat porzucony (post zarchiwizowany / nienapisany). |

Mapy kolorów w [types.ts](../src/app/admin/blog/harmonogram/_components/types.ts):
`STATUS_LABELS`, `STATUS_DOT` (kropka), `STATUS_CARD` (obramowanie + tło karty).

---

## 5. Generator planu — `generateTrendSchedule` (aktualny)

Sercem planowania jest [generateTrendSchedule.ts](../src/lib/blog/generateTrendSchedule.ts).
Krok po kroku:

1. **Idempotencja** — jeśli w danym miesiącu istnieje ≥1 wpis, zwraca
   `{ created: 0 }` i nic nie zmienia. Bezpieczne do wielokrotnego odpalenia.
2. **Daty publikacji** — `getMWFDays()` zbiera wszystkie **poniedziałki / środy /
   piątki** miesiąca, max **12** (`MAX_POSTS_PER_MONTH`).
3. **Trendy per filar** — `collectTopics()` dla każdego filaru (`PILLARS`)
   równolegle pobiera „rosnące" powiązane zapytania:
   - `discovery: "TRENDS"` → provider SerpApi Google Trends (frazy krajowe),
   - `discovery: "AUTOCOMPLETE"` → provider Autocomplete (frazy lokalne, seed × geo).
   - Timeout 20 s/zapytanie (`TREND_TIMEOUT_MS`) — cron w tle, czas niekrytyczny.
   - Fallback: gdy provider pusty/pada → `evergreenForPillar()` z `EVERGREEN_TOPICS`.
   - `source`: `live` (same trendy), `fallback` (same evergreen), `mixed` (oba).
4. **Odsiew i przycinanie** — `filterNoise()` (usuwa brandowe/nawigacyjne/
   off-target), `trimQuery()` (obcina lata, dopiski po mieście), scalanie
   duplikatów po przyciętej frazie; jednosłowowe frazy odrzucane (za ogólne).
5. **Kandydaci** — `buildCandidates()` rozkłada tematy **round-robin po filarach**
   (i%liczba filarów), by miesiąc miał zbalansowane kategorie. `toWorkingTitle()`
   robi z frazy roboczy tytuł (ogonki + kapitalizacja + rotowana końcówka).
6. **Dedupe historyczny** — `dedupe()` odrzuca tematy, których BAZOWY klucz
   (`titleBaseKey`, bez sufiksu/ogonków) pojawił się w ostatnich **6 miesiącach**.
7. **Zapis transakcyjny** — `createMany({ skipDuplicates: true })`.

Zwraca `{ year, month, created, source }`.

> **Uwaga o dwóch generatorach:** cron używa `generateTrendSchedule`
> (trendy + filary), ale **ręczny** `POST /api/admin/blog/schedule` z panelu
> wciąż woła starszy `generateMonthlySchedule` (Gemini, tematy z historii bloga,
> model `gemini-3.1-flash-lite`). Jeśli chcesz spójności — przepnij ręczny POST
> na `generateTrendSchedule`. `generateWeeklySchedule` nie jest nigdzie podpięty.

---

## 6. Endpointy cron — kontrakt

Wszystkie idą przez wspólny wrapper `runCron` ([runCron.ts](../src/lib/cron/runCron.ts)):
autoryzacja `requireCron` (sekret `CRON_SECRET` w nagłówku), retry błędów
połączenia (`withDbRetry` — budzenie Neona), alert mailem do admina przy awarii,
zwrot `{ ok: true, ...data }` lub `500`. Każdy obsługuje **GET i POST**.

### `POST /api/cron/blog/publish` — co 5 min (`*/5 * * * *`)
- Znajduje `Post` w `SCHEDULED` z `publishedAt <= now`.
- W transakcji: `Post → PUBLISHED` + `BlogScheduleEntry(postId) → PUBLISHED`.
- Powiadomienie do adminów (IN_APP + PUSH) + `notifyIndexNow()` (Bing/Yandex).
- Nigdy nie cofa czasu — publikuje tylko wpisy, których godzina już minęła.

### `POST /api/cron/blog/generate-schedule` — raz w miesiącu (`0 3 1 * *`)
- Parametry (body lub query): `year` + `month` (0-indexed), albo `offset` (bieżący + N miesięcy). Domyślnie bieżący miesiąc.
- Woła `generateTrendSchedule`. Powiadomienie tylko gdy `created > 0` (bez alert fatigue).

### `POST /api/cron/blog/reminders` — raz dziennie 9:00 PL (`0 7 * * *`)
- Znajduje `BlogScheduleEntry` w `PLANNED` z `scheduledDate <= koniec dziś` (na dziś + zaległe).
- Jedno zbiorcze powiadomienie „czas napisać" z linkiem do harmonogramu.
- **Trzymaj dzienną kadencję** — brak flagi „wysłano", częstsze odpalanie = powtórki.

Pełna tabela cronów całej apki: [crons.md](../src/app/api/cron/crons.md).

---

## 7. Frontend — jak działa widok

**Kontener** [page.tsx](../src/app/admin/blog/harmonogram/page.tsx):
- Stan `currentYear`/`currentMonth` (start z `?date=YYYY-MM-DD` albo dziś).
- `fetchEntries()` → `GET /api/admin/blog/schedule?year&month` przy każdej zmianie miesiąca.
- Nawigacja `prevMonth`/`nextMonth`/`goToToday` (obsługa przełomu roku).
- `?highlight=<entryId>` → „neonowe" podświetlenie wpisu na 6 s (powrót z panelu do konkretnego tematu).
- Owinięty w `<Suspense>` (bo używa `useSearchParams`).

**Kalendarz** [CalendarGrid.tsx](../src/app/admin/blog/harmonogram/_components/CalendarGrid.tsx):
- Mapuje wpisy po dniu (`entriesByDay`), max 1 wpis na dzień (dni MWF).
- **Desktop**: siatka 7 kolumn; offset pierwszego dnia liczony `(getDay()+6)%7` (tydzień od poniedziałku); weekendy i „dziś" wyróżnione.
- **Mobile**: pionowa agenda — tylko dni z wpisami, posortowane rosnąco.
- Auto-scroll do podświetlonego wpisu (`data-entry-id` + `scrollIntoView`).

**Karta dnia** [CalendarDayCell.tsx](../src/app/admin/blog/harmonogram/_components/CalendarDayCell.tsx):
- Kropka + kategoria + tytuł (line-clamp), kolor z `STATUS_CARD[status]`.
- Znacznik „• Edytowany", gdy `postId` istnieje a status ≠ `PUBLISHED`.
- Klik → `onSelect(entry)` otwiera modal.

**Modal tematu** [EntryDetailModal.tsx](../src/app/admin/blog/harmonogram/_components/EntryDetailModal.tsx):
- Pokazuje kategorię, datę PL, tytuł, brief (`topic`), frazy, status.
- Akcje zależne od `postId`:
  - **brak `postId`** → „Napisz sam" (`/dodaj/dane-podstawowe?scheduleId=<id>`) lub „Wygeneruj przez AI" (`…&autogenerate=true`).
  - **jest `postId`** → „Kontynuuj edycję" (`/dodaj/edytor-tresci?id=<postId>`) lub „Przejdź do SEO" (`/dodaj/seo?id=<postId>`).

**Hero** [HarmonogramHero.tsx](../src/app/admin/blog/harmonogram/_components/HarmonogramHero.tsx):
- Nawigacja miesiąca + pasek postępu = `opublikowane / total` w danym miesiącu.

---

## 8. Kod — kluczowe fragmenty

### 8.1 Generator: dni publikacji + round-robin filarów (`generateTrendSchedule.ts`)

```ts
const MAX_POSTS_PER_MONTH = 12;

// Wszystkie poniedziałki / środy / piątki miesiąca.
function getMWFDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow === 1 || dow === 3 || dow === 5) days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Round-robin po filarach → zbalansowane kategorie w miesiącu.
function buildCandidates(publishDays, topicsByPillar) {
  const cursors = new Map(PILLARS.map((p) => [p.id, 0]));
  const candidates = [];
  for (let i = 0; i < publishDays.length; i++) {
    const pillar = PILLARS[i % PILLARS.length];
    const topics = topicsByPillar.get(pillar.id) ?? [];
    if (topics.length === 0) continue;
    const cursor = cursors.get(pillar.id) ?? 0;
    const topic = topics[cursor % topics.length];
    cursors.set(pillar.id, cursor + 1);
    candidates.push(toCandidate(publishDays[i], topic, i)); // `i` rotuje sufiks tytułu
  }
  return candidates;
}
```

### 8.2 Cron publikujący (`cron/blog/publish/route.ts`)

```ts
export async function POST(req: Request) {
  return runCron(req, "blog/publish", async () => {
    const now = new Date();
    const dueScheduled = await prisma.post.findMany({
      where: { status: "SCHEDULED", publishedAt: { lte: now } },
      select: { id: true, slug: true, title: true },
    });
    if (dueScheduled.length === 0) return { checkedAt: now.toISOString(), promoted: 0, posts: [] };

    const promoted = [];
    await prisma.$transaction(async (tx) => {
      for (const post of dueScheduled) {
        await tx.post.update({ where: { id: post.id }, data: { status: "PUBLISHED" } });
        await tx.blogScheduleEntry.updateMany({ where: { postId: post.id }, data: { status: "PUBLISHED" } });
        promoted.push(post);
      }
    });

    await sendNotificationToAdmins({ /* … „📝 Opublikowano wpis" … */ });
    await notifyIndexNow(promoted.map((p) => absoluteUrl(`/blog/${p.slug}`)));
    return { checkedAt: now.toISOString(), promoted: promoted.length, posts: promoted };
  });
}
export async function GET(req: Request) { return POST(req); }
```

### 8.3 Lustrzenie statusu Post → Entry (`admin/blog/status/route.ts`)

```ts
// Walidacja: SCHEDULED wymaga publishedAt w PRZYSZŁOŚCI.
if (status === "SCHEDULED") {
  const target = new Date(publishedAt);
  if (target.getTime() <= now.getTime())
    return NextResponse.json({ error: "Data publikacji musi być w przyszłości…" }, { status: 400 });
  data = { status: "SCHEDULED", publishedAt: target };
} else if (status === "PUBLISHED") {
  data = { status: "PUBLISHED", publishedAt: now };
}

const post = await prisma.post.update({ where: { id }, data });
await syncScheduleEntryStatus(id, status); // lustrzenie na kalendarzu

async function syncScheduleEntryStatus(postId, postStatus) {
  const entryStatus =
    postStatus === "PUBLISHED" ? "PUBLISHED"
    : postStatus === "SCHEDULED" ? "SCHEDULED"
    : postStatus === "ARCHIVED" ? "SKIPPED"
    : "IN_PROGRESS";
  await prisma.blogScheduleEntry.updateMany({ where: { postId }, data: { status: entryStatus } });
}
```

### 8.4 Linkowanie kalendarza z artykułem (`admin/blog/save/route.ts`)

```ts
const { id, scheduleId, ...dataToValidate } = body;
// …zapis Post…
if (typeof scheduleId === "string" && scheduleId.length > 0) {
  await prisma.blogScheduleEntry.update({
    where: { id: scheduleId },
    data: { postId: post.id, status: "IN_PROGRESS" }, // kalendarz od razu pokazuje „Edytowany"
  });
}
```

### 8.5 Fetch wpisów miesiąca (`admin/blog/schedule/route.ts` — GET)

```ts
const startOfMonth = new Date(year, month, 1);
const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
const entries = await prisma.blogScheduleEntry.findMany({
  where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
  orderBy: { scheduledDate: "asc" },
});
return NextResponse.json(entries);
```

---

## 9. Konfiguracja / uruchomienie

**Env wymagane:**
- `CRON_SECRET` — sekret dla wszystkich `/api/cron/**` (nagłówek `Authorization: Bearer …` lub `x-cron-secret`).
- `SERPAPI_KEY` (lub odpowiednik providera trendów) — dla `generateTrendSchedule`; brak → automatyczny fallback evergreen.
- `GEMINI_API_KEY` — dla starszego `generateMonthlySchedule`/`generateWeeklySchedule`.
- Alerty awarii cron: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_ALERT_EMAIL`.

**Cron (`vercel.json` — wyciąg):**
```json
{
  "crons": [
    { "path": "/api/cron/blog/generate-schedule", "schedule": "0 3 1 * *" },
    { "path": "/api/cron/blog/publish",           "schedule": "*/5 * * * *" },
    { "path": "/api/cron/blog/reminders",         "schedule": "0 7 * * *" }
  ]
}
```
> Vercel Hobby odpala crony max raz dziennie — dla `publish` (co 5 min) potrzebny
> plan Pro albo zewnętrzny scheduler (cron-job.org / EasyCron). Szczegóły: [crons.md](../src/app/api/cron/crons.md).

**Ręczne wywołania (dev/testy):**
```bash
# Wygeneruj konkretny miesiąc (month 0-indexed: maj = 4)
curl -X POST "https://.../api/cron/blog/generate-schedule?year=2026&month=4" \
  -H "Authorization: Bearer $CRON_SECRET"

# Miesiąc do przodu
curl -X POST "https://.../api/cron/blog/generate-schedule?offset=1" \
  -H "Authorization: Bearer $CRON_SECRET"

# Sprawdź publikację zaległych
curl -X POST "https://.../api/cron/blog/publish" -H "Authorization: Bearer $CRON_SECRET"
```

---

## 10. Uwagi / pułapki

- **Dwa generatory** — cron = `generateTrendSchedule`; ręczny POST z panelu =
  `generateMonthlySchedule` (Gemini). Warto ujednolicić.
- **Brak FK Post↔Entry** — `postId` to luźny string. Trzy miejsca synchronizacji
  (`save`, `status`, `cron/publish`) muszą trzymać spójność; jeśli dodajesz nowy
  przepływ zmiany statusu Posta — pamiętaj o lustrzeniu.
- **Idempotencja generatora** — jeden istniejący wpis w miesiącu blokuje cały
  regenerat. Chcesz przeplanować? Najpierw usuń wpisy tego miesiąca.
- **Daty bez stref** — helpery w [types.ts](../src/app/admin/blog/harmonogram/_components/types.ts)
  parsują ISO ręcznie (`split("T")[0].split("-")`), by uniknąć przesunięć UTC w kalendarzu.
- **`reminders` bez flagi „wysłano"** — dzienna kadencja jest wymuszona logiką, nie stanem; nie odpalaj częściej.
- **1 wpis / dzień** — kalendarz mapuje po dniu (`Map<number, entry>`); generator
  używa dni MWF, więc kolizje nie występują, ale ręcznie dodany drugi wpis na ten
  sam dzień zostałby nadpisany w widoku.
```
