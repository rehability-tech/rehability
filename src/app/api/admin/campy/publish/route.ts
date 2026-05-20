import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

// ==========================================
// SCHEMAT WALIDACJI (ZOD)
// ==========================================
const publishCampSchema = z.object({
  id: z.string().min(1, "Brak ID Campa do opublikowania"),
});

export async function POST(req: Request) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Body zapytania (Zod)
    const body = await req.json();
    const validatedBody = publishCampSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    // Wyciągamy bezpiecznie zwalidowane dane
    const { id } = validatedBody.data;

    // 3. LOGIKA BIZNESOWA: Aktualizacja statusu
    const camp = await prisma.camp.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json({ success: true, campId: camp.id });
  } catch (error) {
    console.error("Błąd podczas publikacji campa:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
