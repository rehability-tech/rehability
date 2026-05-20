import { prisma } from "@/lib/prisma";
import { blogBasicSchema } from "@/lib/zod/blogValidators";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();
    const { id, ...dataToValidate } = body;

    const validated = blogBasicSchema.parse(dataToValidate);

    const postData = {
      title: validated.title,
      slug: validated.slug,
      excerpt: validated.excerpt,
      coverImage: validated.coverImage,
      category: validated.category ?? "Ogólne",
      tags: validated.tags ?? [],
      author: validated.author ?? "Piotr Siemaszko",
      readTime: validated.readTime,
      lastStage: validated.lastStage || "edytor-tresci",
    };

    let post;

    if (id) {
      post = await prisma.post.update({ where: { id }, data: postData });
    } else {
      post = await prisma.post.create({ data: postData });
    }

    return NextResponse.json({ success: true, postId: post.id, lastStage: post.lastStage });
  } catch (error: any) {
    console.error("Błąd zapisu posta:", error);

    if (error && typeof error === "object" && "issues" in error) {
      const msg = error.issues[0]?.message || "Nieprawidłowe dane";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Post o tym slugu już istnieje. Zmień slug." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
