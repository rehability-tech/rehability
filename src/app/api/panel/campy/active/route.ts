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
    const activeBooking = await prisma.booking.findFirst({
      where: {
        email: session.user.email,
        status: { in: ["DEPOSIT_PAID", "FULLY_PAID", "PENDING"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        amountPaid: true,
        updatedAt: true, // <--- TUTAJ DODAJESZ TĘ LINIJKĘ
        camp: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            heroImage: true,
          },
        },
      },
    });

    return NextResponse.json({ booking: activeBooking });
  } catch (error) {
    console.error("[API] Błąd pobierania aktywnego campu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd wewnętrzny" },
      { status: 500 },
    );
  }
}
