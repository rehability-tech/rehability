import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CalendarBlank, Clock, Tag, ArrowLeft, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Image from "next/image";
import BlogFaqBlock from "./_components/BlogFaqBlock";

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  return prisma.post.findFirst({ where: { slug, status: "PUBLISHED" } });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Block renderer ────────────────────────────────────────────────────────────

const PHOSPHOR_ICONS: Record<string, string> = {
  Heartbeat: "M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.151 2.798 2 5 2c1.322 0 2.952.85 4 2.25C10.048 2.85 11.678 2 13 2c2.202 0 4 2.151 4 5.191 0 4.105-5.37 8.863-11 14.402z",
  Leaf: "M6 21c0-13.5 9-18 9-18",
  Sun: "M12 17a5 5 0 100-10 5 5 0 000 10z",
  Person: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0",
  Sparkle: "M12 2l2.4 7.4H22l-6.4 4.6 2.4 7.4L12 17l-6 4.4 2.4-7.4L2 9.4h7.6z",
  Mountains: "M2 20l7-14 4 8 3-6 6 12H2z",
  Tree: "M12 2l4 8H8l4-8zM8 10l-4 10h16L16 10",
  Bed: "M3 7v13M21 7v13M3 14h18M7 7a2 2 0 114 0M13 7a2 2 0 114 0",
  Campfire: "M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z",
};

function BlockIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
      <path d={PHOSPHOR_ICONS[name] || PHOSPHOR_ICONS["Sparkle"]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function renderBlock(block: any, index: number) {
  const { type, content, id } = block;
  const key = id || index;

  switch (type) {
    case "heading":
      return (
        <h2
          key={key}
          className="font-jakarta font-bold text-[#0B3B4C] text-[22px] sm:text-[26px] leading-snug mt-10 mb-4 first:mt-0"
          dangerouslySetInnerHTML={{ __html: content?.text || "" }}
        />
      );

    case "paragraph":
      return (
        <div
          key={key}
          className="font-montserrat text-gray-600 text-[15px] leading-[1.85] mb-5 [&_span]:text-inherit"
          dangerouslySetInnerHTML={{ __html: content?.text || "" }}
        />
      );

    case "highlight":
      return (
        <div key={key} className="border-l-4 border-brand-primary pl-5 py-2 my-6 bg-brand-primary/[0.03] rounded-r-xl">
          <div
            className="font-jakarta font-semibold text-[#0B3B4C] text-[17px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content?.text || "" }}
          />
        </div>
      );

    case "spacer":
      return <div key={key} className="h-10" />;

    case "bulletList": {
      const items: any[] = content?.items || [];
      return (
        <ul key={key} className="flex flex-col gap-3 my-5">
          {items.map((item: any, i: number) => (
            <li key={item.id || i} className="flex items-start gap-3">
              <CheckCircle size={20} weight="fill" className="text-brand-primary shrink-0 mt-0.5" />
              <div
                className="font-montserrat text-gray-600 text-[15px] leading-[1.7] flex-1 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: item.text || "" }}
              />
            </li>
          ))}
        </ul>
      );
    }

    case "featuresGrid": {
      const items: any[] = content?.items || [];
      return (
        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          {items.map((item: any, i: number) => (
            <div key={item.id || i} className="bg-brand-primary/5 rounded-2xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <BlockIcon name={item.icon || "Sparkle"} />
              </div>
              <div
                className="font-montserrat text-[14px] text-[#0B3B4C] leading-snug font-medium"
                dangerouslySetInnerHTML={{ __html: item.text || "" }}
              />
            </div>
          ))}
        </div>
      );
    }

    case "faq":
      return <BlogFaqBlock key={key} items={content?.items || []} />;

    case "inlineImage":
      if (!content?.url) return null;
      return (
        <figure key={key} className="my-8">
          <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={content.url}
              alt={content.alt || ""}
              className="w-full h-auto object-cover max-h-[500px]"
              loading="lazy"
            />
          </div>
          {content.alt && (
            <figcaption className="text-center font-montserrat text-[12px] text-gray-400 mt-2">
              {content.alt}
            </figcaption>
          )}
        </figure>
      );

    case "videoEmbed": {
      const rawUrl: string = content?.url || "";
      const videoId = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (!videoId) return null;
      return (
        <div key={key} className="my-8 aspect-video w-full rounded-2xl overflow-hidden bg-gray-100">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Wideo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── SEO ───────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Nie znaleziono artykułu" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const image = post.ogImage || post.coverImage || undefined;
  const canonical = post.canonicalUrl || `https://rehability.pl/blog/${post.slug}`;

  return {
    title,
    description,
    robots: post.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: post.title }] : [],
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const blocks: any[] = Array.isArray(post.content) ? post.content : [];
  const publishDate = post.publishedAt ?? post.updatedAt;

  // Estimate read time from blocks text
  const allText = blocks
    .filter((b) => ["heading", "paragraph", "highlight"].includes(b.type))
    .map((b) => (b.content?.text || "").replace(/<[^>]+>/g, " "))
    .join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const readTime = post.readTime ?? Math.max(1, Math.round(wordCount / 200));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? "",
    image: post.ogImage || post.coverImage || undefined,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Rehability",
      logo: { "@type": "ImageObject", url: "https://rehability.pl/logo.png" },
    },
    datePublished: publishDate.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.join(", "),
    articleSection: post.category,
    url: `https://rehability.pl/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-[#071f28] pt-32 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block mb-4 px-3 py-1 rounded-full text-[12px] font-montserrat font-semibold bg-brand-primary/20 text-brand-primary tracking-wide uppercase">
              {post.category}
            </span>
            <h1 className="font-jakarta font-bold text-white text-[28px] sm:text-[36px] md:text-[42px] leading-[1.2] mb-6">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="font-montserrat text-white/70 text-[15px] leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-white/50 text-[13px] font-montserrat">
              <span className="flex items-center gap-1.5">
                <CalendarBlank size={14} weight="bold" />
                {formatDate(publishDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} weight="bold" />
                {readTime} min czytania
              </span>
              <span className="text-white/30">·</span>
              <span>{post.author}</span>
            </div>
          </div>
        </section>

        {/* Cover image */}
        {post.coverImage && (
          <div className="max-w-3xl mx-auto px-4 -mt-6">
            <div className="relative w-full h-[240px] sm:h-[360px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </div>
        )}

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-4 py-12">
          {blocks.length > 0 ? (
            <div>{blocks.map((block, i) => renderBlock(block, i))}</div>
          ) : (
            <p className="font-montserrat text-gray-400 text-center py-12">
              Treść artykułu jest niedostępna.
            </p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={16} className="text-gray-400 shrink-0" />
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[12px] font-montserrat font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
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
      </main>

      <Footer />
    </>
  );
}
