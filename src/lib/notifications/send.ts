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
  const BADGE_URL = "https://www.rehabilityprudnik.pl/badge-96x96.png";
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
        chrome_web_badge: BADGE_URL,
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
  const {
    userId,
    title,
    message = "",
    type = "INFO",
    link,
    push = true,
  } = input;

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

/**
 * Push broadcast do wszystkich użytkowników z włączonymi powiadomieniami.
 * Nie tworzy rekordów IN_APP per-user (GLOBAL target).
 */
export async function sendNotificationToAll(
  input: Omit<SendNotificationInput, "userId" | "push">,
) {
  const { title, message = "", type = "INFO", link } = input;

  await dispatchNotification({
    target: "GLOBAL",
    title,
    message,
    link,
    type,
    channels: ["PUSH"],
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
  BOOKING_ABANDONED: "BOOKING",
  BOOKING_REMOVED: "BOOKING",
  CHECK_IN: "BOOKING",
};

// Macierz [A]/[P] per zdarzenie. Klucz dla "alert fatigue":
// karty zdrowia idą tylko IN_APP + ACTIVITY (admin sprawdza grupowo),
// a domknięcia nieopłaconych rezerwacji tylko do ACTIVITY — to zapis do
// historii, nie news wart budzenia telefonu.
const CAMP_EVENT_CHANNELS: Record<CampEventKind, NotificationChannel[]> = {
  DEPOSIT_PAID: ["ACTIVITY", "IN_APP", "PUSH"],
  FULLY_PAID: ["ACTIVITY", "IN_APP", "PUSH"],
  SERVICE_BOUGHT: ["ACTIVITY", "IN_APP", "PUSH"],
  SIGNUP: ["ACTIVITY", "IN_APP", "PUSH"],
  CHECK_IN: ["ACTIVITY", "IN_APP", "PUSH"],
  HEALTH_FILLED: ["ACTIVITY", "IN_APP"],
  HEALTH_UPDATED: ["ACTIVITY", "IN_APP"],
  BOOKING_ABANDONED: ["ACTIVITY"],
  BOOKING_REMOVED: ["ACTIVITY"],
};

function buildCopy(input: LogCampEventInput): {
  title: string;
  message: string;
  kind: string;
} {
  const { kind, userName, amount, tripTitle, detail } = input;
  const trip = tripTitle ? `wydarzenie: ${tripTitle}` : "wydarzenie";

  // Wszystkie komunikaty są NEUTRALNE PŁCIOWO — zamiast czasownika z końcówką
  // rodzajową („zarezerwowała") używamy formy rzeczownikowej po myślniku
  // („— rozpoczęta rezerwacja"). Platforma jest dla uczestników i uczestniczek.
  switch (kind) {
    case "DEPOSIT_PAID":
      return {
        title: "🎉 Nowa wpłata: Zadatek",
        message: `${userName} — zadatek opłacony${amount ? ` (${amount} PLN)` : ""}, ${trip}.`,
        kind: "PAYMENT",
      };
    case "FULLY_PAID":
      return {
        title: "💰 Wpłata: Reszta kwoty",
        message: `${userName} — reszta kwoty opłacona${amount ? ` (${amount} PLN)` : ""}, ${trip}.`,
        kind: "PAYMENT",
      };
    case "HEALTH_FILLED":
      return {
        title: "❤️ Wypełniona karta zdrowia",
        message: `${userName} — karta zdrowia wypełniona (${trip}).`,
        kind: "HEALTH_FILLED",
      };
    case "HEALTH_UPDATED":
      return {
        title: "❤️ Aktualizacja karty zdrowia",
        message: `${userName} — karta zdrowia zaktualizowana tuż przed wydarzeniem (${trip}).`,
        kind: "HEALTH_FILLED",
      };
    case "SERVICE_BOUGHT":
      return {
        title: "✨ Nowa rezerwacja SPA",
        message: `${userName} — rezerwacja usługi${detail ? ` „${detail}"` : ""}, ${trip}.`,
        kind: "SERVICE_BOUGHT",
      };
    // UWAGA: ten wpis powstaje przy OTWARCIU płatności, zanim Stripe cokolwiek
    // pobierze. Celowo — pokazuje porzucone koszyki. Dlatego nazywa się
    // „rozpoczęta rezerwacja", a nie „nowa rezerwacja": miejsce liczy się
    // dopiero po zadatku (osobny wpis DEPOSIT_PAID).
    case "SIGNUP":
      return {
        title: "👋 Rozpoczęta rezerwacja",
        message: `${userName} — rozpoczęta rezerwacja, ${trip}. Miejsce liczy się dopiero po wpłacie zadatku.`,
        kind: "SIGNUP",
      };
    case "BOOKING_ABANDONED":
      return {
        title: "⌛ Porzucona rezerwacja",
        message: `${userName} — rezerwacja anulowana automatycznie, zadatek nie wpłynął (${trip}).`,
        kind: "BOOKING_ABANDONED",
      };
    case "BOOKING_REMOVED":
      return {
        title: "🗑️ Rezerwacja usunięta",
        message: `${userName} — nieopłacona rezerwacja usunięta przez administratora${detail ? ` ${detail}` : ""} (${trip}).`,
        kind: "BOOKING_REMOVED",
      };
    case "CHECK_IN":
      return {
        title: "✅ Check-in",
        message: `${userName} — check-in na miejscu (${trip}).`,
        kind: "CHECK_IN",
      };
  }
}

/**
 * Fasada zdarzeń wydarzenia. Jeden helper dla wszystkich akcji uczestników,
 * który leci przez dispatcher i automatycznie dobiera kanały wg macierzy.
 *
 * Zapisuje `tripId` do kolumny relacyjnej w `Activity` (a nie do `meta`),
 * dzięki czemu widok logów na pojedynczym wydarzeniu może filtrować po FK.
 */
export async function logCampEvent(input: LogCampEventInput) {
  const copy = buildCopy(input);

  await dispatchNotification({
    target: "ADMIN",
    title: copy.title,
    message: copy.message,
    link: `/admin/wydarzenia/${input.tripId}`,
    type: NOTIFICATION_TYPE[input.kind],
    channels: CAMP_EVENT_CHANNELS[input.kind],
    kind: copy.kind,
    who: input.userName,
    tripId: input.tripId,
  });
}

/**
 * Loguje sprzedaż kursu VOD do live-feedu admina (Activity) + powiadomienie/push.
 * Analogicznie do `logCampEvent`, ale dla pillaru „VOD".
 */
export async function logVodPurchase(input: {
  userName: string;
  courseTitle: string;
  courseSlug?: string;
  amount?: string | null;
}) {
  await dispatchNotification({
    target: "ADMIN",
    title: "🎓 Sprzedaż kursu VOD",
    message: `${input.userName} — zakup kursu „${input.courseTitle}"${
      input.amount ? ` (${input.amount} zł)` : ""
    }.`,
    link: input.courseSlug ? `/kursy/${input.courseSlug}` : "/admin/kursy/lista",
    type: "VOD",
    channels: ["ACTIVITY", "IN_APP", "PUSH"],
    kind: "VOD_PURCHASE",
    who: input.userName,
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
