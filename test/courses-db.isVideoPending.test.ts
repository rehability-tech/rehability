/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TEST JEDNOSTKOWY (unit test)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Co to jest test jednostkowy?
 *   Sprawdza JEDNĄ, małą "jednostkę" kodu (tu: pojedynczą funkcję)
 *   w izolacji — bez bazy danych, bez sieci, bez Reacta. Dzięki temu jest
 *   błyskawiczny i deterministyczny (zawsze ten sam wynik dla tego samego
 *   wejścia).
 *
 * Dlaczego akurat `isVideoPending`?
 *   To funkcja CZYSTA (pure): dla danego wejścia zwraca zawsze ten sam wynik
 *   i nie ma efektów ubocznych (nie pisze do bazy, nie loguje, nie zmienia
 *   nic na zewnątrz). Funkcje czyste to najłatwiejszy i najwdzięczniejszy
 *   materiał na testy jednostkowe — nic nie trzeba "udawać" (mockować).
 *
 * Logika, którą testujemy (z src/lib/courses-db.ts):
 *   - kurs "single"   → brakuje wideo, gdy nie ma głównego `video`
 *   - kurs "sections" → brakuje wideo, gdy NIE MA lekcji LUB któraś lekcja
 *                       nie ma nagrania
 */

// `describe`/`it`/`expect` to API Vitest. Importujemy je jawnie, bo w
// vitest.config.ts ustawiliśmy `globals: false` (są bardziej czytelne, gdy
// widać skąd pochodzą).
import { describe, it, expect } from "vitest";
import { isVideoPending } from "@/lib/courses-db";

// `describe` grupuje powiązane testy w jeden blok (jak rozdział w raporcie).
describe("isVideoPending", () => {
  // ── Wariant kursu "single" (pojedynczy film) ───────────────────────────

  // `it` (alias `test`) opisuje JEDNO oczekiwane zachowanie. Nazwa powinna
  // czytać się jak zdanie: "it returns true when ...".
  it("single: zwraca true (oczekuje wideo), gdy brak głównego nagrania", () => {
    // Wzorzec AAA (Arrange–Act–Assert), czyli: Przygotuj → Wykonaj → Sprawdź.

    // Arrange — przygotuj dane wejściowe. `modules: []` bo dla "single"
    // lekcje nie mają znaczenia; liczy się tylko pole `video`.
    const kurs = { format: "single", video: null, modules: [] };

    // Act + Assert — wywołaj funkcję i sprawdź wynik.
    // `expect(...).toBe(x)` to porównanie ścisłe (===) — idealne dla boolean.
    expect(isVideoPending(kurs)).toBe(true);
  });

  it("single: zwraca false (komplet), gdy główne wideo jest ustawione", () => {
    const kurs = {
      format: "single",
      video: "https://iframe.mediadelivery.net/embed/123/abc",
      modules: [],
    };
    expect(isVideoPending(kurs)).toBe(false);
  });

  // ── Wariant kursu "sections" (moduły + lekcje) ─────────────────────────

  it("sections: zwraca true, gdy kurs nie ma żadnej lekcji", () => {
    // Pusty program = nie ma czego oglądać → wideo "w toku".
    const kurs = { format: "sections", video: null, modules: [] };
    expect(isVideoPending(kurs)).toBe(true);
  });

  it("sections: zwraca true, gdy CHOĆ JEDNA lekcja nie ma nagrania", () => {
    // To najważniejszy przypadek brzegowy: jedna lekcja gotowa, druga pusta.
    // Funkcja używa `.some()` — wystarczy jeden brak, by całość była "pending".
    const kurs = {
      format: "sections",
      video: null,
      modules: [
        {
          lessons: [
            { video: "embed-1" }, // ma nagranie
            { video: null }, // ← brak nagrania przesądza wynik
          ],
        },
      ],
    };
    expect(isVideoPending(kurs)).toBe(true);
  });

  it("sections: zwraca false, gdy KAŻDA lekcja ma nagranie", () => {
    const kurs = {
      format: "sections",
      video: null,
      modules: [
        { lessons: [{ video: "embed-1" }] },
        { lessons: [{ video: "embed-2" }, { video: "embed-3" }] },
      ],
    };
    expect(isVideoPending(kurs)).toBe(false);
  });
});
