import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateCampCompleteness } from "@/lib/camps/validateCampCompleteness";

import { z } from "zod";

// ==========================================
// SCHEMATY WALIDACJI (ZOD)
// ==========================================

// Walidacja ID w parametrach ścieżki
const paramsSchema = z.object({
  id: z.string().min(1, "Brak ID Campa"),
});

// Walidacja danych wejściowych dla PATCH (Edytor treści).
// Uwaga: pole `description` jest CELOWO POMINIĘTE — należy do kroku
// "Dane podstawowe" i jest aktualizowane przez /api/admin/campy/save.
// Gdyby tu trafiło (np. ze starego frontu), zod odetnie je w `safeParse`
// dzięki domyślnemu strip-mode, więc nie przedostanie się do Prismy.
const patchBodySchema = z.object({
  subtitle: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  heroImage: z.string().url("Niepoprawny URL zdjęcia").nullable().optional(),
  // blocks to Json z bazy, na froncie przesyłasz tablicę obiektów TipTap,
  // sprawdzamy tylko czy to w ogóle jest przysłane (może być dowolną strukturą json/array)
  blocks: z.any().optional(),
});

// ==========================================
// GET: Pobieranie pojedynczego campa
// ==========================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Parametry ścieżki (id)
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // 3. Logika biznesowa
    const camp = await prisma.camp.findUnique({
      where: { id: id },
    });

    if (!camp) {
      return NextResponse.json(
        { error: "Nie znaleziono wyjazdu o podanym ID" },
        { status: 404 },
      );
    }

    return NextResponse.json(camp);
  } catch (error) {
    console.error("Błąd podczas pobierania pojedynczego campa:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}

// ==========================================
// PATCH: Aktualizacja danych z edytora treści
// ==========================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Parametry ścieżki (id)
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // 3. WALIDACJA: Body zapytania (Zod parse JSON)
    const body = await request.json();
    const validatedBody = patchBodySchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    // Wyciągamy bezpiecznie zwalidowane dane
    // (description celowo pominięty — patrz komentarz przy patchBodySchema)
    const { subtitle, tags, heroImage, blocks } = validatedBody.data;

    // 4. Pobieramy aktualny stan campa — potrzebny do auto-cofnięcia statusu
    const existingCamp = await prisma.camp.findUnique({ where: { id } });
    if (!existingCamp) {
      return NextResponse.json(
        { error: "Nie znaleziono wyjazdu o podanym ID" },
        { status: 404 },
      );
    }

    // 5. Składamy "post-update" kształt campa do walidacji kompletności
    const mergedCamp = {
      heroImage: heroImage !== undefined ? heroImage : existingCamp.heroImage,
      location: existingCamp.location,
      startDate: existingCamp.startDate,
      endDate: existingCamp.endDate,
      mapUrl: existingCamp.mapUrl,
      allowBringFriend: existingCamp.allowBringFriend,
      blocks: blocks !== undefined ? blocks : existingCamp.blocks,
    };

    // Jeśli camp był PUBLISHED, a nowy stan jest niekompletny — wymuszamy DRAFT
    let forcedDraft = false;
    if (existingCamp.status === "PUBLISHED") {
      const { isComplete } = validateCampCompleteness(mergedCamp);
      if (!isComplete) forcedDraft = true;
    }

    // 6. Logika biznesowa - Aktualizacja w bazie danych
    const updatedCamp = await prisma.camp.update({
      where: { id: id },
      data: {
        subtitle,
        tags,
        heroImage,
        // description celowo pominięty — należy do "Dane podstawowe"
        blocks, // Prisma zapisze tablicę obiektów jako JSONB w Postgresie
        lastStage: "edytor-tresci", // Aktualizujemy krok, w którym jest admin
        ...(forcedDraft ? { status: "DRAFT" } : {}),
      },
    });

    return NextResponse.json({
      ...updatedCamp,
      ...(forcedDraft
        ? {
            forcedDraft: true,
            message: "Cofnięto publikację z powodu braków w treści",
          }
        : {}),
    });
  } catch (error) {
    console.error("Błąd API podczas zapisu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisu danych" },
      { status: 500 },
    );
  }
}
