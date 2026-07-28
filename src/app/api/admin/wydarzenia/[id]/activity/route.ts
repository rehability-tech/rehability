import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { NextResponse } from "next/server";

const VALID_TYPES = new Set([
  "PAYMENT",
  "HEALTH_FILLED",
  "SERVICE_BOUGHT",
  "SIGNUP",
  "CHECK_IN",
]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? "5")),
    );
    const typeParam = searchParams.get("type");

    // Filtrujemy po kolumnie relacyjnej `tripId`. Stare rekordy zapisywały
    // tripId w `meta` (przed wprowadzeniem dispatchera) — obsługujemy oba przez OR,
    // żeby historia z migracji nie zniknęła z widoku.
    // Zakładka „Inne" = wszystko, co nie mieści się w nazwanych filtrach
    // (m.in. porzucone i ręcznie usunięte rezerwacje). Wcześniej `OTHER`
    // przelatywał bez dopasowania i pokazywał PEŁNĄ listę.
    const kindFilter: Prisma.ActivityWhereInput =
      typeParam === "OTHER"
        ? { kind: { notIn: Array.from(VALID_TYPES) } }
        : typeParam && VALID_TYPES.has(typeParam)
          ? { kind: typeParam }
          : {};

    const where: Prisma.ActivityWhereInput = {
      OR: [
        { tripId: id },
        { tripId: null, meta: id, pillar: "CAMP" },
      ],
      ...kindFilter,
    };

    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Błąd pobierania aktywności:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
