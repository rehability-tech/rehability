"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { CourseCard } from "./CourseCard";
import { type Course } from "../_data/courses";

const PAGE_SIZE = 6;

const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export function KursyCatalog({
  courses,
  categories,
}: {
  courses: Course[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [page, setPage] = useState(1);

  const filtered = useMemo<Course[]>(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesCategory =
        activeCategory === "Wszystkie" || c.category === activeCategory;
      const matchesQuery =
        q === "" ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, courses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleCategory = (category: string) => {
    setActiveCategory(category);
    setPage(1);
  };

  return (
    <section id="katalog" className="container pb-24 scroll-mt-28">
      {/* NAGŁÓWEK + WYSZUKIWARKA */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <span className="inline-flex items-center text-[13px] font-semibold font-montserrat text-brand-primary tracking-wider uppercase mb-3">
            Katalog
          </span>
          <h2 className="font-jakarta font-bold text-[30px] md:text-[40px] leading-[1.1] text-brand-secondary">
            Baza <span className="text-brand-primary">programów VOD</span>
          </h2>
        </div>

        <label className="relative block w-full lg:w-[360px] shrink-0">
          <span className="sr-only">Szukaj programu</span>
          <MagnifyingGlass
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40 pointer-events-none"
          />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Szukaj programu..."
            className="w-full bg-white border border-gray-200 rounded-[14px] pl-11 pr-4 py-3.5 font-montserrat text-sm text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors shadow-sm"
          />
        </label>
      </div>

      {/* FILTRY KATEGORII */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategory(category)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold font-montserrat transition-all duration-200 ${
                isActive
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-primary/40 hover:text-brand-primary"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* SIATKA KART */}
      {pageItems.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${query}-${currentPage}`}
            variants={gridContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {pageItems.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-center font-montserrat text-brand-secondary/60 py-16">
          Brak programów spełniających kryteria. Spróbuj zmienić frazę lub
          kategorię.
        </p>
      )}

      {/* PAGINACJA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-14">
          <button
            type="button"
            aria-label="Poprzednia strona"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center justify-center size-10 rounded-full bg-white border border-gray-200 text-brand-primary disabled:opacity-30 hover:border-brand-primary/40 transition-colors"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`size-10 rounded-full font-montserrat text-[14px] font-semibold transition-all ${
                n === currentPage
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-brand-secondary/60 hover:text-brand-primary"
              }`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            aria-label="Następna strona"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center justify-center size-10 rounded-full bg-white border border-gray-200 text-brand-primary disabled:opacity-30 hover:border-brand-primary/40 transition-colors"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
