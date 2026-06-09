# 🎬 Szkolenia — Moduł BLOGI (admin / redakcja)

Audyt stanu + scenariusz nagrań dla panelu `/admin/blog`.
Odhaczaj odcinki w trakcie nagrywania.

---

## A. Audyt — co działa, co domknąć przed kamerą

### 🟢 Pełna ścieżka admina (działa)

1. **Lista** [`/admin/blog`](./page.tsx) — filtry (Wszystkie / Opublikowane / Szkice / Archiwalne); na kartach: publikuj / przywróć do szkicu / archiwizuj / edytuj / usuń / podgląd.
2. **Kreator (3 kroki)** [`BlogCreatorStepper`](./dodaj/_components/BlogCreatorStepper.tsx):
   - **Dane podstawowe** — okładka **wymagana** (upload własny lub biblioteka Pexels), tytuł, excerpt, kategoria (+ własne), tagi. Przycisk **„Generuj z AI"** wypełnia całość z jednego promptu.
   - **Edytor treści** — bloki + tryb autogeneracji.
   - **SEO** — `PublishControl`: **Opublikuj teraz** lub **Zaplanuj** (data w przyszłości).
3. **Harmonogram** [`/admin/blog/harmonogram`](./harmonogram/page.tsx) — kalendarz tematów na miesiąc; z wpisu klikasz „Wygeneruj przez AI" → kreator startuje z gotowym tematem i sam dobiera okładkę.
4. **Automatyzacja (crony)** — `generate-schedule` (plan na kolejny miesiąc) + `publish` (publikuje zaplanowane co ~5 min). Opis: [crons.md](../../api/cron/crons.md), [blog cron README](../../api/cron/blog/README.md).

### 🟡 Do weryfikacji przed nagraniem

Własne TODO z [page.tsx](./page.tsx#L3):

- [ ] Czy cron `generate-schedule` realnie odpala się raz w miesiącu (skonfigurowany w schedulerze, nie tylko w kodzie).
- [ ] Czy cron `publish` realnie publikuje zaplanowane wpisy.
- [ ] Czy statusy (DRAFT/SCHEDULED/PUBLISHED/ARCHIVED) wyświetlają się poprawnie na liście.
- [ ] Zmiana statusu, gdy wpis pisany jest ręcznie (bez harmonogramu).

> **Rekomendacja:** crony pokaż na nagraniu jako *efekt* („wpis sam się opublikował o zaplanowanej godzinie"), a nie konfigurację schedulera. Najpierw jednak ręcznie odpal oba endpointy raz, żeby potwierdzić, że działają — inaczej nie nagrasz dowodu.

---

## B. Scenariusz nagrań (4 krótkie odcinki, ~3–5 min każdy)

### Przygotowanie
- Konto admina + dane demo: kilka blogów w różnych statusach, harmonogram z wpisem `PLANNED`.
- Ręcznie odpal `blog/publish` i `blog/generate-schedule` raz — potwierdź, że działają.
- Czyste okno przeglądarki, zoom 100–110%, podświetlony kursor.

### 🎬 Odc. 1.1 — Pisanie artykułu ręcznie
`/admin/blog` → „Nowy artykuł" → okładka (pokaż upload **i** Pexels) → tytuł / excerpt / kategoria / tagi → „Dalej: Edytor treści" → dodawanie bloków → krok SEO → **Opublikuj teraz** → pokaż wpis na `/blog/<slug>`.

### 🎬 Odc. 1.2 — Artykuł z pomocą AI
Ten sam start, ale „Generuj z AI" → opisz temat → AI wypełnia tytuł / opis / tagi / kategorie. Podkreśl: to punkt startowy do edycji, nie gotowiec.

### 🎬 Odc. 1.3 — Harmonogram + generacja jednym kliknięciem
`/admin/blog/harmonogram` → omów plan tematów na miesiąc → z wpisu „Wygeneruj przez AI" → wybór okładki → automatyczne przejście przez kreator do edytora.

### 🎬 Odc. 1.4 — Planowanie publikacji i statusy
W kroku SEO **Zaplanuj** na przyszłą datę → wróć na listę, pokaż status `SCHEDULED` → wyjaśnij, że cron publikuje automatycznie (pokaż efekt, nie konfigurację). Omów cykl: szkic → zaplanowany → opublikowany → archiwalny.
