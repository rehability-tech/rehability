import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/requireCron";
import { prisma } from "@/lib/prisma";

// GET /api/cron/bookings/cleanup
// Endpoint wywoływany przez Vercel Cron (np. co 15 minut).
// Zwalnia zablokowane terminy (ServiceOrder), które nie zostały opłacone.
export async function GET(req: Request) {
  // Zabezpieczenie: endpoint może wywołać tylko Vercel Cron lub my z tokenem CRON_SECRET
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  try {
    // Definiujemy czas wygaśnięcia: 15 minut temu
    const expirationTime = new Date(Date.now() - 15 * 60 * 1000);

    // Znajdź i anuluj wiszące zamówienia
    const result = await prisma.serviceOrder.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: expirationTime, // mniejsze niż (starsze niż) expirationTime
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(`[CRON] Wyczyszczono porzucone koszyki SPA: ${result.count}`);

    return NextResponse.json({
      ok: true,
      message: "Wyczyszczono porzucone rezerwacje SPA.",
      cleanedCount: result.count,
    });
  } catch (error) {
    console.error("[CRON_BOOKINGS_CLEANUP] Błąd podczas czyszczenia:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
