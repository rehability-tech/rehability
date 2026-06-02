"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
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
      {children}
    </main>
  );
}
