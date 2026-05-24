"use client";
/*
Harmonogram
-- [] Poprawić cronjoba do generowania co miesiąc planu na blogi
-- [] Sprawdzić czy statusy wyświetlają się poprawnie
-- [] Ogarnąć cronjoba do publikowania blogów autoamtycznie 
-- [] Zmiana statusu bloga jeśli zostanie on napisany samodzielnie 
*/
import React, { useEffect, useState } from "react";
import { Plus, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
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

  const filtered = posts.filter((p) => filter === "ALL" || p.status === filter);

  const counts = {
    ALL: posts.length,
    PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
    DRAFT: posts.filter((p) => p.status === "DRAFT").length,
    ARCHIVED: posts.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
            Zarządzaj Blogiem
          </h1>
          <p className="font-montserrat text-gray-500 text-[15px] mt-1">
            Twórz i publikuj artykuły z pełną optymalizacją SEO.
          </p>
        </div>

        <Button
          href="/admin/blog/dodaj/dane-podstawowe"
          rightIcon={<Plus size={18} weight="bold" />}
        >
          Nowy artykuł
        </Button>
      </header>

      {/* Filtry */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer",
              filter === value
                ? "bg-[#0B3B4C] text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-[#0B3B4C]",
            )}
          >
            {label}
            <span
              className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                filter === value
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
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
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 px-4 text-center">
            <h3 className="font-jakarta font-bold text-lg text-[#0B3B4C] mb-2">
              Brak artykułów
            </h3>
            <p className="font-montserrat text-sm text-gray-500 max-w-sm">
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
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
