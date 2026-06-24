import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordCourseView } from "@/lib/courses-view";

// Beacon z publicznej strony kursu — strona jest statyczna (ISR), więc licznik
// wyświetleń nabijamy z klienta przez ten endpoint.
export async function POST(request: NextRequest) {
  try {
    const { slug } = (await request.json().catch(() => ({}))) as {
      slug?: string;
    };
    if (!slug) {
      return NextResponse.json({ error: "Brak slug" }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await recordCourseView(course.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API_KURSY_VIEW_ERROR]", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
