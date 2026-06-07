import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET — deep-linki nieprzeczytanych powiadomień czatu zalogowanego użytkownika.
// Paski nawigacji porównują własny href zakładki "Czat" z tą listą i pokazują
// pulsujący wskaźnik, gdy jest tam nowa wiadomość.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      isRead: false,
      link: { contains: "/chat" },
    },
    select: { link: true },
    distinct: ["link"],
  });

  const links = rows.map((r) => r.link).filter((l): l is string => Boolean(l));
  return NextResponse.json({ links });
}

const postSchema = z.object({ link: z.string().min(1) });

// POST — oznacza nieprzeczytane powiadomienia danego czatu jako przeczytane.
// Wołane przy wejściu na ekran czatu, żeby zgasić wskaźnik nowej wiadomości.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const result = await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false, link: parsed.data.link },
    data: { isRead: true },
  });

  return NextResponse.json({ updated: result.count });
}
