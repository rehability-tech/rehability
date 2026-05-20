import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
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

      const missing: string[] = [];

      // Sprawdzamy podstawowe wartości
      if (!camp.heroImage) missing.push("zdjęcia (tła)");
      if (!camp.location) missing.push("lokalizacji");
      if (!camp.startDate || !camp.endDate) missing.push("daty wyjazdu");

      // Sprawdzamy ilość bloków i czy znajduje się tam blok mapy
      let blocksCount = 0;
      let hasMapBlock = false;

      if (camp.blocks) {
        try {
          const parsed =
            typeof camp.blocks === "string"
              ? JSON.parse(camp.blocks)
              : camp.blocks;
          if (Array.isArray(parsed)) {
            blocksCount = parsed.length;
            hasMapBlock = parsed.some((block: any) => block.type === "map");
          }
        } catch (e) {
          console.error("Błąd podczas parsowania JSON-a bloków", e);
        }
      }

      if (blocksCount < 3) missing.push("minimum 3 bloków w Edytorze Treści");

      // Jeżeli dodano blok mapy, sprawdzamy pole mapUrl wyciągnięte BEZPOŚREDNIO z bazy
      if (hasMapBlock && (!camp.mapUrl || camp.mapUrl.trim() === "")) {
        missing.push("linku do mapy Google (wymagany przez dodany blok mapy)");
      }

      // Jeśli czegokolwiek brakuje, blokujemy zapytanie i zwracamy powód
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Nie można opublikować. Brakuje: ${missing.join(", ")}.` },
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
