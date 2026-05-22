import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// TO JEST KLUCZOWE - wymusza pobieranie świeżych danych przy każdym odświeżeniu
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const camps = await prisma.camp.findMany({
      orderBy: { createdAt: "desc" },
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
        heroImage: true,
        mapUrl: true,
        allowBringFriend: true,
        blocks: true, // <--- Upewnij się, że to tutaj jest!
      },
    });

    return NextResponse.json(camps);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Błąd" }, { status: 500 });
  }
}
