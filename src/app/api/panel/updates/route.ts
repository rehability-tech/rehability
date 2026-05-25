import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const updates = await prisma.systemUpdate.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 5, // Pobieramy 5 najnowszych
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("[API] Błąd pobierania nowości:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd wewnętrzny" },
      { status: 500 },
    );
  }
}
