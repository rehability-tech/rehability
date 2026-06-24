"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Zakładam, że masz utilsa do klas

export default function MainClientContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();

  // Przykładowa logika: Jeśli jesteśmy np. na stronie czatu, usuwamy paddingi
  const isChatPage = pathname?.includes("/chat");
  const isProfilePage = !!params.participantId;

  return (
    <main
      className={cn(
        "flex-1 overflow-x-clip max-w-[1400px] mx-auto w-full",
        // Domyślne paddingi:
        "pb-28 lg:pb-12 px-4 lg:px-8 pt-6 lg:pt-8",
        // Dynamiczne nadpisywanie:
        isChatPage && "!p-0 max-w-none !pb-0",
        isProfilePage && "pt-2 lg:pt-4",
      )}
    >
      {/* Wspólna animacja przejścia między trasami panelu — klucz na pathname
          sprawia, że treść każdej trasy wjeżdża na nowo przy nawigacji.
          Czat (pełnoekranowy) dostaje delikatny fade bez przesunięcia. */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: isChatPage ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: isChatPage ? 0.25 : 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(isChatPage && "flex flex-col flex-1 min-h-0 h-full")}
      >
        {children}
      </motion.div>
    </main>
  );
}
