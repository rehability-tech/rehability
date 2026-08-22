/**
 * ─────────────────────────────────────────────────────────────────────────
 *  WŁAŚCICIEL PROMOCJI
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Promocja należy do DOKŁADNIE JEDNEGO produktu: wydarzenia albo kursu.
 * Prisma nie potrafi wyrazić „dokładnie jedno z dwóch" (oba pola są
 * opcjonalne), więc niezmiennik pilnujemy tutaj i w warstwie zapisu.
 *
 * Dzięki temu jedna tabela, jeden panel i jeden zestaw komponentów obsługują
 * oba produkty — kosztem tego jednego, jawnie pilnowanego warunku.
 */

export type DiscountOwner =
  | { kind: "trip"; tripId: string }
  | { kind: "course"; courseId: string };

export function tripOwner(tripId: string): DiscountOwner {
  return { kind: "trip", tripId };
}

export function courseOwner(courseId: string): DiscountOwner {
  return { kind: "course", courseId };
}

/** Fragment `where` wskazujący promocje danego produktu. */
export function ownerFilter(
  owner: DiscountOwner,
): { tripId: string } | { courseId: string } {
  return owner.kind === "trip"
    ? { tripId: owner.tripId }
    : { courseId: owner.courseId };
}

/**
 * Fragment `data` przy tworzeniu promocji. Drugie pole ustawiamy jawnie na
 * null, żeby przy kopiowaniu rekordu między produktami nie został „ogon"
 * po poprzednim właścicielu.
 */
export function ownerData(owner: DiscountOwner): {
  tripId: string | null;
  courseId: string | null;
} {
  return owner.kind === "trip"
    ? { tripId: owner.tripId, courseId: null }
    : { tripId: null, courseId: owner.courseId };
}

/** Etykieta produktu do komunikatów i linków w panelu. */
export function ownerPanelPath(owner: DiscountOwner, slug?: string): string {
  return owner.kind === "trip"
    ? `/admin/wydarzenia/${owner.tripId}/rabaty`
    : `/admin/kursy/${slug ?? owner.courseId}/rabaty`;
}
