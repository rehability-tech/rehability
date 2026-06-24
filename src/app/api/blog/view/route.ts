import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordPostView } from "@/lib/blog/recordPostView";

// Beacon z publicznej strony wpisu — strona jest statyczna (ISR), więc licznik
// wyświetleń nabijamy z klienta przez ten endpoint.
export async function POST(request: NextRequest) {
  try {
    const { slug } = (await request.json().catch(() => ({}))) as {
      slug?: string;
    };
    if (!slug) {
      return NextResponse.json({ error: "Brak slug" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await recordPostView(post.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API_BLOG_VIEW_ERROR]", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
