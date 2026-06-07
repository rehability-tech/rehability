import { EMAIL_FROM, getAppUrl, getResend } from "@/lib/email/resend";

// Powiadomienie admina o AWARII crona.
//
// WAŻNE: awarie cronów to najczęściej "baza nieosiągalna", więc alert NIE MOŻE
// zależeć od bazy (in-app/push przez dispatcher zapisują do DB — bezużyteczne,
// gdy DB leży). Dlatego idziemy mailem przez Resend, który potrzebuje tylko
// RESEND_API_KEY i adresu w ADMIN_ALERT_EMAIL.

// Throttle w pamięci procesu, żeby przy dłuższej awarii (cron co 5 min) nie
// wysłać kilkunastu maili. Best-effort: reset przy zimnym starcie / wielu
// instancjach serverless, ale i tak tnie większość powtórek.
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 min na ten sam cron
const lastAlertAt = new Map<string, number>();

// Domyślny odbiorca alertów o awarii crona. Można nadpisać przez ADMIN_ALERT_EMAIL.
const DEFAULT_ALERT_EMAIL = "biuro@kocikdev.com";

export async function alertAdminCronFailure(
  cronName: string,
  error: unknown,
): Promise<void> {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  const to = process.env.ADMIN_ALERT_EMAIL || DEFAULT_ALERT_EMAIL;
  const resend = getResend();

  if (!resend) {
    console.error(
      `[cron alert] Nie mogę wysłać maila o awarii crona "${cronName}" — brak RESEND_API_KEY. Błąd: ${detail}`,
    );
    return;
  }

  const now = Date.now();
  const last = lastAlertAt.get(cronName) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) {
    console.warn(
      `[cron alert] Pomijam mail o "${cronName}" (cooldown ${Math.round(
        (ALERT_COOLDOWN_MS - (now - last)) / 60000,
      )} min). Błąd: ${detail}`,
    );
    return;
  }
  lastAlertAt.set(cronName, now);

  const when = new Date(now).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
  });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `⚠️ Awaria crona: ${cronName}`,
      text: [
        `Cron "${cronName}" zakończył się błędem.`,
        ``,
        `Czas: ${when}`,
        `Błąd: ${detail}`,
        ``,
        `Najczęstsza przyczyna: baza Neon usnęła (scale-to-zero) i nie wstała w czasie.`,
        `Endpoint zwrócił 500 — scheduler ponowi przy następnym uruchomieniu.`,
        ``,
        `Panel: ${getAppUrl()}/admin`,
      ].join("\n"),
    });
  } catch (sendErr) {
    console.error(
      `[cron alert] Wysyłka maila o awarii "${cronName}" nie powiodła się:`,
      sendErr,
    );
  }
}
