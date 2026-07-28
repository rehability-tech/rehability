import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { tripSeoSchema } from "@/lib/zod/tripsValidators";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().min(1, "Brak ID Wydarzenia") });

// ==========================================
// PATCH: Aktualizacja danych SEO Wydarzenia
// ==========================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: id w ścieżce
    const validatedParams = paramsSchema.safeParse(await params);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // 3. WALIDACJA: body (Zod)
    const body = await req.json();
    const validatedBody = tripSeoSchema.safeParse(body);
    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      metaTitle,
      metaDescription,
      focusKeyword,
      ogImage,
      canonicalUrl,
      noIndex,
    } = validatedBody.data;

    // 4. Aktualizacja w bazie + przesunięcie lastStage na "seo"
    const updatedCamp = await prisma.trip.update({
      where: { id },
      data: {
        metaTitle,
        metaDescription,
        focusKeyword,
        ogImage,
        canonicalUrl,
        noIndex: noIndex ?? false,
        lastStage: "seo",
      },
    });

    return NextResponse.json(updatedCamp);
  } catch (error) {
    console.error("Błąd PATCH SEO Wydarzenia:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisu SEO" },
      { status: 500 },
    );
  }
}
