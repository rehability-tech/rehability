import { list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import {
  bunnyConfigured,
  listBunnyVideos,
  deleteBunnyVideo,
} from "@/lib/bunny";

// GET/POST /api/cron/blob/cleanup
//
// Garbage collection storage: usuwa pliki/nagrania, które NIE są nigdzie
// używane w bazie.
//  - Vercel Blob — zdjęcia/pliki (User.image, Post*, Trip*, usługi, maile).
//  - Bunny Stream — wideo kursów (Course.video, Lesson.video; embed URL).
//
// Bezpieczeństwo:
//  - Kasuje tylko obiekty starsze niż `minAgeHours` (domyślnie 24h) — chroni
//    przed wyścigiem "wgrano plik, ale rekord w DB jeszcze niezapisany".
//  - `?dryRun=1` — tylko raportuje, nic nie kasuje (do testów / pierwszego runu).
//  - `?minAgeHours=N` — zmiana progu wieku.
//
// Referencje zbieramy ze WSZYSTKICH pól mogących trzymać URL/embed (też JSON):
//  User.image · Post(coverImage, ogImage, content) ·
//  Trip(heroImage, ogImage, description, blocks, invitationEmail*) ·
//  ExtraService.image · TripService.image · EmailTemplate.sections ·
//  Course.video · Lesson.video

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
  const cutoff = Date.now() - minAgeHours * 60 * 60 * 1000;

  // Jedna pula referencji służy obu czyszczeniom (blob URL/pathname oraz GUID
  // wideo Bunny — embed URL zawiera GUID, więc generous match je obejmuje).
  const referenced = await collectReferencedText();

  const blob = await cleanupBlobs(referenced, cutoff, dryRun);
  const bunny = await cleanupBunnyVideos(referenced, cutoff, dryRun);

  console.log(
    `[CRON blob/cleanup] bloby=${blob.totalBlobs} sieroty=${blob.orphans} ` +
      `usunięto=${blob.deleted} | bunny=${bunny.totalVideos ?? "-"} ` +
      `sieroty=${bunny.orphans ?? "-"} usunięto=${bunny.deleted ?? "-"}` +
      `${dryRun ? " (dryRun)" : ""}`,
  );

  return { dryRun, minAgeHours, blob, bunny };
}

/** Vercel Blob: kasuje pliki nieużywane nigdzie w bazie i starsze niż próg. */
async function cleanupBlobs(referenced: string, cutoff: number, dryRun: boolean) {
  // 1. Wylistuj wszystkie bloby (z paginacją).
  const blobs: { url: string; pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ cursor, limit: 1000 });
    for (const b of res.blobs) {
      blobs.push({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt });
    }
    cursor = res.cursor;
  } while (cursor);

  // 2. Sieroty = nieużywane I starsze niż próg wieku.
  const orphans = blobs.filter((b) => {
    if (new Date(b.uploadedAt).getTime() >= cutoff) return false; // za młody
    // Generous match — keep jeśli URL LUB pathname występuje gdziekolwiek.
    const isUsed =
      referenced.includes(b.url) || referenced.includes(b.pathname);
    return !isUsed;
  });

  // 3. Kasuj (chyba że dry run) — partiami.
  let deleted = 0;
  if (!dryRun && orphans.length > 0) {
    const urls = orphans.map((o) => o.url);
    for (let i = 0; i < urls.length; i += 100) {
      await del(urls.slice(i, i + 100));
      deleted += Math.min(100, urls.length - i);
    }
  }

  return {
    totalBlobs: blobs.length,
    orphans: orphans.length,
    deleted,
    sample: orphans.slice(0, 25).map((o) => o.pathname),
  };
}

/** Bunny Stream: kasuje wideo nieużywane nigdzie w bazie i starsze niż próg. */
async function cleanupBunnyVideos(
  referenced: string,
  cutoff: number,
  dryRun: boolean,
) {
  if (!bunnyConfigured()) {
    return { configured: false as const, skipped: true as const };
  }

  // 1. Lista wszystkich wideo w bibliotece (z paginacją).
  const videos = await listBunnyVideos();

  // 2. Sieroty = GUID nigdzie w referencjach I starsze niż próg wieku.
  const orphans = videos.filter((v) => {
    if (new Date(v.dateUploaded).getTime() >= cutoff) return false; // za młode
    return !referenced.includes(v.guid);
  });

  // 3. Kasuj pojedynczo (Bunny nie ma batch-delete) — chyba że dry run.
  let deleted = 0;
  let failed = 0;
  if (!dryRun) {
    for (const v of orphans) {
      const ok = await deleteBunnyVideo(v.guid);
      if (ok) deleted += 1;
      else failed += 1;
    }
  }

  return {
    configured: true as const,
    totalVideos: videos.length,
    orphans: orphans.length,
    deleted,
    failed,
    sample: orphans.slice(0, 25).map((o) => ({ guid: o.guid, title: o.title })),
  };
}

/** Skleja wszystkie pola DB mogące zawierać URL blobu lub embed wideo. */
async function collectReferencedText(): Promise<string> {
  const parts: string[] = [];
  const pushStr = (v: string | null | undefined) => {
    if (v) parts.push(v);
  };
  const pushJson = (v: unknown) => {
    if (v != null) parts.push(JSON.stringify(v));
  };

  const [users, posts, trips, extras, tripServices, templates, courses, lessons] =
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
      prisma.course.findMany({ select: { video: true, image: true } }),
      prisma.lesson.findMany({ select: { video: true } }),
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

  for (const c of courses) {
    pushStr(c.video);
    pushStr(c.image);
  }
  for (const l of lessons) pushStr(l.video);

  return parts.join("\n");
}
