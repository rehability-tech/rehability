import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Zwraca singleton klienta Resend albo `null`, gdy brak `RESEND_API_KEY`.
 * Dzięki temu wysyłka maili jest "best-effort" — brak klucza nie wywraca
 * krytycznych ścieżek (np. webhooka Stripe), tylko pomija wysyłkę.
 */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] Brak RESEND_API_KEY — pomijam wysyłkę e-maila.");
    return null;
  }
  if (!cached) cached = new Resend(apiKey);
  return cached;
}

/**
 * Adres nadawcy. W produkcji ustaw zweryfikowaną domenę w Resend
 * (np. "Rehability <zaproszenia@twojadomena.pl>"). Domyślnie sandbox Resend.
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Rehability <onboarding@resend.dev>";

/** Bazowy URL aplikacji — do budowania linków w mailach. */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}
