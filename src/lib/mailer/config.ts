/**
 * Konfiguracja modułu mailingowego.
 *
 * To JEDYNY plik w `src/lib/mailer` dotykający `process.env`. Dzięki temu
 * przeniesienie modułu do innego projektu sprowadza się do podmiany tej funkcji
 * (albo wstrzyknięcia własnego `MailerConfig`) — rdzeń nie zna zmiennych środowiskowych.
 */

export interface MailerConfig {
  /** Domyślna nazwa nadawcy (np. "Rehability"). */
  fromName: string;
  /** Pełny nagłówek From (np. "Rehability <kontakt@domena.pl>"). */
  fromHeader: string;
  /** Bazowy URL aplikacji — do budowania linków (wypisanie, CTA). */
  appUrl: string;
  /** Klucz API providera (Resend). Brak = wysyłka działa jako no-op. */
  resendApiKey?: string;
  /** Sekret webhooka providera (do weryfikacji podpisu Svix). */
  webhookSecret?: string;
}

/** Wyciąga samą nazwę z nagłówka "Nazwa <email>" (fallback do całości). */
function parseFromName(header: string): string {
  const match = header.match(/^\s*"?([^"<]+?)"?\s*</);
  return match ? match[1].trim() : header.trim();
}

export function loadMailerConfigFromEnv(): MailerConfig {
  const fromHeader =
    process.env.EMAIL_FROM || "Rehability <onboarding@resend.dev>";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return {
    fromName: parseFromName(fromHeader),
    fromHeader,
    appUrl: appUrl.replace(/\/$/, ""),
    resendApiKey: process.env.RESEND_API_KEY,
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
  };
}
