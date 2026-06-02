import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolvePackage, PACKAGE_RELATION_SELECT } from "@/lib/bookings/partner";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tripId } = await params;

  // SECURITY & VALIDATION: Wczesne odrzucenie błędnego żądania
  if (!tripId) {
    return NextResponse.json({ error: "Missing trip ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  // SECURITY: Sprawdzenie uprawnień
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // OPTIMIZATION: Zrównoleglenie zapytań (Promise.all) eliminuje waterfall.
    // Zamiast dołączać zdjęcie campa do każdej rezerwacji (redundancja danych), pobieramy je raz.
    const [trip, participants] = await Promise.all([
      prisma.trip.findUnique({
        where: { id: tripId },
        select: { heroImage: true }, // INFO: Podmień na 'imageUrl' / 'coverImage' jeśli tak nazywa się kolumna w bazie
      }),
      prisma.booking.findMany({
        where: {
          tripId: tripId,
          status: { not: "CANCELLED" },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              healthProfile: true,
            },
          },
          serviceOrders: {
            where: { status: { not: "CANCELLED" } },
            // BUGFIX PROACTIVE: Dodałem 'price', ponieważ Twój frontend używa go do sortowania "Najwięcej wydano"
            select: { id: true, price: true },
          },
          ...PACKAGE_RELATION_SELECT,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // ERROR HANDLING: Zabezpieczenie przed usuniętym/nieistniejącym wyjazdem
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Dla każdej rezerwacji dokładamy info o partnerze "pakietu" (zabierz przyjaciółkę).
    const withPackage = participants.map((p) => {
      const pkg = resolvePackage(p);
      return {
        ...p,
        packagePartner: pkg
          ? {
              name: pkg.partner.name,
              relation: pkg.partner.relation,
              active: pkg.active,
            }
          : null,
      };
    });

    return NextResponse.json({
      participants: withPackage,
      heroImage: trip.heroImage,
    });
  } catch (error) {
    console.error("[GET /api/admin/wyjazdy/[id]/uczestnicy] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
