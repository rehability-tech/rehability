import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// ==========================================
// SCHEMATY WALIDACJI (ZOD)
// ==========================================

// Walidacja dla parametrów ścieżki (ID)
const paramsSchema = z.object({
  id: z.string().min(1, "Brak ID Campa"),
});

// Walidacja parametrów zapytań URL (searchParams)
const postQuerySchema = z.object({
  filename: z.string().min(1, "Brak nazwy pliku"),
});

const deleteQuerySchema = z.object({
  url: z
    .string()
    .url("Nieprawidłowy adres URL do usunięcia")
    .optional()
    .nullable(),
});

// ==========================================
// FUNKCJA POMOCNICZA: Tworzy SEO-friendly nazwę
// ==========================================
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// ==========================================
// POST: Wgrywanie zdjęcia i aktualizacja bazy
// ==========================================
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Parametry ścieżki
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message }, // <--- ZMIANA TUTAJ
        { status: 400 },
      );
    }
    const campId = validatedParams.data.id;

    // 3. WALIDACJA: Query params (nazwa pliku)
    const { searchParams } = new URL(request.url);
    const validatedQuery = postQuerySchema.safeParse({
      filename: searchParams.get("filename"),
    });

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: validatedQuery.error.issues[0].message }, // <--- ZMIANA TUTAJ
        { status: 400 },
      );
    }
    const originalFilename = validatedQuery.data.filename;

    // 4. Logika biznesowa - pobieranie danych i upload
    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      select: { title: true },
    });

    if (!camp) {
      return NextResponse.json(
        { error: "Nie znaleziono wyjazdu w bazie" },
        { status: 404 },
      );
    }

    const extension = originalFilename.includes(".")
      ? `.${originalFilename.split(".").pop()}`
      : "";

    const rawName = camp.title ? `${camp.title}-hero` : "wyjazd-hero";
    const seoFilename = `${slugify(rawName)}${extension}`;

    const blob = await put(seoFilename, request.body as any, {
      access: "public",
      addRandomSuffix: true,
    });

    const updatedCamp = await prisma.camp.update({
      where: { id: campId },
      data: {
        heroImage: blob.url,
      },
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      camp: updatedCamp,
    });
  } catch (error) {
    console.error("Błąd uploadu i aktualizacji bazy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas przetwarzania" },
      { status: 500 },
    );
  }
}

// ==========================================
// DELETE: Usuwanie zdjęcia z chmury i z bazy
// ==========================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Parametry ścieżki
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message }, // <--- ZMIANA TUTAJ
        { status: 400 },
      );
    }
    const campId = validatedParams.data.id;

    // 3. WALIDACJA: Query params (URL pliku)
    const { searchParams } = new URL(request.url);
    const validatedQuery = deleteQuerySchema.safeParse({
      url: searchParams.get("url"),
    });

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: validatedQuery.error.issues[0].message }, // <--- ZMIANA TUTAJ
        { status: 400 },
      );
    }
    const fileUrl = validatedQuery.data.url;

    // 4. Logika biznesowa - usuwanie pliku i czyszczenie bazy
    if (fileUrl) {
      await del(fileUrl);
    }

    const updatedCamp = await prisma.camp.update({
      where: { id: campId },
      data: {
        heroImage: null,
      },
    });

    return NextResponse.json({
      success: true,
      camp: updatedCamp,
    });
  } catch (error) {
    console.error("Błąd usuwania pliku/bazy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania" },
      { status: 500 },
    );
  }
}
