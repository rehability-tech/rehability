/** Dozwolony kształt kodu rabatowego: 3–32 znaki, A–Z, 0–9, podkreślnik, myślnik. */
export const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

/**
 * Sprowadza kod do postaci kanonicznej: bez spacji (także w środku — ludzie
 * wklejają „LATO 10"), wielkimi literami. W bazie trzymamy wyłącznie taką
 * postać, więc porównanie jest zwykłym równaniem, bez `mode: "insensitive"`.
 */
export function normalizeCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidCodeShape(code: string): boolean {
  return CODE_PATTERN.test(code);
}
