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

export type SystemUpdateType = "VOD" | "CAMP" | "BLOG" | "SYSTEM";

export interface SendNotificationInput {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  link?: string;
  // Jeśli false — tylko zapis do DB, bez push (np. powiadomienia czysto in-app)
  push?: boolean;
}

export interface CreateSystemUpdateInput {
  type: SystemUpdateType;
  title: string;
  description: string;
  link?: string;
  // Jeśli true — wyśle Push na telefony wszystkich użytkowniczek z włączonymi powiadomieniami
  push?: boolean;
}
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Ulepszona funkcja - przyjmuje tablicę playerIds zamiast pojedynczego stringa
async function sendOneSignalPush(
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
 * 1. INDYWIDUALNE: Wysyła powiadomienie do konkretnego użytkownika.
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
    await sendOneSignalPush([user.oneSignalPlayerId], title, message, link);
  }

  return notification;
}

/**
 * 2. ADMINI: Wysyła to samo powiadomienie do wszystkich Adminów.
 */
export async function sendNotificationToAdmins(
  input: Omit<SendNotificationInput, "userId">,
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, oneSignalPlayerId: true, isNotificationEnabled: true },
  });

  // Tworzymy rekordy w bazie dla każdego admina (do dzwoneczka)
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          title: input.title,
          message: input.message,
          type: input.type || "SYSTEM",
          link: input.link,
        },
      }),
    ),
  );

  if (input.push !== false) {
    const adminPlayerIds = admins
      .filter((a) => a.isNotificationEnabled && a.oneSignalPlayerId)
      .map((a) => a.oneSignalPlayerId as string);

    await sendOneSignalPush(
      adminPlayerIds,
      input.title,
      input.message,
      input.link,
    );
  }
}

/**
 * 3. GLOBALNE: Tworzy nowość widoczną na pulpicie (SystemUpdate)
 * i Opcjonalnie wysyła Push do wszystkich. Nie spamuje bazy Notification!
 */
export async function createSystemUpdate(input: CreateSystemUpdateInput) {
  const { type, title, description, link, push = false } = input;

  // 1. Zapisujemy w tabeli SystemUpdate (widoczne dla wszystkich pod "Ostatnie nowości")
  const update = await prisma.systemUpdate.create({
    data: { type, title, description, link },
  });

  // 2. Jeśli admin chce, powiadamiamy użytkowniczki na telefony
  if (push) {
    const subscribedUsers = await prisma.user.findMany({
      where: {
        isNotificationEnabled: true,
        oneSignalPlayerId: { not: null },
      },
      select: { oneSignalPlayerId: true },
    });

    const playerIds = subscribedUsers.map((u) => u.oneSignalPlayerId as string);

    // Wysyłamy zbiorczego pusha
    await sendOneSignalPush(playerIds, title, description, link);
  }

  return update;
}
