"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import SearchBar from "./topbar/SearchBar";
import NotificationsDropdown from "./topbar/NotificationsDropdown";
import ProfileMenu from "./topbar/ProfileMenu";
import GlobalDrawer from "./topbar/GlobalDrawer";
import { QrCheckInScanner } from "./topbar/QrCheckInScanner";
import { cn } from "@/lib/utils";
import { AdminUser } from "./topbar/types";

export interface AdminTopbarProps {
  user?: AdminUser;
}

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  // Na chacie chowamy topbar na mobile (zostaje pełnoekranowy czat ze strzałką wstecz).
  const isChatPage = pathname?.includes("/chat");

  // Kontekst konkretnego wyjazdu (/admin/wyjazdy/[id], poza kreatorem "dodaj").
  // Wtedy pokazujemy back, który wraca do listy wyjazdów ("głównego menu").
  const campIdMatch = pathname?.match(/\/admin\/wyjazdy\/([a-zA-Z0-9_-]+)/);
  const NON_TRIP_SEGMENTS = new Set(["dodaj", "nowy", "edycja"]);
  const isTripContext = !!campIdMatch && !NON_TRIP_SEGMENTS.has(campIdMatch[1]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[100] h-16 px-4 lg:px-6 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.12)]",
          isChatPage && "max-md:hidden",
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          {isTripContext && (
            <>
              <Link
                href="/admin/wyjazdy"
                aria-label="Wróć do listy wyjazdów"
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-brand-secondary/60 hover:text-brand-primary hover:bg-white/60 transition-colors"
              >
                <ArrowLeft size={20} weight="bold" />
              </Link>
              <QrCheckInScanner tripId={campIdMatch![1]} />
            </>
          )}
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <NotificationsDropdown />
          <div className="hidden md:block h-6 w-px bg-brand-secondary/10 mx-1" />
          <ProfileMenu user={user} />
        </div>
      </header>

      <GlobalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />
    </>
  );
}
