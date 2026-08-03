import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo/site";
import { activeTripDateCutoff } from "@/lib/trips/bookingWindow";

type Entry = MetadataRoute.Sitemap[number];

const staticEntries: Entry[] = [
  { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1.0 },
  { url: absoluteUrl("/wydarzenia"), changeFrequency: "weekly", priority: 0.9 },
  { url: absoluteUrl("/kursy"), changeFrequency: "weekly", priority: 0.9 },
  { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.9 },
  { url: absoluteUrl("/o-nas"), changeFrequency: "monthly", priority: 0.7 },
  { url: absoluteUrl("/gabinet"), changeFrequency: "monthly", priority: 0.8 },
  {
    url: absoluteUrl("/polityka-prywatnosci"),
    changeFrequency: "yearly",
    priority: 0.2,
  },
  { url: absoluteUrl("/regulamin"), changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // `sandbox: false` w każdym zapytaniu — treści z piaskownicy nigdy nie
    // trafiają do sitemapy, nawet gdy mają status PUBLISHED.
    const [trips, posts, courses] = await Promise.all([
      // Minione wydarzenia wypadają z sitemapy od razu, nie czekając na crona
      // archiwizującego — nie zapraszamy Google na termin, który już był.
      prisma.trip.findMany({
        where: {
          status: "PUBLISHED",
          noIndex: false,
          sandbox: false,
          endDate: { gte: activeTripDateCutoff() },
        },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.course.findMany({
        where: { status: "PUBLISHED", noIndex: false, sandbox: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const tripEntries: Entry[] = trips.map((t) => ({
      url: absoluteUrl(`/wydarzenia/${t.id}`),
      lastModified: t.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const postEntries: Entry[] = posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const courseEntries: Entry[] = courses.map((c) => ({
      url: absoluteUrl(`/kursy/${c.slug}`),
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [
      ...staticEntries,
      ...tripEntries,
      ...postEntries,
      ...courseEntries,
    ];
  } catch (error) {
    // Fallback: Wymóg produkcyjny. Nigdy nie zwracaj błędu 500 dla robota.
    // Jeśli dynamiczny content zawiedzie, zwracamy chociaż strony statyczne[cite: 1].
    console.error("[SITEMAP_ERROR] Failed to generate dynamic sitemap", error);
    return staticEntries;
  }
}
