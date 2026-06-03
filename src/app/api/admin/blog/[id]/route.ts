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
  } catch (error: unknown) {
    // Nieprawidłowe dane wejściowe → 400.
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: error.flatten() },
        { status: 400 },
      );
    }
    // P2025 = rekord nie istnieje (post usunięty / baza zresetowana w trakcie
    // edycji). Zwracamy czytelny 404 zamiast opaque 500, by klient mógł ostrzec.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Artykuł nie istnieje (mógł zostać usunięty lub baza została zresetowana)." },
        { status: 404 },
      );
    }
    console.error("Błąd PATCH posta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);

    // Zwalniamy powiązany wpis harmonogramu (jeśli jest), żeby slot wrócił do
    // puli „do napisania" i nie wisiał z martwym postId.
    await prisma.blogScheduleEntry.updateMany({
      where: { postId: id },
      data: { postId: null, status: "PLANNED" },
    });

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // P2025 = rekord nie istnieje (np. podwójne kliknięcie) — traktujemy jako sukces.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ ok: true, alreadyGone: true });
    }
    console.error("Błąd usuwania posta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
