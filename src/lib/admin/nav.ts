// ==========================================
// KONTEKST NAWIGACJI ADMINA
// ==========================================
// Jedno źródło prawdy o tym, czy adres to „konkretne wydarzenie / konkretny
// kurs", czy zwykła podstrona sekcji. Sidebar i mobilny pasek liczyły to
// wcześniej osobno i listy wyjątków się rozjechały — przez co /admin/wydarzenia/lista
// wchodziło na mobile w tryb pojedynczego wydarzenia (segment „lista" brany
// za ID) i pokazywało Uczestników / Harmonogram / Sklep / Czat.

/** Segmenty po /admin/wydarzenia/, które NIE są ID wydarzenia. */
export const NON_TRIP_SEGMENTS = new Set([
  "dodaj",
  "lista",
  // Defensywnie — trasy historyczne i te, które mogą dojść w tej sekcji.
  "nowy",
  "edycja",
  "platnosci",
  "live",
  "uczestnicy",
  "uczestniczki",
]);

/** Segmenty po /admin/kursy/, które NIE są slugiem kursu. */
export const NON_COURSE_SEGMENTS = new Set(["dodaj", "lista"]);

function segmentAfter(
  pathname: string | null | undefined,
  section: string,
): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "admin" || parts[1] !== section) return null;
  return parts[2] ?? null;
}

/**
 * ID wydarzenia z adresu /admin/wydarzenia/[id]/... albo null, gdy to sekcja
 * (lista, kreator) lub inna część panelu.
 */
export function getAdminTripId(pathname: string | null | undefined): string | null {
  const segment = segmentAfter(pathname, "wydarzenia");
  if (!segment || NON_TRIP_SEGMENTS.has(segment)) return null;
  return segment;
}

/** Slug kursu z adresu /admin/kursy/[slug]/... albo null. */
export function getAdminCourseSlug(
  pathname: string | null | undefined,
): string | null {
  const segment = segmentAfter(pathname, "kursy");
  if (!segment || NON_COURSE_SEGMENTS.has(segment)) return null;
  return segment;
}
