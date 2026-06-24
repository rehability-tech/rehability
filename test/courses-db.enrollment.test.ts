/**
 * ─────────────────────────────────────────────────────────────────────────
 *  TEST INTEGRACYJNY (z zamockowaną bazą danych)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Różnica względem testu jednostkowego:
 *   Funkcje `isUserEnrolled` i `getVodOverview` NIE są czyste — sięgają do
 *   bazy przez Prismę. Nie chcemy w teście prawdziwej bazy (byłby wolny,
 *   wymagałby konfiguracji i danych, a wynik zależałby od stanu DB).
 *
 * Rozwiązanie: MOCK (atrapa).
 *   Podmieniamy moduł `@/lib/prisma` na sztuczny obiekt, którego metody to
 *   `vi.fn()` — funkcje-szpiedzy. Sami decydujemy, co "baza" zwróci
 *   (`mockResolvedValue`), i sprawdzamy, że nasza logika dobrze to przetwarza
 *   ORAZ że odpytała bazę o właściwe rzeczy (`toHaveBeenCalledWith`).
 *
 * To wciąż test "integracyjny" w tym sensie, że sprawdza współpracę naszej
 * funkcji z warstwą Prismy (kształt zapytań), ale bez realnego I/O.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── 1. MOCK MODUŁU PRISMY ──────────────────────────────────────────────────
//
// `vi.hoisted` jest konieczne: `vi.mock` jest "wynoszony" (hoisted) na samą
// górę pliku — wykonuje się ZANIM zwykłe `const` zdążą powstać. Gdybyśmy
// odwołali się do zwykłej zmiennej w fabryce mocka, byłaby jeszcze undefined.
// `vi.hoisted` uruchamia kod równie wcześnie, więc atrapy są już gotowe.
const db = vi.hoisted(() => ({
  course: { findUnique: vi.fn() },
  enrollment: { findUnique: vi.fn(), findMany: vi.fn() },
  lessonProgress: { findMany: vi.fn() },
}));

// Od teraz każdy `import { prisma } from "@/lib/prisma"` (także TEN wewnątrz
// courses-db.ts) dostanie nasz obiekt-atrapę zamiast prawdziwego klienta.
vi.mock("@/lib/prisma", () => ({ prisma: db }));

// WAŻNE: import testowanego modułu MUSI być po `vi.mock`. W praktyce kolejność
// nie ma znaczenia (vi.mock i tak jest hoisted), ale trzymanie go niżej
// czytelnie pokazuje intencję: "mock najpierw, potem kod pod test".
import { isUserEnrolled, getVodOverview } from "@/lib/courses-db";

// `beforeEach` czyści historię wywołań przed KAŻDYM testem, żeby testy były
// od siebie niezależne (jeden nie "widzi" wywołań z poprzedniego).
beforeEach(() => {
  vi.clearAllMocks();
});

// Pełny rekord kursu w kształcie, jakiego oczekuje wewnętrzny `mapCourse`.
// Wyciągamy go do helpera, by testy nie tonęły w polach, które ich nie dotyczą.
function makeDbCourse(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "c1",
    slug: "kurs-test",
    title: "Kurs testowy",
    category: "Rehabilitacja",
    rating: 0,
    reviews: 0,
    views: 0,
    durationMin: 90,
    price: 199,
    image: null,
    excerpt: "Krótki opis",
    format: "sections",
    video: null,
    description: null,
    content: null,
    faq: null,
    testimonials: null,
    metaTitle: null,
    metaDescription: null,
    focusKeyword: null,
    ogImage: null,
    canonicalUrl: null,
    noIndex: false,
    createdAt: new Date("2026-01-01"),
    publishedAt: null,
    modules: [],
    ...over,
  };
}

describe("isUserEnrolled", () => {
  it("zwraca false, gdy kursu o takim slug nie ma", async () => {
    // Arrange: udajemy, że baza nie znalazła kursu.
    db.course.findUnique.mockResolvedValue(null);

    // Act
    const result = await isUserEnrolled("user-1", "nieistniejacy");

    // Assert: skoro nie ma kursu, w ogóle nie pytamy o Enrollment (early return).
    expect(result).toBe(false);
    expect(db.enrollment.findUnique).not.toHaveBeenCalled();
  });

  it("zwraca true, gdy istnieje zapis (Enrollment) dla pary user+kurs", async () => {
    // Arrange: kurs istnieje (zwraca id), zapis też istnieje.
    db.course.findUnique.mockResolvedValue({ id: "c1" });
    db.enrollment.findUnique.mockResolvedValue({ id: "e1" });

    // Act
    const result = await isUserEnrolled("user-1", "kurs-test");

    // Assert: wynik...
    expect(result).toBe(true);

    // ...ORAZ że odpytaliśmy bazę POPRAWNIE — po złożonym kluczu
    // unikalnym `userId_courseId`. To chroni przed regresją typu
    // "ktoś przerobił zapytanie i zaczęło szukać po samym userId".
    expect(db.enrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: "user-1", courseId: "c1" } },
      select: { id: true },
    });
  });

  it("zwraca false, gdy kurs istnieje, ale użytkownik nie ma zapisu", async () => {
    db.course.findUnique.mockResolvedValue({ id: "c1" });
    db.enrollment.findUnique.mockResolvedValue(null); // brak dostępu

    expect(await isUserEnrolled("user-1", "kurs-test")).toBe(false);
  });
});

describe("getVodOverview", () => {
  it("liczy procent ukończenia per kurs oraz łączne godziny", async () => {
    // Arrange — użytkownik ma 1 kurs z 4 lekcjami (po 2 w każdym module).
    const course = makeDbCourse({
      id: "c1",
      durationMin: 120, // → powinno dać 2h po zaokrągleniu
      modules: [
        { id: "m1", title: "Moduł 1", lessons: [{ id: "l1" }, { id: "l2" }] },
        { id: "m2", title: "Moduł 2", lessons: [{ id: "l3" }, { id: "l4" }] },
      ],
    });
    // enrollment.findMany zwraca zapisy z dołączonym kursem.
    db.enrollment.findMany.mockResolvedValue([{ course }]);
    // Użytkownik ukończył 1 z 4 lekcji → 25%.
    db.lessonProgress.findMany.mockResolvedValue([{ lessonId: "l1" }]);

    // Act
    const overview = await getVodOverview("user-1");

    // Assert — sprawdzamy wyliczenia, nie sztywny kształt całego obiektu.
    expect(overview.progressByCourse["c1"]).toBe(25); // 1/4 = 25%
    expect(overview.lessonsDone).toBe(1); // liczba ukończonych lekcji
    expect(overview.hoursTotal).toBe(2); // round(120/60) = 2
    expect(overview.courses).toHaveLength(1);
    expect(overview.courses[0].slug).toBe("kurs-test");
  });

  it("daje 0% dla kursu bez ukończonych lekcji (i nie dzieli przez zero)", async () => {
    // Przypadek brzegowy: kod używa `total = lessonIds.length || 1`, żeby
    // kurs bez lekcji nie wywalił się na dzieleniu przez zero.
    const pusty = makeDbCourse({ id: "c9", modules: [] });
    db.enrollment.findMany.mockResolvedValue([{ course: pusty }]);
    db.lessonProgress.findMany.mockResolvedValue([]); // nic nie ukończono

    const overview = await getVodOverview("user-1");

    expect(overview.progressByCourse["c9"]).toBe(0);
    expect(overview.lessonsDone).toBe(0);
  });
});
