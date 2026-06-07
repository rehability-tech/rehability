import { NextResponse } from "next/server";

// Wspólna walidacja uploadów obrazków trafiających do Vercel Blob.
// Bloby są publiczne (access: "public"), więc nie wolno pozwolić na wgranie
// np. SVG/HTML z aktywną zawartością (stored XSS) ani gigantycznych plików.

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

// Domyślny limit 10 MB — wystarcza na zdjęcia hero, blokuje nadużycia.
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export type ImageUploadCheck =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Sprawdza rozszerzenie nazwy pliku, nagłówek Content-Type oraz Content-Length.
 * To walidacja "na wejściu" (header-based) — nie zastępuje skanowania zawartości,
 * ale odcina oczywiste nadużycia (SVG/HTML, pliki wielometrowe).
 */
export function validateImageUpload(
  request: Request,
  filename: string,
  maxBytes: number = DEFAULT_MAX_BYTES,
): ImageUploadCheck {
  const ext = filename.includes(".")
    ? filename.split(".").pop()!.toLowerCase()
    : "";

  if (!ALLOWED_EXT.includes(ext)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Niedozwolony typ pliku. Dozwolone: ${ALLOWED_EXT.join(", ")}.`,
        },
        { status: 415 },
      ),
    };
  }

  // Przeglądarka przy `body: file` ustawia Content-Type na MIME pliku.
  // Jeśli klient podał typ obrazka, musi być on na whiteliście (blokuje image/svg+xml).
  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (
    contentType &&
    contentType.startsWith("image/") &&
    !ALLOWED_MIME.includes(contentType)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Niedozwolony typ MIME: ${contentType}.` },
        { status: 415 },
      ),
    };
  }
  // Jawnie blokujemy typy nie-obrazkowe (np. text/html), jeśli zostały podane.
  if (contentType && !contentType.startsWith("image/")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Dozwolone są wyłącznie pliki graficzne." },
        { status: 415 },
      ),
    };
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Plik jest za duży (max ${Math.round(maxBytes / (1024 * 1024))} MB).`,
        },
        { status: 413 },
      ),
    };
  }

  return { ok: true };
}
