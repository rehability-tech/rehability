// src/app/api/wyjazdy/[tripId]/chat/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  tripId: z.string().cuid("Nieprawidłowy format ID wyjazdu"),
});

const postBodySchema = z.object({
  text: z.string().trim().min(1, "Wiadomość nie może być pusta").max(2000),
});

/**
 * Sprawdza, czy zalogowany użytkownik ma dostęp do czatu danego wyjazdu.
 * Admin ma dostęp zawsze. Uczestniczka tylko jeśli posiada rezerwację (po userId lub e-mailu).
 * Zwraca kontekst potrzebny do dalszej obsługi żądania albo `null` przy braku dostępu.
 */
async function resolveAccess(tripId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    const ownership: Array<Record<string, string>> = [{ userId: session.user.id }];
    if (session.user.email) ownership.push({ email: session.user.email });

    const booking = await prisma.booking.findFirst({
      where: { tripId, OR: ownership },
      select: { id: true },
    });
    if (!booking) return null;
  }

  return {
    userId: session.user.id,
    userName: session.user.name ?? "Uczestniczka",
    userImage: session.user.image ?? null,
    isAdmin,
  };
}

// GET — chronologiczna lista wiadomości wraz z danymi nadawcy.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe zapytanie" }, { status: 400 });
  }

  const { tripId } = parsed.data;
  const access = await resolveAccess(tripId);
  if (!access) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      isAdmin: true,
      userId: true,
      user: { select: { name: true, image: true, role: true } },
    },
  });

  return NextResponse.json({
    currentUserId: access.userId,
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      isAdmin: m.isAdmin,
      senderId: m.userId,
      senderName: m.user?.name ?? "Uczestniczka",
      senderImage: m.user?.image ?? null,
      senderRole: m.user?.role ?? "USER",
      isMine: m.userId === access.userId,
    })),
  });
}

// POST — zapis wiadomości + powiadomienie drugiej strony (in-app + push).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe zapytanie" }, { status: 400 });
  }

  const { tripId } = parsed.data;
  const access = await resolveAccess(tripId);
  if (!access) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsedBody = postBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );
  }

  const { text } = parsedBody.data;
  const { isAdmin, userId, userName } = access;

  const message = await prisma.message.create({
    data: { tripId, userId, text, isAdmin },
    select: {
      id: true,
      text: true,
      createdAt: true,
      isAdmin: true,
      userId: true,
      user: { select: { name: true, image: true, role: true } },
    },
  });

  // Powiadomienia odpalamy "fire & forget" — nie blokujemy odpowiedzi czatu.
  void notifyChat({ tripId, text, isAdmin, senderId: userId, senderName: userName });

  return NextResponse.json(
    {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      isAdmin: message.isAdmin,
      senderId: message.userId,
      senderName: message.user?.name ?? userName,
      senderImage: message.user?.image ?? null,
      senderRole: message.user?.role ?? (isAdmin ? "ADMIN" : "USER"),
      isMine: true,
    },
    { status: 201 },
  );
}

const SNIPPET_MAX = 120;

interface NotifyArgs {
  tripId: string;
  text: string;
  isAdmin: boolean;
  senderId: string;
  senderName: string;
}

/**
 * Routing powiadomień:
 * - Admin pisze  -> powiadamiamy uczestniczki (każda dostaje deep-link do SWOJEJ rezerwacji).
 * - User pisze    -> powiadamiamy adminów (jeden wspólny link do panelu admina).
 */
async function notifyChat({ tripId, text, isAdmin, senderId, senderName }: NotifyArgs) {
  const snippet =
    text.length > SNIPPET_MAX ? `${text.slice(0, SNIPPET_MAX).trimEnd()}…` : text;

  try {
    if (isAdmin) {
      // Każda uczestniczka ma własny bookingId, więc deep-link musi być per-osobę.
      const bookings = await prisma.booking.findMany({
        where: {
          tripId,
          userId: { not: null },
          status: { notIn: ["CANCELLED", "EXPIRED", "PENDING_INVITATION"] },
        },
        select: { id: true, userId: true },
      });

      await Promise.allSettled(
        bookings
          .filter((b) => b.userId && b.userId !== senderId)
          .map((b) =>
            dispatchNotification({
              target: "USER",
              userIds: [b.userId as string],
              title: "Wiadomość od organizatora",
              message: snippet,
              link: `/panel/wyjazdy/${b.id}/chat`,
              type: "INFO",
              channels: ["IN_APP", "PUSH"],
            }),
          ),
      );
    } else {
      await dispatchNotification({
        target: "ADMIN",
        title: `Nowa wiadomość od ${senderName}`,
        message: snippet,
        link: `/admin/wyjazdy/${tripId}/chat`,
        type: "INFO",
        channels: ["IN_APP", "PUSH"],
      });
    }
  } catch (err) {
    console.error("[Chat] Notification dispatch failed:", err);
  }
}
