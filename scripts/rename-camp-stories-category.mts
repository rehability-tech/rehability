/**
 * Migracja jednorazowa: zmiana nazwy kategorii bloga.
 *
 *   "Camp Stories"  ->  "Wyjazdy holistyczne"
 *
 * Kategoria jest wolnym Stringiem (nie enum), więc zmiana stałych w kodzie
 * nie rusza istniejących rekordów w bazie. Ten skrypt aktualizuje oba modele,
 * które trzymają kategorię: Post (opublikowane/robocze artykuły) oraz
 * BlogScheduleEntry (zaplanowane wpisy harmonogramu).
 *
 * Uruchomienie:
 *   npx tsx scripts/rename-camp-stories-category.mts
 *
 * Wymaga DATABASE_URL w .env (czytane natywnie poniżej, bez zależności).
 */
import { readFileSync } from "node:fs";

// Minimalny loader .env (skrypt poza runtime Next, więc ładujemy ręcznie).
for (const line of readFileSync("./.env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const OLD_CATEGORY = "Camp Stories";
const NEW_CATEGORY = "Wyjazdy holistyczne";

const { PrismaClient } = await import("../src/generated/prisma/index.js");
const prisma = new PrismaClient();

async function run() {
  console.log(`\n🔁 Migracja kategorii: "${OLD_CATEGORY}" -> "${NEW_CATEGORY}"\n`);

  const posts = await prisma.post.updateMany({
    where: { category: OLD_CATEGORY },
    data: { category: NEW_CATEGORY },
  });
  console.log(`  Post: zaktualizowano ${posts.count} rekord(ów).`);

  const schedule = await prisma.blogScheduleEntry.updateMany({
    where: { category: OLD_CATEGORY },
    data: { category: NEW_CATEGORY },
  });
  console.log(`  BlogScheduleEntry: zaktualizowano ${schedule.count} rekord(ów).`);

  console.log(`\n✅ Gotowe. Łącznie: ${posts.count + schedule.count} rekord(ów).\n`);
}

run()
  .catch((err) => {
    console.error("❌ Błąd migracji:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
