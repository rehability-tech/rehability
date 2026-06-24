import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// Cron: archiwizuje wyjazdy, które już się odbyły.
// Każdy PUBLISHED Trip z endDate w przeszłości → ARCHIVED. Dzięki temu znika
// z publicznych listingów i z formularza rezerwacji bez ręcznej akcji admina.
// (Listingi i tak filtrują po endDate, ale archiwizacja porządkuje status w bazie.)

export async function POST(req: Request) {
  return runCron(req, "trips/archive-past", async () => {
    const now = new Date();
    const result = await prisma.trip.updateMany({
      where: {
        status: "PUBLISHED",
        endDate: { lt: now },
      },
      data: { status: "ARCHIVED" },
    });

    return { checkedAt: now.toISOString(), archived: result.count };
  });
}

export async function GET(req: Request) {
  return POST(req);
}
