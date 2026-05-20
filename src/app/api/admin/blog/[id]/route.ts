import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";
import { blogContentSchema, blogSeoSchema } from "@/lib/zod/blogValidators";

const paramsSchema = z.object({ id: z.string().min(1) });

const patchBodySchema = z.union([
  blogContentSchema.extend({ action: z.literal("content") }),
  blogSeoSchema.extend({ action: z.literal("seo") }),
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post)
      return NextResponse.json(
        { error: "Nie znaleziono posta" },
        { status: 404 },
      );

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);
    const body = await req.json();
    const validated = patchBodySchema.parse(body);

    let data: Record<string, unknown>;

    if (validated.action === "content") {
      data = { content: validated.content, lastStage: "seo" };
    } else {
      data = {
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        focusKeyword: validated.focusKeyword,
        ogImage: validated.ogImage,
        canonicalUrl: validated.canonicalUrl,
        noIndex: validated.noIndex ?? false,
        lastStage: "seo",
      };
    }

    const post = await prisma.post.update({ where: { id }, data });
    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Błąd PATCH posta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
