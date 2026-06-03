"use client";
/*
Harmonogram
-- [] Poprawić cronjoba do generowania co miesiąc planu na blogi
-- [] Sprawdzić czy statusy wyświetlają się poprawnie
-- [] Ogarnąć cronjoba do publikowania blogów autoamtycznie 
-- [] Zmiana statusu bloga jeśli zostanie on napisany samodzielnie 
*/
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  CircleNotch,
  NewspaperClipping,
  ArticleMedium,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BlogPostCard, BlogPostData } from "./_components/BlogPostCard";

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

const FILTERS = [
  { label: "Wszystkie", value: "ALL" },
  { label: "Opublikowane", value: "PUBLISHED" },
  { label: "Szkice", value: "DRAFT" },
  { label: "Archiwalne", value: "ARCHIVED" },
] as const;

export default function AdminBlogList() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/admin/blog?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Błąd pobierania");
        setPosts(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleUpdateLocalStatus = (id: string, newStatus: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = posts.filter((p) => filter === "ALL" || p.status === filter);

  const counts = {
    ALL: posts.length,
    PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
    DRAFT: posts.filter((p) => p.status === "DRAFT").length,
    ARCHIVED: posts.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <div className="relative min-h-screen">
      {/* --- BRANDOWE ROZMYTE AKCENTY W TLE --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-7 pb-28 md:pb-8"
      >
        {/* ========================================================= */}
        {/* HERO HEADER (gradient brandowy, glassmorphism)            */}
        {/* ========================================================= */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
                <NewspaperClipping
                  size={14}
                  weight="fill"
                  className="text-brand-yellow"
                />
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  Centrum treści
                </span>
              </div>
              <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
                Zarządzaj Blogiem
              </h1>
              <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
                Twórz i publikuj artykuły z pełną optymalizacją SEO. Generuj
                treści z harmonogramu jednym kliknięciem.
              </p>
            </div>

            {/* Przycisk dodawania (biały, premium) */}
            <Link
              href="/admin/blog/dodaj/dane-podstawowe"
              className="group relative inline-flex items-center justify-center gap-2 px-6 h-12 rounded-[16px] bg-white text-brand-secondary font-bold text-[13.5px] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden shrink-0 border border-white/40"
            >
              <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                <Plus size={18} weight="bold" className="text-brand-primary" />
                Nowy artykuł
              </span>
            </Link>
          </div>
        </header>

        {/* ========================================================= */}
        {/* FILTRY (glassmorphism chipy)                              */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 relative overflow-hidden",
                filter === value
                  ? "bg-brand-primary text-white shadow-[0_6px_18px_-6px_rgba(40,125,136,0.5)]"
                  : "bg-white/70 backdrop-blur-xl text-brand-secondary/60 border border-white/60 hover:bg-white hover:text-brand-secondary",
              )}
            >
              {filter === value && (
                <span className="absolute -bottom-3 -right-1 w-9 h-9 bg-brand-yellow/40 rounded-full blur-md pointer-events-none" />
              )}
              <span className="relative z-10">{label}</span>
              <span
                className={cn(
                  "relative z-10 text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                  filter === value
                    ? "bg-white/20 text-white"
                    : "bg-brand-primary/10 text-brand-primary",
                )}
              >
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* LISTA                                                     */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 relative min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px]">
              <CircleNotch
                size={32}
                weight="bold"
                className="text-brand-primary animate-spin mb-4"
              />
              <p className="text-sm font-montserrat text-gray-500 font-medium">
                Wczytywanie artykułów...
              </p>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-3xl rounded-tr-none shadow-[0_10px_40px_-15px_rgba(3,63,99,0.12)] border border-white/60 flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="absolute -top-10 -right-8 w-32 h-32 bg-brand-yellow/15 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl rounded-tr-none bg-brand-primary/10 border border-brand-primary/10 flex items-center justify-center mb-4">
                <ArticleMedium
                  size={26}
                  weight="duotone"
                  className="text-brand-primary"
                />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-brand-secondary mb-1.5">
                Brak artykułów
              </h3>
              <p className="font-montserrat text-sm text-brand-secondary/50 max-w-sm">
                Nie znaleziono postów dla wybranego filtru.
              </p>
            </div>
          )}

          {!isLoading && (
            <AnimatePresence>
              {filtered.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  onChangeStatus={handleUpdateLocalStatus}
                  onDelete={handleDeletePost}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
