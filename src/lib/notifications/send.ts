import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "BOOKING"
  | "PAYMENT"
  | "HEALTH"
  | "SPA"
  | "SYSTEM";

export interface SendNotificationInput {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  link?: string;
  // Jeśli false — tylko zapis do DB, bez push (np. powiadomienia czysto in-app)
  push?: boolean;
}

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendOneSignalPush(
  playerId: string,
  title: string,
  message: string | undefined,
  link: string | undefined,
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn(
      "[notifications] OneSignal env vars not set — skipping push",
    );
    return;
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
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
 * Wysyła powiadomienie do użytkownika:
 * 1. Zapisuje rekord w DB (zawsze pojawi się w dzwoneczku).
 * 2. Jeśli user.isNotificationEnabled === true i ma oneSignalPlayerId — wysyła push.
 *
 * Push jest best-effort: błędy OneSignal nie blokują zapisu do DB.
 */
export async function sendNotification(input: SendNotificationInput) {
  const { userId, title, message, type = "INFO", link, push = true } = input;

  const notification = await prisma.notification.create({
    data: { userId, title, message, type, link },
  });

  if (!push) return notification;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isNotificationEnabled: true, oneSignalPlayerId: true },
  });

  if (user?.isNotificationEnabled && user.oneSignalPlayerId) {
    await sendOneSignalPush(user.oneSignalPlayerId, title, message, link);
  }

  return notification;
}

/**
 * Wysyła to samo powiadomienie do wszystkich Adminów (rola ADMIN).
 * Używaj do alertów typu "nowa rejestracja", "wpłata zadatku".
 */
export async function sendNotificationToAdmins(
  input: Omit<SendNotificationInput, "userId">,
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      sendNotification({ ...input, userId: admin.id }),
    ),
  );
}
