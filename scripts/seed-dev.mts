/**
 * Dane testowe do klikania systemu rabatowego.
 *
 * IDEMPOTENTNY — można puszczać wielokrotnie. Tworzy kurs dev (DRAFT, żeby nie
 * trafił do publicznego katalogu) oraz zestaw promocji pokrywający wszystkie
 * trzy reguły nakładania: kod wygrywający z przeceną, kod łączący się z nią
 * i samą przecenę automatyczną.
 *
 * Uruchamiaj TYLKO na bazie testowej:
 *   npm run db:test:seed
 *
 * Skrypt sam odmawia pracy, gdy DATABASE_URL wygląda na bazę główną.
 */
import { prisma } from "@/lib/prisma";

const SLUG = "kurs-dev-testowy";

/**
 * Zabezpieczenie przed odpaleniem na produkcji. Branch Neona ma w hoście
 * człon `br-` albo nazwę gałęzi; baza główna projektu go nie ma. Guard można
 * pominąć świadomie przez SEED_ALLOW_MAIN=1.
 */
function assertNotMainDatabase() {
  if (process.env.SEED_ALLOW_MAIN === "1") return;

  const url = process.env.DATABASE_URL ?? "";
  const looksLikeBranch = /(-br-|\bbr-|test|dev|localhost|127\.0\.0\.1)/i.test(url);

  if (!looksLikeBranch) {
    console.error(
      "\n✖ DATABASE_URL nie wygląda na bazę testową.\n" +
        "  Seed tworzy dane śmieciowe — nie chcesz ich na produkcji.\n" +
        "  Użyj `npm run db:test:seed`, a jeśli naprawdę wiesz co robisz,\n" +
        "  ustaw SEED_ALLOW_MAIN=1.\n",
    );
    process.exit(1);
  }
}

async function main() {
  assertNotMainDatabase();

  const course = await prisma.course.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      slug: SLUG,
      title: "[DEV] Kurs testowy — rabaty",
      category: "Testy",
      excerpt:
        "Kurs istniejący wyłącznie do testowania systemu rabatowego: kodów, przecen, rabatów mailowych i piaskownicy.",
      price: 200, // okrągła kwota — procenty łatwo sprawdzić w głowie
      durationMin: 60,
      format: "single",
      // DRAFT, żeby nie pojawił się w publicznym katalogu /kursy.
      status: "DRAFT",
      description: [],
      content: [],
      faq: [],
    },
  });

  // Kod wygrywający z przeceną (−50% od 200 zł = 100 zł).
  await prisma.discountCode.upsert({
    where: { courseId_code: { courseId: course.id, code: "DEV50" } },
    update: {},
    create: {
      courseId: course.id,
      code: "DEV50",
      note: "Testowy kod -50%, NIE łączy się z przeceną",
      valueType: "percent",
      percent: 50,
      stackableWithSale: false,
      isActive: true,
    },
  });

  // Kod łączący się z przeceną (200 → 160 → 144 zł).
  await prisma.discountCode.upsert({
    where: { courseId_code: { courseId: course.id, code: "DEVSTACK10" } },
    update: {},
    create: {
      courseId: course.id,
      code: "DEVSTACK10",
      note: "Testowy kod -10%, ŁĄCZY SIĘ z przeceną",
      valueType: "percent",
      percent: 10,
      stackableWithSale: true,
      isActive: true,
    },
  });

  // Przecena automatyczna (200 → 160 zł). Sale nie ma unikalnego klucza
  // po nazwie, więc idempotencję robimy ręcznie.
  const existingSale = await prisma.sale.findFirst({
    where: { courseId: course.id, name: "[DEV] Przecena -20%" },
  });
  if (!existingSale) {
    await prisma.sale.create({
      data: {
        courseId: course.id,
        name: "[DEV] Przecena -20%",
        note: "Automatyczna, bez kodu",
        valueType: "percent",
        percent: 20,
        isActive: true,
      },
    });
  }

  console.log(`✓ Kurs: ${course.slug} (${course.price} zł, ${course.status})`);
  console.log("✓ Kody: DEV50 (-50%), DEVSTACK10 (-10%, łączy się)");
  console.log("✓ Przecena: [DEV] Przecena -20%");
  console.log("\nOczekiwane ceny: bez kodu 160 zł · DEV50 100 zł · DEVSTACK10 144 zł");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
