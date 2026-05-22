"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowUpRight, Clock, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { BlogHero } from "./BlogHero";

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  author: string;
  readTime: number | null;
  publishedAt: string;
}

const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const FALLBACK_COVER = "/images/static/camp.png";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function BlogCard({ post, priority = false }: { post: BlogListItem; priority?: boolean }) {
  return (
    <motion.article variants={cardVariant} layout>
      <Link
        prefetch={false}
        href={`/blog/${post.slug}`}
        className="group flex flex-col bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(40,125,136,0.18)] hover:border-brand-primary/20 transition-all duration-300 overflow-hidden h-full"
      >
        <div className="relative w-full h-[200px] overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={post.coverImage || FALLBACK_COVER}
            fill
            alt={post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? "eager" : "lazy"}
          />
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-brand-primary font-montserrat font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {post.category}
            </span>
          </div>
          <div className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 group-hover:text-brand-primary group-hover:bg-white transition-colors shadow-sm">
            <ArrowUpRight size={16} weight="bold" />
          </div>
        </div>

        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-jakarta font-bold text-[#0B3B4C] text-[18px] leading-[130%] mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="font-montserrat text-gray-500 text-[13px] leading-[160%] line-clamp-3 mb-4 flex-1">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
            <span className="font-montserrat text-[12px] font-semibold text-[#0B3B4C]">
              {post.author}
            </span>
            <div className="flex items-center gap-3 text-gray-400">
              <span className="flex items-center gap-1 font-montserrat text-[12px]">
                <CalendarBlank size={12} />
                {formatDate(post.publishedAt)}
              </span>
              {post.readTime && (
                <span className="flex items-center gap-1 font-montserrat text-[12px]">
                  <Clock size={12} />
                  {post.readTime} min
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function FeaturedPost({ post }: { post: BlogListItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col md:flex-row items-stretch bg-white rounded-[28px] border border-brand-primary/15 shadow-[0_8px_40px_rgba(40,125,136,0.12)] hover:shadow-[0_12px_50px_rgba(40,125,136,0.22)] transition-all duration-300 overflow-hidden"
      >
        <div className="relative w-full md:w-[45%] h-[280px] md:h-auto shrink-0 bg-gray-100">
          <Image
            src={post.coverImage || FALLBACK_COVER}
            fill
            alt={post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-transparent to-black/5" />
        </div>

        <div className="flex flex-col justify-center p-8 md:p-10 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-brand-primary/10 text-brand-primary font-montserrat font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="bg-amber-100 text-amber-700 font-montserrat font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
              Polecany
            </span>
          </div>

          <h2 className="font-jakarta font-bold text-[#0B3B4C] text-[26px] sm:text-[30px] leading-[125%] mb-3 group-hover:text-brand-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="font-montserrat text-gray-500 text-[14px] leading-[170%] mb-6 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-400 text-[13px] font-montserrat">
              <span className="font-semibold text-[#0B3B4C]">{post.author}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CalendarBlank size={13} />
                {formatDate(post.publishedAt)}
              </span>
              {post.readTime && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {post.readTime} min
                  </span>
                </>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shrink-0">
              <ArrowUpRight size={18} weight="bold" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface BlogGridProps {
  posts: BlogListItem[];
}

export function BlogGrid({ posts }: BlogGridProps) {
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [search, setSearch] = useState("");

  const featuredPost = posts[0];
  const rest = posts.slice(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rest.filter((p) => {
      const matchesCat = activeCategory === "Wszystkie" || p.category === activeCategory;
      if (!matchesCat) return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        (p.excerpt ?? "").toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [rest, activeCategory, search]);

  const showFeatured =
    featuredPost &&
    (activeCategory === "Wszystkie" || featuredPost.category === activeCategory) &&
    (!search.trim() ||
      featuredPost.title.toLowerCase().includes(search.trim().toLowerCase()) ||
      (featuredPost.excerpt ?? "").toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <BlogHero
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        search={search}
        onSearchChange={setSearch}
      />

      <section className="container py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-montserrat text-gray-500 text-[15px]">
              Aktualnie nie mamy opublikowanych artykułów. Wróć tu wkrótce.
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {showFeatured && <FeaturedPost key={featuredPost.id} post={featuredPost} />}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${search}`}
                variants={gridContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.length > 0 ? (
                  filtered.map((post, i) => (
                    <BlogCard key={post.id} post={post} priority={i < 3} />
                  ))
                ) : (
                  <motion.p
                    variants={cardVariant}
                    className="col-span-full text-center font-montserrat text-gray-400 py-16"
                  >
                    {search.trim()
                      ? "Brak artykułów pasujących do wyszukiwania."
                      : "Brak artykułów w tej kategorii."}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </section>
    </>
  );
}
