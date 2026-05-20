"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowUpRight, Clock, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { BlogHero } from "./BlogHero";

// ==========================================
// DANE ARTYKUŁÓW
// ==========================================
const POSTS = [
  {
    id: 1,
    slug: "krzyzbol-przy-pracy-siedzacej",
    category: "Fizjoterapia",
    title: "5 ćwiczeń na zdrowy kręgosłup przy pracy siedzącej",
    excerpt:
      "Ból pleców to problem numer jeden wśród pracowników biurowych. Te proste ćwiczenia wystarczy wykonywać 10 minut dziennie, żeby odzyskać komfort i zapobiec poważnym zmianom zwyrodnieniowym.",
    image: "/images/about/gabinet_fizjoterapii.jpg",
    author: "Piotr Siemaszko",
    date: "12 maja 2026",
    readTime: "5 min",
    featured: true,
  },
  {
    id: 2,
    slug: "medytacja-i-mozg",
    category: "Mindfulness",
    title: "Jak medytacja zmienia strukturę mózgu? Nauka odpowiada",
    excerpt:
      "Badacze z Harvardu udowodnili, że już 8 tygodni regularnej medytacji powiększa hipokamp i zmniejsza ciało migdałowate — centrum stresu.",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg",
    author: "Zespół Rehability",
    date: "8 maja 2026",
    readTime: "7 min",
    featured: false,
  },
  {
    id: 3,
    slug: "kolacja-regeneracyjna",
    category: "Żywienie",
    title: "Kolacja regeneracyjna — co jeść po intensywnym treningu",
    excerpt:
      "Okno anaboliczne to mit, ale odpowiednie odżywienie wieczorem naprawdę przyspiesza odbudowę mięśni i poprawia jakość snu.",
    image: "/images/about/piotr_siemaszko.png",
    author: "Zespół Rehability",
    date: "3 maja 2026",
    readTime: "6 min",
    featured: false,
  },
  {
    id: 4,
    slug: "wyjazd-jarnoltowek",
    category: "Camp Stories",
    title: "Wyjazd dla kobiet w Jarnołtówku — co zostało z uczestniczkami",
    excerpt:
      "Rozmawiałyśmy z uczestniczkami 3 miesiące po wyjeździe. Ich odpowiedzi zaskoczyły nas bardziej, niż mogłyśmy się spodziewać.",
    image: "/images/static/camp.png",
    author: "Piotr Siemaszko",
    date: "28 kwietnia 2026",
    readTime: "9 min",
    featured: false,
  },
  {
    id: 5,
    slug: "stretching-poranny",
    category: "Ruch",
    title: "Stretching poranny — 10-minutowa rutyna na dobry start dnia",
    excerpt:
      "Nie musisz ćwiczyć godzinami. Ten krótki rytuał rozbudza układ nerwowy, mobilizuje stawy i redukuje napięcie z poprzedniego dnia.",
    image: "/images/about/gabinet_fizjoterapii.jpg",
    author: "Piotr Siemaszko",
    date: "22 kwietnia 2026",
    readTime: "4 min",
    featured: false,
  },
  {
    id: 6,
    slug: "fizjoterapia-vs-osteopatia",
    category: "Terapia",
    title: "Czym różni się fizjoterapia od osteopatii?",
    excerpt:
      "Obie metody leczą ciało, ale w zupełnie inny sposób. Wyjaśniamy, kiedy sięgnąć po którą — i dlaczego nie warto ich przeciwstawiać.",
    image: "/images/about/szlolenie_dla_fizjoterapeutów.jpg",
    author: "Piotr Siemaszko",
    date: "15 kwietnia 2026",
    readTime: "8 min",
    featured: false,
  },
  {
    id: 7,
    slug: "adaptogeny",
    category: "Żywienie",
    title: "Adaptogeny — superfoods czy chwilowa moda?",
    excerpt:
      "Ashwagandha, reishi, rhodiola. Internet szaleje, a Ty pytasz czy to działa. Sprawdziliśmy badania i pytamy naszą dietetyczkę.",
    image: "/images/about/piotr_siemaszko.png",
    author: "Zespół Rehability",
    date: "10 kwietnia 2026",
    readTime: "6 min",
    featured: false,
  },
  {
    id: 8,
    slug: "zimowy-retreat",
    category: "Camp Stories",
    title: "Zimowy retreat w górach — jak 5 dni odmienia nawyki na stałe",
    excerpt:
      "Odcięcie od telefonu, zimne poranki, wspólne gotowanie i dużo ciszy. Sprawdzamy, co naprawdę dzieje się z ciałem i głową podczas tygodnia bez pośpiechu.",
    image: "/images/static/camp.png",
    author: "Zespół Rehability",
    date: "2 kwietnia 2026",
    readTime: "10 min",
    featured: false,
  },
  {
    id: 9,
    slug: "oddychanie-przeponowe",
    category: "Mindfulness",
    title: "Oddychanie przeponowe — prosta technika, która zmniejsza kortyzol",
    excerpt:
      "Twój oddech jest płytki i wysoki? To jeden z głównych sygnałów chronicznego stresu. Naucz się oddychać od nowa — to trwa tylko 5 minut.",
    image: "/images/about/gabinet_fizjoterapii.jpg",
    author: "Piotr Siemaszko",
    date: "25 marca 2026",
    readTime: "5 min",
    featured: false,
  },
];

