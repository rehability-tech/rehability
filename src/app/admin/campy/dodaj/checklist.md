# 📋 Checklist: Blokada publikacji Campa (Brak bloku opcji wyjazdowej)

**Cel:** Zapobieganie publikacji wyjazdu (`status: "PUBLISHED"`), gdy opcja wyjazdowa (np. `allowBringFriend` / toggle wyjazdu) jest włączona w ustawieniach, ale nie ma odzwierciedlenia w zbudowanych blokach (`blocks` JSON) na stronie Campa.

## 💻 1. Frontend (UI - `campy/dodaj` & `CampCard`)

- [ ] **Logika walidacji w komponencie:** Napisać funkcję sprawdzającą, czy opcja wyjazdowa jest `true`, a tablica `blocks` **nie zawiera** odpowiedniego typu bloku (np. `type: "trip-option"`).
- [ ] **Zablokowanie przycisku publikacji:** Zbindować wynik powyższej funkcji z właściwością `disabled` przycisku "Publikuj" (zmiana statusu z DRAFT na PUBLISHED).
- [ ] **Dodanie Tooltipa:** Owinąć zablokowany przycisk "Publikuj" w komponent `Tooltip` (np. z Radix UI / Twojej biblioteki UI).
- [ ] **Treść Tooltipa:** Dodać jasny komunikat, np.: _"Opcja wyjazdowa jest włączona, ale brakuje odpowiedniego bloku w kreatorze treści. Dodaj blok opcji wyjazdowej, aby opublikować."_
- [ ] **Wizualny feedback (Opcjonalnie):** Podświetlić na czerwono lub dodać małą ikonę ostrzegawczą obok samego przełącznika opcji wyjazdowej, żeby użytkownik od razu widział, gdzie jest problem.

## ⚙️ 2. Backend (API - Zabezpieczenie przed ominięciem UI)

- [ ] **Lokalizacja endpointu:** Otworzyć odpowiedni plik trasy API (np. `app/api/admin/campy/[id]/route.ts` lub akcję serwerową).
- [ ] **Walidacja przed zapisem:** Dodać warunek (if) przed aktualizacją rekordu w bazie za pomocą `prisma.camp.update()`.
- [ ] **Logika blokady:**
  ```typescript
  // Pseudokod do API
  if (body.status === "PUBLISHED" && body.wyjazdowaZaznaczona) {
    const hasBlock = body.blocks.some(
      (block) => block.type === "nazwa_bloku_wyjazdowego",
    );
    if (!hasBlock) {
      return new NextResponse("Brak bloku opcji wyjazdowej w treści", {
        status: 400,
      });
    }
  }
  ```
