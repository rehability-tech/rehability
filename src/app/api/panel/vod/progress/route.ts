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

  const { lessonId, completed } = (await request.json().catch(() => ({}))) as {
    lessonId?: string;
    completed?: boolean;
  };
  if (!lessonId) {
    return NextResponse.json({ error: "Brak lessonId." }, { status: 400 });
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: !!completed },
    create: { userId, lessonId, completed: !!completed },
  });

  return NextResponse.json({ ok: true });
}
