import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Zapis postępu lekcji (ukończono / odznaczono). Wymaga zalogowania.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { lessonId, courseId, seconds, completed } = (await request
    .json()
    .catch(() => ({}))) as {
    lessonId?: string;
    courseId?: string;
    seconds?: number;
    completed?: boolean;
  };

  // Postęp kursu „single" (jeden film, bez lekcji) — zapisujemy obejrzane
  // sekundy na Enrollment. watchedSec rośnie monotonicznie (scrub wstecz nie
  // cofa postępu); 100% liczymy później z videoDurationSec / completedAt.
  if (!lessonId && courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, watchedSec: true },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: "Brak dostępu do kursu." },
        { status: 403 },
      );
    }
    const next = Math.max(
      enrollment.watchedSec,
      Math.max(0, Math.round(seconds ?? 0)),
    );
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        watchedSec: next,
        ...(completed ? { completedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (!lessonId) {
    return NextResponse.json(
      { error: "Brak lessonId lub courseId." },
      { status: 400 },
    );
  }

  // Tryb lekcyjny wymaga dostępu do kursu — inaczej każdy zalogowany mógłby
  // zapisać postęp dowolnej lekcji. Lekcja nie ma courseId, więc idziemy przez
  // lesson → module → courseId i sprawdzamy Enrollment (jak w trybie „single").
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return NextResponse.json(
      { error: "Nie znaleziono lekcji." },
      { status: 404 },
    );
  }
  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId: lesson.module.courseId },
    },
    select: { id: true },
  });
  if (!enrolled) {
    return NextResponse.json(
      { error: "Brak dostępu do kursu." },
      { status: 403 },
    );
  }

  // Postęp lekcji: `completed` (oznaczenie/odznaczenie) i `seconds` (obejrzany
  // czas) są niezależne — tick z playera niesie tylko sekundy, a przycisk tylko
  // flagę. Każde pole aktualizujemy osobno, sekundy monotonicznie (max).
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { seconds: true, completed: true },
  });
  const nextSeconds =
    seconds !== undefined
      ? Math.max(existing?.seconds ?? 0, Math.max(0, Math.round(seconds)))
      : (existing?.seconds ?? 0);
  const nextCompleted =
    completed !== undefined ? !!completed : (existing?.completed ?? false);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: nextCompleted, seconds: nextSeconds },
    create: {
      userId,
      lessonId,
      completed: nextCompleted,
      seconds: nextSeconds,
    },
  });

  return NextResponse.json({ ok: true });
}
