import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Lista ID ulubionych („zapisanych") kursów zalogowanego użytkownika.
export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const rows = await prisma.courseFavorite.findMany({
    where: { userId },
    select: { courseId: true },
  });
  return NextResponse.json({ ids: rows.map((r) => r.courseId) });
}

// Dodanie/usunięcie kursu z ulubionych (idempotentnie).
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { courseId, saved } = (await request.json().catch(() => ({}))) as {
    courseId?: string;
    saved?: boolean;
  };
  if (!courseId) {
    return NextResponse.json({ error: "Brak courseId." }, { status: 400 });
  }

  if (saved === false) {
    await prisma.courseFavorite.deleteMany({ where: { userId, courseId } });
    return NextResponse.json({ ok: true, saved: false });
  }

  // saved === true (domyślnie) → upsert idempotentny.
  await prisma.courseFavorite.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
  return NextResponse.json({ ok: true, saved: true });
}
