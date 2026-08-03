import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import { activeTripDateCutoff } from "@/lib/trips/bookingWindow";

// Cron: archiwizuje wydarzenia, które już się odbyły.
// Każdy PUBLISHED Trip po ostatnim dniu → ARCHIVED, ze zdjęciem wyróżnienia.
// Dzięki temu znika z publicznych listingów, z sitemapy i z formularza rezerwacji
// bez ręcznej akcji admina, a w panelu admina przestaje udawać „Aktywny".
//
// Próg to `activeTripDateCutoff` (północ dzisiejszej daty w czasie polskim), a NIE
// `endDate < now`. Różnica jest krytyczna: `endDate` to północ ostatniego dnia,
// więc porównanie z „teraz" archiwizowałoo wydarzenie nad ranem W DNIU jego
// trwania — status przestawał być PUBLISHED i `create-payment-intent` odrzucał
// płatności ostatniego dnia. Teraz archiwizacja następuje dobę później.
//
// Listingi filtrują po dacie niezależnie od tego crona, więc jego przestój
// niczego nie wystawia klientom — porządkuje tylko status w bazie.

export async function POST(req: Request) {
  return runCron(req, "trips/archive-past", async () => {
    const now = new Date();
    const cutoff = activeTripDateCutoff(now);

    const result = await prisma.trip.updateMany({
      where: {
        status: "PUBLISHED",
        endDate: { lt: cutoff },
      },
      // `isFeatured` zdejmujemy razem ze statusem — inaczej zakończone wydarzenie
      // zostawałoo w strefie „Na głównej" w panelu admina.
      data: { status: "ARCHIVED", isFeatured: false },
    });

    return {
      checkedAt: now.toISOString(),
      cutoff: cutoff.toISOString(),
      archived: result.count,
    };
  });
}

export async function GET(req: Request) {
  return POST(req);
}
