// Powiadomienie admina o AWARII crona — PUSH przez OneSignal, NIEZALEŻNY OD BAZY.
//
// Awarie cronów to najczęściej "baza nieosiągalna", więc alert nie może zależeć
// od bazy. Dlatego NIE pobieramy adminów z DB (jak dispatcher/sendNotificationToAdmins)
// — kierujemy push wprost po `external_id` wpisanych w ADMIN_ALERT_ONESIGNAL_IDS.
// To jest userId, którym OneSignalProvider woła OneSignal.login(userId).

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const BADGE_URL = "https://www.rehabilityprudnik.pl/badge-96x96.png";

// Throttle w pamięci procesu, żeby przy dłuższej awarii (cron co 5 min) nie
// wysłać kilkunastu pushy. Best-effort: reset przy zimnym starcie / wielu
// instancjach serverless, ale i tak tnie większość powtórek.
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 min na ten sam cron
const lastAlertAt = new Map<string, number>();

function adminExternalIds(): string[] {
  return (process.env.ADMIN_ALERT_ONESIGNAL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function alertAdminCronFailure(
  cronName: string,
  error: unknown,
): Promise<void> {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error(
      `[cron alert] Brak konfiguracji OneSignal (NEXT_PUBLIC_ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY). ` +
        `Push o awarii "${cronName}" pominięty. Błąd: ${detail}`,
    );
    return;
  }

  const ids = adminExternalIds();
  if (ids.length === 0) {
    console.error(
      `[cron alert] Brak ADMIN_ALERT_ONESIGNAL_IDS — nie wiem, do kogo wysłać push. ` +
        `Błąd "${cronName}": ${detail}`,
    );
    return;
  }

  const now = Date.now();
  const last = lastAlertAt.get(cronName) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) {
    console.warn(
      `[cron alert] Pomijam push o "${cronName}" (cooldown ${Math.round(
        (ALERT_COOLDOWN_MS - (now - last)) / 60000,
      )} min). Błąd: ${detail}`,
    );
    return;
  }
  lastAlertAt.set(cronName, now);

  const title = `⚠️ Awaria crona: ${cronName}`;
  // Krótka treść — push ma limity; pełny stack i tak leci do logów serwera.
  const message = detail.length > 200 ? `${detail.slice(0, 197)}…` : detail;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.rehabilityprudnik.pl";

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        // SDK v16: subskrybenci są zalogowani przez login(userId) → alias external_id.
        target_channel: "push",
        include_aliases: { external_id: ids },
        headings: { en: title, pl: title },
        contents: { en: message, pl: message },
        chrome_web_badge: BADGE_URL,
        url: `${appUrl}/admin`,
      }),
    });

    if (!res.ok) {
      console.error(
        `[cron alert] OneSignal odrzucił push o "${cronName}": ${await res.text()}`,
      );
    }
  } catch (sendErr) {
    console.error(
      `[cron alert] Wysyłka push o awarii "${cronName}" nie powiodła się:`,
      sendErr,
    );
  }
}
