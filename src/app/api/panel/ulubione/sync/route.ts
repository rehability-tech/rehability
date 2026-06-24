import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Migracja ulubionych z localStorage do bazy po zalogowaniu: scala przesłane ID
// z istniejącymi (bez duplikatów) i zwraca pełną, aktualną listę.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { ids } = (await request.json().catch(() => ({}))) as {
    ids?: unknown;
  };
  const incoming = Array.isArray(ids)
    ? Array.from(new Set(ids.filter((x): x is string => typeof x === "string")))
    : [];

  if (incoming.length) {
    // Tylko istniejące kursy (gość mógł mieć w localStorage ID usuniętych kursów).
    const valid = await prisma.course.findMany({
      where: { id: { in: incoming } },
      select: { id: true },
    });
    if (valid.length) {
      await prisma.courseFavorite.createMany({
        data: valid.map((c) => ({ userId, courseId: c.id })),
        skipDuplicates: true,
      });
    }
  }

  const rows = await prisma.courseFavorite.findMany({
    where: { userId },
    select: { courseId: true },
  });
  return NextResponse.json({ ids: rows.map((r) => r.courseId) });
}
