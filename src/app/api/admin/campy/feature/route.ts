// Plik: src/app/api/admin/campy/feature/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    // Używamy transakcji Prismy, żeby zagwarantować, że tylko jeden wyjazd będzie wyróżniony
    await prisma.$transaction([
      // 1. Zdejmujemy flagę isFeatured ze wszystkich campów
      prisma.camp.updateMany({
        data: { isFeatured: false },
      }),
      // 2. Jeśli podano ID, ustawiamy flagę isFeatured tylko dla tego jednego campa
      ...(id
        ? [
            prisma.camp.update({
              where: { id },
              data: { isFeatured: true },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd zapisu wyróżnionego campa:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
