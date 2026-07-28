"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import UserSearchBar from "./topbar/UserSearchBar";
import UserNotifications from "./topbar/UserNotifications";
import UserProfileMenu from "./topbar/UserProfileMenu";
import { cn } from "@/lib/utils";
import type { UserTopbarProps } from "./topbar/types";

export type { UserTopbarProps } from "./topbar/types";

export default function UserTopbar({ user }: UserTopbarProps) {
  const pathname = usePathname();
  // Na chacie chowamy topbar na mobile (zostaje pełnoekranowy czat ze strzałką wstecz).
  const isChatPage = pathname?.includes("/chat");

  // Kontekst konkretnego wydarzenia (/panel/wydarzenia/[bookingId]).
  // Wtedy pokazujemy back, który wraca do listy wydarzeń ("głównego menu").
  const isTripContext = !!pathname?.match(/\/panel\/wydarzenia\/([a-zA-Z0-9_-]+)/);

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] h-16 px-4 lg:px-8 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.08)]",
        isChatPage && "max-md:hidden",
      )}
    >
      {/* LEWA STRONA: Back (kontekst wydarzenia) + Wyszukiwarka */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isTripContext && (
          <Link
            href="/panel/wydarzenia"
            aria-label="Wróć do listy wydarzeń"
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-brand-secondary/60 hover:text-brand-primary hover:bg-white/60 transition-colors"
          >
            <ArrowLeft size={20} weight="bold" />
          </Link>
        )}
        <UserSearchBar />
      </div>

      {/* PRAWA STRONA: Powiadomienia + Profil */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <UserNotifications />
        <div className="hidden md:block h-6 w-px bg-brand-secondary/10 mx-1" />
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
