"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MagnifyingGlass,
  X,
  Tent,
  Article,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

const mockSearchData = [
  {
    id: "1",
    title: "Zarządzaj wpisami na blogu",
    href: "/admin/blog",
    icon: Article,
  },
  {
    id: "2",
    title: "Kategorie Bloga",
    href: "/admin/blog/kategorie",
    icon: FileText,
  },
  {
    id: "4",
    title: "Lista aktywnych Wyjazdów",
    href: "/admin/wyjazdy",
    icon: Tent,
  },
];

export default function SearchBar() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Po rozwinięciu searchbara (mobile) ustawiamy focus na input,
  // gdy skończy się animacja rozwijania (300ms = duration-300).
  useEffect(() => {
    if (!isFocused) return;
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, [isFocused]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredResults =
    query.trim() === ""
      ? []
      : mockSearchData.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div className="relative min-w-0 flex-1 md:max-w-[340px]" ref={wrapperRef}>
      <div
        className={`
          flex items-center transition-all duration-300 ease-out h-10
          ${isFocused ? "w-full bg-white shadow-[0_4px_15px_rgba(3,63,99,0.1)] border-brand-primary/30" : "w-10 md:w-full bg-white/50 border-white/60"}
          rounded-full border overflow-hidden backdrop-blur-md
        `}
      >
        <button
          onClick={() => setIsFocused(true)}
          className="w-10 h-10 flex shrink-0 items-center justify-center text-brand-secondary/60 hover:text-brand-primary transition-colors"
          aria-label="Szukaj"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Znajdź czego potrzebujesz..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`
            bg-transparent border-none outline-none font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/40 w-full pr-4
            ${isFocused || "hidden md:block"}
          `}
        />
        {isFocused && query && (
          <button
            onClick={() => setQuery("")}
            className="px-3 text-brand-secondary/40 hover:text-brand-secondary"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[240px] z-[160] bg-white/95 backdrop-blur-xl border border-brand-secondary/10 rounded-2xl shadow-[0_20px_40px_-10px_rgba(3,63,99,0.2)] overflow-hidden"
          >
            {filteredResults.length > 0 ? (
              <ul className="py-2">
                {filteredResults.map((result) => (
                  <li key={result.id}>
                    <button
                      onClick={() => {
                        router.push(result.href);
                        setIsFocused(false);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-primary/5 transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-secondary/5 flex items-center justify-center text-brand-secondary/50 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                        <result.icon size={16} weight="duotone" />
                      </div>
                      <span className="font-montserrat text-[13px] font-medium text-brand-secondary truncate">
                        {result.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center">
                <p className="font-montserrat text-[13px] text-brand-secondary/50">
                  Brak wyników dla &quot;{query}&quot;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
