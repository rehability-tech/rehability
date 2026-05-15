import { prisma } from "@/lib/prisma";
import { campSchema } from "@/lib/zod/campsValidators"; // Upewnij się, że w schemacie Zod też dopisałeś lastStage (opcjonalnie)
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Walidacja Zod
    const validatedData = campSchema.parse(body);

    // Walidacja logiki dat
    if (validatedData.endDate < validatedData.startDate) {
      return NextResponse.json(
        { error: "Data zakończenia nie może być przed datą rozpoczęcia" },
        { status: 400 },
      );
    }

    // Wyciągamy id i lastStage (który może przyjść z frontu lub mieć wartość domyślną)
    const { id, lastStage, ...data } = body;

    let camp;

    if (id) {
      // 2a. AKTUALIZACJA istniejącego campa
      camp = await prisma.camp.update({
        where: { id },
        data: {
          title: data.title,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          capacity: parseInt(data.capacity),
          price: parseFloat(data.price),
          deposit: parseFloat(data.deposit),
          lastAiPrompt: data.lastAiPrompt,
          // Jeśli front przesyła stage, aktualizujemy go
          lastStage: lastStage || "dane-podstawowe",
        },
      });
    } else {
      // 2b. TWORZENIE nowego campa
      camp = await prisma.camp.create({
        data: {
          title: data.title,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          capacity: parseInt(data.capacity),
          price: parseFloat(data.price),
          deposit: parseFloat(data.deposit),
          lastAiPrompt: data.lastAiPrompt,
          lastStage: lastStage || "dane-podstawowe",
        },
      });
    }

    return NextResponse.json({
      success: true,
      campId: camp.id,
      lastStage: camp.lastStage,
    });
  } catch (error) {
    console.error("Błąd zapisu campa:", error);

    // Obsługa błędów walidacji Zod
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane wejściowe" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Błąd serwera podczas zapisu" },
      { status: 500 },
    );
  }
}
