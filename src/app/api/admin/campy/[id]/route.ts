import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { z } from "zod";

// ==========================================
// SCHEMATY WALIDACJI (ZOD)
// ==========================================

// Walidacja ID w parametrach ścieżki
const paramsSchema = z.object({
  id: z.string().min(1, "Brak ID Campa"),
});

// Walidacja danych wejściowych dla PATCH (Edytor treści)
const patchBodySchema = z.object({
  subtitle: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  heroImage: z.string().url("Niepoprawny URL zdjęcia").nullable().optional(),
  description: z.string().nullable().optional(),
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
    const { subtitle, tags, heroImage, description, blocks } =
      validatedBody.data;

    // 4. Logika biznesowa - Aktualizacja w bazie danych
    const updatedCamp = await prisma.camp.update({
      where: { id: id },
      data: {
        subtitle,
        tags,
        heroImage,
        description,
        blocks, // Prisma zapisze tablicę obiektów jako JSONB w Postgresie
        lastStage: "edytor-tresci", // Aktualizujemy krok, w którym jest admin
      },
    });

    return NextResponse.json(updatedCamp);
  } catch (error) {
    console.error("Błąd API podczas zapisu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisu danych" },
      { status: 500 },
    );
  }
}
