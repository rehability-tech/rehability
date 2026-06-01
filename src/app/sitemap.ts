import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo/site";

type Entry = MetadataRoute.Sitemap[number];

const staticEntries: Entry[] = [
  { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1.0 },
  { url: absoluteUrl("/wyjazdy"), changeFrequency: "weekly", priority: 0.9 },
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
    const [trips, posts] = await Promise.all([
      prisma.trip.findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const tripEntries: Entry[] = trips.map((t) => ({
      url: absoluteUrl(`/wyjazdy/${t.id}`),
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

    return [...staticEntries, ...tripEntries, ...postEntries];
  } catch (error) {
    // Fallback: Wymóg produkcyjny. Nigdy nie zwracaj błędu 500 dla robota.
    // Jeśli dynamiczny content zawiedzie, zwracamy chociaż strony statyczne[cite: 1].
    console.error("[SITEMAP_ERROR] Failed to generate dynamic sitemap", error);
    return staticEntries;
  }
}
