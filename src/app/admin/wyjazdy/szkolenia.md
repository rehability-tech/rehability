# 🎬 Szkolenia — Moduł WYJAZDY (admin / redakcja)

Audyt stanu + scenariusz nagrań dla panelu `/admin/wyjazdy`.
Odhaczaj odcinki w trakcie nagrywania.

---

## A. Audyt — co działa, co domknąć przed kamerą

### 🟢 Pełna ścieżka admina (działa)

1. **Lista** [`/admin/wyjazdy`](./page.tsx) — strefa **„Wyróżniony na stronie głównej"** (przeciągasz wyjazd, żeby go wypromować), filtry, karty ze statusem i liczbą zapisanych; usuwanie zablokowane, gdy są rezerwacje.
2. **Kreator (4–5 kroków)** [`TripCreatorStepper`](./dodaj/_components/TripCreatorStepper.tsx):
   - **Dane podstawowe** → **Edytor treści** (bloki: cennik, opcje rezerwacji, FAQ, wideo, mapa) → **E-mail** (krok pojawia się **tylko gdy** włączone „zabierz przyjaciółkę" — pełny edytor maila z AI) → **SEO** → **Podsumowanie** (podgląd karty + opisu na różnych urządzeniach).
3. **Zarządzanie wyjazdem** [`/admin/wyjazdy/[id]`](./[id]/page.tsx) — **realne dane** (nie mock): dashboard, lista uczestniczek, aktywność, harmonogram. Podstrony: **harmonogram** (siatka godzin/wydarzeń), **sklep** (usługi SPA), **uczestnicy** + profil pojedynczej uczestniczki, **chat** grupowy.

### 🟡 Do świadomego ominięcia / domknięcia

- [ ] **Statystyki na liście wyjazdów** — `soldSeats` i `revenuePln` są **zahardkodowane na 0** ([page.tsx:82](./page.tsx#L82), komentarz „Docelowo: połączone z rezerwacjami"). Sekcja statystyk jest pusta w renderze. → **nie pokazuj na kamerze** albo dokończ wcześniej.
- [ ] **Blokada publikacji** gdy „zabierz przyjaciółkę" włączone, ale brak bloku opcji w treści — [checklist.md](./dodaj/checklist.md) **cała niezrobiona**. → na nagraniu po prostu dodaj blok poprawnie; nie demonstruj walidacji, bo jej nie ma.
- [ ] **„Ankieta wstępna"** na dashboardzie — model `Survey` nie istnieje, to TODO ([README.md:310](./[id]/README.md#L310)). → nie obiecuj tego na szkoleniu.

---

## B. Scenariusz nagrań (5 odcinków, ~4–7 min)

### Przygotowanie
- Konto admina + dane demo: 1 wyjazd opublikowany z 2–3 uczestniczkami i wpłatami, 1 wyjazd-szkic.
- Czyste okno przeglądarki, zoom 100–110%, podświetlony kursor.

### 🎬 Odc. 2.1 — Tworzenie wyjazdu: dane + treść
`/admin/wyjazdy` → „Dodaj nowy Trip" → dane podstawowe → edytor treści z blokami (cennik, opcje rezerwacji, FAQ, mapa, wideo).

### 🎬 Odc. 2.2 — Opcja „zabierz przyjaciółkę" + e-mail
Włącz opcję → pokaż, że **pojawia się krok E-mail** → edytor zaproszenia (+ generowanie AI) → podgląd w skrzynce.

### 🎬 Odc. 2.3 — SEO, podsumowanie i publikacja
Krok SEO → Podsumowanie (podgląd karty/opisu na desktop/mobile) → publikacja → przeciągnięcie do strefy **„Wyróżniony na stronie głównej"** → pokaż efekt na stronie publicznej.

### 🎬 Odc. 2.4 — Zarządzanie wyjazdem (dashboard)
`/admin/wyjazdy/[id]` → omów dashboard, uczestniczki, aktywność → **harmonogram** (dodawanie wydarzeń w siatce) → **sklep** (usługi SPA i sloty).

### 🎬 Odc. 2.5 — Uczestniczki i komunikacja
Lista uczestniczek → profil pojedynczej (płatności, karta zdrowia, check-in) → **chat** grupowy. *(Pomiń pustą sekcję statystyk i „ankietę wstępną".)*
