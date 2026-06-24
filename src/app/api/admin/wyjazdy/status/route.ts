import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { validateTripCompleteness } from "@/lib/trips/validateTripCompleteness";
import { createSystemUpdate } from "@/lib/notifications/send";
import { notifyIndexNow } from "@/lib/seo/indexing";
import { absoluteUrl } from "@/lib/seo/site";
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
    let previousStatus: string | null = null;
    if (status === "PUBLISHED") {
      const trip = await prisma.trip.findUnique({ where: { id } });

      if (!trip) {
        return NextResponse.json(
          { error: "Nie znaleziono wyjazdu" },
          { status: 404 },
        );
      }

      previousStatus = trip.status;

      const { isComplete, missing } = validateTripCompleteness(trip);

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
    const updatedCamp = await prisma.trip.update({
      where: { id },
      data: { status },
    });

    // 5. SYSTEM_UPDATE [D] + PUSH [P] do uczestniczek — tylko przy pierwszej publikacji
    if (status === "PUBLISHED" && previousStatus !== "PUBLISHED") {
      createSystemUpdate({
        type: "CAMP",
        title: `Nowy wyjazd: ${updatedCamp.title}`,
        description:
          updatedCamp.description?.slice(0, 240) ||
          "Sprawdź nowy wyjazd w ofercie.",
        link: `/wyjazdy/${updatedCamp.id}`,
        push: true,
      }).catch((err) =>
        console.error("[wyjazdy/status] createSystemUpdate failed:", err),
      );

      // IndexNow — powiadom wyszukiwarki (Bing/Yandex/...) o nowym wyjeździe,
      // pomijając te oznaczone jako noIndex (spójnie z sitemap.xml). notifyIndexNow
      // nigdy nie rzuca; Google dociąga wyjazd z sitemap.xml (nie IndexNow).
      if (!updatedCamp.noIndex) {
        await notifyIndexNow(absoluteUrl(`/wyjazdy/${updatedCamp.id}`));
      }
    }

    return NextResponse.json({ success: true, trip: updatedCamp });
  } catch (error: any) {
    console.error("Błąd zmiany statusu:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas zmiany statusu" },
      { status: 500 },
    );
  }
}
