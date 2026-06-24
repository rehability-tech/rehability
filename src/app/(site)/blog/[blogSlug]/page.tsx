import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarBlank,
  Clock,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, absoluteUrl } from "@/lib/seo/site";
import { BlogBlockRenderer } from "./_components/BlogBlockRenderer";
import { Reveal } from "./_components/Reveal";
import { BlogViewBeacon } from "./_components/BlogViewBeacon";

type Props = { params: Promise<{ blogSlug: string }> };

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
      take: 100,
    });
    return posts.map((p) => ({ blogSlug: p.slug }));
  } catch {
    return [];
  }
}

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}

const RELATED_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  category: true,
  readTime: true,
  publishedAt: true,
  updatedAt: true,
} as const;

async function getRelatedPosts(currentSlug: string, category: string) {
  // Najpierw z tej samej kategorii…
  const sameCategory = await prisma.post.findMany({
    where: { status: "PUBLISHED", slug: { not: currentSlug }, category },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: RELATED_SELECT,
  });

  if (sameCategory.length >= 3) return sameCategory;

  // …a jeśli za mało, dobierz najnowsze z innych kategorii (bez duplikatów).
  const excludeSlugs = [currentSlug, ...sameCategory.map((p) => p.slug)];
  const fillers = await prisma.post.findMany({
    where: { status: "PUBLISHED", slug: { notIn: excludeSlugs } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 3 - sameCategory.length,
    select: RELATED_SELECT,
  });

  return [...sameCategory, ...fillers];
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadTime(blocks: unknown[]): number {
  const text = blocks
    .filter(
      (b): b is { type: string; content?: { text?: string } } =>
        typeof b === "object" && b !== null,
    )
    .filter((b) => ["heading", "paragraph", "highlight"].includes(b.type))
    .map((b) => stripHtml(b.content?.text || ""))
    .join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogSlug } = await params;
  const post = await getPost(blogSlug);
  if (!post) return { title: "Nie znaleziono artykułu" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const image = post.ogImage || post.coverImage || undefined;
  const canonical = post.canonicalUrl || absoluteUrl(`/blog/${post.slug}`);

  return {
    title,
    description,
    keywords: post.tags,
    robots: post.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    ...(post.noIndex ? {} : { alternates: { canonical } }),
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: post.title }] : [],
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      section: post.category,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { blogSlug } = await params;
  const post = await getPost(blogSlug);
  if (!post) notFound();

  const blocks: unknown[] = Array.isArray(post.content)
    ? (post.content as unknown[])
    : [];
  const publishDate = post.publishedAt ?? post.updatedAt;
  const readTime = post.readTime ?? estimateReadTime(blocks);

  const related = await getRelatedPosts(post.slug, post.category);

  const canonical = post.canonicalUrl || absoluteUrl(`/blog/${post.slug}`);
  const heroImage = post.ogImage || post.coverImage || undefined;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? "",
    image: heroImage,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    datePublished: publishDate.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.join(", "),
    articleSection: post.category,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <BlogViewBeacon slug={post.slug} />

      <main className="bg-white">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary pt-32 pb-16 px-4">
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[radial-gradient(circle_at_30%_20%,#f2d967_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#287D88_0%,transparent_50%)]" />
          <div className="relative max-w-3xl mx-auto">
            <Reveal
              as="div"
              immediate
              y={12}
              className="mb-6 text-[12px] font-montserrat text-white/50 flex items-center gap-2 min-w-0"
            >
              <nav
                aria-label="Okruszki"
                className="flex items-center gap-1.5 min-w-0 w-full"
              >
                <Link
                  href="/"
                  className="hover:text-white/80 transition-colors shrink-0"
                >
                  Start
                </Link>
                <span aria-hidden className="shrink-0">
                  ›
                </span>
                <Link
                  href="/blog"
                  className="hover:text-white/80 transition-colors shrink-0"
                >
                  Blog
                </Link>
                <span aria-hidden className="shrink-0">
                  ›
                </span>
                <span className="text-white/30 truncate min-w-0">
                  {post.title}
                </span>
              </nav>
            </Reveal>

            <Reveal as="div" immediate delay={0.08} y={14}>
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-[11px] font-montserrat font-semibold bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/25 tracking-wider uppercase backdrop-blur-md">
                {post.category}
              </span>
            </Reveal>

            <Reveal
              as="h1"
              immediate
              delay={0.16}
              className="font-jakarta font-bold text-white text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] mb-6"
            >
              {post.title}
            </Reveal>

            {post.excerpt && (
              <Reveal
                as="p"
                immediate
                delay={0.24}
                className="font-montserrat text-white/70 text-[15px] sm:text-[16px] leading-relaxed mb-8 max-w-2xl"
              >
                {post.excerpt}
              </Reveal>
            )}

            <Reveal
              as="div"
              immediate
              delay={0.32}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/60 text-[13px] font-montserrat"
            >
              <span className="font-semibold text-white/85">{post.author}</span>
              <span className="text-white/25" aria-hidden>
                ·
              </span>
              <time
                dateTime={publishDate.toISOString()}
                className="flex items-center gap-1.5"
              >
                <CalendarBlank size={14} weight="bold" />
                {formatDate(publishDate)}
              </time>
              <span className="text-white/25" aria-hidden>
                ·
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} weight="bold" />
                {readTime} min czytania
              </span>
            </Reveal>
          </div>
        </section>

        {/* Cover image */}
        {post.coverImage && (
          <Reveal
            as="div"
            immediate
            delay={0.4}
            y={24}
            className="max-w-[800px] mx-auto px-4 -mt-10 sm:-mt-12 relative z-10"
          >
            <div className="relative w-full h-[220px] sm:h-[340px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_20px_60px_-20px_rgba(11,59,76,0.45)] bg-gray-100">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          </Reveal>
        )}

        {/* Article body */}
        <article className="max-w-[800px] mx-auto px-4 pt-12 pb-16">
          <Reveal as="div" y={16}>
            <BlogBlockRenderer
              blocks={
                blocks as Parameters<typeof BlogBlockRenderer>[0]["blocks"]
              }
            />
          </Reveal>

          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={16} className="text-gray-400 shrink-0" aria-hidden />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[12px] font-montserrat font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[13px] font-montserrat font-semibold text-brand-primary hover:text-brand-primary/70 transition-colors"
            >
              <ArrowLeft size={16} weight="bold" />
              Wróć do bloga
            </Link>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="bg-[#f7fbfc] border-t border-gray-100 py-16 px-4"
          >
            <div className="max-w-5xl mx-auto">
              <Reveal as="div" className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-primary mb-2">
                    Czytaj dalej
                  </p>
                  <h2
                    id="related-heading"
                    className="font-jakarta font-bold text-[#0B3B4C] text-[24px] sm:text-[28px] leading-tight"
                  >
                    Podobne artykuły
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-montserrat font-semibold text-brand-primary hover:gap-2.5 transition-all"
                >
                  Wszystkie
                  <ArrowUpRight size={14} weight="bold" />
                </Link>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((r, i) => {
                  const rDate = (r.publishedAt ?? r.updatedAt) as Date;
                  return (
                    <Reveal
                      key={r.id}
                      as="div"
                      y={24}
                      delay={i * 0.1}
                      className="h-full"
                    >
                    <Link
                      href={`/blog/${r.slug}`}
                      className="group h-full flex flex-col bg-white rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(40,125,136,0.15)] hover:border-brand-primary/20 transition-all duration-300 overflow-hidden"
                    >
                      <div className="relative w-full h-[160px] bg-gray-100 overflow-hidden">
                        <Image
                          src={r.coverImage || "/images/static/camp.png"}
                          alt={r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-brand-primary font-montserrat font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                            {r.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-jakarta font-bold text-[#0B3B4C] text-[16px] leading-snug mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
                          {r.title}
                        </h3>
                        {r.excerpt && (
                          <p className="font-montserrat text-gray-500 text-[13px] leading-[160%] line-clamp-2 mb-3 flex-1">
                            {r.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-gray-400 text-[12px] font-montserrat pt-3 border-t border-gray-100">
                          <time
                            dateTime={rDate.toISOString()}
                            className="flex items-center gap-1"
                          >
                            <CalendarBlank size={12} />
                            {formatDate(rDate)}
                          </time>
                          {r.readTime && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {r.readTime} min
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
