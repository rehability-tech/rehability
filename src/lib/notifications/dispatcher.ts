import { prisma } from "@/lib/prisma";
import { sendOneSignalPush } from "./send";
import type { DispatchPayload, NotificationChannel, TargetAudience } from "./types";

const ONESIGNAL_CHUNK_SIZE = 2000;

/**
 * Centralny dispatcher powiadomień. Pojedyncze wejście dla wszystkich kanałów.
 * - Zapisy DB (IN_APP, ACTIVITY, SYSTEM_UPDATE) lecą synchronicznie.
 * - PUSH i EMAIL puszczane są jako "fire & forget" — błąd integracji nie wywala procesu wołającego.
 */
export async function dispatchNotification(payload: DispatchPayload): Promise<void> {
  const {
    target,
    title,
    message,
    link,
    channels,
    type = "INFO",
    tripId,
    kind,
    who,
  } = payload;

  try {
    const targetIds = await resolveTargetUserIds(target, payload.userIds);

    if (channels.includes("IN_APP") && targetIds.length > 0) {
      await prisma.notification.createMany({
        data: targetIds.map((id) => ({
          userId: id,
          title,
          message,
          link,
          type,
        })),
        skipDuplicates: true,
      });
    }

    if (channels.includes("ACTIVITY") && kind && who) {
      await prisma.activity.create({
        data: {
          pillar: type,
          kind,
          who,
          text: title,
          tripId,
          meta: message,
        },
      });
    }

    if (channels.includes("SYSTEM_UPDATE")) {
      await prisma.systemUpdate.create({
        data: {
          type,
          title,
          description: message,
          link,
        },
      });
    }

    if (channels.includes("PUSH")) {
      handlePushNotification(target, targetIds, title, message, link).catch((err) =>
        console.error("[Dispatcher] Push Error:", err),
      );
    }

    if (channels.includes("EMAIL") && targetIds.length > 0) {
      handleEmailNotification(targetIds, title, message, link).catch((err) =>
        console.error("[Dispatcher] Email Error:", err),
      );
    }
  } catch (error) {
    console.error("[Dispatcher] Core Error:", error);
  }
}

async function resolveTargetUserIds(
  target: TargetAudience,
  userIds: string[] | undefined,
): Promise<string[]> {
  if (target === "ADMIN") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  if (target === "GLOBAL") {
    // Dla GLOBAL nie wypełniamy IN_APP per-user (to by zalało DB).
    // Push jest broadcastem — handlePushNotification poradzi sobie sam.
    return [];
  }

  return Array.from(new Set(userIds ?? []));
}

async function handlePushNotification(
  target: TargetAudience,
  targetIds: string[],
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  const whereClause =
    target === "GLOBAL"
      ? { isNotificationEnabled: true, oneSignalPlayerId: { not: null } }
      : {
          id: { in: targetIds },
          isNotificationEnabled: true,
          oneSignalPlayerId: { not: null },
        };

  if (target !== "GLOBAL" && targetIds.length === 0) return;

  const users = await prisma.user.findMany({
    where: whereClause,
    select: { oneSignalPlayerId: true },
  });

  const playerIds = users.map((u) => u.oneSignalPlayerId as string);
  if (playerIds.length === 0) return;

  for (let i = 0; i < playerIds.length; i += ONESIGNAL_CHUNK_SIZE) {
    const chunk = playerIds.slice(i, i + ONESIGNAL_CHUNK_SIZE);
    await sendOneSignalPush(chunk, title, message, link);
  }
}

// Stub — providera (Resend/Nodemailer) jeszcze nie ma w projekcie.
// Funkcja zostaje, żeby kanał EMAIL działał od razu po dodaniu integracji.
async function handleEmailNotification(
  targetIds: string[],
  _title: string,
  _message: string,
  _link?: string,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[Dispatcher] EMAIL channel requested for ${targetIds.length} user(s) — provider not configured yet, skipping.`,
    );
  }
}

export type { DispatchPayload, NotificationChannel };
