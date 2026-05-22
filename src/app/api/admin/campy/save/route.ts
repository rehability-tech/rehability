import { prisma } from "@/lib/prisma";
import { campSchema } from "@/lib/zod/campsValidators";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { validateCampCompleteness } from "@/lib/camps/validateCampCompleteness";

export async function POST(req: Request) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();

    // 2. Oddzielamy metadane (id, lastStage) od danych do walidacji
    const { id, lastStage, ...dataToValidate } = body;

    // 3. Walidacja Zod - OD TEGO MOMENTU UŻYWAMY TYLKO validatedData
    const validatedData = campSchema.parse(dataToValidate);

    // Walidacja logiki dat
    if (validatedData.endDate < validatedData.startDate) {
      return NextResponse.json(
        { error: "Data zakończenia nie może być przed datą rozpoczęcia" },
        { status: 400 },
      );
    }

    // 4. PRZYGOTOWANIE OBIEKTU DANYCH
    // Zod już zwalidował i przekonwertował (coerce) typy na Date i number!
    const campData = {
      title: validatedData.title,
      location: validatedData.location,
      mapUrl: validatedData.mapUrl,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      capacity: validatedData.capacity,
      price: validatedData.price,
      deposit: validatedData.deposit,
      allowBringFriend: validatedData.allowBringFriend, // <--- NOWA LINIA
      description: validatedData.description,
      lastAiPrompt: validatedData.lastAiPrompt,
      lastStage: lastStage || "dane-podstawowe",
    };

    let camp;
    let forcedDraft = false;

    if (id) {
      // 5a. AKTUALIZACJA
      // Pobieramy aktualny stan campa, żeby wiedzieć, czy był PUBLISHED
      const existingCamp = await prisma.camp.findUnique({ where: { id } });
      if (!existingCamp) {
        return NextResponse.json(
          { error: "Nie znaleziono wyjazdu o podanym ID" },
          { status: 404 },
        );
      }

      // Składamy "post-update" kształt campa do walidacji kompletności.
      // heroImage / blocks nie są edytowane w tym endpointzie — bierzemy z bazy.
      if (existingCamp.status === "PUBLISHED") {
        const mergedCamp = {
          heroImage: existingCamp.heroImage,
          location: campData.location,
          startDate: campData.startDate,
          endDate: campData.endDate,
          mapUrl: campData.mapUrl,
          allowBringFriend: campData.allowBringFriend,
          blocks: existingCamp.blocks,
        };
        const { isComplete } = validateCampCompleteness(mergedCamp);
        if (!isComplete) forcedDraft = true;
      }

      camp = await prisma.camp.update({
        where: { id },
        data: {
          ...campData,
          ...(forcedDraft ? { status: "DRAFT" } : {}),
        },
      });
    } else {
      // 5b. TWORZENIE
      camp = await prisma.camp.create({
        data: campData,
      });
    }

    return NextResponse.json({
      success: true,
      campId: camp.id,
      lastStage: camp.lastStage,
      ...(forcedDraft
        ? {
            forcedDraft: true,
            message: "Cofnięto publikację z powodu braków w treści",
          }
        : {}),
    });
  } catch (error: any) {
    console.error("Błąd zapisu campa:", error);

    // Obsługa błędów walidacji Zod
    if (error && typeof error === "object" && "issues" in error) {
      const errorMessage =
        error.issues[0]?.message || "Nieprawidłowe dane wejściowe";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Błąd serwera podczas zapisu" },
      { status: 500 },
    );
  }
}
