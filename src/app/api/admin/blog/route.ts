import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        author: true,
        readTime: true,
        status: true,
        publishedAt: true,
        lastStage: true,
        createdAt: true,
        updatedAt: true,
        metaTitle: true,
        metaDescription: true,
        focusKeyword: true,
        noIndex: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Błąd pobierania postów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
