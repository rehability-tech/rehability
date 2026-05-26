# Roadmapa: Admin Dashboard (Bento Grid Layout)

## 📌 Cel

Przebudowa strony głównej panelu administratora (`/admin`) na funkcjonalny, modułowy układ typu **Bento Grid**, zachowując nasz lekki, szklany design system (Glassmorphism, białe/krystaliczne tła, akcenty `#287D88` i `#F2D967`). Dashboard ma dostarczać kluczowych informacji biznesowych "na rzut oka", bez przytłaczania danymi.

---

## 🛠 Faza 1: Architektura Layoutu (Siatka CSS / Tailwind)

- [ ] Zmiana obecnego układu (kolumnowego) na zaawansowany `grid` (np. `grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4`).
- [ ] Opracowanie komponentu bazowego kafelka (`BentoCard`), który domyślnie posiada nasz efekt szkła: `bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl`.
- [ ] Zdefiniowanie "wielkości" kafelków w siatce (np. główne statystyki na 2 kolumny, feed na 1 wysoką kolumnę).

---

## 📊 Faza 2: Funkcjonalne Widgety (Zawartość Bento)

Zamiast trzech wielkich kart filarów, rozbijamy dane na użyteczne widgety:

- [ ] **Widget 1: Finanse / Quick Stats (Główny KPI)**
  - Co zawiera: Przychód z tego miesiąca (Wyjazdy + VOD), liczba nowych rejestracji.
  - Wygląd: Najbardziej wyeksponowany kafelek, subtelny gradient `brand-primary`.
- [ ] **Widget 2: Centrum Akcji (To-Do list systemu)**
  - Co zawiera: Rzeczy wymagające Twojej uwagi. Np. "3 nieopłacone reszty za Wyjazd", "2 niewypełnione karty zdrowia", "1 nowy komentarz na blogu".
  - Wygląd: Minimalistyczna lista z ikonami (czerwone/żółte akcenty przy pilnych sprawach).

- [ ] **Widget 3: Najbliższe Wydarzenia (Timeline)**
  - Co zawiera: Odliczanie do najbliższego Wyjazdu + informacja o liczbie wolnych miejsc. Jeśli jest aktywny Wyjazd - status "W trakcie".

- [ ] **Widget 4: Mini-Moduły Filarów (Skróty)**
  - Co zawiera: 3 małe, kwadratowe kafelki służące jako szybka nawigacja do: Zarządzania Wyjazdami, V
