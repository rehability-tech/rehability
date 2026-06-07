import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// GET/POST /api/cron/bookings/cleanup
// Zwalnia zablokowane terminy (ServiceOrder w PENDING starsze niż 15 min).
export async function GET(req: Request) {
  return runCron(req, "bookings/cleanup", async () => {
    const expirationTime = new Date(Date.now() - 15 * 60 * 1000);

    const result = await prisma.serviceOrder.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: expirationTime },
      },
      data: { status: "CANCELLED" },
    });

    console.log(`[CRON] Wyczyszczono porzucone koszyki SPA: ${result.count}`);

    return {
      message: "Wyczyszczono porzucone rezerwacje SPA.",
      cleanedCount: result.count,
    };
  });
}

export async function POST(req: Request) {
  return GET(req);
}
