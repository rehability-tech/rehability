import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Brak ID" }, { status: 400 });
    }

    const camp = await prisma.camp.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json({ success: true, campId: camp.id });
  } catch (error) {
    console.error("Błąd podczas publikacji campa:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
