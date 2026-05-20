import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

// ==========================================
// SCHEMAT WALIDACJI (ZOD)
// ==========================================
const featureCampSchema = z.object({
  // ID może być opcjonalne/nullem, jeśli chcemy po prostu usunąć wyróżnienie ze wszystkich
  id: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Body zapytania (Zod parse JSON)
    const body = await req.json();
    const validatedBody = featureCampSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    // Wyciągamy bezpiecznie zwalidowane dane
    const { id } = validatedBody.data;

    // 3. LOGIKA BIZNESOWA: Transakcja Prismy
    // Gwarantujemy, że tylko jeden wyjazd będzie wyróżniony
    await prisma.$transaction([
      // Krok A: Zdejmujemy flagę isFeatured ze wszystkich campów
      prisma.camp.updateMany({
        data: { isFeatured: false },
      }),
      // Krok B: Jeśli podano ID, ustawiamy flagę isFeatured tylko dla tego jednego campa
      ...(id
        ? [
            prisma.camp.update({
              where: { id },
              data: { isFeatured: true },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd zapisu wyróżnionego campa:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
