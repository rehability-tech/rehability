import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Zapobiegamy mocnemu cache'owaniu przez Next.js, żeby lista zawsze była świeża po dodaniu nowego campa
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      orderBy: {
        createdAt: "desc", // Najnowsze na górze
      },
      // Pobieramy tylko te pola, których potrzebujemy do listy (optymalizacja)
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        location: true,
        capacity: true,
        isFeatured: true,
        lastStage: true,
        heroImage: true, // <--- ZMIANA: imageUrl zmienione na heroImage
      },
    });

    return NextResponse.json(camps);
  } catch (error) {
    console.error("Błąd pobierania campów:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać listy wyjazdów" },
      { status: 500 },
    );
  }
}
