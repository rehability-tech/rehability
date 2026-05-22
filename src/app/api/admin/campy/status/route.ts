import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { validateCampCompleteness } from "@/lib/camps/validateCampCompleteness";
import { z } from "zod";

// Definiujemy schemat Zod dla aktualizacji statusu
const statusUpdateSchema = z.object({
  id: z.string().min(1, "ID wyjazdu jest wymagane"),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"], {
    message: "Nieprawidłowy status wyjazdu",
  }),
});

export async function PATCH(req: Request) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();

    // 2. Walidacja Zod
    const validationResult = statusUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.issues[0]?.message || "Błąd walidacji",
        },
        { status: 400 },
      );
    }

    // Wyciągamy bezpieczne i zwalidowane dane
    const { id, status } = validationResult.data;

    // =================================================================
    // 3. TWARDA WALIDACJA PRZED PUBLIKACJĄ (Blokada "pustaków")
    // =================================================================
    if (status === "PUBLISHED") {
      const camp = await prisma.camp.findUnique({ where: { id } });

      if (!camp) {
        return NextResponse.json(
          { error: "Nie znaleziono wyjazdu" },
          { status: 404 },
        );
      }

      const { isComplete, missing } = validateCampCompleteness(camp);

      if (!isComplete) {
        return NextResponse.json(
          {
            error: `Nie można opublikować. Brakuje: ${missing.join(", ")}.`,
            missing,
          },
          { status: 400 },
        );
      }
    }

    // 4. Aktualizacja w bazie
    const updatedCamp = await prisma.camp.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, camp: updatedCamp });
  } catch (error: any) {
    console.error("Błąd zmiany statusu:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas zmiany statusu" },
      { status: 500 },
    );
  }
}
