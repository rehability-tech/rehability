import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const prefsSchema = z.object({
  isNotificationEnabled: z.boolean().optional(),
  oneSignalPlayerId: z.string().nullable().optional(),
  // pozwala odnotować, że soft-prompt został pokazany (i odroczyć kolejny)
  markPrompted: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isNotificationEnabled: true,
      notificationPromptedAt: true,
      oneSignalPlayerId: true,
    },
  });

  return NextResponse.json({ preferences: user });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = prefsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const { isNotificationEnabled, oneSignalPlayerId, markPrompted } =
    parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(isNotificationEnabled !== undefined && { isNotificationEnabled }),
      ...(oneSignalPlayerId !== undefined && { oneSignalPlayerId }),
      ...(markPrompted && { notificationPromptedAt: new Date() }),
    },
    select: {
      isNotificationEnabled: true,
      notificationPromptedAt: true,
      oneSignalPlayerId: true,
    },
  });

  return NextResponse.json({ preferences: updated });
}
