# 📋 Checklist: Blokada publikacji Wydarzenia (Brak bloku opcji rezerwacji)

**Cel:** Zapobieganie publikacji wydarzenia (`status: "PUBLISHED"`), gdy opcja osoby towarzyszącej (np. `allowBringFriend` / toggle wydarzenia) jest włączona w ustawieniach, ale nie ma odzwierciedlenia w zbudowanych blokach (`blocks` JSON) na stronie Wydarzenia.

## 💻 1. Frontend (UI - `campy/dodaj` & `TripCard`)

- [ ] **Logika walidacji w komponencie:** Napisać funkcję sprawdzającą, czy opcja osoby towarzyszącej jest `true`, a tablica `blocks` **nie zawiera** odpowiedniego typu bloku (np. `type: "trip-option"`).
- [ ] **Zablokowanie przycisku publikacji:** Zbindować wynik powyższej funkcji z właściwością `disabled` przycisku "Publikuj" (zmiana statusu z DRAFT na PUBLISHED).
- [ ] **Dodanie Tooltipa:** Owinąć zablokowany przycisk "Publikuj" w komponent `Tooltip` (np. z Radix UI / Twojej biblioteki UI).
- [ ] **Treść Tooltipa:** Dodać jasny komunikat, np.: _"Opcja osoby towarzyszącej jest włączona, ale brakuje odpowiedniego bloku w kreatorze treści. Dodaj blok opcji rezerwacji, aby opublikować."_
- [ ] **Wizualny feedback (Opcjonalnie):** Podświetlić na czerwono lub dodać małą ikonę ostrzegawczą obok samego przełącznika opcji osoby towarzyszącej, żeby użytkownik od razu widział, gdzie jest problem.

## ⚙️ 2. Backend (API - Zabezpieczenie przed ominięciem UI)

- [ ] **Lokalizacja endpointu:** Otworzyć odpowiedni plik trasy API (np. `app/api/admin/wydarzenia/[id]/route.ts` lub akcję serwerową).
- [ ] **Walidacja przed zapisem:** Dodać warunek (if) przed aktualizacją rekordu w bazie za pomocą `prisma.trip.update()`.
- [ ] **Logika blokady:**
  ```typescript
  // Pseudokod do API
  if (body.status === "PUBLISHED" && body.osobaTowarzyszacaZaznaczona) {
    const hasBlock = body.blocks.some(
      (block) => block.type === "nazwa_bloku_rezerwacji",
    );
    if (!hasBlock) {
      return new NextResponse("Brak bloku opcji rezerwacji w treści", {
        status: 400,
      });
    }
  }
  ```
