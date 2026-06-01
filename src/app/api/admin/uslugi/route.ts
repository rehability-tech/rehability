import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await prisma.extraService.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd pobierania usług" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, duration, price, description, image } = body;

    if (!name || !duration || !price) {
      return NextResponse.json(
        { error: "Brak wymaganych pól" },
        { status: 400 },
      );
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json(
        { error: "Opis usługi jest wymagany" },
        { status: 400 },
      );
    }

    const newService = await prisma.extraService.create({
      data: {
        name,
        duration: parseInt(duration, 10), // <--- ZMIANA: Zmieniamy tekst z formularza na liczbę
        price: parseFloat(price),
        description,
        image: typeof image === "string" && image.trim() ? image : null,
      },
    });

    return NextResponse.json(newService);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd podczas zapisu usługi" },
      { status: 500 },
    );
  }
}
// ... (istniejący kod GET i POST pozostaje bez zmian)

// EDYCJA ISTNIEJĄCEJ USŁUGI
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, duration, price, description, image } = body;

    if (!id || !name || !duration || !price) {
      return NextResponse.json(
        { error: "Brakuje wymaganych pól" },
        { status: 400 },
      );
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json(
        { error: "Opis usługi jest wymagany" },
        { status: 400 },
      );
    }

    const data = {
      name,
      duration: parseInt(duration, 10),
      price: parseFloat(price),
      description,
      image:
        image === null
          ? null
          : typeof image === "string" && image.trim()
            ? image
            : undefined,
    };

    // Propagacja: edycja w katalogu globalnym aktualizuje też wszystkie
    // kopie usługi przypisane do campów (TripService powiązane przez sourceServiceId).
    const [updatedService] = await prisma.$transaction([
      prisma.extraService.update({ where: { id }, data }),
      prisma.tripService.updateMany({ where: { sourceServiceId: id }, data }),
    ]);

    return NextResponse.json(updatedService);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd aktualizacji usługi" },
      { status: 500 },
    );
  }
}
