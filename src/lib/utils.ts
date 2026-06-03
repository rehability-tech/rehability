// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Optymalne łączenie klas Tailwinda. Rozwiązuje konflikty (np. p-4 i p-2 nadpiszą się poprawnie).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bezpieczny generator UUID v4.
 *
 * `crypto.randomUUID()` istnieje TYLKO w secure context (HTTPS lub localhost).
 * Przy testach przez LAN po HTTP (np. http://192.168.x.x:3000) jest `undefined`
 * i rzuca "crypto.randomUUID is not a function". Tu spadamy wtedy na
 * `crypto.getRandomValues`, a w ostateczności na Math.random.
 */
export function safeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; // wersja 4
    b[8] = (b[8] & 0x3f) | 0x80; // wariant
    const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Domeny-placeholdery, które AI lubi zmyślać dla bloków zdjęć (np.
 * "https://przyklad.pl/...", "https://example.com/..."). To NIE są realne
 * zdjęcia — traktujemy je jak puste, żeby kreator zatrzymał się i poprosił o
 * wybór grafiki, a fałszywy host nigdy nie trafił do <next/image>.
 */
const PLACEHOLDER_IMAGE_HOSTS = [
  /(^|\.)example\.(com|org|net|pl|info)$/i,
  /(^|\.)przyk[lł]ad\.[a-z]+$/i,
  /(^|\.)twoja(domena|strona)\.[a-z]+$/i,
  /(^|\.)your(domain|site|website)\.[a-z]+$/i,
  /(^|\.)domena\.[a-z]+$/i,
  /(^|\.)placeholder\.[a-z]+$/i,
];

/**
 * Czy `url` to PRAWDZIWY adres zdjęcia (http(s) lub lokalny upload „/...")?
 *
 * AI dla bloków `inlineImage` ma zostawiać `url` puste i opisywać zdjęcie w `alt`,
 * ale bywa, że wpisuje do `url` placeholder/rekomendację (np. "zdjęcie kobiety..."
 * albo zmyśloną domenę typu "przyklad.pl"). Taki tekst NIE jest zdjęciem — gdyby
 * uznać go za poprawny url, kolejka doboru zdjęć byłaby pusta i kreator NIE
 * zatrzymałby się, by poprosić o wybór grafiki (a fałszywy host wywaliłby
 * <next/image>, bo nie jest skonfigurowany w next.config).
 */
export function isUsableImageUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  // Lokalny upload „/..." — akceptujemy.
  if (trimmed.startsWith("/")) return true;
  // Musi być poprawny http(s) URL.
  if (!/^https?:\/\//i.test(trimmed)) return false;
  let host = "";
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return false; // nie-parsowalny URL = nie używamy
  }
  if (!host) return false;
  // Odrzuć zmyślone domeny-placeholdery.
  return !PLACEHOLDER_IMAGE_HOSTS.some((re) => re.test(host));
}