// ==========================================
// ANIMACJE
// ==========================================
const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// ==========================================
// KARTA ARTYKUŁU
// ==========================================
function BlogCard({ post }: { post: (typeof POSTS)[0] }) {
  return (
    <motion.article variants={cardVariant} layout>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(40,125,136,0.18)] hover:border-brand-primary/20 transition-all duration-300 overflow-hidden h-full"
      >
        {/* Zdjęcie */}
        <div className="relative w-full h-[200px] overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={post.image}
            fill
            alt={post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Kategoria */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-brand-primary font-montserrat font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {post.category}
            </span>
          </div>
          {/* Strzałka */}
          <div className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 group-hover:text-brand-primary group-hover:bg-white transition-colors shadow-sm">
            <ArrowUpRight size={16} weight="bold" />
          </div>
        </div>

        {/* Treść */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-jakarta font-bold text-[#0B3B4C] text-[18px] leading-[130%] mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="font-montserrat text-gray-500 text-[13px] leading-[160%] line-clamp-3 mb-4 flex-1">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="font-montserrat text-[12px] font-semibold text-[#0B3B4C]">
              {post.author}
            </span>
            <div className="flex items-center gap-3 text-gray-400">
              <span className="flex items-center gap-1 font-montserrat text-[12px]">
                <CalendarBlank size={12} />
                {post.date}
              </span>
              <span className="flex items-center gap-1 font-montserrat text-[12px]">
                <Clock size={12} />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ==========================================
// WYRÓŻNIONY ARTYKUŁ (FIRST POST)
// ==========================================
function FeaturedPost({ post }: { post: (typeof POSTS)[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col md:flex-row items-stretch gap-0 bg-white rounded-[28px] border border-brand-primary/15 shadow-[0_8px_40px_rgba(40,125,136,0.12)] hover:shadow-[0_12px_50px_rgba(40,125,136,0.22)] transition-all duration-300 overflow-hidden"
      >
        {/* Zdjęcie */}
        <div className="relative w-full md:w-[45%] h-[280px] md:h-auto shrink-0 bg-gray-100">
          <Image
            src={post.image}
            fill
            alt={post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 md:block hidden" />
        </div>

        {/* Treść */}
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
          <p className="font-montserrat text-gray-500 text-[14px] leading-[170%] mb-6 line-clamp-3">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-400 text-[13px] font-montserrat">
              <span className="font-semibold text-[#0B3B4C]">{post.author}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><CalendarBlank size={13} />{post.date}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={13} />{post.readTime}</span>
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

// ==========================================
// GŁÓWNY KOMPONENT
// ==========================================
export function BlogGrid() {
  const [activeCategory, setActiveCategory] = useState("Wszystkie");

  const featuredPost = POSTS[0];
  const filtered =
    activeCategory === "Wszystkie"
      ? POSTS.slice(1)
      : POSTS.filter((p) => p.category === activeCategory);

  const showFeatured =
    activeCategory === "Wszystkie" || featuredPost.category === activeCategory;

  return (
    <>
      <BlogHero activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <section className="container py-16">
        {/* Wyróżniony artykuł */}
        <AnimatePresence mode="wait">
          {showFeatured && (
            <FeaturedPost key="featured" post={featuredPost} />
          )}
        </AnimatePresence>

        {/* Siatka */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={gridContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.length > 0 ? (
              filtered.map((post) => <BlogCard key={post.id} post={post} />)
            ) : (
              <motion.p
                variants={cardVariant}
                className="col-span-3 text-center font-montserrat text-gray-400 py-16"
              >
                Brak artykułów w tej kategorii.
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
