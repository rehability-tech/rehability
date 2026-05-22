import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BlogGrid, type BlogListItem } from "./_components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog | Rehability",
  description:
    "Sprawdzona wiedza z zakresu fizjoterapii, mindfulness i zdrowego stylu życia — pisana przez specjalistów Rehability.",
  alternates: { canonical: "https://rehability.pl/blog" },
  openGraph: {
    type: "website",
    url: "https://rehability.pl/blog",
    title: "Blog | Rehability",
    description:
      "Sprawdzona wiedza z zakresu fizjoterapii, mindfulness i zdrowego stylu życia — pisana przez specjalistów Rehability.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Rehability",
    description:
      "Sprawdzona wiedza z zakresu fizjoterapii, mindfulness i zdrowego stylu życia — pisana przez specjalistów Rehability.",
  },
};

export const revalidate = 600;

async function getPublishedPosts(): Promise<BlogListItem[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      author: true,
      readTime: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    category: p.category,
    author: p.author,
    readTime: p.readTime,
    publishedAt: (p.publishedAt ?? p.updatedAt).toISOString(),
  }));
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://rehability.pl/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="min-h-screen pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <BlogGrid posts={posts} />
    </main>
  );
}
