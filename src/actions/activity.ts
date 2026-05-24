"use server";

import { prisma } from "@/lib/prisma";
// revalidatePath odświeża cache Next.js, dzięki czemu przy kolejnym pobraniu mamy nowe dane
import { revalidatePath } from "next/cache";

type Pillar = "CAMP" | "VOD" | "BLOG" | "SYSTEM";
type Kind =
  | "PAYMENT"
  | "VOD_PURCHASE"
  | "POST_PUBLISHED"
  | "HEALTH_FILLED"
  | "SIGNUP"
  | "SERVICE_ORDER";

interface LogActivityProps {
  pillar: Pillar;
  kind: Kind;
  who: string;
  text: string;
  meta?: string;
}

export async function logActivity(data: LogActivityProps) {
  try {
    const activity = await prisma.activity.create({
      data: {
        pillar: data.pillar,
        kind: data.kind,
        who: data.who,
        text: data.text,
        meta: data.meta,
      },
    });

    // Powiedz Next.js, że strona admina ma nieaktualne dane i musi je odświeżyć
    revalidatePath("/admin");

    return { success: true, activity };
  } catch (error) {
    console.error("[ACTIVITY_LOG_ERROR]", error);
    return { success: false, error: "Nie udało się zapisać aktywności" };
  }
}
