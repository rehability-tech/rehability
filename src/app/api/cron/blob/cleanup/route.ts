import { list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// GET/POST /api/cron/blob/cleanup
//
// Usuwa z Vercel Blob pliki, które NIE są nigdzie używane w bazie.
// Bezpieczeństwo:
//  - Kasuje tylko bloby starsze niż `minAgeHours` (domyślnie 24h) — chroni
//    przed wyścigiem "wgrano do blobu, ale rekord w DB jeszcze niezapisany".
//  - `?dryRun=1` — tylko raportuje, nic nie kasuje (do testów / pierwszego runu).
//  - `?minAgeHours=N` — zmiana progu wieku.
//
// Referencje zbieramy ze WSZYSTKICH pól mogących trzymać URL blobu (też JSON):
//  User.image · Post(coverImage, ogImage, content) ·
//  Trip(heroImage, ogImage, description, blocks, invitationEmail*) ·
//  ExtraService.image · TripService.image · EmailTemplate.sections

export async function GET(req: Request) {
  return runCron(req, "blob/cleanup", () => cleanup(req));
}

export async function POST(req: Request) {
  return runCron(req, "blob/cleanup", () => cleanup(req));
}

async function cleanup(req: Request) {
  const url = new URL(req.url);
  const dryRun =
    url.searchParams.get("dryRun") === "1" ||
    url.searchParams.get("dry") === "1";
  const minAgeHours = Number(url.searchParams.get("minAgeHours") ?? 24);

  // 1. Zbierz wszystkie referencje do plików z bazy w jeden duży string.
  const referenced = await collectReferencedText();

  // 2. Wylistuj wszystkie bloby (z paginacją).
  const blobs: { url: string; pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ cursor, limit: 1000 });
    for (const b of res.blobs) {
      blobs.push({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt });
    }
    cursor = res.cursor;
  } while (cursor);

  // 3. Sieroty = nieużywane I starsze niż próg wieku.
  const cutoff = Date.now() - minAgeHours * 60 * 60 * 1000;
  const orphans = blobs.filter((b) => {
    const tooYoung = new Date(b.uploadedAt).getTime() >= cutoff;
    if (tooYoung) return false;
    // Generous match — keep jeśli URL LUB pathname występuje gdziekolwiek.
    const isUsed =
      referenced.includes(b.url) || referenced.includes(b.pathname);
    return !isUsed;
  });

  // 4. Kasuj (chyba że dry run) — partiami.
  let deleted = 0;
  if (!dryRun && orphans.length > 0) {
    const urls = orphans.map((o) => o.url);
    for (let i = 0; i < urls.length; i += 100) {
      await del(urls.slice(i, i + 100));
      deleted += Math.min(100, urls.length - i);
    }
  }

  console.log(
    `[CRON blob/cleanup] bloby=${blobs.length} sieroty=${orphans.length} ` +
      `usunięto=${deleted}${dryRun ? " (dryRun)" : ""}`,
  );

  return {
    dryRun,
    minAgeHours,
    totalBlobs: blobs.length,
    orphans: orphans.length,
    deleted,
    // próbka do podglądu w odpowiedzi (nie zaśmieca logów)
    sample: orphans.slice(0, 25).map((o) => o.pathname),
  };
}

/** Skleja wszystkie pola DB mogące zawierać URL blobu w jeden string. */
async function collectReferencedText(): Promise<string> {
  const parts: string[] = [];
  const pushStr = (v: string | null | undefined) => {
    if (v) parts.push(v);
  };
  const pushJson = (v: unknown) => {
    if (v != null) parts.push(JSON.stringify(v));
  };

  const [users, posts, trips, extras, tripServices, templates] =
    await Promise.all([
      prisma.user.findMany({ select: { image: true } }),
      prisma.post.findMany({
        select: { coverImage: true, ogImage: true, content: true },
      }),
      prisma.trip.findMany({
        select: {
          heroImage: true,
          ogImage: true,
          description: true,
          blocks: true,
          invitationEmailHeroImage: true,
          invitationEmailBody: true,
          invitationEmailHighlights: true,
          invitationEmailGallery: true,
          invitationEmailSections: true,
        },
      }),
      prisma.extraService.findMany({ select: { image: true } }),
      prisma.tripService.findMany({ select: { image: true } }),
      prisma.emailTemplate.findMany({ select: { sections: true } }),
    ]);

  for (const u of users) pushStr(u.image);

  for (const p of posts) {
    pushStr(p.coverImage);
    pushStr(p.ogImage);
    pushJson(p.content);
  }

  for (const t of trips) {
    pushStr(t.heroImage);
    pushStr(t.ogImage);
    pushStr(t.description);
    pushJson(t.blocks);
    pushStr(t.invitationEmailHeroImage);
    pushStr(t.invitationEmailBody);
    pushJson(t.invitationEmailHighlights);
    pushJson(t.invitationEmailGallery);
    pushJson(t.invitationEmailSections);
  }

  for (const s of extras) pushStr(s.image);
  for (const s of tripServices) pushStr(s.image);
  for (const tpl of templates) pushJson(tpl.sections);

  return parts.join("\n");
}
