import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Wyciągamy dane przysłane z edytora
    const { subtitle, tags, heroImage, description, blocks } = body;

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
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }
}
