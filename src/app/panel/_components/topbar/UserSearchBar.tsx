"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MagnifyingGlass,
  X,
  SquaresFour,
  Tent,
  MonitorPlay,
  Lock,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

type SearchItem = {
  id: string;
  title: string;
  href: string;
  icon: typeof SquaresFour;
  disabled?: boolean;
};

const mockSearchData: SearchItem[] = [
  { id: "1", title: "Mój Start", href: "/panel", icon: SquaresFour },
  { id: "2", title: "Moje Wyjazdy", href: "/panel/wyjazdy", icon: Tent },
  {
    id: "3",
    title: "Platforma VOD",
    href: "/panel/vod",
    icon: MonitorPlay,
    disabled: true, // w budowie — bez nawigacji
  },
  { id: "4", title: "Mój Profil", href: "/panel/profil", icon: UserIcon },
];

export default function UserSearchBar() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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
          type="text"
          placeholder="Czego szukasz?"
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
                {filteredResults.map((result) =>
                  result.disabled ? (
                    <li key={result.id}>
                      <div
                        aria-disabled="true"
                        title="Platforma VOD jest w budowie"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-not-allowed select-none opacity-70"
                      >
                        <div className="relative w-8 h-8 rounded-lg bg-brand-secondary/5 flex items-center justify-center text-brand-secondary/40 shrink-0">
                          <result.icon size={16} weight="duotone" />
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-secondary/70 flex items-center justify-center">
                            <Lock size={8} weight="fill" className="text-white" />
                          </span>
                        </div>
                        <span className="font-montserrat text-[13px] font-medium text-brand-secondary/50 truncate">
                          {result.title}
                        </span>
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-brand-secondary/40 shrink-0">
                          W budowie
                        </span>
                      </div>
                    </li>
                  ) : (
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
                  ),
                )}
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
