"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Code, X, CaretDown } from "@phosphor-icons/react/dist/ssr";

// Zgrupowane ścieżki dla lepszej czytelności w panelu
const DEBUG_ROUTES = [
  {
    group: "Strona Główna",
    routes: [
      { name: "Start (Home)", path: "/" },
      { name: "O nas", path: "/o-nas" },
      { name: "Gabinet", path: "/gabinet" },
      { name: "Blog", path: "/blog" },
      { name: "W budowie", path: "/w-budowie" },
    ],
  },
  {
    group: "Campy (Frontend)",
    routes: [
      { name: "Campy (Lista)", path: "/campy" },
      { name: "Camp (Przykładowy)", path: "/campy/miedzy-nami-kobietami" },
    ],
  },
  {
    group: "Panel Admina",
    routes: [
      { name: "Dashboard", path: "/admin" },
      { name: "Dodaj nowego Campa", path: "/admin/campy/dodaj" },
      { name: "Lista Campów (Edycja)", path: "/admin/campy" },
    ],
  },
];

export function DebugNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Jeśli jesteśmy na produkcji, możemy ukryć ten panel całkowicie.
  // if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end font-montserrat">
      {/* Przycisk Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="Toggle Debug Nav"
      >
        {isOpen ? <X size={24} /> : <Code size={24} />}
      </button>

      {/* Rozwijane Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-3 w-72 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col gap-1 overflow-hidden"
          >
            <div className="mb-2 px-2 flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                Dev Routing
              </span>
              <span className="text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
              {DEBUG_ROUTES.map((group, groupIdx) => (
                <div key={groupIdx} className="mb-4 last:mb-0">
                  <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5 mt-2">
                    {group.group}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {group.routes.map((route, idx) => {
                      const isActive = pathname === route.path;

                      return (
                        <Link
                          key={idx}
                          href={route.path}
                          onClick={() => setIsOpen(false)}
                          className={`px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center justify-between group ${
                            isActive
                              ? "bg-[#287D88] text-white"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{route.name}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
