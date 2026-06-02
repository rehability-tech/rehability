"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminContentArea({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Na chacie czat jest pełnoekranowy: zdejmujemy max-width i dolny zapas
  // (dolny pasek nawigacji jest wtedy ukryty).
  const isChatPage = pathname?.includes("/chat");

  return (
    <div
      className={cn(
        "mx-auto w-full flex-1",
        isChatPage ? "max-w-none" : "max-w-[1400px] pb-22",
      )}
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  );
}
