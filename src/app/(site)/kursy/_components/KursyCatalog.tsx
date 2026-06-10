"use client";

import { useMemo, useRef, useState } from "react";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { CourseCard } from "./CourseCard";
import { COURSES, COURSE_CATEGORIES, type Course } from "../_data/courses";

const PAGE_SIZE = 6;

export function KursyCatalog() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [page, setPage] = useState(1);
  const filtersRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo<Course[]>(() => {
    const q = query.trim().toLowerCase();
    return COURSES.filter((c) => {
      const matchesCategory =
        activeCategory === "Wszystkie" || c.category === activeCategory;
      const matchesQuery =
        q === "" ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

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

  const scrollFilters = (dir: "left" | "right") => {
    filtersRef.current?.scrollBy({
      left: dir === "left" ? -240 : 240,
      behavior: "smooth",
    });
  };

  return (
    <section className="container pb-24">
      {/* NAGŁÓWEK + WYSZUKIWARKA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <h2 className="font-jakarta font-semibold text-[28px] md:text-[36px] text-brand-secondary">
          Baza <span className="text-brand-primary">programów VOD</span>
        </h2>

        <div className="flex items-stretch w-full md:w-[390px]">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Wpisz wyszukiwaną frazę"
            className="flex-1 h-[50px] px-5 rounded-l-2xl border border-brand-primary/50 border-r-0 bg-white/70 font-montserrat text-[15px] text-brand-secondary placeholder:text-brand-secondary/40 outline-none focus:border-brand-primary"
          />
          <span className="flex items-center justify-center size-[50px] rounded-r-2xl bg-brand-primary text-white shrink-0">
            <MagnifyingGlass size={20} weight="bold" />
          </span>
        </div>
      </div>

      {/* FILTRY KATEGORII */}
      <div className="flex items-center gap-3 mb-10 rounded-[19px] bg-white/40 backdrop-blur-md border border-white/50 p-4">
        <button
          type="button"
          aria-label="Przewiń filtry w lewo"
          onClick={() => scrollFilters("left")}
          className="shrink-0 flex items-center justify-center size-10 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <div
          ref={filtersRef}
          className="flex-1 flex items-center gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {COURSE_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategory(category)}
                className={`shrink-0 px-5 py-2.5 rounded-xl font-montserrat text-[14px] whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white font-semibold"
                    : "bg-white border border-brand-primary/20 text-brand-secondary hover:border-brand-primary/50"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Przewiń filtry w prawo"
          onClick={() => scrollFilters("right")}
          className="shrink-0 flex items-center justify-center size-10 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      {/* SIATKA KART */}
      {pageItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-[60px]">
          {pageItems.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className="text-center font-montserrat text-brand-secondary/60 py-16">
          Brak programów spełniających kryteria. Spróbuj zmienić frazę lub
          kategorię.
        </p>
      )}

      {/* PAGINACJA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-14">
          <button
            type="button"
            aria-label="Poprzednia strona"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center justify-center size-[35px] rounded-full text-brand-primary disabled:opacity-30 hover:bg-brand-primary/10 transition-colors"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`size-[30px] rounded-full font-montserrat text-[14px] transition-colors ${
                n === currentPage
                  ? "bg-brand-primary text-white font-semibold"
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
            className="flex items-center justify-center size-[35px] rounded-full text-brand-primary disabled:opacity-30 hover:bg-brand-primary/10 transition-colors"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
