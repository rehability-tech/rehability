import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

/**
 * Oznacza kurs jako ukończony (single → po obejrzeniu filmu; moduły → po
 * ostatniej lekcji). Idempotentne: ustawia `Enrollment.completedAt` tylko raz,
 * jeśli użytkownik ma dostęp do kursu. Wymaga zalogowania.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { courseId } = (await request.json().catch(() => ({}))) as {
    courseId?: string;
  };
  if (!courseId) {
    return NextResponse.json({ error: "Brak courseId." }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, completedAt: true },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Brak dostępu do kursu." }, { status: 403 });
  }

  // Ustawiamy datę tylko raz — pierwsze ukończenie liczy się jako „kiedy".
  if (!enrollment.completedAt) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { completedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
