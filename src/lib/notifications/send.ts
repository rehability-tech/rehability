import { dispatchNotification } from "./dispatcher";
import type {
  CampEventKind,
  CreateSystemUpdateInput,
  LogCampEventInput,
  NotificationChannel,
  NotificationType,
} from "./types";

export type {
  CampEventKind,
  CreateSystemUpdateInput,
  LogCampEventInput,
  NotificationType,
} from "./types";

export interface SendNotificationInput {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  link?: string;
  push?: boolean;
}

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Niskopoziomowy strzał do OneSignal REST API.
 * Zachowany jako export, bo dispatcher.ts go używa wewnętrznie po wyselekcjonowaniu odbiorców.
 */
export async function sendOneSignalPush(
  playerIds: string[],
  title: string,
  message: string | undefined,
  link: string | undefined,
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("[notifications] OneSignal env vars not set — skipping push");
    return;
  }

  if (playerIds.length === 0) return;

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: title, pl: title },
        contents: { en: message || title, pl: message || title },
        ...(link && { url: link }),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[notifications] OneSignal push failed:", errBody);
    }
  } catch (err) {
    console.error("[notifications] OneSignal push error:", err);
  }
}

/**
 * Wysyła powiadomienie do konkretnego użytkownika.
 * Zachowane jako fasada — `push: false` ogranicza kanały do IN_APP.
 */
export async function sendNotification(input: SendNotificationInput) {
  const { userId, title, message = "", type = "INFO", link, push = true } = input;

  const channels: NotificationChannel[] = ["IN_APP"];
  if (push) channels.push("PUSH");

  await dispatchNotification({
    target: "USER",
    userIds: [userId],
    title,
    message,
    link,
    type,
    channels,
  });
}

/**
 * Broadcast do wszystkich Adminów (IN_APP + opcjonalnie PUSH).
 */
export async function sendNotificationToAdmins(
  input: Omit<SendNotificationInput, "userId">,
) {
  const { title, message = "", type = "SYSTEM", link, push = true } = input;

  const channels: NotificationChannel[] = ["IN_APP"];
  if (push) channels.push("PUSH");

  await dispatchNotification({
    target: "ADMIN",
    title,
    message,
    link,
    type,
    channels,
  });
}

// ============================================================
// FASADA ZDARZEŃ CAMPA
// ============================================================

const NOTIFICATION_TYPE: Record<CampEventKind, NotificationType> = {
  DEPOSIT_PAID: "PAYMENT",
  FULLY_PAID: "PAYMENT",
  HEALTH_FILLED: "HEALTH",
  HEALTH_UPDATED: "HEALTH",
  SERVICE_BOUGHT: "SPA",
  SIGNUP: "BOOKING",
  CHECK_IN: "BOOKING",
};

// Macierz [A]/[P] per zdarzenie. Klucz dla "alert fatigue":
// karty zdrowia idą tylko IN_APP + ACTIVITY (admin sprawdza grupowo).
const CAMP_EVENT_CHANNELS: Record<CampEventKind, NotificationChannel[]> = {
  DEPOSIT_PAID: ["ACTIVITY", "IN_APP", "PUSH"],
  FULLY_PAID: ["ACTIVITY", "IN_APP", "PUSH"],
  SERVICE_BOUGHT: ["ACTIVITY", "IN_APP", "PUSH"],
  SIGNUP: ["ACTIVITY", "IN_APP", "PUSH"],
  CHECK_IN: ["ACTIVITY", "IN_APP", "PUSH"],
  HEALTH_FILLED: ["ACTIVITY", "IN_APP"],
  HEALTH_UPDATED: ["ACTIVITY", "IN_APP"],
};

function buildCopy(input: LogCampEventInput): {
  title: string;
  message: string;
  kind: string;
} {
  const { kind, userName, amount, tripTitle, detail } = input;
  const trip = tripTitle ? `wyjazd: ${tripTitle}` : "wyjazd";

  switch (kind) {
    case "DEPOSIT_PAID":
      return {
        title: "🎉 Nowa wpłata: Zadatek",
        message: `${userName} opłaciła zadatek${amount ? ` (${amount} PLN)` : ""} za ${trip}.`,
        kind: "PAYMENT",
      };
    case "FULLY_PAID":
      return {
        title: "💰 Wpłata: Reszta kwoty",
        message: `${userName} dopłaciła resztę${amount ? ` (${amount} PLN)` : ""} za ${trip}.`,
        kind: "PAYMENT",
      };
    case "HEALTH_FILLED":
      return {
        title: "❤️ Wypełniona karta zdrowia",
        message: `${userName} wypełniła kartę zdrowia (${trip}).`,
        kind: "HEALTH_FILLED",
      };
    case "HEALTH_UPDATED":
      return {
        title: "❤️ Aktualizacja karty zdrowia",
        message: `${userName} zaktualizowała kartę zdrowia tuż przed wyjazdem (${trip}).`,
        kind: "HEALTH_FILLED",
      };
    case "SERVICE_BOUGHT":
      return {
        title: "✨ Nowa rezerwacja SPA",
        message: `${userName} zarezerwowała usługę${detail ? ` ${detail}` : ""} na ${trip}.`,
        kind: "SERVICE_BOUGHT",
      };
    case "SIGNUP":
      return {
        title: "👋 Nowa rezerwacja",
        message: `${userName} zarezerwowała ${trip}.`,
        kind: "SIGNUP",
      };
    case "CHECK_IN":
      return {
        title: "✅ Check-in",
        message: `${userName} zameldowała się (${trip}).`,
        kind: "CHECK_IN",
      };
  }
}

/**
 * Fasada zdarzeń wyjazdu. Jeden helper dla wszystkich akcji uczestniczek,
 * który leci przez dispatcher i automatycznie dobiera kanały wg macierzy.
 *
 * Zapisuje `tripId` do kolumny relacyjnej w `Activity` (a nie do `meta`),
 * dzięki czemu widok logów na pojedynczym wyjeździe może filtrować po FK.
 */
export async function logCampEvent(input: LogCampEventInput) {
  const copy = buildCopy(input);

  await dispatchNotification({
    target: "ADMIN",
    title: copy.title,
    message: copy.message,
    link: `/admin/wyjazdy/${input.tripId}`,
    type: NOTIFICATION_TYPE[input.kind],
    channels: CAMP_EVENT_CHANNELS[input.kind],
    kind: copy.kind,
    who: input.userName,
    tripId: input.tripId,
  });
}

/**
 * Tworzy „nowość" na tablicy (SystemUpdate), opcjonalnie z broadcast push do uczestniczek.
 */
export async function createSystemUpdate(input: CreateSystemUpdateInput) {
  const { type, title, description, link, push = false } = input;

  const channels: NotificationChannel[] = ["SYSTEM_UPDATE"];
  if (push) channels.push("PUSH");

  await dispatchNotification({
    target: "GLOBAL",
    title,
    message: description,
    link,
    type,
    channels,
  });
}
